import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(projectRoot, "bin/hai-harness.mjs");
const checker = path.join(projectRoot, "Agents/check-for-update.mjs");

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

function beacon(cwd, ...args) {
  return run(process.execPath, [checker, "--target", cwd, "--cache", path.join(cwd, ".beacon-cache.json"), ...args], cwd);
}

function beaconWithLocalCache(cwd, ...args) {
  return run(process.execPath, [checker, "--target", cwd, ...args], cwd);
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

  const packageMetadata = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8"));
  const releaseMetadata = JSON.parse(await fs.readFile(path.join(projectRoot, "release.json"), "utf8"));
  assert.equal(releaseMetadata.version, packageMetadata.version);
  const checkerSource = await fs.readFile(checker, "utf8");
  assert.match(checkerSource, /api\.github\.com\/repos\/ClaudiusMa\/HAI-Harness\/releases\/latest/);
  assert.doesNotMatch(checkerSource, /raw\.githubusercontent\.com.*release\.json/);

  const installed = harness(target, "init", "--target", target);
  assert.equal(installed.status, 0, installed.stderr);
  const receipt = JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8"));
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.installedVersion, "0.2.0");
  assert.equal(receipt.channel, "stable");
  assert.equal(receipt.checkEnabled, true);
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
  const disabled = beacon(target, "--disable");
  assert.equal(disabled.status, 0, disabled.stderr);
  const updated = harness(target, "update", "--target", target);
  assert.equal(updated.status, 0, updated.stderr);
  assert.equal(await fs.readFile(path.join(target, "Agents/planning.md"), "utf8"), "project-owned planning\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/design.md"), "utf8"), "project-owned design guide\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/lessons/INDEX.md"), "utf8"), "project-owned lesson index\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), "project-owned Augustus queue\n");
  assert.notEqual(await fs.readFile(path.join(target, "Agents/skills/decision-logger/SKILL.md"), "utf8"), "stale stable method\n");
  assert.notEqual(await fs.readFile(path.join(target, "Agents/handoffs/TEMPLATE.md"), "utf8"), "stale handoff template\n");
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.equal(JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8")).checkEnabled, false);
  const healthy = harness(target, "doctor", "--target", target);
  assert.equal(healthy.status, 0, healthy.stderr);
  assert.match(healthy.stdout, /Update status: disabled/);

  await fs.writeFile(path.join(target, "Agents/planning.md"), "planning\n".repeat(2633));
  await fs.writeFile(path.join(target, "Agents/tasks/julius.md"), "task\n".repeat(842));
  const polluted = harness(target, "doctor", "--target", target);
  assert.notEqual(polluted.status, 0);
  assert.match(polluted.stdout, /Agents\/planning\.md: 2633 lines \(limit 1200\)/);
  assert.match(polluted.stdout, /Agents\/tasks\/julius\.md: 842 lines \(limit 400\)/);
  assert.match(polluted.stdout, /handoffs\/ or Agents\/_archive\//);
});

test("update beacon is weekly, private, resilient, and notifies once per release", async (t) => {
  const target = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-beacon-"));
  t.after(() => fs.rm(target, { recursive: true, force: true }));
  assert.equal(harness(target, "init", "--target", target).status, 0);

  const cachePath = path.join(target, ".beacon-cache.json");
  const fixtureDir = path.join(target, "fixtures");
  await fs.mkdir(fixtureDir);
  const availableManifest = path.join(fixtureDir, "available.json");
  const newerManifest = path.join(fixtureDir, "newer.json");
  const draftManifest = path.join(fixtureDir, "draft.json");
  const prereleaseManifest = path.join(fixtureDir, "prerelease.json");
  const unversionedTagManifest = path.join(fixtureDir, "unversioned-tag.json");
  const malformedManifest = path.join(fixtureDir, "malformed.json");
  const oversizedManifest = path.join(fixtureDir, "oversized.json");
  await fs.writeFile(availableManifest, JSON.stringify({
    tag_name: "v0.3.0",
    html_url: "https://example.invalid/v0.3.0",
    draft: false,
    prerelease: false
  }));
  await fs.writeFile(newerManifest, JSON.stringify({
    tag_name: "v0.4.0",
    html_url: "https://example.invalid/v0.4.0",
    draft: false,
    prerelease: false
  }));
  await fs.writeFile(draftManifest, JSON.stringify({
    tag_name: "v0.5.0",
    html_url: "https://example.invalid/v0.5.0",
    draft: true,
    prerelease: false
  }));
  await fs.writeFile(prereleaseManifest, JSON.stringify({
    tag_name: "v0.5.0",
    html_url: "https://example.invalid/v0.5.0",
    draft: false,
    prerelease: true
  }));
  await fs.writeFile(unversionedTagManifest, JSON.stringify({
    tag_name: "0.5.0",
    html_url: "https://example.invalid/0.5.0",
    draft: false,
    prerelease: false
  }));
  await fs.writeFile(malformedManifest, "{not-json");
  await fs.writeFile(oversizedManifest, "x".repeat(17 * 1024));

  const seeded = {
    schemaVersion: 1,
    lastNotifiedVersion: null
  };
  seeded.lastCheckedAt = "2026-08-10T00:00:00.000Z";
  seeded.lastCheckStatus = "current";
  seeded.latestVersion = "0.2.0";
  await fs.writeFile(cachePath, `${JSON.stringify(seeded, null, 2)}\n`);

  const notDue = beacon(target, "--now", "2026-08-11T00:00:00.000Z", "--manifest", malformedManifest);
  assert.equal(notDue.status, 0, notDue.stderr);
  assert.equal(notDue.stdout, "");
  assert.equal(JSON.parse(await fs.readFile(cachePath, "utf8")).lastCheckedAt, "2026-08-10T00:00:00.000Z");

  const due = beacon(target, "--now", "2026-08-18T00:00:00.000Z", "--manifest", availableManifest);
  assert.equal(due.status, 0, due.stderr);
  assert.match(due.stdout, /HAI-Harness 0\.3\.0 is available \(installed: 0\.2\.0\)/);
  assert.match(due.stdout, /update --dry-run/);
  assert.match(due.stdout, /https:\/\/example\.invalid\/v0\.3\.0/);
  const notifiedState = JSON.parse(await fs.readFile(cachePath, "utf8"));
  assert.equal(notifiedState.lastNotifiedVersion, "0.3.0");
  assert.equal(notifiedState.lastCheckStatus, "available");

  const repeated = beacon(target, "--now", "2026-08-19T00:00:00.000Z", "--manifest", availableManifest);
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.equal(repeated.stdout, "");

  const nextRelease = beacon(target, "--force", "--now", "2026-08-19T00:00:00.000Z", "--manifest", newerManifest);
  assert.equal(nextRelease.status, 0, nextRelease.stderr);
  assert.match(nextRelease.stdout, /HAI-Harness 0\.4\.0 is available/);

  const updatedReceipt = JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8"));
  updatedReceipt.installedVersion = "0.4.0";
  await fs.writeFile(path.join(target, ".hai-harness.json"), `${JSON.stringify(updatedReceipt, null, 2)}\n`);
  const updatedStatus = beacon(target, "--status", "--now", "2026-08-20T00:00:00.000Z", "--manifest", malformedManifest);
  assert.equal(updatedStatus.status, 0, updatedStatus.stderr);
  assert.match(updatedStatus.stdout, /Update status: current \(0\.4\.0\)/);

  assert.equal(beacon(target, "--disable").status, 0);
  const beforeDisabledCheck = JSON.parse(await fs.readFile(cachePath, "utf8")).lastCheckedAt;
  const optedOut = beacon(target, "--force", "--now", "2026-09-01T00:00:00.000Z", "--manifest", availableManifest);
  assert.equal(optedOut.status, 0, optedOut.stderr);
  assert.equal(optedOut.stdout, "");
  assert.equal(JSON.parse(await fs.readFile(cachePath, "utf8")).lastCheckedAt, beforeDisabledCheck);

  assert.equal(beacon(target, "--enable").status, 0);
  for (const rejectedManifest of [
    path.join(fixtureDir, "missing.json"),
    malformedManifest,
    oversizedManifest,
    draftManifest,
    prereleaseManifest,
    unversionedTagManifest
  ]) {
    const rejected = beacon(target, "--force", "--now", "2026-09-01T00:00:00.000Z", "--manifest", rejectedManifest);
    assert.equal(rejected.status, 0, rejected.stderr);
    assert.equal(rejected.stdout, "");
    const status = beacon(target, "--status", "--now", "2026-09-01T00:00:00.000Z", "--manifest", rejectedManifest);
    assert.equal(status.status, 0, status.stderr);
    assert.match(status.stdout, /Update status: unknown\/offline/);
  }
});

test("routine update checks keep an installed Git worktree clean", async (t) => {
  const { tempRoot, repo } = await makeGitFixture(t);
  assert.equal(harness(repo, "init", "--target", repo).status, 0);
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Install fixture harness");

  const manifestPath = path.join(tempRoot, "release.json");
  await fs.writeFile(manifestPath, JSON.stringify({
    tag_name: "v0.3.0",
    html_url: "https://example.invalid/v0.3.0",
    draft: false,
    prerelease: false
  }));
  const cachePath = path.resolve(repo, git(repo, "rev-parse", "--git-path", "hai-harness/update-beacon.json"));
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify({
    schemaVersion: 1,
    lastCheckedAt: "2026-08-01T00:00:00.000Z",
    lastCheckStatus: "current",
    latestVersion: "0.2.0",
    lastNotifiedVersion: null
  }));

  const checked = beaconWithLocalCache(repo, "--now", "2026-08-14T00:00:00.000Z", "--manifest", manifestPath);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /HAI-Harness 0\.3\.0 is available/);
  assert.equal(git(repo, "status", "--porcelain", "--untracked-files=all"), "");
});
