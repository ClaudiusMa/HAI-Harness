// Harness variants and the per-run project layout.
//
// A variant is `none` (the bare fixture) or a HAI-Harness source tree given as a path,
// optionally labelled: `lean=/path/to/lane`. The tree's own `bin/hai-harness.mjs init`
// installs it, with `--default-role claudia`, so the scripted prompts reach Claudia in the
// harness conditions and plain instructions in `none`.
import fs from "node:fs/promises";
import path from "node:path";
import { copyDir, exists, git, gitOptional, run, slugify } from "./util.mjs";

export const PROJECT_DIR_NAME = "project";

export async function parseVariant(spec) {
  if (spec === "none") return { label: "none", kind: "none", source: null };
  const eq = spec.indexOf("=");
  const label = eq > 0 ? spec.slice(0, eq) : null;
  const source = path.resolve(eq > 0 ? spec.slice(eq + 1) : spec);
  if (!(await exists(path.join(source, "bin", "hai-harness.mjs")))) {
    throw new Error(`Variant ${spec}: ${source} has no bin/hai-harness.mjs, so it is not a HAI-Harness source tree.`);
  }
  if (label === "none") throw new Error("The label `none` is reserved for the bare fixture.");
  const commit = await gitOptional(source, ["rev-parse", "--short", "HEAD"]);
  const dirty = Boolean(await gitOptional(source, ["status", "--short"]));
  return {
    label: label ?? `${slugify(path.basename(source))}${commit ? `@${commit}` : ""}`,
    kind: "harness",
    source,
    commit,
    dirty
  };
}

// Lays out one run:
//   <runDir>/project            the primary checkout the agent starts in
//   <runDir>/_worktrees/project  where HAI task lanes land (taskLaneRoot puts lanes in
//                               <parent>/_worktrees/<repo>/<slug>), so they stay in the run
//   <runDir>/baseline           an untouched copy of the fixture plus install, for checks
export async function prepareProject({ runDir, fixtureDir, variant, adapter }) {
  const projectDir = path.join(runDir, PROJECT_DIR_NAME);
  await fs.mkdir(projectDir, { recursive: true });
  await copyDir(fixtureDir, projectDir);
  await git(projectDir, ["init", "-q", "-b", "main"]);
  await git(projectDir, ["config", "user.name", "Calibration Eval"]);
  await git(projectDir, ["config", "user.email", "calibration@eval.invalid"]);
  await git(projectDir, ["config", "commit.gpgsign", "false"]);
  await git(projectDir, ["add", "-A"]);
  await git(projectDir, ["commit", "-q", "-m", "Fixture"]);
  const install = { label: variant.label, kind: variant.kind, source: variant.source, commit: variant.commit ?? null, dirty: variant.dirty ?? false };
  if (variant.kind === "harness") {
    const result = await run(process.execPath, [path.join(variant.source, "bin", "hai-harness.mjs"), "init", "--target", projectDir, "--default-role", "claudia"], { cwd: projectDir, timeoutMs: 60000 });
    if (result.code !== 0) throw new Error(`Installing ${variant.label} failed:\n${result.stderr || result.stdout}`);
    install.initOutput = result.stdout.split("\n").slice(-4).join("\n");
  }
  // Host-specific entry files (Claude Code reads CLAUDE.md, not AGENTS.md).
  install.hostFiles = adapter.prepareProject ? await adapter.prepareProject(projectDir) : [];
  await git(projectDir, ["add", "-A"]);
  const pending = await git(projectDir, ["status", "--porcelain"]);
  if (pending) await git(projectDir, ["commit", "-q", "-m", `Install ${variant.label}`]);
  install.baselineCommit = await git(projectDir, ["rev-parse", "HEAD"]);
  const baselineDir = path.join(runDir, "baseline");
  await copyDir(fixtureDir, baselineDir);
  return { projectDir, baselineDir, install };
}

// The folders the agent may have built in: the primary checkout and every lane.
export async function workTrees(runDir) {
  const projectDir = path.join(runDir, PROJECT_DIR_NAME);
  const trees = [{ kind: "primary", dir: projectDir }];
  const laneRoot = path.join(runDir, "_worktrees", PROJECT_DIR_NAME);
  const entries = await fs.readdir(laneRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.isDirectory()) trees.push({ kind: "lane", dir: path.join(laneRoot, entry.name), name: entry.name });
  }
  // Lanes a host created elsewhere inside the run (for example a host's own worktree flag).
  const listed = await gitOptional(projectDir, ["worktree", "list", "--porcelain"]);
  for (const line of (listed ?? "").split("\n")) {
    if (!line.startsWith("worktree ")) continue;
    const dir = line.slice("worktree ".length);
    const real = await fs.realpath(dir).catch(() => dir);
    const known = await Promise.all(trees.map((t) => fs.realpath(t.dir).catch(() => t.dir)));
    if (!known.includes(real) && real.startsWith(await fs.realpath(runDir))) trees.push({ kind: "lane", dir: real, name: path.basename(real) });
  }
  return trees;
}

// Picks the tree to score. The primary checkout wins when it moved past the baseline or
// holds uncommitted work; otherwise the most recently changed lane (work that was never
// integrated). Returns { dir, from, unintegratedLanes }.
export async function resolveArtifact(runDir, baselineCommit) {
  const trees = await workTrees(runDir);
  const changedLanes = [];
  let primaryChanged = false;
  for (const tree of trees) {
    const head = await gitOptional(tree.dir, ["rev-parse", "HEAD"]);
    const dirty = await gitOptional(tree.dir, ["status", "--porcelain", "--untracked-files=all"]);
    const changed = head !== baselineCommit || Boolean(dirty);
    if (tree.kind === "primary") primaryChanged = changed;
    else if (changed) {
      const merged = head && (await gitOptional(trees[0].dir, ["merge-base", "--is-ancestor", head, "HEAD"])) !== null && !dirty;
      if (!merged) changedLanes.push({ ...tree, mtime: await newestMtime(tree.dir) });
    }
  }
  changedLanes.sort((a, b) => b.mtime - a.mtime);
  if (primaryChanged || changedLanes.length === 0) {
    return { dir: trees[0].dir, from: "primary", unintegratedLanes: changedLanes.map((l) => l.name) };
  }
  return { dir: changedLanes[0].dir, from: `lane:${changedLanes[0].name}`, unintegratedLanes: changedLanes.map((l) => l.name) };
}

async function newestMtime(root) {
  let newest = 0;
  const visit = async (dir) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else newest = Math.max(newest, (await fs.stat(full).catch(() => ({ mtimeMs: 0 }))).mtimeMs);
    }
  };
  await visit(root);
  return newest;
}
