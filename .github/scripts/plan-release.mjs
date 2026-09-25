#!/usr/bin/env node

/**
 * Dependency-free release planner for origin/main.
 * Decides whether a push should publish a stable GitHub Release.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const runFile = promisify(execFile);

export const PRODUCT_PATH_PREFIXES = ["Agents/", "Human/", "bin/", "scaffold/"];
export const PRODUCT_PATH_FILES = new Set([
  "package.json",
  "release.json",
  "README.md",
  "LICENSE",
  "hai-meta"
]);
export const RELEASE_COMMIT_PATTERN = /^release: v\d+\.\d+\.\d+\b/i;
export const RELEASE_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;
export const FIRST_RELEASE_VERSION = "0.2.1";
export const DEFAULT_RELEASE_NOTES_BASE =
  "https://github.com/ClaudiusMa/HAI-Harness/releases/tag";

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isProductPath(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (PRODUCT_PATH_FILES.has(normalized)) return true;
  return PRODUCT_PATH_PREFIXES.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
  );
}

/**
 * @param {string} version
 * @returns {string}
 */
export function bumpPatch(version) {
  const match = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Invalid semantic version: ${version}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

/**
 * @param {string} subject
 * @returns {boolean}
 */
export function isReleaseCommitSubject(subject) {
  return RELEASE_COMMIT_PATTERN.test(String(subject || "").trim());
}

/**
 * @param {{
 *   repoRoot: string,
 *   apply?: boolean,
 *   git?: (args: string[]) => Promise<string>,
 *   readFile?: (filePath: string) => Promise<string>,
 *   writeFile?: (filePath: string, contents: string) => Promise<void>,
 *   releaseNotesBase?: string,
 * }} options
 */
export async function planRelease(options) {
  const repoRoot = path.resolve(options.repoRoot);
  const git =
    options.git ||
    (async (args) => {
      const { stdout } = await runFile("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
      return stdout.trimEnd();
    });
  const readFile = options.readFile || ((filePath) => fs.readFile(filePath, "utf8"));
  const writeFile =
    options.writeFile ||
    (async (filePath, contents) => {
      await fs.writeFile(filePath, contents);
    });
  const releaseNotesBase = options.releaseNotesBase || DEFAULT_RELEASE_NOTES_BASE;

  const headSubject = (await git(["log", "-1", "--format=%s"])).trim();
  if (isReleaseCommitSubject(headSubject)) {
    return {
      publish: false,
      reason: "release-commit",
      headSubject
    };
  }

  const lastTag = await findLatestReleaseTag(git);
  const changedPaths = await listChangedPaths(git, lastTag);
  const productChanges = changedPaths.filter(isProductPath);
  if (productChanges.length === 0) {
    return {
      publish: false,
      reason: lastTag ? "no-product-path-changes" : "no-product-path-changes",
      lastTag,
      changedPaths
    };
  }

  const version = lastTag ? bumpPatch(lastTag.version) : FIRST_RELEASE_VERSION;
  const tag = `v${version}`;
  const subjects = await listCommitSubjects(git, lastTag);
  const summary = summarizeSubjects(subjects, version);
  const releaseNotesUrl = `${releaseNotesBase}/${tag}`;

  const packagePath = path.join(repoRoot, "package.json");
  const releasePath = path.join(repoRoot, "release.json");
  const packageJson = JSON.parse(await readFile(packagePath));
  const releaseJson = JSON.parse(await readFile(releasePath));

  const nextPackage = { ...packageJson, version };
  const nextRelease = {
    ...releaseJson,
    version,
    releaseNotesUrl,
    summary
  };

  if (options.apply) {
    await writeFile(packagePath, `${JSON.stringify(nextPackage, null, 2)}\n`);
    await writeFile(releasePath, `${JSON.stringify(nextRelease, null, 2)}\n`);
  }

  return {
    publish: true,
    reason: "product-path-changes",
    lastTag: lastTag ? lastTag.tag : null,
    version,
    tag,
    summary,
    releaseNotesUrl,
    productChanges,
    packageVersion: nextPackage.version,
    releaseVersion: nextRelease.version,
    commitMessage: `release: v${version}`
  };
}

/**
 * @param {(args: string[]) => Promise<string>} git
 */
async function findLatestReleaseTag(git) {
  let tagsOutput = "";
  try {
    tagsOutput = await git(["tag", "--list", "v*.*.*", "--sort=-v:refname"]);
  } catch {
    return null;
  }
  const tags = tagsOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  for (const tag of tags) {
    const match = tag.match(RELEASE_TAG_PATTERN);
    if (!match) continue;
    return {
      tag,
      version: `${match[1]}.${match[2]}.${match[3]}`
    };
  }
  return null;
}

/**
 * @param {(args: string[]) => Promise<string>} git
 * @param {{ tag: string } | null} lastTag
 */
async function listChangedPaths(git, lastTag) {
  // With a prior release tag, any product path changed since that tag can publish.
  // With no prior tag, only the tip commit is inspected so a .hai/-only tip skips.
  // --root -m --first-parent includes files from a merge tip; plain diff-tree omits them.
  const output = lastTag
    ? await git(["diff", "--name-only", `${lastTag.tag}..HEAD`])
    : await git(["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", "-m", "--first-parent", "HEAD"]);
  return uniquePaths(output);
}

/**
 * @param {(args: string[]) => Promise<string>} git
 * @param {{ tag: string } | null} lastTag
 */
async function listCommitSubjects(git, lastTag) {
  const args = lastTag
    ? ["log", "--format=%s", `${lastTag.tag}..HEAD`]
    : ["log", "-1", "--format=%s", "HEAD"];
  const output = await git(args);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((subject) => !isReleaseCommitSubject(subject));
}

/**
 * @param {string[]} subjects
 * @param {string} version
 */
function summarizeSubjects(subjects, version) {
  const unique = [];
  for (const subject of subjects) {
    if (!unique.includes(subject)) unique.push(subject);
  }
  if (unique.length === 0) {
    return `HAI-Harness ${version}.`;
  }
  const clipped = unique.slice(0, 5);
  const body = clipped.join("; ");
  const more = unique.length > clipped.length ? ` (+${unique.length - clipped.length} more)` : "";
  return `HAI-Harness ${version}: ${body}${more}`;
}

/**
 * @param {string} output
 */
function uniquePaths(output) {
  const seen = new Set();
  const result = [];
  for (const line of output.split("\n")) {
    const relativePath = line.trim().replaceAll("\\", "/");
    if (!relativePath || seen.has(relativePath)) continue;
    seen.add(relativePath);
    result.push(relativePath);
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const repoRoot =
    args.find((arg, index) => args[index - 1] === "--repo") ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const plan = await planRelease({ repoRoot, apply });
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  if (!plan.publish) process.exitCode = 0;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
