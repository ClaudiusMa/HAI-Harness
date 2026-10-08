import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { once } from "node:events";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installedVersion = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8")).version;
const cli = path.join(projectRoot, "bin/hai-harness.mjs");
const checker = path.join(projectRoot, "Agents/check-for-update.mjs");

function run(command, args, cwd, env) {
  return spawnSync(command, args, { cwd, encoding: "utf8", env });
}

function git(cwd, ...args) {
  const result = run("git", args, cwd);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function harness(cwd, ...args) {
  return run(process.execPath, [cli, ...args], cwd);
}

// A session in an installed project: no `hai-harness` on PATH, no npm, no network.
const noHarnessEnv = {
  ...process.env,
  PATH: (process.env.PATH ?? "").split(path.delimiter).filter((dir) => !existsSync(path.join(dir, "hai-harness"))).join(path.delimiter)
};

// Runs the project's own copy of the CLI (Agents/hai-harness.mjs) from `cwd`.
function projectCli(copyRoot, cwd, ...args) {
  return run(process.execPath, [path.join(copyRoot, "Agents/hai-harness.mjs"), ...args], cwd, noHarnessEnv);
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
  // Physical path, so paths the CLI prints (it resolves symlinks) match the ones tests build.
  const repo = path.join(await fs.realpath(tempRoot), "project");
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

async function makeHeldLane(t, slug = "retained") {
  const fixture = await makeGitFixture(t);
  const { repo } = fixture;
  assert.equal(harness(repo, "worktree", "create", slug, "--target", repo).status, 0);
  const lane = `${repo}-worktrees/${slug}`;
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  const approved = harness(lane, "worktree", "approve", "--keep-worktree", "--approved", "Hold for outward work", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /retained by --keep-worktree/);
  assert.ok(await fs.stat(lane));
  return { ...fixture, lane, branch: `task/${slug}` };
}

test("cleanup retries completed lanes and protects ignored, dirty, locked and newer work", async (t) => {
  const { repo, lane, branch } = await makeHeldLane(t);
  const cleanup = () => harness(repo, "worktree", "cleanup", branch, "--target", repo);
  const expectRetained = (result, pattern) => {
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, pattern);
    assert.ok(git(repo, "branch", "--list", branch));
  };
  await fs.writeFile(path.join(lane, ".gitignore"), "private.txt\n");
  git(lane, "add", ".gitignore");
  const firstRetry = cleanup();
  assert.match(firstRetry.stdout, /retry: node \S*bin\/hai-harness\.mjs worktree cleanup task\/retained --target/);
  assert.doesNotMatch(firstRetry.stdout, /retry: hai-harness/);
  expectRetained(firstRetry, /staged, tracked, or untracked work/);
  git(lane, "commit", "-m", "Ignore private artifact");
  expectRetained(cleanup(), /Exact task tip .* is not integrated/);
  git(repo, "merge", "--no-ff", "-m", "Integrate follow-up fixture", branch);
  await fs.writeFile(path.join(lane, "private.txt"), "valuable unpublished artifact\n");
  expectRetained(cleanup(), /Ignored files may contain valuable work[\s\S]*private.txt/);
  assert.equal(await fs.readFile(path.join(lane, "private.txt"), "utf8"), "valuable unpublished artifact\n");
  await fs.unlink(path.join(lane, "private.txt"));
  git(repo, "worktree", "lock", "--reason", "active peer review", lane);
  expectRetained(cleanup(), /Worktree is locked: active peer review/);
  git(repo, "worktree", "unlock", lane);
  await fs.writeFile(path.join(lane, "notes.txt"), "unfinished\n");
  expectRetained(cleanup(), /untracked work/);
  await fs.unlink(path.join(lane, "notes.txt"));
  assert.equal(cleanup().status, 0);
  assert.equal(cleanup().status, 0);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  assert.match(harness(repo, "help").stdout, /worktree cleanup[\s\S]*--keep-worktree/);
});

test("cleanup handles partial removal, orphans and other worktree ownership without force", async (t) => {
  const { repo, lane, branch } = await makeHeldLane(t, "partial");
  git(repo, "worktree", "remove", lane);
  await fs.mkdir(lane);
  await fs.writeFile(path.join(lane, "keep.txt"), "valuable leftover\n");
  const orphan = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(orphan.status, 0);
  assert.match(orphan.stdout, /Git has unregistered the task folder/);
  assert.equal(await fs.readFile(path.join(lane, "keep.txt"), "utf8"), "valuable leftover\n");
  await fs.unlink(path.join(lane, "keep.txt"));
  await fs.rmdir(lane);
  const moved = path.join(path.dirname(lane), "peer-location");
  git(repo, "worktree", "add", moved, branch);
  const peer = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(peer.status, 0);
  assert.match(peer.stdout, /owned by another worktree/);
  assert.ok(await fs.stat(moved));
  git(repo, "worktree", "remove", moved);
  const branchOnly = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.equal(branchOnly.status, 0, branchOnly.stdout);
  assert.match(branchOnly.stdout, /Merged local task branch removed/);
  await fs.mkdir(lane);
  await fs.writeFile(path.join(lane, "keep.txt"), "unknown owner\n");
  const absentBranch = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(absentBranch.status, 0);
  assert.match(absentBranch.stdout, /Task branch is absent but a folder remains/);
  assert.equal(await fs.readFile(path.join(lane, "keep.txt"), "utf8"), "unknown owner\n");
});

test("cleanup preserves lane symlinks, nested repositories and valuable ignored files during approve", async (t) => {
  const { repo, lane, branch } = await makeHeldLane(t, "links");
  const realLane = `${lane}-saved`;
  await fs.rename(lane, realLane);
  await fs.symlink(realLane, lane, "dir");
  const redirected = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(redirected.status, 0);
  assert.match(redirected.stdout, /symlink redirect/);
  assert.equal(await fs.readFile(path.join(realLane, "result.txt"), "utf8"), "approved\n");
  await fs.unlink(lane);
  await fs.rename(realLane, lane);
  await fs.mkdir(path.join(lane, "nested"));
  git(path.join(lane, "nested"), "init");
  const nested = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(nested.status, 0);
  assert.ok(await fs.stat(path.join(lane, "nested/.git")));
  // A separate new lane exercises automatic approve cleanup without committing the nested repo.
  assert.equal(harness(repo, "worktree", "create", "ignored", "--target", repo).status, 0);
  const ignoredLane = `${repo}-worktrees/ignored`;
  await fs.writeFile(path.join(ignoredLane, ".gitignore"), "valuable.bin\n");
  await fs.writeFile(path.join(ignoredLane, "valuable.bin"), "unpublished\n");
  const approved = harness(ignoredLane, "worktree", "approve", "--approved", "Ignored preservation", "--target", ignoredLane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /Ignored files may contain valuable work/);
  assert.equal(await fs.readFile(path.join(ignoredLane, "valuable.bin"), "utf8"), "unpublished\n");
});

test("cleanup instruction replay stops owned preview, retries generated cache, and retains uncertain artifacts", async (t) => {
  const { repo, lane, branch } = await makeHeldLane(t, "replay");
  const exclude = path.resolve(repo, git(repo, "rev-parse", "--git-path", "info/exclude"));
  await fs.appendFile(exclude, "\nowned-cache.txt\n");
  const childCode = 'process.stdout.write(JSON.stringify({pid:process.pid,cwd:process.cwd()})); setInterval(()=>{},1000);';
  const owned = spawn(process.execPath, ["-e", childCode], { cwd: lane, stdio: ["ignore", "pipe", "pipe"] });
  const peer = spawn(process.execPath, ["-e", childCode], { cwd: repo, stdio: ["ignore", "pipe", "pipe"] });
  t.after(() => { owned.kill(); peer.kill(); });
  const ownedState = JSON.parse((await once(owned.stdout, "data"))[0].toString());
  assert.equal(await fs.realpath(ownedState.cwd), await fs.realpath(lane));
  assert.equal(ownedState.pid, owned.pid);
  assert.ok(peer.pid);
  // This fixture records provenance by creating the exact cache itself.
  await fs.writeFile(path.join(lane, "owned-cache.txt"), "generated fixture cache\n");
  const initial = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(initial.status, 0);
  assert.match(initial.stdout, /Ignored files may contain valuable work[\s\S]*owned-cache.txt/);
  const exited = once(owned, "exit");
  owned.kill("SIGTERM");
  await exited;
  process.kill(peer.pid, 0); // Peer preview remains running.
  const cache = path.join(lane, "owned-cache.txt");
  assert.ok((await fs.lstat(cache)).isFile());
  assert.equal(await fs.readFile(cache, "utf8"), "generated fixture cache\n");
  await fs.unlink(cache); // Exact verified disposable file; no directory recursion.
  await fs.writeFile(path.join(lane, "uncertain.txt"), "preserve until ownership known\n");
  const retained = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.notEqual(retained.status, 0);
  assert.equal(await fs.readFile(path.join(lane, "uncertain.txt"), "utf8"), "preserve until ownership known\n");
  await fs.unlink(path.join(lane, "uncertain.txt")); // Fixture owner resolves its artifact.
  const completed = harness(repo, "worktree", "cleanup", branch, "--target", repo);
  assert.equal(completed.status, 0, completed.stdout);
  process.kill(peer.pid, 0);
  const evidence = { ownedState, ownedExitSignal: owned.signalCode, peerPid: peer.pid, peerSurvived: true, initial: initial.stdout, retained: retained.stdout, completed: completed.stdout };
  const evidencePath = path.join(os.tmpdir(), `hai-cleanup-replay-${process.pid}.json`);
  await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(`Cleanup instruction replay evidence: ${evidencePath}`);
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
    await fs.readFile(path.join(target, "Agents/hai-harness.mjs"), "utf8"),
    await fs.readFile(cli, "utf8")
  );
  // Every installed instruction names the project CLI, never a bare command that is not on PATH.
  const bareCommand = /(?<![\w/.-])hai-harness (?:worktree|human-sync|doctor|init|update)\b/;
  const installedDocs = [];
  const collectDocs = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await collectDocs(full);
      else if (entry.name.endsWith(".md")) installedDocs.push(full);
    }
  };
  await collectDocs(target);
  assert.ok(installedDocs.length > 20);
  for (const doc of installedDocs) {
    assert.doesNotMatch(await fs.readFile(doc, "utf8"), bareCommand, path.relative(target, doc));
  }
  assert.match(await fs.readFile(path.join(target, "AGENTS.md"), "utf8"), /node Agents\/hai-harness\.mjs worktree create <task-slug>/);
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
  await fs.writeFile(path.join(target, "Agents/hai-harness.mjs"), "stale project copy of the CLI\n");
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
  assert.equal(await fs.readFile(path.join(target, "Agents/hai-harness.mjs"), "utf8"), await fs.readFile(cli, "utf8"));
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.equal(JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8")).checkEnabled, false);
  for (const skill of shippedSkills) await fs.unlink(path.join(target, `Agents/skills/${skill}/SKILL.md`));
  await fs.unlink(path.join(target, "Agents/hai-harness.mjs"));
  const missingReviewSkill = harness(target, "doctor", "--target", target);
  assert.notEqual(missingReviewSkill.status, 0);
  assert.match(missingReviewSkill.stdout, /Agents\/hai-harness\.mjs/);
  assert.match(missingReviewSkill.stdout, /Agents\/skills\/code-review\/SKILL\.md/);
  assert.match(missingReviewSkill.stdout, /Agents\/skills\/implement\/SKILL\.md/);
  const restoredReviewSkill = harness(target, "update", "--target", target);
  assert.equal(restoredReviewSkill.status, 0, restoredReviewSkill.stderr);
  assert.equal(await fs.readFile(path.join(target, "Agents/hai-harness.mjs"), "utf8"), await fs.readFile(cli, "utf8"));
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

test("cleanup retains current-task pending and uncaptured packets but leaves peer packets alone", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t);
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  await fs.appendFile(path.join(packet, "human-inbox.md"), "\n### current\n- Status: pending\n");
  const approved = harness(lane, "worktree", "approve", "--approved", "Packet cleanup", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /1 pending/);
  assert.ok(await fs.stat(lane));
  await fs.writeFile(path.join(packet, "human-inbox.md"), "Captured through: none\n\n## Drafts\n### unreviewed without status\n");
  const malformed = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.notEqual(malformed.status, 0);
  assert.match(malformed.stdout, /unresolved draft entries/);
  await fs.writeFile(path.join(packet, "human-inbox.md"), "Captured through: none\n\n## Drafts\n");
  await appendTrail(packet, [trailEntry(1, "user", "process", "completion rule")]);
  const uncaptured = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.notEqual(uncaptured.status, 0);
  assert.match(uncaptured.stdout, /uncaptured review items/);
  await setCaptureCursor(packet, "T1");
  assert.equal(harness(repo, "worktree", "create", "packet-peer", "--target", repo).status, 0);
  const peerLane = `${repo}-worktrees/packet-peer`;
  assert.equal(harness(peerLane, "human-sync", "init", "--target", peerLane).status, 0);
  const peerPacket = JSON.parse(harness(peerLane, "human-sync", "status", "--target", peerLane).stdout).packet;
  await fs.appendFile(path.join(peerPacket, "human-inbox.md"), "\n### peer\n- Status: pending\n");
  const cleaned = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout);
  assert.ok(await fs.stat(peerLane));
  assert.match(await fs.readFile(path.join(peerPacket, "human-inbox.md"), "utf8"), /pending/);
  assert.ok(await fs.stat(path.join(packet, "packet.json")));
});

test("cleanup selects current packet incarnation when a completed task slug is reused", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t);
  await fs.writeFile(path.join(lane, "first.txt"), "first incarnation\n");
  const first = harness(lane, "worktree", "approve", "--approved", "First incarnation", "--target", lane);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  const oldFiles = Object.fromEntries(await Promise.all(["packet.json", "human-inbox.md", "decision-trail.md"].map(async (name) => [name, await fs.readFile(path.join(packet, name), "utf8")])));
  assert.equal(harness(repo, "worktree", "create", "capture", "--target", repo).status, 0);
  assert.equal(harness(root, "human-sync", "init", "--target", root).status, 0);
  const currentPacket = JSON.parse(harness(root, "human-sync", "status", "--target", root).stdout).packet;
  assert.notEqual(currentPacket, packet);
  await fs.writeFile(path.join(lane, "second.txt"), "second incarnation\n");
  const second = harness(lane, "worktree", "approve", "--keep-worktree", "--approved", "Second incarnation", "--target", lane);
  assert.equal(second.status, 0, second.stderr);
  await fs.appendFile(path.join(currentPacket, "human-inbox.md"), "\n### current unresolved decision\n- Status: pending\n");
  const pending = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.notEqual(pending.status, 0);
  assert.match(pending.stdout, /1 pending/);
  await fs.writeFile(path.join(currentPacket, "human-inbox.md"), "Captured through: none\n\n## Drafts\n");
  const completed = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.equal(completed.status, 0, completed.stdout);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  for (const [name, content] of Object.entries(oldFiles)) assert.equal(await fs.readFile(path.join(packet, name), "utf8"), content);
  assert.ok(await fs.stat(path.join(currentPacket, "packet.json")));
});

test("cleanup fails closed on missing or duplicate packet sections before draft and trail checks", async (t) => {
  const { repo, lane, packet } = await makePacketFixture(t);
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  const inboxFile = path.join(packet, "human-inbox.md");
  const trailFile = path.join(packet, "decision-trail.md");
  const initialInbox = await fs.readFile(inboxFile, "utf8");
  const initialTrail = await fs.readFile(trailFile, "utf8");
  await fs.writeFile(inboxFile, initialInbox.replace("## Drafts", "## Draft") + "\n### needs decision\n- Status: pending\n");
  const approved = harness(lane, "worktree", "approve", "--approved", "Malformed packet retention", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /exactly one ## Drafts section; found 0/);
  assert.ok(await fs.stat(lane));
  assert.ok(git(repo, "branch", "--list", "task/capture"));
  for (const [name, content, pattern] of [
    ["human-inbox.md", initialInbox.replace("## Drafts", "## Draft"), /exactly one ## Drafts section; found 0/],
    ["human-inbox.md", initialInbox + "\n## Drafts\n### needs decision\n- Status: pending\n", /exactly one ## Drafts section; found 2/],
    ["decision-trail.md", initialTrail.replace("## Entries", "## Entry") + "\n" + trailEntry(1, "user", "process"), /exactly one ## Entries section; found 0/],
    ["decision-trail.md", initialTrail + "\n## Entries\n" + trailEntry(1, "user", "process"), /exactly one ## Entries section; found 2/]
  ]) {
    await fs.writeFile(inboxFile, initialInbox);
    await fs.writeFile(trailFile, initialTrail);
    await fs.writeFile(path.join(packet, name), content);
    const retained = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
    assert.notEqual(retained.status, 0);
    assert.match(retained.stdout, pattern);
    assert.equal(await fs.readFile(path.join(packet, name), "utf8"), content);
    assert.ok(await fs.stat(lane));
    assert.ok(git(repo, "branch", "--list", "task/capture"));
  }
  await fs.writeFile(inboxFile, initialInbox);
  await fs.writeFile(trailFile, initialTrail);
  assert.equal(harness(repo, "worktree", "cleanup", "task/capture", "--target", repo).status, 0);
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
  assert.ok(await fs.stat(lane));
  assert.match(approved.stdout, /1 deferred draft/);
  assert.match(await fs.readFile(path.join(packet, "human-inbox.md"), "utf8"), /carry forward/);
  assert.equal(JSON.parse(await fs.readFile(path.join(packet, "packet.json"), "utf8")).identity.branch, "task/capture");
});

async function makeInstalledProject(t) {
  const fixture = await makeGitFixture(t);
  const { repo } = fixture;
  t.after(() => fs.rm(`${repo}-worktrees`, { recursive: true, force: true }));
  assert.equal(harness(repo, "init", "--target", repo).status, 0);
  assert.equal(beacon(repo, "--disable").status, 0);
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Install harness");
  return fixture;
}

test("the project copy of the CLI runs lanes and human-sync with no PATH entry and hands init and update to the package", async (t) => {
  const { repo } = await makeInstalledProject(t);
  const source = await fs.readFile(cli, "utf8");
  assert.notEqual(run("sh", ["-c", "command -v hai-harness"], repo, noHarnessEnv).status, 0);
  assert.equal(await fs.readFile(path.join(repo, "Agents/hai-harness.mjs"), "utf8"), source);
  // The project holds no packaged templates, as in a real installation.
  assert.equal(await fs.stat(path.join(repo, "scaffold")).catch(() => null), null);

  const created = projectCli(repo, repo, "worktree", "create", "field");
  assert.equal(created.status, 0, created.stderr);
  const lane = `${repo}-worktrees/field`;
  // The lane carries its own tracked copy, so the same command works from inside it.
  assert.equal(await fs.readFile(path.join(lane, "Agents/hai-harness.mjs"), "utf8"), source);
  const status = projectCli(lane, lane, "worktree", "status");
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Branch:\s+task\/field/);
  // From inside a lane, `create` still works when pointed at the primary checkout.
  const inside = projectCli(lane, lane, "worktree", "create", "inside", "--target", repo);
  assert.equal(inside.status, 0, inside.stderr);
  assert.match(projectCli(lane, lane, "worktree", "status", "--all").stdout, /task\/inside[\s\S]*task\/field|task\/field[\s\S]*task\/inside/);
  assert.equal(projectCli(lane, lane, "human-sync", "init").status, 0);
  const packet = JSON.parse(projectCli(lane, lane, "human-sync", "status").stdout).packet;
  for (const name of ["decision-trail.md", "human-inbox.md"]) {
    assert.equal(
      await fs.readFile(path.join(packet, name), "utf8"),
      await fs.readFile(path.join(projectRoot, "scaffold/task-packet", name), "utf8"),
      "embedded packet template must match scaffold/task-packet"
    );
  }
  const doctor = projectCli(lane, lane, "doctor");
  assert.equal(doctor.status, 0, doctor.stdout + doctor.stderr);
  assert.match(doctor.stdout, /looks installed/);

  // init and update need the package's templates: the project copy points at npx instead of copying from the wrong root.
  const receipt = await fs.readFile(path.join(lane, ".hai-harness.json"), "utf8");
  const refusedUpdate = projectCli(lane, lane, "update", "--dry-run");
  assert.notEqual(refusedUpdate.status, 0);
  assert.match(refusedUpdate.stderr, /npx github:ClaudiusMa\/HAI-Harness update --dry-run/);
  const refusedInit = projectCli(lane, lane, "init", "--target", "/tmp/a project");
  assert.notEqual(refusedInit.status, 0);
  assert.match(refusedInit.stderr, /npx github:ClaudiusMa\/HAI-Harness init --target "\/tmp\/a project"/);
  assert.equal(await fs.readFile(path.join(lane, ".hai-harness.json"), "utf8"), receipt);
  assert.match(projectCli(lane, lane, "help").stdout, /node Agents\/hai-harness\.mjs worktree approve/);

  // Approve from the lane's own copy; the copy is deleted with the lane while it runs.
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  const approved = projectCli(lane, lane, "worktree", "approve", "--approved", "Field fixture");
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  assert.equal(git(repo, "log", "-1", "--format=%s"), "Merge task/field: Field fixture");

  // Keep a lane, then clean it up from the primary's copy with the printed command form.
  assert.equal(projectCli(repo, repo, "worktree", "create", "second").status, 0);
  const second = `${repo}-worktrees/second`;
  await fs.writeFile(path.join(second, "second.txt"), "approved\n");
  const kept = projectCli(second, second, "worktree", "approve", "--keep-worktree", "--approved", "Second fixture");
  assert.equal(kept.status, 0, kept.stderr);
  assert.match(kept.stdout, new RegExp(`node Agents/hai-harness\\.mjs worktree cleanup task/second --target ${repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  const cleaned = projectCli(repo, repo, "worktree", "cleanup", "task/second", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout + cleaned.stderr);
  assert.equal(await fs.stat(second).catch(() => null), null);
});

test("a lane made by hand is refused with the supported recovery and never gains forged metadata", async (t) => {
  const { repo } = await makeInstalledProject(t);
  const lane = `${repo}-worktrees/by-hand`;
  git(repo, "worktree", "add", "-b", "task/by-hand", lane);
  await fs.writeFile(path.join(lane, "hand.txt"), "by hand\n");
  git(lane, "add", "hand.txt");
  git(lane, "commit", "-m", "Hand-made work");

  const approve = projectCli(lane, lane, "worktree", "approve", "--approved", "Hand-made");
  assert.notEqual(approve.status, 0);
  assert.match(approve.stderr, /task\/by-hand was not created by the harness/);
  assert.match(approve.stderr, /"node Agents\/hai-harness\.mjs worktree create <new-slug>"[\s\S]*git merge task\/by-hand/);
  assert.doesNotMatch(approve.stderr, /"hai-harness /);
  assert.doesNotMatch(approve.stderr, /git config|haiBaseCommit|haiIntegrationBranch/);
  const cleanup = projectCli(repo, repo, "worktree", "cleanup", "task/by-hand", "--target", repo);
  assert.notEqual(cleanup.status, 0);
  assert.match(cleanup.stdout, /task\/by-hand was not created by the harness/);
  assert.doesNotMatch(cleanup.stdout, /git config|haiBaseCommit|haiIntegrationBranch/);
  assert.match(projectCli(lane, lane, "human-sync", "init").stderr, /was not created by the harness/);
  assert.match(projectCli(lane, lane, "worktree", "status").stdout, /not created by the harness/);
  assert.equal(run("git", ["config", "--get-regexp", "^branch\\.task/by-hand\\."], repo).stdout, "");
  assert.ok(git(repo, "branch", "--list", "task/by-hand"));

  // The recovery it names works: a real lane merges the hand-made branch and integrates it.
  assert.equal(projectCli(repo, repo, "worktree", "create", "recovered").status, 0);
  const recovered = `${repo}-worktrees/recovered`;
  git(recovered, "merge", "task/by-hand");
  const approved = projectCli(recovered, recovered, "worktree", "approve", "--approved", "Recovered hand-made work");
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal(await fs.readFile(path.join(repo, "hand.txt"), "utf8"), "by hand\n");
  git(repo, "worktree", "remove", lane);
  git(repo, "branch", "-d", "task/by-hand");
});

test("conflict-copy sweep quarantines only provably redundant duplicates and reports the rest", async (t) => {
  const { repo } = await makeGitFixture(t);
  const common = path.join(repo, ".git");
  const commitA = git(repo, "rev-parse", "HEAD");
  await fs.writeFile(path.join(repo, "docs.md"), "docs\n");
  await fs.writeFile(path.join(repo, "kept.md"), "tracked\n");
  await fs.writeFile(path.join(repo, "kept 2.md"), "tracked\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Tracked files, one a tracked duplicate");
  git(repo, "switch", "-c", "side");
  git(repo, "commit", "--allow-empty", "-m", "Side work");
  const sideCommit = git(repo, "rev-parse", "HEAD");
  git(repo, "switch", "develop");
  const put = (rel, content) => fs.writeFile(path.join(repo, ...rel.split("/")), content);

  const redundantInGit = {
    "refs/heads/develop 2": `${commitA}\n`,
    "index 2": "stale index cache\n",
    "scratch 2.txt": "same bytes\n"
  };
  await put(".git/scratch.txt", "same bytes\n");
  for (const [rel, content] of Object.entries(redundantInGit)) await put(`.git/${rel}`, content);
  await put(".git/config 2", "[core]\n\tbare = false\n# diverged copy\n");
  await put(".git/orphan 2", "no original exists\n");
  await put("plan.md", "plan\n");
  await put("plan 2.md", "plan\n");
  await put("diff.md", "one\n");
  await put("diff 2.md", "two\n");
  const everywhere = [...Object.keys(redundantInGit).map((rel) => path.join(common, ...rel.split("/"))), path.join(repo, "plan 2.md")];

  // doctor reports the same findings and moves nothing
  const report = harness(repo, "doctor", "--target", repo);
  assert.match(report.stdout, /Warnings:[\s\S]*4 redundant cloud-sync conflict copies[\s\S]*worktree sweep/);
  for (const file of everywhere) assert.ok(report.stdout.includes(file), file);
  assert.match(report.stdout, /Conflict copy needs a decision: .*config 2 \(original: .*config\)\. Its content differs/);
  assert.match(report.stdout, /orphan 2 .*The original does not exist/);
  assert.match(report.stdout, /diff 2\.md/);
  for (const file of everywhere) assert.ok(await fs.stat(file), `doctor must not move ${file}`);

  const swept = harness(repo, "worktree", "sweep", "--target", repo);
  assert.equal(swept.status, 0, swept.stderr);
  assert.match(swept.stdout, /moved 4 redundant cloud-sync duplicates to a reversible quarantine; nothing was deleted/);
  assert.match(swept.stdout, /Conflict copies kept \(3\)/);
  const [stamp, ...extra] = await fs.readdir(path.join(common, "hai-harness/quarantine"));
  assert.equal(extra.length, 0);
  const quarantine = path.join(common, "hai-harness/quarantine", stamp);
  for (const file of everywhere) assert.equal(await fs.stat(file).catch(() => null), null, `${file} should have moved`);
  for (const [rel, content] of Object.entries(redundantInGit)) assert.equal(await fs.readFile(path.join(quarantine, "git", ...rel.split("/")), "utf8"), content);
  assert.equal(await fs.readFile(path.join(quarantine, "tree", path.basename(repo), "plan 2.md"), "utf8"), "plan\n");
  const manifest = await fs.readFile(path.join(quarantine, "manifest.txt"), "utf8");
  assert.match(manifest, /Nothing here was deleted/);
  for (const file of everywhere) assert.ok(manifest.includes(`from: ${file}`), file);
  assert.match(manifest, /reason: its commit is already part of refs\/heads\/develop/);
  assert.match(manifest, /reason: Git index copy; it may hold staged state, so it is stored in the quarantine and can be restored from the manifest/);
  // differing, original-less and tracked copies are untouched
  assert.equal(await fs.readFile(path.join(common, "config 2"), "utf8"), "[core]\n\tbare = false\n# diverged copy\n");
  assert.equal(await fs.readFile(path.join(common, "orphan 2"), "utf8"), "no original exists\n");
  assert.equal(await fs.readFile(path.join(repo, "diff 2.md"), "utf8"), "two\n");
  assert.equal(await fs.readFile(path.join(repo, "kept 2.md"), "utf8"), "tracked\n");
  assert.ok(git(repo, "ls-files", "kept 2.md"));
  assert.doesNotMatch(git(repo, "status", "--porcelain"), /kept/);
  for (const text of ["config 2", "orphan 2", "diff 2.md"]) assert.ok(swept.stdout.includes(text), text);
  assert.match(swept.stdout, /original:[\s\S]*why:[\s\S]*next:/);
  // sweeping again moves nothing new
  const again = harness(repo, "worktree", "sweep", "--target", repo);
  assert.equal(again.status, 0, again.stderr);
  assert.doesNotMatch(again.stdout, /moved \d+ redundant/);
  assert.equal((await fs.readdir(path.join(common, "hai-harness/quarantine"))).length, 1);

  // A kept copy of a ref or HEAD that Git may read stops the lane commands, and explains itself.
  await put(".git/refs/heads/develop 3", `${sideCommit}\n`);
  await put(".git/refs/heads/develop 4", `${"b".repeat(40)}\n`);
  await put(".git/HEAD 2", "ref: refs/heads/side\n");
  await put(".git/scratch 3.txt", "same bytes\n");
  const blocked = harness(repo, "worktree", "create", "blocked", "--target", repo);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /Stopped: a cloud-sync conflict copy in Git metadata is not provably redundant/);
  // what the sweep moved before it stopped is stated, not "Nothing was changed"
  assert.match(blocked.stderr, /1 redundant copy was moved to the quarantine as listed above; nothing else was changed\./);
  assert.equal(await fs.stat(path.join(common, "scratch 3.txt")).catch(() => null), null);
  assert.match(blocked.stdout, /moved 1 redundant cloud-sync duplicate/);
  assert.match(blocked.stderr, /develop 3\n\s+original: .*refs\/heads\/develop\n\s+why:\s+Its commit [0-9a-f]+ is not part of refs\/heads\/develop[\s\S]*git log -3/);
  assert.match(blocked.stderr, /develop 4[\s\S]*does not exist in this repository/);
  assert.match(blocked.stderr, /HEAD 2[\s\S]*content differs/);
  assert.equal(await fs.stat(`${repo}-worktrees/blocked`).catch(() => null), null);
  assert.equal(await fs.readFile(path.join(common, "refs/heads/develop 3"), "utf8"), `${sideCommit}\n`);
  // Once the user has settled them, the remaining non-blocking copies never stop a lane.
  for (const rel of ["refs/heads/develop 3", "refs/heads/develop 4", "HEAD 2"]) await fs.unlink(path.join(common, ...rel.split("/")));
  for (const name of ["plan.md", "diff.md", "diff 2.md"]) await fs.unlink(path.join(repo, name));
  const created = harness(repo, "worktree", "create", "unblocked", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /Conflict copies kept \(2\)[\s\S]*config 2[\s\S]*orphan 2/);
  t.after(() => fs.rm(`${repo}-worktrees`, { recursive: true, force: true }));
});

test("create, approve and cleanup sweep identical duplicates so they cannot block or enter commits", async (t) => {
  const { repo } = await makeGitFixture(t);
  t.after(() => fs.rm(`${repo}-worktrees`, { recursive: true, force: true }));
  await fs.writeFile(path.join(repo, "base.md"), "base\n");
  git(repo, "add", "base.md");
  git(repo, "commit", "-m", "Add base");
  // An untracked sync duplicate would make the primary look dirty and refuse the lane.
  await fs.writeFile(path.join(repo, "base 2.md"), "base\n");
  const created = harness(repo, "worktree", "create", "swept", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /moved 1 redundant cloud-sync duplicate to a reversible quarantine/);
  const lane = `${repo}-worktrees/swept`;
  const common = path.join(repo, ".git");
  const stored = async () => (await fs.readdir(path.join(common, "hai-harness/quarantine"))).sort();
  assert.equal((await stored()).length, 1);

  // approve must not commit a duplicate next to the result
  await fs.writeFile(path.join(lane, "result.txt"), "result\n");
  await fs.writeFile(path.join(lane, "result 2.txt"), "result\n");
  const approved = harness(lane, "worktree", "approve", "--keep-worktree", "--approved", "Swept", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(git(repo, "ls-files"), /^result\.txt$/m);
  assert.doesNotMatch(git(repo, "ls-files"), /result 2\.txt/);

  // cleanup: a differing duplicate is real unfinished work and is kept; an identical one is swept
  await fs.writeFile(path.join(lane, "result 2.txt"), "conflicting\n");
  const retained = harness(repo, "worktree", "cleanup", "task/swept", "--target", repo);
  assert.notEqual(retained.status, 0);
  assert.match(retained.stdout, /Conflict copies kept \(1\)[\s\S]*result 2\.txt[\s\S]*Cleanup retained task\/swept/);
  assert.equal(await fs.readFile(path.join(lane, "result 2.txt"), "utf8"), "conflicting\n");
  await fs.writeFile(path.join(lane, "result 2.txt"), "result\n");
  const cleaned = harness(repo, "worktree", "cleanup", "task/swept", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout + cleaned.stderr);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  const quarantines = await stored();
  assert.equal(quarantines.length, 3);
  assert.equal(await fs.readFile(path.join(common, "hai-harness/quarantine", quarantines[2], "tree", "swept", "result 2.txt"), "utf8"), "result\n");
});

test("approve refuses to commit a kept conflict copy, and --quarantine moves only an approved, untracked one", async (t) => {
  const { repo } = await makeGitFixture(t);
  t.after(() => fs.rm(`${repo}-worktrees`, { recursive: true, force: true }));
  for (const [name, content] of [[".gitignore", ".env\n"], ["notes.md", "notes\n"], ["tracked.md", "tracked\n"], ["tracked 2.md", "tracked copy\n"]]) {
    await fs.writeFile(path.join(repo, name), content);
  }
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Base files, one a tracked duplicate");
  assert.equal(harness(repo, "worktree", "create", "guard", "--target", repo).status, 0);
  const lane = `${repo}-worktrees/guard`;
  await fs.writeFile(path.join(lane, "result.txt"), "result\n");
  await fs.writeFile(path.join(lane, ".env"), "SECRET=1\n"); // ignored original
  await fs.writeFile(path.join(lane, ".env 2"), "SECRET=2\n");
  await fs.writeFile(path.join(lane, "notes 2.md"), "other notes\n");
  await fs.writeFile(path.join(lane, "orphan 2.txt"), "no original\n");
  const head = git(lane, "rev-parse", "HEAD");

  const refused = harness(lane, "worktree", "approve", "--approved", "Guarded", "--target", lane);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Stopped: approve would commit what looks like a cloud-sync conflict copy\. Nothing was committed\./);
  assert.ok(refused.stderr.includes(path.join(lane, ".env 2")) && refused.stderr.includes(path.join(lane, "notes 2.md")));
  assert.match(refused.stderr, /merge what is needed into the original[\s\S]*worktree sweep --quarantine <path>/);
  assert.ok(!refused.stderr.includes("orphan 2.txt"), "an orphan with no original only reports");
  assert.match(refused.stdout, /Conflict copies kept \(1\)[\s\S]*orphan 2\.txt/);
  assert.equal(git(lane, "rev-parse", "HEAD"), head);
  assert.equal(git(lane, "diff", "--cached", "--name-only"), "");
  assert.equal(await fs.readFile(path.join(lane, ".env 2"), "utf8"), "SECRET=2\n");

  // --quarantine refuses what it must not touch
  const notACopy = harness(lane, "worktree", "sweep", "--quarantine", "notes.md", "--target", lane);
  assert.notEqual(notACopy.status, 0);
  assert.match(notACopy.stderr, /not named like a cloud-sync conflict copy/);
  const tracked = harness(lane, "worktree", "sweep", "--quarantine", "tracked 2.md", "--target", lane);
  assert.notEqual(tracked.status, 0);
  assert.match(tracked.stderr, /is tracked; tracked files are never quarantined/);
  assert.equal(await fs.readFile(path.join(lane, "tracked 2.md"), "utf8"), "tracked copy\n");
  assert.notEqual(harness(lane, "worktree", "sweep", "--quarantine", "missing 2.md", "--target", lane).status, 0);

  // for paths the user approved, it moves exactly those into the same quarantine and marks them
  const common = path.join(repo, ".git");
  for (const named of [".env 2", path.join(lane, "notes 2.md")]) {
    const moved = harness(lane, "worktree", "sweep", "--quarantine", named, "--target", lane);
    assert.equal(moved.status, 0, moved.stderr);
    assert.match(moved.stdout, /moved to the reversible quarantine at the user's direction; nothing was deleted/);
  }
  const quarantines = await fs.readdir(path.join(common, "hai-harness/quarantine"));
  assert.equal(quarantines.length, 2);
  const manifests = await Promise.all(quarantines.map((name) => fs.readFile(path.join(common, "hai-harness/quarantine", name, "manifest.txt"), "utf8")));
  assert.ok(manifests.every((text) => /reason: user-directed; the sweep had kept it: Its content differs from the original\./.test(text) && /directed: by the user/.test(text)));
  assert.equal(await fs.stat(path.join(lane, ".env 2")).catch(() => null), null);
  assert.equal(await fs.readFile(path.join(lane, ".env"), "utf8"), "SECRET=1\n");
  assert.equal(await fs.readFile(path.join(lane, "orphan 2.txt"), "utf8"), "no original\n");

  const approved = harness(lane, "worktree", "approve", "--approved", "Guarded", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  const committed = git(repo, "ls-files");
  assert.match(committed, /^result\.txt$/m);
  assert.doesNotMatch(committed, /\.env 2|notes 2/);
});

test("kept worktree admin and task-packet directory copies stop lane commands with a reason, and a missing original index is kept", async (t) => {
  const { repo } = await makeInstalledProject(t);
  const common = path.join(repo, ".git");
  assert.equal(projectCli(repo, repo, "worktree", "create", "alpha").status, 0);
  const lane = `${repo}-worktrees/alpha`;
  assert.equal(projectCli(lane, lane, "human-sync", "init").status, 0);
  const packet = JSON.parse(projectCli(lane, lane, "human-sync", "status").stdout).packet;
  const admin = path.join(common, "worktrees/alpha");

  // an index copy whose original index is gone may hold the only staged state: kept, reported, not blocking
  await fs.writeFile(path.join(admin, "index 2"), "possibly the only staged state\n");
  await fs.rename(path.join(admin, "index"), path.join(admin, "index.saved"));
  const keptIndex = projectCli(repo, repo, "worktree", "sweep");
  assert.equal(keptIndex.status, 0, keptIndex.stderr);
  assert.match(keptIndex.stdout, /index 2\n\s+original: .*\n\s+why:\s+The original index is missing, so this copy may hold the only staged state\./);
  assert.equal(await fs.readFile(path.join(admin, "index 2"), "utf8"), "possibly the only staged state\n");
  await fs.rename(path.join(admin, "index.saved"), path.join(admin, "index"));
  await fs.rm(path.join(admin, "index 2"));

  // a differing copy of a worktree admin directory shows up as an extra worktree
  await fs.cp(admin, `${admin} 2`, { recursive: true });
  await fs.writeFile(path.join(`${admin} 2`, "extra"), "differs\n");
  const adminBlocked = projectCli(repo, repo, "worktree", "create", "beta");
  assert.notEqual(adminBlocked.status, 0);
  assert.match(adminBlocked.stderr, /Stopped: a cloud-sync conflict copy in Git metadata is not provably redundant/);
  assert.ok(adminBlocked.stderr.includes(`${admin} 2`));
  assert.match(adminBlocked.stderr, /Git lists a copy of a worktree admin directory as an extra worktree/);
  assert.match(adminBlocked.stderr, /node Agents\/hai-harness\.mjs worktree sweep --quarantine <path>/);
  assert.equal(await fs.stat(`${repo}-worktrees/beta`).catch(() => null), null);
  assert.equal(projectCli(repo, repo, "worktree", "sweep", "--quarantine", `${admin} 2`).status, 0);
  assert.equal(await fs.stat(`${admin} 2`).catch(() => null), null);
  assert.ok(await fs.stat(path.join(admin, "HEAD")), "the real admin directory is untouched");

  // a differing copy of a task-packet directory would fail cleanup with an opaque identity error
  await fs.cp(packet, `${packet} 2`, { recursive: true });
  await fs.writeFile(path.join(`${packet} 2`, "decision-trail.md"), "diverged trail\n");
  const packetBlocked = projectCli(repo, repo, "worktree", "cleanup", "task/alpha", "--target", repo);
  assert.notEqual(packetBlocked.status, 0);
  assert.match(packetBlocked.stderr, /Stopped:/);
  assert.ok(packetBlocked.stderr.includes(`${packet} 2`));
  assert.match(packetBlocked.stderr, /Invalid task packet identity/);
  assert.ok(git(repo, "branch", "--list", "task/alpha"));
  assert.equal(projectCli(repo, repo, "worktree", "sweep", "--quarantine", `${packet} 2`).status, 0);
  assert.equal(await fs.stat(packet).then(() => true), true);
  const created = projectCli(repo, repo, "worktree", "create", "beta");
  assert.equal(created.status, 0, created.stderr);
});

test("simultaneous sweeps hand each duplicate to exactly one of them without false stops", async (t) => {
  const { repo } = await makeGitFixture(t);
  const bulk = path.join(repo, ".git/bulk");
  await fs.mkdir(bulk);
  const total = 60;
  for (let index = 0; index < total; index += 1) {
    await fs.writeFile(path.join(bulk, `f${index}.txt`), `payload ${index}\n`);
    await fs.writeFile(path.join(bulk, `f${index} 2.txt`), `payload ${index}\n`);
  }
  const sweep = () => new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, "worktree", "sweep", "--target", repo], { cwd: repo, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
  const results = await Promise.all([sweep(), sweep()]);
  let movedByThem = 0;
  for (const result of results) {
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout + result.stderr, /Stopped|could not be moved|kept \(/);
    movedByThem += Number(result.stdout.match(/moved (\d+) redundant/)?.[1] ?? 0);
  }
  assert.equal(movedByThem, total);
  const remaining = (await fs.readdir(bulk)).filter((name) => name.includes(" 2.txt"));
  assert.deepEqual(remaining, []);
  let stored = 0;
  const quarantineRoot = path.join(repo, ".git/hai-harness/quarantine");
  for (const session of await fs.readdir(quarantineRoot)) {
    stored += (await fs.readdir(path.join(quarantineRoot, session, "git/bulk")).catch(() => [])).length;
  }
  assert.equal(stored, total);
});

test("init and update run only from the identified package; every other location is an installed copy", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "hai-detect-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const place = async (relative, packageName) => {
    const folder = path.join(root, relative.split("/")[0]);
    await fs.mkdir(path.join(folder, path.dirname(relative.split("/").slice(1).join("/"))), { recursive: true });
    await fs.writeFile(path.join(folder, "package.json"), JSON.stringify({ name: packageName, version: "9.9.9" }));
    await fs.mkdir(path.join(folder, "scaffold"), { recursive: true });
    await fs.writeFile(path.join(folder, "scaffold/AGENTS.md"), "template\n");
    const script = path.join(root, relative);
    await fs.copyFile(cli, script);
    return script;
  };
  const target = path.join(root, "target");
  await fs.mkdir(target);
  const update = (script, ...args) => run(process.execPath, [script, "update", "--dry-run", ...args], root, noHarnessEnv);

  // bin/hai-harness.mjs beside a package.json named hai-harness is the package
  const real = update(await place("pkg/bin/hai-harness.mjs", "hai-harness"), "--target", target);
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /Dry run complete/);
  // the same file under another package name, or under Agents/, is an installed copy
  for (const [relative, name] of [["other/bin/hai-harness.mjs", "someone-else"], ["agents/Agents/hai-harness.mjs", "hai-harness"]]) {
    const refused = update(await place(relative, name), "--target", target);
    assert.notEqual(refused.status, 0, relative);
    assert.match(refused.stderr, /npx github:ClaudiusMa\/HAI-Harness update --dry-run --target/);
  }

  // A project with its own scaffold/AGENTS.md and package.json: the installed copy must not touch its files.
  const project = path.join(root, "project");
  await fs.mkdir(project);
  assert.equal(harness(project, "init", "--target", project).status, 0);
  await fs.writeFile(path.join(project, "package.json"), JSON.stringify({ name: "my-app", version: "1.2.3" }));
  await fs.mkdir(path.join(project, "scaffold"));
  await fs.writeFile(path.join(project, "scaffold/AGENTS.md"), "the project's own template\n");
  await fs.writeFile(path.join(project, "AGENTS.md"), "the project's own entry point\n");
  const receipt = await fs.readFile(path.join(project, ".hai-harness.json"), "utf8");
  const live = projectCli(project, project, "update");
  assert.notEqual(live.status, 0);
  assert.match(live.stderr, /npx github:ClaudiusMa\/HAI-Harness update/);
  assert.equal(await fs.readFile(path.join(project, "AGENTS.md"), "utf8"), "the project's own entry point\n");
  assert.equal(await fs.readFile(path.join(project, ".hai-harness.json"), "utf8"), receipt);
});

test("approve refuses an untracked directory copy, and staging it explicitly is the way through", async (t) => {
  const { repo } = await makeGitFixture(t);
  t.after(() => fs.rm(`${repo}-worktrees`, { recursive: true, force: true }));
  await fs.mkdir(path.join(repo, "src"));
  await fs.writeFile(path.join(repo, "src/a.js"), "one\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Add src");
  assert.equal(harness(repo, "worktree", "create", "dirs", "--target", repo).status, 0);
  const lane = `${repo}-worktrees/dirs`;
  await fs.mkdir(path.join(lane, "src 2"));
  await fs.writeFile(path.join(lane, "src 2/a.js"), "two\n");
  await fs.mkdir(path.join(lane, "solo 2")); // no sibling "solo": reported at most, never a stop
  await fs.writeFile(path.join(lane, "solo 2/x.txt"), "x\n");
  await fs.writeFile(path.join(lane, "result.txt"), "result\n");
  const head = git(lane, "rev-parse", "HEAD");

  const refused = harness(lane, "worktree", "approve", "--approved", "Dirs", "--target", lane);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Stopped: approve would commit what looks like a cloud-sync conflict copy\. Nothing was committed\./);
  assert.ok(refused.stderr.includes(path.join(lane, "src 2")));
  assert.ok(!refused.stderr.includes("solo 2"));
  assert.match(refused.stderr, /intentional, renaming it or staging it explicitly with `git add <path>` lets approve proceed/);
  assert.equal(git(lane, "rev-parse", "HEAD"), head);
  assert.equal(git(lane, "diff", "--cached", "--name-only"), "");

  // the sweep never moves a directory out of a checkout, even when the user names it
  const named = harness(lane, "worktree", "sweep", "--quarantine", "src 2", "--target", lane);
  assert.notEqual(named.status, 0);
  assert.match(named.stderr, /Only a regular file can be quarantined from a checkout/);
  assert.equal(await fs.readFile(path.join(lane, "src 2/a.js"), "utf8"), "two\n");

  // the user says it is intentional: explicit staging lets approve proceed
  git(lane, "add", "src 2");
  const approved = harness(lane, "worktree", "approve", "--approved", "Dirs", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  const committed = git(repo, "ls-files");
  assert.match(committed, /^src 2\/a\.js$/m);
  assert.match(committed, /^solo 2\/x\.txt$/m);
});

test("--quarantine resolves relative paths against --target and refuses files owned by a nested repository", async (t) => {
  const { repo } = await makeGitFixture(t);
  await fs.writeFile(path.join(repo, "plain.txt"), "original\n");
  await fs.writeFile(path.join(repo, "plain 2.txt"), "diverged\n");
  // a decoy with the same relative name in the calling directory must not be what gets resolved
  const elsewhere = path.dirname(repo);
  await fs.writeFile(path.join(elsewhere, "plain 2.txt"), "decoy\n");
  const nested = path.join(repo, "nested");
  await fs.mkdir(nested);
  git(nested, "init", "-b", "main");
  git(nested, "config", "user.name", "Nested");
  git(nested, "config", "user.email", "nested@example.invalid");
  await fs.writeFile(path.join(nested, "a.txt"), "tracked by the nested repository\n");
  await fs.writeFile(path.join(nested, "a 2.txt"), "also tracked there\n");
  git(nested, "add", "-A");
  git(nested, "commit", "-m", "Nested content");

  // the outer checkout cannot see nested/a 2.txt as tracked, so ownership is checked explicitly
  const refused = harness(elsewhere, "worktree", "sweep", "--quarantine", "nested/a 2.txt", "--target", repo);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /belongs to a different Git repository \(a nested repository or submodule at /);
  assert.equal(await fs.readFile(path.join(nested, "a 2.txt"), "utf8"), "also tracked there\n");
  assert.equal(git(nested, "status", "--porcelain"), "");

  const moved = harness(elsewhere, "worktree", "sweep", "--quarantine", "plain 2.txt", "--target", repo);
  assert.equal(moved.status, 0, moved.stderr);
  assert.equal(await fs.stat(path.join(repo, "plain 2.txt")).catch(() => null), null);
  assert.equal(await fs.readFile(path.join(repo, "plain.txt"), "utf8"), "original\n");
  assert.equal(await fs.readFile(path.join(elsewhere, "plain 2.txt"), "utf8"), "decoy\n");
  assert.match(harness(repo, "help").stdout, /relative path is resolved against --target/);
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
  // The harness's own .hai copy of the CLI refuses update and names the wrapper that does the job.
  const ownCopy = run(process.execPath, [path.join(target, "Agents/hai-harness.mjs"), "update"], root, noHarnessEnv);
  assert.notEqual(ownCopy.status, 0);
  assert.match(ownCopy.stderr, /npx github:ClaudiusMa\/HAI-Harness update/);
  assert.match(ownCopy.stderr, /\.\/hai-meta sync/);
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
