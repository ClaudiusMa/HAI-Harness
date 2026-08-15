#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const runFile = promisify(execFile);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDirs = ["Agents", "Human"];
const templateFiles = ["AGENTS.md"];
const ignoredNames = new Set([".DS_Store"]);
const generatedTaskRoles = [
  { slug: "augustus", name: "Augustus" },
  { slug: "julius", name: "Julius" }
];

// Stable method files are safe to refresh. Project-owned state is never
// overwritten by `update`.
const scaffoldPaths = [
  "AGENTS.md",
  "Agents/check-for-update.mjs",
  "Agents/onboarding.md",
  "Agents/claudia.md",
  "Agents/augustus.md",
  "Agents/julius.md",
  "Agents/athena.md",
  "Agents/hephaestus.md",
  "Agents/designs/README.md",
  "Agents/handoffs/README.md",
  "Agents/handoffs/TEMPLATE.md",
  "Agents/_archive/README.md",
  "Agents/_archive/handoffs/README.md",
  "Agents/_archive/tasks/README.md",
  "Agents/tasks/TEMPLATE.md",
  "Agents/lessons/README.md",
  "Agents/lessons/TEMPLATE.md",
  "Agents/skills/decision-logger/SKILL.md",
  "Agents/skills/guardian/SKILL.md",
  "Agents/skills/handoff/SKILL.md",
  "Agents/skills/traffic-control/SKILL.md",
  "Agents/skills/lesson-logger/SKILL.md",
  "Agents/skills/retrospective/SKILL.md",
  "Human/onboarding.md"
];

// These files hold project-owned state after installation. `update` creates
// them only when absent.
const createOnlyPaths = ["Agents/lessons/INDEX.md"];

// Mandatory startup context should stay current and scannable. These budgets
// are intentionally generous; they catch history dumps without constraining
// normal project detail.
const promptHygieneLimits = new Map([
  ["Agents/planning.md", 1200],
  ["Agents/tasks/augustus.md", 400],
  ["Agents/tasks/julius.md", 400]
]);

const usage = `HAI-Harness

Usage:
  hai-harness init              [--target <dir>] [--force] [--dry-run]
  hai-harness update            [--target <dir>] [--dry-run]
  hai-harness doctor            [--target <dir>]
  hai-harness worktree create   <task-slug> [--integration <branch>] [--target <dir>]
  hai-harness worktree status   [--target <dir>]
  hai-harness worktree approve  --approved <message> [--target <dir>]
  hai-harness help

Commands:
  init       Copy the HAI-Harness files into an existing project.
  update     Refresh stable method files and create missing generic infrastructure.
             Never overwrite project-owned planning, context, task, handoff, or lesson state.
  doctor     Check whether the target project has the expected harness files.
  worktree   Create, inspect, or explicitly approve a native Git task lane.

Options:
  --target <dir>       Project or worktree directory. Defaults to the current directory.
  --force              (init only) Overwrite existing harness files.
  --dry-run            (init/update only) Show what would change without writing files.
  --integration <name> (worktree create only) Named local integration branch.
  --approved <message> (worktree approve only) Explicit approval and commit message.
`;

main().catch((error) => {
  console.error(`hai-harness: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(usage);
    return;
  }

  if (command === "worktree") {
    await worktree(args);
    return;
  }

  const options = parseOptions(args, new Set(["--target", "--force", "--dry-run"]));
  if (command === "init") {
    await init(options);
    return;
  }
  if (command === "update") {
    rejectOption(options.force, "--force is only valid with init.");
    await update(options);
    return;
  }
  if (command === "doctor") {
    rejectOption(options.force || options.dryRun, "doctor accepts only --target.");
    await doctor(options);
    return;
  }

  throw new Error(`Unknown command "${command}". Run "hai-harness help".`);
}

function parseOptions(args, allowed) {
  const options = {
    target: process.cwd(),
    force: false,
    dryRun: false,
    integration: undefined,
    approved: undefined,
    positional: []
  };
  const valueOptions = new Map([
    ["--target", "target"],
    ["--integration", "integration"],
    ["--approved", "approved"]
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--force" || arg === "--dry-run") {
      if (!allowed.has(arg)) throw new Error(`Unknown option "${arg}".`);
      options[arg === "--force" ? "force" : "dryRun"] = true;
      continue;
    }
    if (valueOptions.has(arg)) {
      if (!allowed.has(arg)) throw new Error(`Unknown option "${arg}".`);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
      options[valueOptions.get(arg)] = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) throw new Error(`Unknown option "${arg}".`);
    options.positional.push(arg);
  }

  options.target = path.resolve(options.target);
  return options;
}

function rejectOption(condition, message) {
  if (condition) throw new Error(message);
}

async function init(options) {
  await assertDirectory(options.target);
  const results = { created: [], overwritten: [], skipped: [] };
  for (const dir of templateDirs) {
    await copyDirectory(path.join(packageRoot, dir), path.join(options.target, dir), options, results);
  }
  for (const file of templateFiles) {
    await copyFile(path.join(packageRoot, file), path.join(options.target, file), options, results);
  }
  for (const role of generatedTaskRoles) {
    await generateTaskFile(role, options, results, options.force);
  }
  await refreshInstalledState(options);
  printInitSummary(options.target, options, results);
}

async function update(options) {
  await assertDirectory(options.target);
  const results = { updated: [], created: [], preserved: [], missingSource: [] };

  for (const relativePath of scaffoldPaths) {
    await refreshPath(relativePath, options, results, false);
  }
  for (const relativePath of createOnlyPaths) {
    await refreshPath(relativePath, options, results, true);
  }
  for (const role of generatedTaskRoles) {
    await generateTaskFile(role, options, results, false);
  }
  await refreshInstalledState(options);
  printUpdateSummary(options.target, options, results);
}

async function refreshInstalledState(options) {
  if (options.dryRun) return;
  const statePath = path.join(options.target, ".hai-harness.json");
  const current = await readJson(statePath).catch(() => ({}));
  const packageMetadata = await readJson(path.join(packageRoot, "package.json"));
  const state = {
    schemaVersion: 1,
    installedVersion: packageMetadata.version,
    channel: typeof current.channel === "string" ? current.channel : "stable",
    checkEnabled: current.checkEnabled !== false
  };
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporaryPath, statePath);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function generateTaskFile(role, options, results, overwrite) {
  const sourcePath = path.join(packageRoot, "Agents/tasks/TEMPLATE.md");
  const relativePath = `Agents/tasks/${role.slug}.md`;
  const targetPath = path.join(options.target, relativePath);
  if (!(await exists(sourcePath))) {
    results.missingSource?.push("Agents/tasks/TEMPLATE.md");
    return;
  }
  const targetExists = await exists(targetPath);
  if (targetExists && !overwrite) {
    if (results.preserved) results.preserved.push(relativePath);
    else results.skipped.push(relativePath);
    return;
  }
  const template = await fs.readFile(sourcePath, "utf8");
  const rendered = template
    .replaceAll("{{ROLE_NAME}}", role.name)
    .replaceAll("{{ROLE_SLUG}}", role.slug);
  if (!options.dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, rendered);
  }
  const key = targetExists ? "overwritten" : "created";
  results[key].push(relativePath);
}

async function refreshPath(relativePath, options, results, createOnly) {
  const sourcePath = path.join(packageRoot, relativePath);
  const targetPath = path.join(options.target, relativePath);
  if (!(await exists(sourcePath))) {
    results.missingSource.push(relativePath);
    return;
  }

  const targetExists = await exists(targetPath);
  if (createOnly && targetExists) {
    results.preserved.push(relativePath);
    return;
  }
  if (!options.dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
  results[targetExists ? "updated" : "created"].push(relativePath);
}

async function doctor(options) {
  await assertDirectory(options.target);
  const requiredPaths = [
    "AGENTS.md",
    ".hai-harness.json",
    "Agents/check-for-update.mjs",
    "Agents/onboarding.md",
    "Agents/project_context.md",
    "Agents/planning.md",
    "Agents/design.md",
    "Agents/claudia.md",
    "Agents/augustus.md",
    "Agents/julius.md",
    "Agents/athena.md",
    "Agents/hephaestus.md",
    "Agents/tasks/augustus.md",
    "Agents/tasks/julius.md",
    "Agents/lessons/INDEX.md",
    "Agents/lessons/README.md",
    "Agents/lessons/TEMPLATE.md",
    "Agents/skills/traffic-control/SKILL.md",
    "Agents/skills/lesson-logger/SKILL.md",
    "Human/onboarding.md",
    "Human/brief.md",
    "Human/decisions.md"
  ];
  const missing = [];
  for (const relativePath of requiredPaths) {
    if (!(await exists(path.join(options.target, relativePath)))) missing.push(relativePath);
  }
  const oversized = [];
  for (const [relativePath, maxLines] of promptHygieneLimits) {
    const targetPath = path.join(options.target, relativePath);
    if (!(await exists(targetPath))) continue;
    const lineCount = countLines(await fs.readFile(targetPath, "utf8"));
    if (lineCount > maxLines) oversized.push({ relativePath, lineCount, maxLines });
  }
  let updateStatus = "Update status: unknown/offline";
  if (missing.includes(".hai-harness.json") === false && missing.includes("Agents/check-for-update.mjs") === false) {
    try {
      const { stdout } = await runFile(process.execPath, [path.join(options.target, "Agents/check-for-update.mjs"), "--status", "--target", options.target], {
        cwd: options.target,
        timeout: 6_000,
        maxBuffer: 32 * 1024
      });
      if (stdout.trim()) updateStatus = stdout.trim();
    } catch {}
  }
  if (missing.length === 0 && oversized.length === 0) {
    console.log(`HAI-Harness looks installed in ${options.target}`);
    console.log(updateStatus);
    return;
  }
  console.log(`HAI-Harness needs attention in ${options.target}`);
  if (missing.length > 0) {
    console.log("\nMissing:");
    for (const relativePath of missing) console.log(`  - ${relativePath}`);
  }
  if (oversized.length > 0) {
    console.log("\nOversized mandatory startup context:");
    for (const item of oversized) {
      console.log(`  - ${item.relativePath}: ${item.lineCount} lines (limit ${item.maxLines})`);
    }
    console.log("Move completed queues and historical evidence to Agents/handoffs/ or Agents/_archive/; keep live planning and task files current-only.");
  }
  console.log(`\n${updateStatus}`);
  process.exitCode = 1;
}

function countLines(content) {
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length - (content.endsWith("\n") ? 1 : 0);
}

async function worktree(args) {
  const [action, ...rest] = args;
  if (action === "create") {
    const options = parseOptions(rest, new Set(["--target", "--integration"]));
    if (options.positional.length !== 1) throw new Error("worktree create requires one task slug.");
    await createWorktree(options, options.positional[0]);
    return;
  }
  if (action === "status") {
    const options = parseOptions(rest, new Set(["--target"]));
    if (options.positional.length !== 0) throw new Error("worktree status accepts no positional arguments.");
    await worktreeStatus(options);
    return;
  }
  if (action === "approve") {
    const options = parseOptions(rest, new Set(["--target", "--approved"]));
    if (options.positional.length !== 0) throw new Error("worktree approve accepts no positional arguments.");
    if (!options.approved?.trim()) throw new Error("worktree approve requires --approved <message>.");
    await approveWorktree(options);
    return;
  }
  throw new Error("worktree requires create, status, or approve.");
}

async function createWorktree(options, slug) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error("Task slug must use lowercase letters, numbers, and hyphens only.");
  }
  const currentRoot = await git(options.target, ["rev-parse", "--show-toplevel"]);
  const worktrees = await listWorktrees(currentRoot);
  const controlRoot = worktrees[0]?.root;
  if (!controlRoot || samePath(currentRoot, controlRoot) === false) {
    throw new Error(`Run worktree create from the primary checkout${controlRoot ? `: ${controlRoot}` : "."}`);
  }

  const integrationBranch = options.integration || await git(controlRoot, ["branch", "--show-current"]);
  assertSafeBranch(integrationBranch, "Pass --integration with a named local integration branch.");
  if (!(await localBranchExists(controlRoot, integrationBranch))) {
    throw new Error(`Unknown local integration branch: ${integrationBranch}`);
  }
  const integrationMatches = worktrees.filter((item) => item.branch === integrationBranch);
  if (integrationMatches.length !== 1) {
    throw new Error(`The integration branch must have exactly one checked-out worktree: ${integrationBranch}`);
  }
  const integrationRoot = integrationMatches[0].root;
  if ((await git(integrationRoot, ["branch", "--show-current"])) !== integrationBranch) {
    throw new Error("Integration worktree branch changed during inspection.");
  }
  await assertClean(integrationRoot, "The integration worktree is dirty. Finish or commit its current work first.");

  const taskBranch = `codex/${slug}`;
  if (await localBranchExists(controlRoot, taskBranch)) throw new Error(`Task branch already exists: ${taskBranch}`);
  const taskRoot = path.join(`${controlRoot}-worktrees`, slug);
  if (await exists(taskRoot)) throw new Error(`Task worktree path already exists: ${taskRoot}`);
  const baseCommit = await git(integrationRoot, ["rev-parse", "HEAD"]);

  await fs.mkdir(path.dirname(taskRoot), { recursive: true });
  let created = false;
  try {
    await git(controlRoot, ["worktree", "add", "-b", taskBranch, taskRoot, baseCommit], { inherit: true });
    created = true;
    await git(controlRoot, ["config", "--local", `branch.${taskBranch}.codexIntegrationBranch`, integrationBranch]);
    await git(controlRoot, ["config", "--local", `branch.${taskBranch}.codexBaseCommit`, baseCommit]);
  } catch (error) {
    if (created) {
      await git(controlRoot, ["worktree", "remove", "--force", taskRoot]).catch(() => {});
      await git(controlRoot, ["branch", "-D", taskBranch]).catch(() => {});
    }
    throw error;
  }

  console.log("Worktree ready");
  console.log(`  path:        ${taskRoot}`);
  console.log(`  branch:      ${taskBranch}`);
  console.log(`  integrates:  ${integrationBranch}`);
  console.log(`  base commit: ${baseCommit}`);
  console.log("Run the project's own preview or dev command from this task worktree; review this exact lane before approval.");
}

async function worktreeStatus(options) {
  const currentRoot = await git(options.target, ["rev-parse", "--show-toplevel"]);
  const worktrees = await listWorktrees(currentRoot);
  const controlRoot = worktrees[0]?.root;
  const branch = await git(currentRoot, ["branch", "--show-current"]);
  const dirty = (await git(currentRoot, ["status", "--porcelain", "--untracked-files=all"])).length > 0;
  console.log(`Worktree:           ${currentRoot}`);
  console.log(`Branch:             ${branch || "detached"}`);
  console.log(`Primary checkout:   ${controlRoot || "unknown"}`);
  console.log(`Working tree:       ${dirty ? "dirty" : "clean"}`);
  if (branch.startsWith("codex/")) {
    const integration = await gitOptional(controlRoot, ["config", "--get", `branch.${branch}.codexIntegrationBranch`]);
    const base = await gitOptional(controlRoot, ["config", "--get", `branch.${branch}.codexBaseCommit`]);
    console.log(`Integration branch: ${integration || "missing"}`);
    console.log(`Base commit:        ${base || "missing"}`);
  }
}

async function approveWorktree(options) {
  const taskRoot = await git(options.target, ["rev-parse", "--show-toplevel"]);
  const worktrees = await listWorktrees(taskRoot);
  const controlRoot = worktrees[0]?.root;
  if (!controlRoot || samePath(taskRoot, controlRoot)) throw new Error("Run worktree approve from a task worktree.");
  const taskBranch = await git(taskRoot, ["branch", "--show-current"]);
  if (!taskBranch.startsWith("codex/")) throw new Error("Approval requires a codex/* task branch.");

  const integrationBranch = await gitOptional(controlRoot, ["config", "--get", `branch.${taskBranch}.codexIntegrationBranch`]);
  const baseCommit = await gitOptional(controlRoot, ["config", "--get", `branch.${taskBranch}.codexBaseCommit`]);
  assertSafeBranch(integrationBranch, "Task metadata has no named local integration branch.");
  if (!baseCommit || !/^[0-9a-f]{40,64}$/.test(baseCommit)) throw new Error("Task metadata has no valid base commit.");
  if (!(await localBranchExists(controlRoot, integrationBranch))) throw new Error(`Unknown local integration branch: ${integrationBranch}`);
  const integrationMatches = worktrees.filter((item) => item.branch === integrationBranch);
  if (integrationMatches.length !== 1) throw new Error(`The integration branch must have exactly one checked-out worktree: ${integrationBranch}`);
  const integrationRoot = integrationMatches[0].root;
  if ((await git(integrationRoot, ["branch", "--show-current"])) !== integrationBranch) throw new Error("Integration worktree branch changed.");
  await assertClean(integrationRoot, "The integration worktree is dirty. The task worktree is preserved.");

  await git(taskRoot, ["diff", "--check"], { inherit: true });
  await git(taskRoot, ["diff", "--cached", "--check"], { inherit: true });
  await git(taskRoot, ["add", "-A"]);
  await git(taskRoot, ["diff", "--cached", "--check"], { inherit: true });
  const hasStagedChanges = !(await gitExitZero(taskRoot, ["diff", "--cached", "--quiet"]));
  if (hasStagedChanges) {
    const message = withCodexTrailer(options.approved.trim());
    await git(taskRoot, ["commit", "-m", message], { inherit: true });
  }
  await assertClean(taskRoot, "The task worktree changed during its approved commit.");
  const taskCommit = await git(taskRoot, ["rev-parse", "HEAD"]);
  if (taskCommit === baseCommit) throw new Error("There is no task change to integrate.");
  if (!(await gitExitZero(taskRoot, ["merge-base", "--is-ancestor", baseCommit, taskCommit]))) {
    throw new Error("Task branch no longer descends from its recorded base commit.");
  }
  if (!(await gitExitZero(integrationRoot, ["merge-base", "--is-ancestor", baseCommit, "HEAD"]))) {
    throw new Error("Integration branch no longer descends from the recorded task base. The task worktree is preserved.");
  }
  if (await gitExitZero(integrationRoot, ["merge-base", "--is-ancestor", taskCommit, "HEAD"])) {
    throw new Error("There is no unintegrated task commit to merge.");
  }
  await assertClean(integrationRoot, "The integration worktree changed during approval. The task worktree is preserved.");

  const mergeMessage = withCodexTrailer(`Merge ${taskBranch}: ${options.approved.trim()}`);
  try {
    await git(integrationRoot, ["merge", "--no-ff", "--no-commit", taskCommit], { inherit: true });
    await git(integrationRoot, ["commit", "-m", mergeMessage], { inherit: true });
  } catch (error) {
    await git(integrationRoot, ["merge", "--abort"]).catch(() => {});
    throw new Error(`${error.message} The task worktree and branch were preserved.`);
  }

  const mergeCommit = await git(integrationRoot, ["rev-parse", "HEAD"]);
  const secondParent = await git(integrationRoot, ["rev-parse", "HEAD^2"]);
  if (secondParent !== taskCommit) throw new Error("Local merge did not record the exact approved task commit.");

  let removed = false;
  try {
    await git(controlRoot, ["worktree", "remove", taskRoot]);
    await git(controlRoot, ["branch", "-d", taskBranch]);
    removed = true;
  } catch {
    // Integration succeeded; preserve anything Git refuses to remove.
  }
  console.log("Approved result merged locally.");
  console.log(`  integration branch: ${integrationBranch}`);
  console.log(`  task commit:        ${taskCommit}`);
  console.log(`  merge commit:       ${mergeCommit}`);
  console.log(removed ? "Temporary task worktree removed." : "Task worktree retained because Git did not remove it cleanly.");
  console.log("No push, pull request, remote merge, deployment, or publication was performed.");
}

function withCodexTrailer(message) {
  const trailer = "Co-authored-by: Codex <noreply@openai.com>";
  const withoutDuplicates = message.split(/\r?\n/).filter((line) => line !== trailer).join("\n").trimEnd();
  return `${withoutDuplicates}\n\n${trailer}`;
}

function assertSafeBranch(branch, missingMessage) {
  if (!branch) throw new Error(missingMessage);
  if (branch === "main" || branch === "master") throw new Error("Agents never integrate directly into main or master.");
  if (branch.startsWith("-") || branch.includes("..") || /[\s~^:?*[\\]/.test(branch)) {
    throw new Error(`Unsafe integration branch name: ${branch}`);
  }
}

async function assertClean(root, message) {
  const status = await git(root, ["status", "--porcelain", "--untracked-files=all"]);
  if (status) throw new Error(`${message}\n${status}`);
}

async function listWorktrees(root) {
  const output = await git(root, ["worktree", "list", "--porcelain"]);
  const result = [];
  let current;
  for (const line of output.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { root: path.resolve(line.slice(9)), branch: "" };
      result.push(current);
    } else if (current && line.startsWith("branch refs/heads/")) {
      current.branch = line.slice("branch refs/heads/".length);
    }
  }
  return result;
}

async function localBranchExists(root, branch) {
  return gitExitZero(root, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
}

async function git(root, args, options = {}) {
  try {
    const result = await runFile("git", ["-C", root, ...args], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: options.inherit ? "inherit" : undefined
    });
    return options.inherit ? "" : result.stdout.trim();
  } catch (error) {
    const detail = error.stderr?.trim() || error.stdout?.trim() || error.message;
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
}

async function gitOptional(root, args) {
  try {
    return await git(root, args);
  } catch {
    return "";
  }
}

async function gitExitZero(root, args) {
  try {
    await runFile("git", ["-C", root, ...args]);
    return true;
  } catch {
    return false;
  }
}

function samePath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

async function copyFile(sourcePath, targetPath, options, results) {
  if (!(await exists(sourcePath))) return;
  const relativePath = path.relative(options.target, targetPath);
  const targetExists = await exists(targetPath);
  if (targetExists && !options.force) {
    results.skipped.push(relativePath);
    return;
  }
  if (!options.dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
  results[targetExists ? "overwritten" : "created"].push(relativePath);
}

async function copyDirectory(sourceDir, targetDir, options, results) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  if (!options.dryRun) await fs.mkdir(targetDir, { recursive: true });
  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) await copyDirectory(sourcePath, targetPath, options, results);
    else if (entry.isFile()) await copyFile(sourcePath, targetPath, options, results);
  }
}

async function assertDirectory(target) {
  let stats;
  try {
    stats = await fs.stat(target);
  } catch {
    throw new Error(`Target directory does not exist: ${target}`);
  }
  if (!stats.isDirectory()) throw new Error(`Target is not a directory: ${target}`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printInitSummary(target, options, results) {
  console.log(`${options.dryRun ? "Dry run complete" : "HAI-Harness installed"} for ${target}\n`);
  printCount("Created", results.created);
  printCount("Overwritten", results.overwritten);
  printCount("Skipped existing", results.skipped);
  if (results.skipped.length > 0 && !options.force) {
    console.log("\nExisting files were left unchanged. Re-run with --force to overwrite harness files.");
  }
}

function printUpdateSummary(target, options, results) {
  console.log(`${options.dryRun ? "Dry run complete" : "HAI-Harness scaffold updated"} for ${target}\n`);
  printCount("Updated", results.updated);
  printCount("Created", results.created);
  printCount("Preserved project state", results.preserved);
  if (results.missingSource.length > 0) printCount("Missing in package (skipped)", results.missingSource);
  console.log("\nProject-authored planning, context, design, task queues, handoff entries, lesson state, archive entries, and Human workspace content were left untouched.");
  console.log("Stable scaffold methods, templates, README files, and Human/onboarding.md were refreshed.");
  console.log("Run `hai-harness init --force` only when you intentionally want to overwrite everything.");
}

function printCount(label, paths) {
  console.log(`${label}: ${paths.length}`);
  for (const relativePath of paths) console.log(`  - ${relativePath}`);
}
