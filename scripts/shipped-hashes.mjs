#!/usr/bin/env node
// Regenerates scaffold/shipped-hashes.json: the sha256 of every version of each
// core file that HAI-Harness ever shipped, read from this repository's history.
// `update` and `migrate` replace a core file only when its content is one of
// these (or the receipt's recorded hash); anything else is a user's edit.
// Installs from the default branch can sit on any commit, so every commit
// counts, not only release tags. The working tree counts too, so the version
// about to ship is listed before it is committed. Receipts are often
// gitignored, so a fresh clone relies on this list alone: regenerate it
// whenever a core file changes (a test checks). Run from the repository root:
//   node scripts/shipped-hashes.mjs [<ref>]

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ref = process.argv[2] ?? "HEAD";
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
const text = (...args) => git(...args).toString("utf8").trim();

// Harness-relative installed path → package source paths, with an optional
// "until" commit: that source counts only in history before the commit.
const scaffoldAdded = text("log", "--diff-filter=A", "--format=%H", ref, "--", "scaffold/AGENTS.md").split("\n").pop();
const sources = new Map([
  // The entry file was installed whole until the plugin layout. It is now a
  // retired core file in .hai/ and the pristine test for a legacy root AGENTS.md.
  ["AGENTS.md", [{ source: "scaffold/AGENTS.md" }, { source: "AGENTS.md", until: scaffoldAdded }]],
  ["Agents/hai-harness.mjs", [{ source: "bin/hai-harness.mjs" }]]
]);
const walk = (relative) => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return [];
  if (!fs.statSync(absolute).isDirectory()) return [relative];
  return fs.readdirSync(absolute).filter((name) => name !== ".DS_Store").flatMap((name) => walk(`${relative}/${name}`));
};
const methodFiles = [
  ...text("ls-tree", "-r", "--name-only", ref, "--", "Agents", "Human/onboarding.md").split("\n"),
  ...walk("Agents"),
  "Human/onboarding.md"
];
for (const file of methodFiles) {
  if (file && !sources.has(file)) sources.set(file, [{ source: file }]);
}

// Same comparison as the CLI: text with CRLF folded to LF.
const contentHash = (value) => createHash("sha256").update(value.toString("utf8").replaceAll("\r\n", "\n")).digest("hex");
const hashes = {};
for (const [target, list] of [...sources].sort(([left], [right]) => left.localeCompare(right))) {
  const blobs = new Set();
  for (const { source, until } of list) {
    const range = until ? `${until}^` : ref;
    for (const commit of text("rev-list", range, "--", source).split("\n").filter(Boolean)) {
      // A commit that deleted the file has no blob for it.
      const blob = (() => { try { return text("rev-parse", "--verify", "--quiet", `${commit}:${source}`); } catch { return ""; } })();
      if (blob) blobs.add(blob);
    }
  }
  const digests = [...blobs].map((blob) => contentHash(git("cat-file", "blob", blob)));
  for (const { source, until } of list) {
    if (!until && fs.existsSync(path.join(root, source))) digests.push(contentHash(fs.readFileSync(path.join(root, source))));
  }
  if (digests.length) hashes[target] = [...new Set(digests)].sort();
}

const output = path.join(root, "scaffold/shipped-hashes.json");
fs.writeFileSync(output, `${JSON.stringify({ schemaVersion: 1, generatedFrom: text("rev-parse", ref), hashes }, null, 1)}\n`);
console.log(`Wrote ${path.relative(root, output)}: ${Object.keys(hashes).length} paths, ${Object.values(hashes).flat().length} hashes.`);
