import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(projectRoot, "bin/hai-harness.mjs");

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: "utf8" });
}

function git(cwd, ...args) {
  const result = run("git", args, cwd);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function harness(cwd, ...args) {
  return run(process.execPath, [cli, ...args], cwd);
}

async function makeGitFixture(t) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-test-"));
  t.after(() => fs.rm(tempRoot, { recursive: true, force: true }));
  const repo = path.join(tempRoot, "project");
  await fs.mkdir(repo);
  git(repo, "init", "-b", "develop");
  git(repo, "config", "user.name", "HAI Harness Test");
  git(repo, "config", "user.email", "hai-harness@example.invalid");
  await fs.writeFile(path.join(repo, "README.md"), "fixture\n");
  git(repo, "add", "README.md");
  git(repo, "commit", "-m", "Initial fixture");
  return { tempRoot, repo };
}

test("worktree lifecycle succeeds and unsafe requests are rejected", async (t) => {
  const { repo } = await makeGitFixture(t);

  const created = harness(repo, "worktree", "create", "happy-path", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  const taskRoot = `${repo}-worktrees/happy-path`;
  const status = harness(taskRoot, "worktree", "status", "--target", taskRoot);
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Integration branch: develop/);
  await fs.writeFile(path.join(taskRoot, "result.txt"), "approved\n");
  const approved = harness(taskRoot, "worktree", "approve", "--approved", "Complete fixture", "--target", taskRoot);
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal((await fs.stat(taskRoot).catch(() => null)), null);
  assert.equal(git(repo, "rev-list", "--parents", "-n", "1", "HEAD").split(" ").length, 3);

  await fs.writeFile(path.join(repo, "dirty.txt"), "dirty\n");
  const dirty = harness(repo, "worktree", "create", "dirty-reject", "--target", repo);
  assert.notEqual(dirty.status, 0);
  assert.match(dirty.stderr, /integration worktree is dirty/i);
  await fs.unlink(path.join(repo, "dirty.txt"));

  for (const protectedBranch of ["main", "master"]) {
    git(repo, "branch", protectedBranch);
    const protectedResult = harness(repo, "worktree", "create", `${protectedBranch}-reject`, "--integration", protectedBranch, "--target", repo);
    assert.notEqual(protectedResult.status, 0);
    assert.match(protectedResult.stderr, /never integrate directly/i);
  }

  const pending = harness(repo, "worktree", "create", "approval-required", "--target", repo);
  assert.equal(pending.status, 0, pending.stderr);
  const pendingRoot = `${repo}-worktrees/approval-required`;
  const missingApproval = harness(pendingRoot, "worktree", "approve", "--target", pendingRoot);
  assert.notEqual(missingApproval.status, 0);
  assert.match(missingApproval.stderr, /requires --approved/);
  const ambiguous = harness(pendingRoot, "worktree", "create", "nested", "--target", pendingRoot);
  assert.notEqual(ambiguous.status, 0);
  assert.match(ambiguous.stderr, /primary checkout/i);
  const unsafe = harness(repo, "worktree", "create", "unsafe-branch", "--integration", "bad..branch", "--target", repo);
  assert.notEqual(unsafe.status, 0);
  assert.match(unsafe.stderr, /unsafe integration branch/i);
});

test("init, update, and doctor preserve state and flag polluted startup context", async (t) => {
  const target = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-install-"));
  t.after(() => fs.rm(target, { recursive: true, force: true }));

  const installed = harness(target, "init", "--target", target);
  assert.equal(installed.status, 0, installed.stderr);
  assert.deepEqual((await fs.readdir(path.join(projectRoot, "Agents/tasks"))).sort(), ["TEMPLATE.md"]);
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), /^# Augustus Tasks/m);
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.doesNotMatch(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), /\{\{ROLE_/);
  await fs.writeFile(path.join(target, "Agents/planning.md"), "project-owned planning\n");
  await fs.writeFile(path.join(target, "Agents/design.md"), "project-owned design guide\n");
  await fs.writeFile(path.join(target, "Agents/lessons/INDEX.md"), "project-owned lesson index\n");
  await fs.writeFile(path.join(target, "Agents/tasks/augustus.md"), "project-owned Augustus queue\n");
  await fs.writeFile(path.join(target, "Agents/skills/decision-logger/SKILL.md"), "stale stable method\n");
  await fs.writeFile(path.join(target, "Agents/handoffs/TEMPLATE.md"), "stale handoff template\n");
  await fs.unlink(path.join(target, "Agents/tasks/julius.md"));
  const updated = harness(target, "update", "--target", target);
  assert.equal(updated.status, 0, updated.stderr);
  assert.equal(await fs.readFile(path.join(target, "Agents/planning.md"), "utf8"), "project-owned planning\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/design.md"), "utf8"), "project-owned design guide\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/lessons/INDEX.md"), "utf8"), "project-owned lesson index\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), "project-owned Augustus queue\n");
  assert.notEqual(await fs.readFile(path.join(target, "Agents/skills/decision-logger/SKILL.md"), "utf8"), "stale stable method\n");
  assert.notEqual(await fs.readFile(path.join(target, "Agents/handoffs/TEMPLATE.md"), "utf8"), "stale handoff template\n");
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  const healthy = harness(target, "doctor", "--target", target);
  assert.equal(healthy.status, 0, healthy.stderr);

  await fs.writeFile(path.join(target, "Agents/planning.md"), "planning\n".repeat(2633));
  await fs.writeFile(path.join(target, "Agents/tasks/julius.md"), "task\n".repeat(842));
  const polluted = harness(target, "doctor", "--target", target);
  assert.notEqual(polluted.status, 0);
  assert.match(polluted.stdout, /Agents\/planning\.md: 2633 lines \(limit 1200\)/);
  assert.match(polluted.stdout, /Agents\/tasks\/julius\.md: 842 lines \(limit 400\)/);
  assert.match(polluted.stdout, /handoffs\/ or Agents\/_archive\//);
});
