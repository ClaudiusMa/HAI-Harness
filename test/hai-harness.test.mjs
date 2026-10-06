import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installedVersion = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8")).version;
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
  assert.match(created.stdout, /branch:\s+task\/happy-path/);
  const taskRoot = `${repo}-worktrees/happy-path`;
  assert.equal(git(repo, "config", "--get", "branch.task/happy-path.haiIntegrationBranch"), "develop");
  assert.equal(git(repo, "config", "--get", "branch.task/happy-path.haiBaseCommit"), git(repo, "rev-parse", "HEAD"));
  assert.notEqual(run("git", ["config", "--get", "branch.task/happy-path.codexIntegrationBranch"], repo).status, 0);
  const status = harness(taskRoot, "worktree", "status", "--target", taskRoot);
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Branch:\s+task\/happy-path/);
  assert.match(status.stdout, /Integration branch: develop/);
  await fs.writeFile(path.join(taskRoot, "result.txt"), "approved\n");
  const approved = harness(taskRoot, "worktree", "approve", "--approved", "Complete fixture", "--target", taskRoot);
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal((await fs.stat(taskRoot).catch(() => null)), null);
  assert.equal(git(repo, "rev-list", "--parents", "-n", "1", "HEAD").split(" ").length, 3);
  assert.equal(git(repo, "log", "-1", "--format=%B", "HEAD^2"), "Complete fixture");
  assert.equal(git(repo, "log", "-1", "--format=%B", "HEAD"), "Merge task/happy-path: Complete fixture");
  assert.doesNotMatch(git(repo, "log", "-2", "--format=%B"), /co-authored-by|codex|openai/i);

  await fs.writeFile(path.join(repo, "dirty.txt"), "dirty\n");
  const dirty = harness(repo, "worktree", "create", "dirty-reject", "--target", repo);
  assert.notEqual(dirty.status, 0);
  assert.match(dirty.stderr, /develop checkout has uncommitted changes[\s\S]*review and commit/i);
  await fs.unlink(path.join(repo, "dirty.txt"));

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

  // A lane created before neutral naming must remain approvable while it is in flight.
  const legacyBranch = "codex/legacy-compatible";
  const legacyRoot = `${repo}-worktrees/legacy-compatible`;
  const legacyBase = git(repo, "rev-parse", "HEAD");
  git(repo, "worktree", "add", "-b", legacyBranch, legacyRoot, legacyBase);
  git(repo, "config", "--local", `branch.${legacyBranch}.codexIntegrationBranch`, "develop");
  git(repo, "config", "--local", `branch.${legacyBranch}.codexBaseCommit`, legacyBase);
  await fs.writeFile(path.join(legacyRoot, "legacy-result.txt"), "approved\n");
  const legacyApproved = harness(legacyRoot, "worktree", "approve", "--approved", "Complete legacy fixture", "--target", legacyRoot);
  assert.equal(legacyApproved.status, 0, legacyApproved.stderr);
  assert.equal((await fs.stat(legacyRoot).catch(() => null)), null);
  assert.equal(git(repo, "log", "-1", "--format=%B", "HEAD^2"), "Complete legacy fixture");
  assert.doesNotMatch(git(repo, "log", "-2", "--format=%B"), /co-authored-by|openai/i);
});

test("main lanes refresh in the lane, stop for re-test, hand conflicts back, and keep main clean", async (t) => {
  const { repo } = await makeGitFixture(t);
  git(repo, "branch", "-m", "develop", "main");
  await fs.writeFile(path.join(repo, "shared.txt"), "one\ntwo\nthree\n");
  git(repo, "add", "shared.txt");
  git(repo, "commit", "-m", "Add shared file");
  const commitOnMain = async (file, content, message) => {
    await fs.writeFile(path.join(repo, file), content);
    git(repo, "add", file);
    git(repo, "commit", "-m", message);
  };

  // Main must be clean before a lane starts.
  await fs.writeFile(path.join(repo, "stray.txt"), "stray\n");
  const dirtyCreate = harness(repo, "worktree", "create", "early", "--target", repo);
  assert.notEqual(dirtyCreate.status, 0);
  assert.match(dirtyCreate.stderr, /main checkout has uncommitted changes[\s\S]*review and commit[\s\S]*stray\.txt/);
  const doctorDirty = harness(repo, "doctor", "--target", repo);
  assert.match(doctorDirty.stdout, /primary checkout \(main\) has uncommitted changes: stray\.txt/);
  await fs.unlink(path.join(repo, "stray.txt"));

  for (const slug of ["grid", "hover", "theme"]) {
    const created = harness(repo, "worktree", "create", slug, "--target", repo);
    assert.equal(created.status, 0, created.stderr);
    assert.equal(git(repo, "config", "--get", `branch.task/${slug}.haiIntegrationBranch`), "main");
  }
  const lane = (slug) => `${repo}-worktrees/${slug}`;
  await fs.writeFile(path.join(lane("grid"), "shared.txt"), "ONE\ntwo\nthree\n");
  await fs.writeFile(path.join(lane("hover"), "shared.txt"), "one\ntwo\nTHREE\n");
  await fs.writeFile(path.join(lane("theme"), "shared.txt"), "uno\ntwo\nthree\n");
  const overview = harness(repo, "worktree", "status", "--all", "--target", repo);
  assert.equal(overview.status, 0, overview.stderr);
  assert.match(overview.stdout, /task\/grid\n[\s\S]*integrates:  main \(0 commit\(s\) behind\)[\s\S]*also changed by task\/hover: shared\.txt/);

  // First lane fast-forwards main to a merge commit; main stays clean.
  const grid = harness(lane("grid"), "worktree", "approve", "--approved", "Grid order", "--target", lane("grid"));
  assert.equal(grid.status, 0, grid.stderr);
  assert.equal(git(repo, "log", "-1", "--format=%s"), "Merge task/grid: Grid order");
  assert.equal(git(repo, "status", "--porcelain"), "");
  assert.equal(git(repo, "branch", "--list", "task/grid"), "");

  // A lane behind main gets main merged in and stops so its test can rerun.
  const mainBefore = git(repo, "rev-parse", "HEAD");
  const hover = harness(lane("hover"), "worktree", "approve", "--approved", "Hover video", "--target", lane("hover"));
  assert.notEqual(hover.status, 0);
  assert.match(hover.stdout, /Merged the latest main into task\/hover; nothing was integrated yet[\s\S]*Re-run the quick test/);
  assert.equal(git(repo, "rev-parse", "HEAD"), mainBefore);
  assert.equal(await fs.readFile(path.join(lane("hover"), "shared.txt"), "utf8"), "ONE\ntwo\nTHREE\n");

  // A dirty main blocks integration and keeps the lane.
  await fs.writeFile(path.join(repo, "stray.txt"), "stray\n");
  const blocked = harness(lane("hover"), "worktree", "approve", "--approved", "Hover video", "--target", lane("hover"));
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /main checkout has uncommitted changes[\s\S]*task worktree is preserved/);
  assert.equal(git(repo, "rev-parse", "HEAD"), mainBefore);
  await fs.unlink(path.join(repo, "stray.txt"));

  const hoverAgain = harness(lane("hover"), "worktree", "approve", "--approved", "Hover video", "--target", lane("hover"));
  assert.equal(hoverAgain.status, 0, hoverAgain.stderr);
  assert.equal(await fs.readFile(path.join(repo, "shared.txt"), "utf8"), "ONE\ntwo\nTHREE\n");
  assert.equal(git(repo, "rev-parse", "HEAD^1"), mainBefore);

  // A real conflict changes nothing and is handed back with the file list.
  await commitOnMain("other.txt", "unrelated\n", "Unrelated main change");
  const mainAtConflict = git(repo, "rev-parse", "HEAD");
  const theme = harness(lane("theme"), "worktree", "approve", "--approved", "Theme", "--target", lane("theme"));
  assert.notEqual(theme.status, 0);
  assert.match(theme.stderr, /latest main conflicts with this lane in: shared\.txt[\s\S]*Ask the user/);
  assert.equal(git(repo, "rev-parse", "HEAD"), mainAtConflict);
  assert.equal(git(lane("theme"), "status", "--porcelain"), "");
  assert.equal(git(lane("theme"), "branch", "--show-current"), "task/theme");
  assert.equal(git(lane("theme"), "log", "-1", "--format=%s"), "Theme");
});

test("approve survives a failing checkout hook and cleans up a lane on a secondary integration worktree", async (t) => {
  const { repo, tempRoot } = await makeGitFixture(t);
  git(repo, "branch", "-m", "develop", "main");
  git(repo, "branch", "develop");
  const developRoot = path.join(tempRoot, "develop");
  git(repo, "worktree", "add", developRoot, "develop");
  const hooks = path.join(tempRoot, "hooks");
  await fs.mkdir(hooks);
  await fs.writeFile(path.join(hooks, "post-checkout"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });

  const created = harness(repo, "worktree", "create", "secondary", "--integration", "develop", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  git(repo, "config", "core.hooksPath", hooks);
  const laneRoot = `${repo}-worktrees/secondary`;
  await fs.writeFile(path.join(laneRoot, "result.txt"), "approved\n");
  const approved = harness(laneRoot, "worktree", "approve", "--approved", "Secondary fixture", "--target", laneRoot);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /Temporary task worktree removed/);
  assert.equal(git(developRoot, "log", "-1", "--format=%s"), "Merge task/secondary: Secondary fixture");
  assert.equal(git(repo, "branch", "--list", "task/secondary"), "");
  assert.equal(git(repo, "rev-parse", "main"), git(repo, "rev-parse", "develop^1"));
});

test("init, update, and doctor preserve state and flag polluted startup context", async (t) => {
  const target = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-install-"));
  t.after(() => fs.rm(target, { recursive: true, force: true }));

  const packageMetadata = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8"));
  const releaseMetadata = JSON.parse(await fs.readFile(path.join(projectRoot, "release.json"), "utf8"));
  assert.equal(releaseMetadata.version, packageMetadata.version);
  assert.ok(packageMetadata.files.includes("scaffold"));
  assert.ok(!packageMetadata.files.includes("AGENTS.md"));
  const checkerSource = await fs.readFile(checker, "utf8");
  assert.match(checkerSource, /api\.github\.com\/repos\/ClaudiusMa\/HAI-Harness\/releases\/latest/);
  assert.doesNotMatch(checkerSource, /raw\.githubusercontent\.com.*release\.json/);

  const installed = harness(target, "init", "--target", target);
  assert.equal(installed.status, 0, installed.stderr);
  assert.equal(
    await fs.readFile(path.join(target, "AGENTS.md"), "utf8"),
    await fs.readFile(path.join(projectRoot, "scaffold/AGENTS.md"), "utf8")
  );
  assert.notEqual(
    await fs.readFile(path.join(target, "AGENTS.md"), "utf8"),
    await fs.readFile(path.join(projectRoot, "AGENTS.md"), "utf8")
  );
  assert.equal(await fs.stat(path.join(target, "AGENTS.override.md")).catch(() => null), null);
  assert.equal(await fs.stat(path.join(target, "CLAUDE.md")).catch(() => null), null);
  const receipt = JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8"));
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.installedVersion, installedVersion);
  assert.equal(receipt.channel, "stable");
  assert.equal(receipt.checkEnabled, true);
  assert.deepEqual((await fs.readdir(path.join(projectRoot, "Agents/tasks"))).sort(), ["TEMPLATE.md"]);
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), /^# Augustus Tasks/m);
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.doesNotMatch(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), /\{\{ROLE_/);
  const shippedSkills = ["code-review", "implement"];
  for (const skill of shippedSkills) {
    const skillFile = `Agents/skills/${skill}/SKILL.md`;
    assert.equal(
      await fs.readFile(path.join(target, skillFile), "utf8"),
      await fs.readFile(path.join(projectRoot, skillFile), "utf8")
    );
  }
  await fs.writeFile(path.join(target, "Agents/planning.md"), "project-owned planning\n");
  await fs.writeFile(path.join(target, "Agents/design.md"), "project-owned design guide\n");
  await fs.writeFile(path.join(target, "Agents/lessons/INDEX.md"), "project-owned lesson index\n");
  await fs.writeFile(path.join(target, "Agents/tasks/augustus.md"), "project-owned Augustus queue\n");
  await fs.writeFile(path.join(target, "AGENTS.md"), "stale root entry point\n");
  await fs.writeFile(path.join(target, "Agents/skills/decision-logger/SKILL.md"), "stale stable method\n");
  for (const skill of shippedSkills) {
    await fs.writeFile(path.join(target, `Agents/skills/${skill}/SKILL.md`), `stale ${skill} method\n`);
    await fs.writeFile(path.join(target, `Agents/skills/${skill}/project-note.md`), `project-owned ${skill} note\n`);
  }
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
  assert.equal(
    await fs.readFile(path.join(target, "AGENTS.md"), "utf8"),
    await fs.readFile(path.join(projectRoot, "scaffold/AGENTS.md"), "utf8")
  );
  assert.notEqual(await fs.readFile(path.join(target, "Agents/skills/decision-logger/SKILL.md"), "utf8"), "stale stable method\n");
  for (const skill of shippedSkills) {
    const skillFile = `Agents/skills/${skill}/SKILL.md`;
    assert.equal(await fs.readFile(path.join(target, skillFile), "utf8"), await fs.readFile(path.join(projectRoot, skillFile), "utf8"));
    assert.equal(await fs.readFile(path.join(target, `Agents/skills/${skill}/project-note.md`), "utf8"), `project-owned ${skill} note\n`);
  }
  assert.notEqual(await fs.readFile(path.join(target, "Agents/handoffs/TEMPLATE.md"), "utf8"), "stale handoff template\n");
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.equal(JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8")).checkEnabled, false);
  for (const skill of shippedSkills) await fs.unlink(path.join(target, `Agents/skills/${skill}/SKILL.md`));
  const missingReviewSkill = harness(target, "doctor", "--target", target);
  assert.notEqual(missingReviewSkill.status, 0);
  assert.match(missingReviewSkill.stdout, /Agents\/skills\/code-review\/SKILL\.md/);
  assert.match(missingReviewSkill.stdout, /Agents\/skills\/implement\/SKILL\.md/);
  const restoredReviewSkill = harness(target, "update", "--target", target);
  assert.equal(restoredReviewSkill.status, 0, restoredReviewSkill.stderr);
  for (const skill of shippedSkills) {
    const skillFile = `Agents/skills/${skill}/SKILL.md`;
    assert.equal(await fs.readFile(path.join(target, skillFile), "utf8"), await fs.readFile(path.join(projectRoot, skillFile), "utf8"));
  }
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

function trailEntry(id, origin, area, change = `change ${id}`) {
  return `### T${id}\n- Date: 2026-09-30\n- Change: ${change}\n- Why: reason ${id}\n- Origin: ${origin}\n- Area: ${area}\n`;
}

async function makePacketFixture(t, scope = "") {
  const { repo } = await makeGitFixture(t);
  const target = path.join(repo, scope);
  await fs.mkdir(target, { recursive: true });
  assert.equal(harness(target, "init", "--target", target).status, 0);
  assert.equal(beacon(target, "--disable").status, 0);
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Install harness");
  assert.equal(harness(repo, "worktree", "create", "capture", "--target", repo).status, 0);
  const lane = `${repo}-worktrees/capture`;
  t.after(() => fs.rm(`${repo}-worktrees`, { recursive: true, force: true }));
  const root = path.join(lane, scope);
  assert.equal(harness(root, "human-sync", "init", "--target", root).status, 0);
  const status = harness(root, "human-sync", "status", "--target", root);
  assert.equal(status.status, 0, status.stderr);
  return { repo, lane, root, packet: JSON.parse(status.stdout).packet };
}

async function appendTrail(packet, entries) {
  await fs.appendFile(path.join(packet, "decision-trail.md"), `\n${entries.join("\n")}`);
}

async function setCaptureCursor(packet, cursor) {
  const file = path.join(packet, "human-inbox.md");
  const inbox = await fs.readFile(file, "utf8");
  await fs.writeFile(file, inbox.replace(/^Captured through: .*$/m, `Captured through: ${cursor}`));
}

function observed(root) {
  const result = harness(root, "human-sync", "status", "--target", root);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function acknowledge(root, through, state = observed(root)) {
  return harness(root, "human-sync", "acknowledge", "--target", root, "--through", through, "--head", state.head, "--snapshot", state.snapshot);
}

test("human-sync task packet filters, cursor, malformed review and approved suppression remain read-only", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  assert.match(harness(root, "human-sync", "--target", root).stdout, /no new trail entries since the trail began/);
  await appendTrail(packet, [trailEntry(1, "agent", "code"), trailEntry(2, "agent", "`code`")]);
  const code = harness(root, "human-sync", "--target", root);
  assert.equal(code.status, 0, code.stderr);
  assert.match(code.stdout, /nothing to capture/);
  assert.match(code.stdout, /Captured through: T2/);
  await setCaptureCursor(packet, "T2");
  await appendTrail(packet, [trailEntry(3, "user", "code"), trailEntry(4, "agent", "design"), trailEntry(5, "agent", "process"), trailEntry(6, "agent", "code"), trailEntry(7, "someone", "product"), `${trailEntry(8, "user", "product")}- Applies: approved draft\n`, "### malformed heading\n"]);
  const files = ["decision-trail.md", "human-inbox.md", "packet.json"];
  const before = await Promise.all(files.map((name) => fs.readFile(path.join(packet, name), "utf8")));
  const kept = harness(root, "human-sync", "--target", root);
  assert.equal(kept.status, 0, kept.stderr);
  assert.match(kept.stdout, /5 of 7 new trail entries/);
  assert.match(kept.stdout, /^T3 · decision/m);
  assert.match(kept.stdout, /^T4 · open question/m);
  assert.match(kept.stdout, /^T7 · review/m);
  assert.match(kept.stdout, /^malformed heading · review/m);
  assert.doesNotMatch(kept.stdout, /^T6 ·|^T8 ·/m);
  assert.deepEqual(await Promise.all(files.map((name) => fs.readFile(path.join(packet, name), "utf8"))), before);
  await setCaptureCursor(packet, "`none`");
  assert.equal(harness(root, "human-sync", "--target", root).status, 0);
  await setCaptureCursor(packet, "T8");
  assert.doesNotMatch(harness(root, "human-sync", "--target", root).stdout, /^T[1-8] ·/m);
});

test("human-sync refuses shared, detached, missing and invalid packets and isolates resumed tasks", async (t) => {
  const { repo, root, packet } = await makePacketFixture(t);
  assert.notEqual(harness(repo, "human-sync", "--target", repo).status, 0);
  await appendTrail(packet, [trailEntry(1, "user", "product", "only task one")]);
  assert.equal(harness(repo, "worktree", "create", "other", "--target", repo).status, 0);
  const other = `${repo}-worktrees/other`;
  assert.match(harness(other, "human-sync", "--target", other).stderr, /Missing task packet/);
  assert.equal(harness(other, "human-sync", "init", "--target", other).status, 0);
  assert.doesNotMatch(harness(other, "human-sync", "--target", other).stdout, /only task one/);
  assert.match(harness(root, "human-sync", "--target", root).stdout, /only task one/);
  assert.equal(observed(root).packet, packet);
  git(other, "checkout", "--detach");
  assert.notEqual(harness(other, "human-sync", "--target", other).status, 0);
  const metadata = path.join(packet, "packet.json");
  const content = JSON.parse(await fs.readFile(metadata, "utf8"));
  content.identity.base = "bad";
  await fs.writeFile(metadata, JSON.stringify(content));
  assert.match(harness(root, "human-sync", "--target", root).stderr, /Invalid task packet/);
});

test("human-sync rejects physical packet file and namespace redirects", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const trail = path.join(packet, "decision-trail.md");
  const saved = `${trail}.saved`;
  await fs.rename(trail, saved);
  await fs.symlink(saved, trail);
  assert.match(harness(root, "human-sync", "--target", root).stderr, /never a symlink redirect/);
  await fs.unlink(trail);
  await fs.rename(saved, trail);
  const moved = `${packet}.saved`;
  await fs.rename(packet, moved);
  await fs.symlink(moved, packet);
  assert.match(harness(root, "human-sync", "--target", root).stderr, /never symlink redirects/);
});

test("human-sync init and update omit provisional Agents storage; explicit migration verifies and logs supersession", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  assert.equal(await fs.stat(path.join(root, "Agents/decision-trail.md")).catch(() => null), null);
  await appendTrail(packet, [trailEntry(1, "user", "product")]);
  const before = await fs.readFile(path.join(packet, "decision-trail.md"), "utf8");
  assert.equal(harness(root, "update", "--target", root).status, 0);
  assert.equal(await fs.readFile(path.join(packet, "decision-trail.md"), "utf8"), before);
  assert.equal(await fs.stat(path.join(root, "Agents/human-inbox.md")).catch(() => null), null);
  // Simulate a pre-packet recognized lane without discarding populated files.
  await fs.rm(packet, { recursive: true });
  const trail = `# Trail\n\n## Entries\n${trailEntry(1, "user", "product")}`;
  const inbox = "Captured through: T1\n\n## Drafts\n### draft\n- Status: deferred\n";
  await fs.writeFile(path.join(root, "Agents/decision-trail.md"), trail);
  await fs.writeFile(path.join(root, "Agents/human-inbox.md"), inbox);
  assert.equal(harness(root, "update", "--target", root).status, 0);
  assert.equal(await fs.readFile(path.join(root, "Agents/decision-trail.md"), "utf8"), trail);
  assert.match(harness(root, "human-sync", "init", "--target", root).stderr, /Legacy Agents storage/);
  const migrated = harness(root, "human-sync", "init", "--migrate", "--target", root);
  assert.equal(migrated.status, 0, migrated.stderr);
  assert.equal(await fs.readFile(path.join(packet, "decision-trail.md"), "utf8"), trail);
  assert.equal(await fs.readFile(path.join(packet, "human-inbox.md"), "utf8"), inbox);
  const receipt = JSON.parse(await fs.readFile(path.join(packet, "packet.json"), "utf8"));
  assert.equal(receipt.supersession.files[0].content, trail);
  assert.equal(receipt.supersession.files[1].content, inbox);
  assert.equal(await fs.stat(path.join(root, "Agents/decision-trail.md")).catch(() => null), null);
  assert.match(harness(root, "doctor", "--target", root).stdout, /0 pending and 1 deferred/);
});

test("human-sync migration refuses redirected legacy parents without adopting or retiring external state", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t, ".hai");
  await fs.rm(packet, { recursive: true });
  const agents = path.join(root, "Agents");
  const saved = `${agents}.saved`;
  await fs.rename(agents, saved);
  const destinations = [
    path.join(path.dirname(repo), "external-human-state"),
    path.join(repo, "other-harness", "Agents"),
    path.join(lane, "other-harness", "Agents")
  ];
  const contents = {
    "decision-trail.md": `# Trail\n\n## Entries\n${trailEntry(1, "user", "product", "preserve external choice")}`,
    "human-inbox.md": "Captured through: T1\n\n## Drafts\n### waiting\n- Status: deferred\n"
  };
  for (const destination of destinations) {
    await fs.mkdir(destination, { recursive: true });
    for (const [name, content] of Object.entries(contents)) await fs.writeFile(path.join(destination, name), content);
    await fs.symlink(destination, agents);
    const result = harness(root, "human-sync", "init", "--migrate", "--target", root);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /parent symlink redirects are refused/);
    for (const [name, content] of Object.entries(contents)) assert.equal(await fs.readFile(path.join(destination, name), "utf8"), content);
    assert.equal(await fs.stat(packet).catch(() => null), null, "refusal must not adopt a partial packet");
    await fs.unlink(agents);
  }
  await fs.rename(saved, agents);
});

test("human-sync doctor and acknowledgment bind new traces to committed and dirty snapshots", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const inbox = path.join(packet, "human-inbox.md");
  await fs.appendFile(inbox, "\n### draft\n  - Status: pending note\n### later\n- Status: deferred\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /1 pending and 1 deferred/);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  await fs.appendFile(path.join(root, "Agents/planning.md"), "\nDirection.\n");
  const stale = observed(root);
  await appendTrail(packet, [trailEntry(1, "user", "process", "Agents/planning.md direction")]);
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/planning\.md/);
  await fs.appendFile(path.join(root, "Agents/planning.md"), "\nMore direction.\n");
  assert.notEqual(acknowledge(root, "T1", stale).status, 0);
  assert.equal(acknowledge(root, "T1").status, 0);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  git(root, "add", "Agents/planning.md");
  git(root, "commit", "-m", "Commit direction");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/planning\.md/);
  assert.notEqual(acknowledge(root, "T1").status, 0);
  await appendTrail(packet, [trailEntry(2, "user", "process", "unrelated choice")]);
  assert.match(acknowledge(root, "T2").stderr, /name every changed traced path/);
  await appendTrail(packet, [trailEntry(3, "user", "process", "Agents/planning.md committed direction")]);
  assert.equal(acknowledge(root, "T3").status, 0);
  await fs.appendFile(path.join(root, "Agents/claudia.md"), "\nRole change.\n");
  git(root, "commit", "-am", "Role change");
  await fs.appendFile(path.join(packet, "decision-trail.md"), "\nUnrelated dirty trail.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/claudia\.md/);
});

test("human-sync resolves .hai traced scope, physical common metadata and retained checkpoints through cleanup", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t, ".hai");
  const common = await fs.realpath(git(repo, "rev-parse", "--path-format=absolute", "--git-common-dir"));
  assert.ok(packet.startsWith(`${common}${path.sep}hai-harness${path.sep}`));
  await fs.appendFile(path.join(root, "Agents/design.md"), "\nToken.\n");
  git(lane, "commit", "-am", "Design token");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/design\.md/);
  await appendTrail(packet, [trailEntry(1, "user", "design", "Agents/design.md token")]);
  assert.equal(acknowledge(root, "T1").status, 0);
  const output = path.join(path.dirname(repo), "packet-checkpoint.json");
  assert.equal(harness(root, "human-sync", "checkpoint", "--target", root, "--output", output).status, 0);
  assert.notEqual(harness(root, "human-sync", "checkpoint", "--target", root, "--output", path.join(repo, "checkpoint.json")).status, 0);
  const exported = JSON.parse(await fs.readFile(output, "utf8"));
  assert.match(exported.files["decision-trail.md"], /token/);
  assert.notEqual(harness(root, "human-sync", "checkpoint", "--target", root, "--output", path.join(root, "packet.json")).status, 0);
  assert.notEqual(harness(root, "human-sync", "checkpoint", "--target", root, "--output", path.join(lane, "checkpoint.json")).status, 0);
  await fs.appendFile(path.join(packet, "human-inbox.md"), "\n### carry forward\n- Status: deferred\n");
  const approved = harness(lane, "worktree", "approve", "--approved", "Design token fixture", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  assert.match(await fs.readFile(path.join(packet, "human-inbox.md"), "utf8"), /carry forward/);
  assert.equal(JSON.parse(await fs.readFile(path.join(packet, "packet.json"), "utf8")).identity.branch, "task/capture");
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
  assert.ok(due.stdout.includes(`HAI-Harness 0.3.0 is available (installed: ${installedVersion})`));
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

test("self-hosting wrapper uses ordinary updates and preserves populated project records", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "hai-self-hosting-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const entry of ["Agents", "Human", "bin", "scaffold", "AGENTS.md", "package.json", "release.json", "hai-meta"]) {
    await fs.cp(path.join(projectRoot, entry), path.join(root, entry), { recursive: true });
  }
  const target = path.join(root, ".hai");
  const meta = (...args) => run("bash", [path.join(root, "hai-meta"), ...args], os.tmpdir());
  assert.equal(meta("bootstrap").status, 0);
  const records = [
    ".hai/Agents/planning.md", ".hai/Agents/project_context.md", ".hai/Agents/design.md",
    ".hai/Agents/tasks/augustus.md", ".hai/Agents/tasks/julius.md",
    ".hai/Agents/handoffs/project.md", ".hai/Agents/lessons/INDEX.md",
    ".hai/Agents/lessons/project.md", ".hai/Agents/_archive/project.md",
    ".hai/Human/brief.md", ".hai/Human/decisions.md", ".hai/Human/open_questions.md",
    ".hai/Human/reflections.md", ".hai/README.md", "AGENTS.md",
    ".hai/Agents/skills/local-only/SKILL.md", ".hai/Agents/skills/decision-logger/local-note.md",
    ".hai/Agents/skills/code-review/project-note.md", ".hai/Agents/skills/implement/project-note.md"
  ];
  for (const record of records) {
    await fs.mkdir(path.dirname(path.join(root, record)), { recursive: true });
    await fs.writeFile(path.join(root, record), `Project record: ${record}\n`);
  }
  // A source-side extra file must not be bulk-mirrored over local skill state.
  await fs.writeFile(path.join(root, "Agents/skills/decision-logger/local-note.md"), "source extra\n");
  for (const skill of ["code-review", "implement"]) {
    await fs.writeFile(path.join(root, `Agents/skills/${skill}/project-note.md`), "source extra\n");
  }
  const stableSkills = [
    "Agents/skills/decision-logger/SKILL.md",
    "Agents/skills/code-review/SKILL.md",
    "Agents/skills/implement/SKILL.md"
  ];
  for (const stable of stableSkills) await fs.writeFile(path.join(target, stable), "stale method\n");
  for (const command of ["bootstrap", "sync", "sync"]) {
    const result = meta(command);
    assert.equal(result.status, 0, result.stderr);
    for (const record of records) {
      assert.equal(await fs.readFile(path.join(root, record), "utf8"), `Project record: ${record}\n`, record);
    }
  }
  for (const stable of stableSkills) {
    assert.equal(await fs.readFile(path.join(target, stable), "utf8"), await fs.readFile(path.join(root, stable), "utf8"));
  }
  for (const command of ["bootstrap", "sync", "doctor"]) {
    const rejected = meta(command, "--force");
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /options are not supported/);
  }
  assert.notEqual(meta("unknown").status, 0);
  // Doctor delegates successfully without rewriting canonical redirects.
  const receiptPath = path.join(target, ".hai-harness.json");
  const receipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  receipt.checkEnabled = false;
  await fs.writeFile(receiptPath, JSON.stringify(receipt));
  const checked = meta("doctor");
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /Update status: disabled/);
  assert.equal(await fs.readFile(path.join(root, "AGENTS.md"), "utf8"), "Project record: AGENTS.md\n");
  assert.equal(
    await fs.readFile(path.join(target, "AGENTS.md"), "utf8"),
    await fs.readFile(path.join(root, "scaffold/AGENTS.md"), "utf8")
  );
  assert.equal(await fs.stat(path.join(root, "AGENTS.override.md")).catch(() => null), null);
  assert.equal(await fs.stat(path.join(root, "CLAUDE.md")).catch(() => null), null);
});

test("release planner publishes product changes and skips non-release pushes", async (t) => {
  const { planRelease } = await import(path.join(projectRoot, ".github/scripts/plan-release.mjs"));
  const { tempRoot, repo } = await makeGitFixture(t);

  await fs.writeFile(path.join(repo, "package.json"), `${JSON.stringify({
    name: "hai-harness",
    version: "0.2.0"
  }, null, 2)}\n`);
  await fs.writeFile(path.join(repo, "release.json"), `${JSON.stringify({
    schemaVersion: 1,
    channel: "stable",
    version: "0.2.0",
    releaseNotesUrl: "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.0",
    summary: "seed"
  }, null, 2)}\n`);
  await fs.mkdir(path.join(repo, "Agents"), { recursive: true });
  await fs.writeFile(path.join(repo, "Agents/onboarding.md"), "product\n");
  git(repo, "add", "package.json", "release.json", "Agents/onboarding.md");
  git(repo, "commit", "-m", "Add installable product seed");

  const noPriorTag = await planRelease({ repoRoot: repo, apply: true });
  assert.equal(noPriorTag.publish, true);
  assert.equal(noPriorTag.action, "prepare");
  assert.equal(noPriorTag.version, "0.2.1");
  assert.equal(noPriorTag.tag, "v0.2.1");
  assert.equal(noPriorTag.packageVersion, noPriorTag.releaseVersion);
  assert.equal(
    noPriorTag.releaseNotesUrl,
    "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.1"
  );
  const packageAfterFirst = JSON.parse(await fs.readFile(path.join(repo, "package.json"), "utf8"));
  const releaseAfterFirst = JSON.parse(await fs.readFile(path.join(repo, "release.json"), "utf8"));
  assert.equal(packageAfterFirst.version, "0.2.1");
  assert.equal(releaseAfterFirst.version, "0.2.1");
  assert.equal(packageAfterFirst.version, releaseAfterFirst.version);
  git(repo, "add", "package.json", "release.json");
  git(repo, "commit", "-m", "release: v0.2.1");
  git(repo, "tag", "v0.2.1");

  const releaseCommitSkip = await planRelease({ repoRoot: repo });
  assert.equal(releaseCommitSkip.publish, false);
  assert.equal(releaseCommitSkip.reason, "release-commit");

  await fs.mkdir(path.join(repo, ".hai", "Agents"), { recursive: true });
  await fs.writeFile(path.join(repo, ".hai", "Agents", "planning.md"), "outer planning only\n");
  git(repo, "add", ".hai/Agents/planning.md");
  git(repo, "commit", "-m", "Record outer planning");
  const haiOnlySkip = await planRelease({ repoRoot: repo });
  assert.equal(haiOnlySkip.publish, false);
  assert.match(haiOnlySkip.reason, /no-product-path-changes/);

  await fs.writeFile(path.join(repo, "Agents/onboarding.md"), "product revision\n");
  git(repo, "add", "Agents/onboarding.md");
  git(repo, "commit", "-m", "Revise agent onboarding");
  const productBump = await planRelease({ repoRoot: repo, apply: true });
  assert.equal(productBump.publish, true);
  assert.equal(productBump.action, "prepare");
  assert.equal(productBump.version, "0.2.2");
  assert.equal(productBump.packageVersion, productBump.releaseVersion);
  assert.equal(productBump.packageVersion, "0.2.2");
  const packageAfterBump = JSON.parse(await fs.readFile(path.join(repo, "package.json"), "utf8"));
  const releaseAfterBump = JSON.parse(await fs.readFile(path.join(repo, "release.json"), "utf8"));
  assert.equal(packageAfterBump.version, "0.2.2");
  assert.equal(releaseAfterBump.version, "0.2.2");
  assert.equal(packageAfterBump.version, releaseAfterBump.version);
  assert.equal(
    releaseAfterBump.releaseNotesUrl,
    "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.2"
  );
  assert.match(releaseAfterBump.summary, /Revise agent onboarding/);
});

test("release planner sees product files in a merge tip when no tag exists", async (t) => {
  const { planRelease } = await import(path.join(projectRoot, ".github/scripts/plan-release.mjs"));
  const { repo } = await makeGitFixture(t);
  git(repo, "checkout", "-b", "feature");
  await fs.mkdir(path.join(repo, "Agents"), { recursive: true });
  await fs.writeFile(path.join(repo, "Agents/onboarding.md"), "from feature\n");
  await fs.writeFile(path.join(repo, "package.json"), `${JSON.stringify({ version: "0.2.0" }, null, 2)}\n`);
  await fs.writeFile(path.join(repo, "release.json"), `${JSON.stringify({
    schemaVersion: 1,
    channel: "stable",
    version: "0.2.0",
    releaseNotesUrl: "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.0",
    summary: "seed"
  }, null, 2)}\n`);
  git(repo, "add", "Agents/onboarding.md", "package.json", "release.json");
  git(repo, "commit", "-m", "Add product on feature");
  git(repo, "checkout", "develop");
  git(repo, "merge", "--no-ff", "-m", "Merge feature", "feature");
  const plan = await planRelease({ repoRoot: repo });
  assert.equal(plan.publish, true);
  assert.equal(plan.action, "prepare");
  assert.equal(plan.version, "0.2.1");
  assert.ok(plan.productChanges.includes("Agents/onboarding.md"));
});

test("release planner publishes only a merged release tip", async (t) => {
  const { planRelease } = await import(path.join(projectRoot, ".github/scripts/plan-release.mjs"));
  const { repo } = await makeGitFixture(t);

  await fs.writeFile(path.join(repo, "package.json"), `${JSON.stringify({ version: "0.2.2" }, null, 2)}\n`);
  await fs.writeFile(path.join(repo, "release.json"), `${JSON.stringify({
    schemaVersion: 1,
    channel: "stable",
    version: "0.2.2",
    releaseNotesUrl: "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.2",
    summary: "HAI-Harness 0.2.2."
  }, null, 2)}\n`);
  await fs.mkdir(path.join(repo, "Agents"), { recursive: true });
  await fs.writeFile(path.join(repo, "Agents/onboarding.md"), "product\n");
  git(repo, "add", "package.json", "release.json", "Agents/onboarding.md");
  git(repo, "commit", "-m", "Add product seed");
  git(repo, "tag", "v0.2.2");

  await fs.writeFile(path.join(repo, "package.json"), `${JSON.stringify({ version: "0.2.3" }, null, 2)}\n`);
  await fs.writeFile(path.join(repo, "release.json"), `${JSON.stringify({
    schemaVersion: 1,
    channel: "stable",
    version: "0.2.3",
    releaseNotesUrl: "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.3",
    summary: "HAI-Harness 0.2.3: learning cycle."
  }, null, 2)}\n`);
  git(repo, "add", "package.json", "release.json");
  git(repo, "commit", "-m", "release: v0.2.3");
  const untaggedRelease = await planRelease({ repoRoot: repo, apply: true });
  assert.equal(untaggedRelease.publish, true);
  assert.equal(untaggedRelease.action, "tag");
  assert.equal(untaggedRelease.version, "0.2.3");
  assert.equal(untaggedRelease.tag, "v0.2.3");
  assert.match(untaggedRelease.summary, /learning cycle/);
  assert.equal(JSON.parse(await fs.readFile(path.join(repo, "package.json"), "utf8")).version, "0.2.3");

  git(repo, "tag", "v0.2.3");
  const taggedRelease = await planRelease({ repoRoot: repo });
  assert.equal(taggedRelease.publish, false);
  assert.equal(taggedRelease.reason, "release-commit");

  git(repo, "checkout", "-b", "release/v0.2.4");
  await fs.writeFile(path.join(repo, "package.json"), `${JSON.stringify({ version: "0.2.4" }, null, 2)}\n`);
  await fs.writeFile(path.join(repo, "release.json"), `${JSON.stringify({
    schemaVersion: 1,
    channel: "stable",
    version: "0.2.4",
    releaseNotesUrl: "https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v0.2.4",
    summary: "HAI-Harness 0.2.4."
  }, null, 2)}\n`);
  git(repo, "add", "package.json", "release.json");
  git(repo, "commit", "-m", "release: v0.2.4");
  git(repo, "checkout", "develop");
  git(repo, "merge", "--no-ff", "-m", "Merge pull request #15 from ClaudiusMa/release/v0.2.4", "release/v0.2.4");
  const mergedRelease = await planRelease({ repoRoot: repo });
  assert.equal(mergedRelease.publish, true);
  assert.equal(mergedRelease.action, "tag");
  assert.equal(mergedRelease.version, "0.2.4");

  await fs.writeFile(path.join(repo, "Agents/onboarding.md"), "later product edit\n");
  git(repo, "add", "Agents/onboarding.md");
  git(repo, "commit", "-m", "Revise onboarding without a release tip");
  const laterCommit = await planRelease({ repoRoot: repo });
  assert.equal(laterCommit.publish, false);
  assert.equal(laterCommit.reason, "already-at-release-version");
});
