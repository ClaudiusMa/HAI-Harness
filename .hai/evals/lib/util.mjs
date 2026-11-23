// Small helpers shared by the calibration runner. Node built-ins only.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Runs a command without a shell. Resolves with { code, stdout, stderr, timedOut, ms };
// never rejects for a non-zero exit, so callers decide what a failure means.
export function run(command, args, { cwd, env, input, timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const child = spawn(command, args, { cwd, env: env ?? process.env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000).unref();
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr, timedOut, ms: Date.now() - started });
    });
    if (input !== undefined) child.stdin.end(input);
    else child.stdin.end();
  });
}

export async function git(cwd, args, options = {}) {
  const result = await run("git", ["-C", cwd, ...args], options);
  if (result.code !== 0) throw new Error(`git ${args.join(" ")} failed in ${cwd}: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

export async function gitOptional(cwd, args) {
  const result = await run("git", ["-C", cwd, ...args]).catch(() => null);
  return result && result.code === 0 ? result.stdout.trim() : null;
}

export const exists = (file) => fs.access(file).then(() => true, () => false);

export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function copyDir(source, target) {
  await fs.cp(source, target, { recursive: true, errorOnExist: false, force: true });
}

// Folders that never count as the agent's product work.
export const IGNORED_DIRS = new Set([".git", "node_modules", ".hai", ".claude", ".codex", "_worktrees"]);
export const IGNORED_FILES = new Set(["AGENTS.md", "CLAUDE.md", ".DS_Store"]);

// Relative paths of product files under root, sorted.
export async function listFiles(root) {
  const out = [];
  const visit = async (dir, rel) => {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await visit(path.join(dir, entry.name), childRel);
      } else if (entry.isFile() && !IGNORED_FILES.has(entry.name)) {
        out.push(childRel);
      }
    }
  };
  await visit(root, "");
  return out.sort();
}

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

// { relPath: hash } for every product file under root.
export async function snapshot(root) {
  const files = await listFiles(root);
  const result = {};
  for (const rel of files) result[rel] = sha256(await fs.readFile(path.join(root, rel)));
  return result;
}

// Paths added, removed or changed between two snapshots.
export function diffSnapshots(before, after) {
  const changed = [];
  for (const rel of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[rel] !== after[rel]) changed.push(rel);
  }
  return changed.sort();
}

export function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// The folder runs execute in: a caller-given --workdir or the OS temporary folder.
// Refuses anything inside the ProductLab folder, the user's Documents, or an existing Git
// repository, so a scenario can never write into real work.
export async function safeRunRoot(workdir) {
  const base = await fs.realpath(workdir ? path.resolve(workdir) : os.tmpdir()).catch(() => path.resolve(workdir ?? os.tmpdir()));
  const home = os.homedir();
  const forbidden = [path.join(home, "Documents"), path.join(home, "Desktop")];
  for (const place of forbidden) {
    if (isInside(base, place)) throw new Error(`Refusing to run scenarios under ${base}: it is inside ${place}. Use the OS temporary folder or another --workdir.`);
  }
  if (workdir) {
    await fs.mkdir(base, { recursive: true });
    const top = await gitOptional(base, ["rev-parse", "--show-toplevel"]);
    if (top) throw new Error(`Refusing to run scenarios under ${base}: it is inside the Git repository ${top}.`);
  }
  return base;
}

export function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
}

export function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "x";
}

export const sum = (values) => values.reduce((a, b) => a + (Number(b) || 0), 0);
export const mean = (values) => (values.length ? sum(values) / values.length : NaN);
export function stdev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(sum(values.map((v) => (v - m) ** 2)) / (values.length - 1));
}
