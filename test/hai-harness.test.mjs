import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

// Runs the project's own copy of the CLI (.hai/Agents/hai-harness.mjs) from `cwd`.
function projectCli(copyRoot, cwd, ...args) {
  return run(process.execPath, [path.join(copyRoot, ".hai/Agents/hai-harness.mjs"), ...args], cwd, noHarnessEnv);
}

// The receipt lives in the harness folder: <project>/.hai once installed.
function receiptRoot(cwd) {
  return existsSync(path.join(cwd, ".hai", "Agents")) ? path.join(cwd, ".hai") : cwd;
}

function beacon(cwd, ...args) {
  return run(process.execPath, [checker, "--target", receiptRoot(cwd), "--cache", path.join(cwd, ".beacon-cache.json"), ...args], cwd);
}

function beaconWithLocalCache(cwd, ...args) {
  return run(process.execPath, [checker, "--target", receiptRoot(cwd), ...args], cwd);
}

// Lanes live in the shared folder beside the primary checkout.
function lanesOf(repo) {
  return path.join(path.dirname(repo), "_worktrees", path.basename(repo));
}

function laneOf(repo, slug) {
  return path.join(lanesOf(repo), slug);
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
  const taskRoot = laneOf(repo, "happy-path");
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
  const pendingRoot = laneOf(repo, "approval-required");
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
  const legacyRoot = laneOf(repo, "legacy-compatible");
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

test("lanes go in the shared _worktrees folder and lanes at the old sibling path still clean up", async (t) => {
  const { repo } = await makeGitFixture(t);
  const created = harness(repo, "worktree", "create", "shared-root", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, new RegExp(`path:\\s+${laneOf(repo, "shared-root").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`));
  assert.ok(existsSync(path.join(laneOf(repo, "shared-root"), "README.md")));
  assert.equal(existsSync(`${repo}-worktrees`), false);

  // A lane made by an earlier release sits at <repo>-worktrees/<slug>.
  const legacyRoot = path.join(`${repo}-worktrees`, "shared-root");
  await fs.mkdir(path.dirname(legacyRoot));
  git(repo, "worktree", "move", laneOf(repo, "shared-root"), legacyRoot);
  await fs.writeFile(path.join(legacyRoot, "result.txt"), "approved\n");
  const kept = harness(legacyRoot, "worktree", "approve", "--keep-worktree", "--approved", "Complete legacy lane", "--target", legacyRoot);
  assert.equal(kept.status, 0, kept.stderr);
  assert.ok(existsSync(legacyRoot));
  const cleaned = harness(repo, "worktree", "cleanup", "task/shared-root", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout + cleaned.stderr);
  assert.equal(existsSync(legacyRoot), false);
  assert.equal(run("git", ["rev-parse", "--verify", "refs/heads/task/shared-root"], repo).status === 0, false);
  assert.equal(git(repo, "log", "-1", "--format=%B", "HEAD^2"), "Complete legacy lane");
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
  const lane = (slug) => laneOf(repo, slug);
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
  const laneRoot = laneOf(repo, "secondary");
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
  const lane = laneOf(repo, slug);
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
  const ignoredLane = laneOf(repo, "ignored");
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
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-install-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const target = path.join(project, ".hai");

  const packageMetadata = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8"));
  const releaseMetadata = JSON.parse(await fs.readFile(path.join(projectRoot, "release.json"), "utf8"));
  assert.equal(releaseMetadata.version, packageMetadata.version);
  assert.ok(packageMetadata.files.includes("scaffold"));
  assert.ok(!packageMetadata.files.includes("AGENTS.md"));
  const checkerSource = await fs.readFile(checker, "utf8");
  assert.match(checkerSource, /api\.github\.com\/repos\/ClaudiusMa\/HAI-Harness\/releases\/latest/);
  assert.doesNotMatch(checkerSource, /raw\.githubusercontent\.com.*release\.json/);

  const installed = harness(project, "init", "--target", project);
  assert.equal(installed.status, 0, installed.stderr);
  // Everything lives in .hai/; the only other file is the project's AGENTS.md.
  assert.deepEqual((await fs.readdir(project)).sort(), [".hai", "AGENTS.md"]);
  assert.equal(
    await fs.readFile(path.join(target, "Agents/hai-harness.mjs"), "utf8"),
    await fs.readFile(cli, "utf8")
  );
  // Every installed instruction names the project CLI, never a bare command that is not on PATH.
  const bareCommand = /(?<![\w/.-])hai-harness (?:worktree|human-sync|doctor|init|update|migrate)\b/;
  const oldPath = /node Agents\/(?:hai-harness|check-for-update)\.mjs/;
  const installedDocs = [path.join(project, "AGENTS.md")];
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
    const content = await fs.readFile(doc, "utf8");
    assert.doesNotMatch(content, bareCommand, path.relative(project, doc));
    assert.doesNotMatch(content, oldPath, path.relative(project, doc));
  }
  const entryFile = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
  assert.match(entryFile, /node \.hai\/Agents\/hai-harness\.mjs worktree create <task-slug>/);
  // AGENTS.md carries one block: the always-loaded startup rules, three start steps, at most eight one-line invariants, a small word budget.
  const body = await fs.readFile(path.join(projectRoot, "scaffold/AGENTS.md"), "utf8");
  // A fresh install defaults to own: HAI applies only when a HAI role such as Claudia is named.
  const ownBody = body.trim()
    .replace("Do these in order, before anything else.", "When the user's message or your task contract names a HAI role (step 2), do these in order, before anything else. When it names none, this block does not apply: follow this project's own instructions outside it.")
    .replace("Otherwise you are Claudia, even for a plain coding request; do not ask the user to pick.", "Otherwise no HAI role applies; do not take one or ask the user to pick.");
  assert.equal(entryFile, `<!-- hai-harness:start default=own -->\n${entryFile.split("\n")[1]}\n\n${ownBody}\n<!-- hai-harness:end -->\n`);
  assert.ok(body.split(/\s+/).filter(Boolean).length <= 450, "scaffold/AGENTS.md must stay at 450 words or fewer; put detail in Agents/onboarding.md");
  assert.equal((body.match(/^\d\. \*\*/gm) ?? []).length, 3);
  const always = body.match(/### Always\n\n((?:- .*\n)+)/)?.[1].trim().split("\n") ?? [];
  assert.ok(always.length > 0 && always.length <= 8, `Always lists ${always.length} invariants`);
  for (const role of ["Claudia", "Momus", "Augustus", "Julius", "Athena", "Hephaestus"]) assert.ok(body.includes(role), role);
  assert.match(body, /\.hai\/Agents\/custom\/roles\/<name>\.md/);
  assert.equal(await fs.stat(path.join(target, "AGENTS.md")).catch(() => null), null);
  assert.equal(await fs.stat(path.join(project, "AGENTS.override.md")).catch(() => null), null);
  assert.equal(await fs.stat(path.join(project, "CLAUDE.md")).catch(() => null), null);
  const receipt = JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8"));
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.installedVersion, installedVersion);
  assert.equal(receipt.channel, "stable");
  assert.equal(receipt.checkEnabled, true);
  assert.equal(receipt.block, true);
  assert.equal(receipt.files["Agents/onboarding.md"], createHash("sha256").update(await fs.readFile(path.join(projectRoot, "Agents/onboarding.md"))).digest("hex"));
  for (const folder of ["roles", "skills"]) assert.ok(await fs.stat(path.join(target, `Agents/custom/${folder}/README.md`)));
  assert.deepEqual((await fs.readdir(path.join(projectRoot, "Agents/tasks"))).sort(), ["TEMPLATE.md"]);
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), /^# Augustus Tasks/m);
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.doesNotMatch(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), /\{\{ROLE_/);
  assert.equal(await fs.readFile(path.join(target, "Agents/momus.md"), "utf8"), await fs.readFile(path.join(projectRoot, "Agents/momus.md"), "utf8"));
  assert.equal(await fs.stat(path.join(target, "Agents/tasks/momus.md")).catch(() => null), null);
  // The worker role is one shipped file; it gets no task file of its own.
  assert.equal(await fs.readFile(path.join(target, "Agents/worker.md"), "utf8"), await fs.readFile(path.join(projectRoot, "Agents/worker.md"), "utf8"));
  assert.equal(await fs.stat(path.join(target, "Agents/tasks/worker.md")).catch(() => null), null);
  // A .hai folder is never a project root.
  const nested = harness(project, "update", "--target", target);
  assert.notEqual(nested.status, 0);
  assert.match(nested.stderr, /takes the project root, not its \.hai\/ folder/);
  assert.equal(await fs.stat(path.join(target, ".hai")).catch(() => null), null);

  const protectedRecords = new Map([
    ["Agents/project_context.md", "populated project context\n"],
    ["Human/decisions.md", "confirmed human decisions\n"],
    ["Agents/handoffs/active-incident.md", "existing incident and attempt history\n"],
    ["Agents/custom/roles/apollo.md", "project role\n"],
    ["Agents/custom/skills/release-notes/SKILL.md", "project skill\n"]
  ]);
  for (const [file, content] of protectedRecords) {
    await fs.mkdir(path.dirname(path.join(target, file)), { recursive: true });
    await fs.writeFile(path.join(target, file), content);
  }
  const shippedSkills = ["code-review", "implement", "debugging"];
  await fs.writeFile(path.join(target, "Agents/planning.md"), "project-owned planning\n");
  await fs.writeFile(path.join(target, "Agents/design.md"), "project-owned design guide\n");
  await fs.writeFile(path.join(target, "Agents/lessons/INDEX.md"), "project-owned lesson index\n");
  await fs.writeFile(path.join(target, "Agents/tasks/augustus.md"), "project-owned Augustus queue\n");
  for (const skill of shippedSkills) await fs.writeFile(path.join(target, `Agents/skills/${skill}/project-note.md`), `project-owned ${skill} note\n`);
  // Upgrade a populated installation that does not yet have Momus/debugging.
  await fs.unlink(path.join(target, "Agents/momus.md"));
  await fs.unlink(path.join(target, "Agents/skills/debugging/SKILL.md"));
  await fs.unlink(path.join(target, "Agents/tasks/julius.md"));
  const disabled = beacon(project, "--disable");
  assert.equal(disabled.status, 0, disabled.stderr);
  const updated = harness(project, "update", "--target", project);
  assert.equal(updated.status, 0, updated.stderr);
  assert.match(updated.stdout, /AGENTS\.md: HAI-Harness block already current/);
  for (const [file, content] of protectedRecords) assert.equal(await fs.readFile(path.join(target, file), "utf8"), content);
  assert.equal(await fs.readFile(path.join(target, "Agents/momus.md"), "utf8"), await fs.readFile(path.join(projectRoot, "Agents/momus.md"), "utf8"));
  assert.equal(await fs.stat(path.join(target, "Agents/tasks/momus.md")).catch(() => null), null);
  assert.equal(await fs.readFile(path.join(target, "Agents/planning.md"), "utf8"), "project-owned planning\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/design.md"), "utf8"), "project-owned design guide\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/lessons/INDEX.md"), "utf8"), "project-owned lesson index\n");
  assert.equal(await fs.readFile(path.join(target, "Agents/tasks/augustus.md"), "utf8"), "project-owned Augustus queue\n");
  for (const skill of shippedSkills) {
    const skillFile = `Agents/skills/${skill}/SKILL.md`;
    assert.equal(await fs.readFile(path.join(target, skillFile), "utf8"), await fs.readFile(path.join(projectRoot, skillFile), "utf8"));
    assert.equal(await fs.readFile(path.join(target, `Agents/skills/${skill}/project-note.md`), "utf8"), `project-owned ${skill} note\n`);
  }
  assert.match(await fs.readFile(path.join(target, "Agents/tasks/julius.md"), "utf8"), /^# Julius Tasks/m);
  assert.equal(JSON.parse(await fs.readFile(path.join(target, ".hai-harness.json"), "utf8")).checkEnabled, false);
  for (const skill of shippedSkills) await fs.unlink(path.join(target, `Agents/skills/${skill}/SKILL.md`));
  await fs.unlink(path.join(target, "Agents/hai-harness.mjs"));
  await fs.unlink(path.join(target, "Agents/momus.md"));
  await fs.unlink(path.join(target, "Agents/lanes.md"));
  await fs.unlink(path.join(target, "Agents/worker.md"));
  const missingReviewSkill = harness(project, "doctor", "--target", project);
  assert.notEqual(missingReviewSkill.status, 0);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/hai-harness\.mjs/);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/skills\/code-review\/SKILL\.md/);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/skills\/implement\/SKILL\.md/);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/skills\/debugging\/SKILL\.md/);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/momus\.md/);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/lanes\.md/);
  assert.match(missingReviewSkill.stdout, /\.hai\/Agents\/worker\.md/);
  const restoredReviewSkill = harness(project, "update", "--target", project);
  assert.equal(restoredReviewSkill.status, 0, restoredReviewSkill.stderr);
  assert.equal(await fs.readFile(path.join(target, "Agents/hai-harness.mjs"), "utf8"), await fs.readFile(cli, "utf8"));
  assert.equal(await fs.readFile(path.join(target, "Agents/worker.md"), "utf8"), await fs.readFile(path.join(projectRoot, "Agents/worker.md"), "utf8"));
  for (const skill of shippedSkills) {
    const skillFile = `Agents/skills/${skill}/SKILL.md`;
    assert.equal(await fs.readFile(path.join(target, skillFile), "utf8"), await fs.readFile(path.join(projectRoot, skillFile), "utf8"));
  }
  // The incomplete custom role and skill are reported, not fatal.
  const healthy = harness(project, "doctor", "--target", project);
  assert.equal(healthy.status, 0, healthy.stdout + healthy.stderr);
  assert.match(healthy.stdout, /Update status: disabled/);
  assert.match(healthy.stdout, /Custom role \.hai\/Agents\/custom\/roles\/apollo\.md is incomplete/);
  // doctor accepts the .hai folder too and reads the same project.
  assert.equal(harness(project, "doctor", "--target", target).status, 0);

  await fs.writeFile(path.join(target, "Agents/planning.md"), "planning\n".repeat(2633));
  await fs.writeFile(path.join(target, "Agents/tasks/julius.md"), "task\n".repeat(842));
  const polluted = harness(project, "doctor", "--target", project);
  assert.notEqual(polluted.status, 0);
  assert.match(polluted.stdout, /\.hai\/Agents\/planning\.md: 2633 lines \(limit 1200\)/);
  assert.match(polluted.stdout, /\.hai\/Agents\/tasks\/julius\.md: 842 lines \(limit 400\)/);
  assert.match(polluted.stdout, /handoffs\/ or Agents\/_archive\//);
});

// Startup reading is paid on every session. The worker count is the shipped files a worker is told
// to read (the shared core, its name file, the worker role and the implement method); the lead count is the AGENTS.md
// block, the core, lanes.md, claudia.md and implement. The block is also capped on its own (450
// words) in the install test. Detail belongs in the file of the role or skill that uses it.
test("startup reading paths stay within their word budgets", async () => {
  const words = async (relative) => (await fs.readFile(path.join(projectRoot, relative), "utf8")).split(/\s+/).filter(Boolean).length;
  const total = async (files) => (await Promise.all(files.map(words))).reduce((sum, count) => sum + count, 0);
  for (const role of ["augustus", "julius"]) {
    const worker = await total(["Agents/onboarding.md", `Agents/${role}.md`, "Agents/worker.md", "Agents/skills/implement/SKILL.md"]);
    assert.ok(worker <= 2200, `${role} startup path is ${worker} words; the budget is 2,200`);
  }
  const lead = await total(["scaffold/AGENTS.md", "Agents/onboarding.md", "Agents/lanes.md", "Agents/claudia.md", "Agents/skills/implement/SKILL.md"]);
  assert.ok(lead <= 5800, `Claudia's startup path is ${lead} words; the budget is 5,800`);
  // Each role's read path is stated once, in the core; role docs link to it instead of restating it.
  const onboarding = await fs.readFile(path.join(projectRoot, "Agents/onboarding.md"), "utf8");
  for (const role of ["Claudia", "Augustus, Julius", "Momus", "Athena", "Hephaestus", "Custom role"]) assert.match(onboarding, new RegExp(`^- \\*\\*${role}\\*\\*`, "m"), role);
  for (const doc of ["claudia", "augustus", "julius", "worker", "momus", "athena", "hephaestus"]) {
    assert.doesNotMatch(await fs.readFile(path.join(projectRoot, `Agents/${doc}.md`), "utf8"), /^## (Required )?Read (Order|path)/im, `${doc}.md restates its read path`);
  }
  // The worker line reads the name file, then the shared worker role, then the contract.
  assert.match(onboarding, /^- \*\*Augustus, Julius\*\* \(workers\): your name file, \[worker\.md\]\(worker\.md\), `tasks\/<you>\.md`/m);
});

// One worker role, two names: the rules live once in worker.md, and each name file only says which
// slot it is, where its queue is, and links the role, so the two copies cannot drift.
test("Augustus and Julius are name files for one worker role", async () => {
  const read = (relative) => fs.readFile(path.join(projectRoot, relative), "utf8");
  const augustus = await read("Agents/augustus.md");
  const julius = await read("Agents/julius.md");
  assert.equal(augustus.replaceAll("Augustus", "Julius").replaceAll("augustus", "julius"), julius);
  for (const [name, file] of [["augustus", augustus], ["julius", julius]]) {
    assert.match(file, /\]\(worker\.md\)/, `${name}.md links worker.md`);
    assert.match(file, new RegExp(`\\]\\(tasks/${name}\\.md\\)`), `${name}.md names its queue`);
    assert.ok(file.split(/\s+/).filter(Boolean).length <= 40, `${name}.md is a name file, not a second copy of the role`);
    assert.doesNotMatch(file, /^## /m, `${name}.md holds no rules or optional sections`);
  }
  const worker = await read("Agents/worker.md");
  assert.match(worker, /Augustus and Julius/);
  assert.match(worker, /`tasks\/<your name>\.md`/);
  assert.match(worker, /\[implement\]\(skills\/implement\/SKILL\.md\)/);
  assert.match(worker, /\[code-review\]\(skills\/code-review\/SKILL\.md\)/);
  assert.match(worker, /\[debugging\]\(skills\/debugging\/SKILL\.md\)/);
  assert.match(worker, /Momus incident contract/);
  // A per-worker bias lives in the project's own context, not in an edited core file.
  assert.match(worker, /`project_context\.md`/);
  assert.match(await read("Agents/project_context.md"), /worker name/);
  assert.match(await read("Agents/tasks/TEMPLATE.md"), /`\.\.\/\{\{ROLE_SLUG\}\}\.md` → `\.\.\/worker\.md`/);
});

// The UI checker runs only where a misreading is likely: two or more spec rows, or a request whose
// earlier build was rejected. Otherwise the builder's own per-row evidence stands.
test("the fresh UI checker is required only for multi-row or previously rejected builds", async () => {
  for (const file of ["Agents/claudia.md", "Agents/onboarding.md"]) {
    const text = await fs.readFile(path.join(projectRoot, file), "utf8");
    // The old rule (every UI build gets a checker) is gone.
    assert.doesNotMatch(text, /For a UI build, before the user sees it, a fresh|A UI build is checked by a fresh/, file);
    // The checker's trigger names both conditions.
    const trigger = text.match(/[^.]*\bfresh[^.]*read-only (checker|reader)[^.]*\./)?.[0] ?? "";
    assert.match(trigger, /two or more rows/, file);
    assert.match(trigger, /reject/, file);
  }
});

test("the AGENTS.md block is the only part of the project's file HAI-Harness writes", async (t) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-entry-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const entry = path.join(project, "AGENTS.md");
  const own = "# Engram\r\n\r\nOur own rules, with CRLF and no final newline.";
  await fs.writeFile(entry, own);
  assert.equal(harness(project, "init", "--target", project).status, 0);
  let content = await fs.readFile(entry, "utf8");
  assert.ok(content.startsWith(`${own}\n\n<!-- hai-harness:start default=own -->\n`));
  assert.ok(content.endsWith("<!-- hai-harness:end -->\n"));
  const block = content.slice(own.length + 2);

  // Text above and below the block survives an update byte for byte; only the block is rewritten.
  const above = "# Engram\n\nSend schema changes to Apollo.\n\n";
  const below = "\n## Our notes\n\nKeep these.\n";
  await fs.writeFile(entry, `${above}${block.replace(/## HAI-Harness[\s\S]*<!-- hai-harness:end -->/, "stale block text\n<!-- hai-harness:end -->")}${below}`);
  const refreshed = harness(project, "update", "--target", project);
  assert.equal(refreshed.status, 0, refreshed.stderr);
  assert.match(refreshed.stdout, /block refreshed/);
  assert.equal(await fs.readFile(entry, "utf8"), `${above}${block}${below}`);

  // A removed block stays removed, and doctor says so.
  await fs.writeFile(entry, "# Engram\n\nNo harness here.\n");
  const removed = harness(project, "update", "--target", project);
  assert.equal(removed.status, 0, removed.stderr);
  assert.match(removed.stdout, /no HAI-Harness block, so it was left alone/);
  assert.equal(await fs.readFile(entry, "utf8"), "# Engram\n\nNo harness here.\n");
  assert.match(harness(project, "doctor", "--target", project).stdout, /AGENTS\.md has no HAI-Harness block/);
  // init puts it back on request.
  assert.equal(harness(project, "init", "--target", project).status, 0);
  assert.match(await fs.readFile(entry, "utf8"), /^# Engram\n\nNo harness here\.\n\n<!-- hai-harness:start default=own -->/);

  // Duplicate or unbalanced markers: the file is left untouched and update fails, so scripts notice.
  for (const broken of [`${block}${block}`, "x\n<!-- hai-harness:start -->\ny\n", "<!-- hai-harness:end -->\nx\n<!-- hai-harness:start -->\n"]) {
    await fs.writeFile(entry, broken);
    const result = harness(project, "update", "--target", project);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stdout, /duplicate or unbalanced HAI-Harness markers/);
    assert.equal(await fs.readFile(entry, "utf8"), broken);
  }
});

test("update replaces only core files it shipped, keeps edits, and retires unedited old files", async (t) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-ownership-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const target = path.join(project, ".hai");
  assert.equal(harness(project, "init", "--target", project).status, 0);
  const shipped = JSON.parse(await fs.readFile(path.join(projectRoot, "scaffold/shipped-hashes.json"), "utf8")).hashes;
  const sha = (value) => createHash("sha256").update(value).digest("hex");
  // Every file this package ships is listed, so a clone without a receipt still recognizes it.
  const sources = [["AGENTS.md", "scaffold/AGENTS.md"], ["Agents/hai-harness.mjs", "bin/hai-harness.mjs"], ["Human/onboarding.md", "Human/onboarding.md"]];
  const walk = async (relative) => {
    for (const entry of await fs.readdir(path.join(projectRoot, relative), { withFileTypes: true })) {
      if (entry.name === ".DS_Store") continue;
      if (entry.isDirectory()) await walk(`${relative}/${entry.name}`);
      else sources.push([`${relative}/${entry.name}`, `${relative}/${entry.name}`]);
    }
  };
  await walk("Agents");
  for (const [listed, source] of sources) {
    assert.ok(shipped[listed]?.includes(sha(await fs.readFile(path.join(projectRoot, source)))), `${source} changed: run "node scripts/shipped-hashes.mjs" to list its new version`);
  }
  const older = (file) => run("git", ["show", `v0.2.4:${file}`], projectRoot);
  const edited = "Project edit: Apollo routing\n";
  await fs.writeFile(path.join(target, "Agents/onboarding.md"), edited);
  await fs.writeFile(path.join(target, "Agents/claudia.md"), edited);
  // An older shipped version (when this checkout has the tag) is replaced.
  const oldJulius = older("Agents/julius.md");
  const julius = await fs.readFile(path.join(projectRoot, "Agents/julius.md"), "utf8");
  const replacesOld = oldJulius.status === 0 && oldJulius.stdout !== julius;
  if (replacesOld) await fs.writeFile(path.join(target, "Agents/julius.md"), oldJulius.stdout);
  await fs.writeFile(path.join(target, "AGENTS.md"), await fs.readFile(path.join(projectRoot, "scaffold/AGENTS.md")));
  const preview = harness(project, "update", "--dry-run", "--target", project);
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /Locally modified, kept[^\n]*: 2\n  - \.hai\/Agents\/onboarding\.md\n  - \.hai\/Agents\/claudia\.md/);
  assert.match(preview.stdout, /Retired \(no longer shipped, unedited\): 1\n  - \.hai\/AGENTS\.md/);
  assert.equal(await fs.readFile(path.join(target, "Agents/onboarding.md"), "utf8"), edited);
  assert.ok(await fs.stat(path.join(target, "AGENTS.md")));

  const result = harness(project, "update", "--target", project);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.replace(/^HAI-Harness updated/, "Dry run complete"), preview.stdout);
  assert.equal(await fs.readFile(path.join(target, "Agents/onboarding.md"), "utf8"), edited);
  assert.equal(await fs.readFile(path.join(target, "Agents/claudia.md"), "utf8"), edited);
  assert.equal(await fs.readFile(path.join(target, "Agents/julius.md"), "utf8"), julius);
  if (replacesOld) assert.match(result.stdout, /Updated: 1\n  - \.hai\/Agents\/julius\.md/);
  assert.equal(await fs.stat(path.join(target, "AGENTS.md")).catch(() => null), null);
  assert.match(harness(project, "doctor", "--target", project).stdout, /Core files edited in this project[^\n]*\.hai\/Agents\/onboarding\.md, \.hai\/Agents\/claudia\.md/);

  // An edited retired file is kept for review.
  await fs.writeFile(path.join(target, "AGENTS.md"), "our own notes\n");
  assert.match(harness(project, "update", "--target", project).stdout, /No longer shipped but edited here[^\n]*: 1\n  - \.hai\/AGENTS\.md/);
  assert.equal(await fs.readFile(path.join(target, "AGENTS.md"), "utf8"), "our own notes\n");

  // --accept-upstream takes the shipped version for exactly the named file.
  assert.match(harness(project, "update", "--target", project, "--accept-upstream", "Agents/planning.md").stderr, /is not one/);
  const accepted = harness(project, "update", "--target", project, "--accept-upstream", ".hai/Agents/onboarding.md");
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /--accept-upstream\): 1\n  - \.hai\/Agents\/onboarding\.md/);
  assert.equal(await fs.readFile(path.join(target, "Agents/onboarding.md"), "utf8"), await fs.readFile(path.join(projectRoot, "Agents/onboarding.md"), "utf8"));
  assert.equal(await fs.readFile(path.join(target, "Agents/claudia.md"), "utf8"), edited);
});

// Installs from before the worker role was split out hold the full role in augustus.md and julius.md
// and have no worker.md. A plain update brings them to the name files plus worker.md; no migration.
test("update turns a shipped pre-worker install into name files plus worker.md and keeps an edited one", async (t) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-worker-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const target = path.join(project, ".hai");
  assert.equal(harness(project, "init", "--target", project).status, 0);
  // The last committed versions before worker.md existed (HEAD while the split is uncommitted).
  const added = run("git", ["log", "--diff-filter=A", "--format=%H", "--", "Agents/worker.md"], projectRoot).stdout.trim().split("\n").pop();
  const before = added ? `${added}^` : "HEAD";
  const previous = (file) => {
    const shown = run("git", ["show", `${before}:${file}`], projectRoot);
    assert.equal(shown.status, 0, shown.stderr);
    return shown.stdout;
  };
  const oldAugustus = previous("Agents/augustus.md");
  const oldJulius = previous("Agents/julius.md");
  assert.match(oldAugustus, /## Working rules/, "the previous augustus.md held the whole role");
  assert.equal(run("git", ["cat-file", "-e", `${before}:Agents/worker.md`], projectRoot).status === 0, false);
  await fs.writeFile(path.join(target, "Agents/augustus.md"), oldAugustus);
  await fs.writeFile(path.join(target, "Agents/julius.md"), oldJulius);
  await fs.unlink(path.join(target, "Agents/worker.md"));
  const updated = harness(project, "update", "--target", project);
  assert.equal(updated.status, 0, updated.stderr);
  for (const file of ["Agents/augustus.md", "Agents/julius.md", "Agents/worker.md"]) {
    assert.equal(await fs.readFile(path.join(target, file), "utf8"), await fs.readFile(path.join(projectRoot, file), "utf8"), file);
  }
  assert.match(updated.stdout, /Updated: 2\n  - \.hai\/Agents\/augustus\.md\n  - \.hai\/Agents\/julius\.md/);
  assert.match(updated.stdout, /\.hai\/Agents\/worker\.md/);
  assert.doesNotMatch(updated.stdout, /Locally modified, kept/);
  const healthy = harness(project, "doctor", "--target", project);
  assert.equal(healthy.status, 0, healthy.stdout + healthy.stderr);

  // A project that filled the old Default Scope section edited a core file: update keeps it and says so.
  const filled = oldAugustus.replace(/(## Default Scope\n)<!--[^\n]*-->/, "$1Frontend first.");
  assert.notEqual(filled, oldAugustus);
  await fs.writeFile(path.join(target, "Agents/augustus.md"), filled);
  const kept = harness(project, "update", "--target", project);
  assert.equal(kept.status, 0, kept.stderr);
  assert.match(kept.stdout, /Locally modified, kept[^\n]*: 1\n  - \.hai\/Agents\/augustus\.md/);
  assert.equal(await fs.readFile(path.join(target, "Agents/augustus.md"), "utf8"), filled);
  assert.equal(await fs.readFile(path.join(target, "Agents/worker.md"), "utf8"), await fs.readFile(path.join(projectRoot, "Agents/worker.md"), "utf8"));
  assert.match(harness(project, "doctor", "--target", project).stdout, /Core files edited in this project[^\n]*\.hai\/Agents\/augustus\.md/);
});

test("update moves a root-layout install into .hai and reports what it cannot classify", async (t) => {
  const { repo } = await makeGitFixture(t);
  // A 0.2.x root install with a project's own customizations, as in the field.
  for (const dir of ["Agents", "Human"]) await fs.cp(path.join(projectRoot, dir), path.join(repo, dir), { recursive: true });
  await fs.rm(path.join(repo, "Agents/custom"), { recursive: true });
  await fs.writeFile(path.join(repo, "Agents/hai-harness.mjs"), await fs.readFile(cli));
  await fs.writeFile(path.join(repo, ".hai-harness.json"), JSON.stringify({ schemaVersion: 1, installedVersion: "0.2.4", channel: "stable", checkEnabled: false }));
  await fs.writeFile(path.join(repo, ".gitignore"), ".hai-harness.json\ncache/\n");
  await fs.mkdir(path.join(repo, ".hai"));
  await fs.writeFile(path.join(repo, ".hai/AGENTS.md"), await fs.readFile(path.join(projectRoot, "scaffold/AGENTS.md")));
  const own = "# Engram\n\nSend system and schema changes to Apollo.\nRun node Agents/hai-harness.mjs worktree create first.\n";
  await fs.writeFile(path.join(repo, "AGENTS.md"), own);
  await fs.appendFile(path.join(repo, "Agents/onboarding.md"), "- Apollo: system and schema architect.\n");
  await fs.writeFile(path.join(repo, "Agents/apollo.md"), "# Apollo\n");
  await fs.mkdir(path.join(repo, "Agents/skills/schema-check"));
  await fs.writeFile(path.join(repo, "Agents/skills/schema-check/SKILL.md"), "---\nname: schema-check\ndescription: Check schemas.\n---\n");
  await fs.writeFile(path.join(repo, "Agents/planning.md"), "Engram planning\n");
  await fs.writeFile(path.join(repo, "Human/decisions.md"), "Engram decisions\n");
  await fs.mkdir(path.join(repo, "Agents/cache"));
  await fs.writeFile(path.join(repo, "Agents/cache/ignored.txt"), "ignored\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Root-layout install");
  assert.equal(harness(repo, "worktree", "create", "peer", "--target", repo).status, 0);
  t.after(() => fs.rm(lanesOf(repo), { recursive: true, force: true }));

  assert.match(harness(repo, "doctor", "--target", repo).stdout, /old root layout[\s\S]*update --dry-run/);
  assert.match(harness(repo, "init", "--target", repo).stderr, /old root layout/);

  // The user runs the ordinary update; it performs the move.
  const before = git(repo, "status", "--porcelain", "--ignored");
  const preview = harness(repo, "update", "--dry-run", "--target", repo);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(git(repo, "status", "--porcelain", "--ignored"), before);
  for (const expected of [
    /Agents -> \.hai\/Agents/, /Human -> \.hai\/Human/, /\.hai-harness\.json -> \.hai\/\.hai-harness\.json/,
    /Locally modified, kept[^\n]*: 1\n  - \.hai\/Agents\/onboarding\.md/,
    /Retired[^\n]*: 1\n  - \.hai\/AGENTS\.md/,
    /custom role[^\n]*: 1\n  - \.hai\/Agents\/apollo\.md/,
    /Not shipped skills[^\n]*: 1\n  - \.hai\/Agents\/skills\/schema-check/,
    /Still say "node Agents[^\n]*: 1\n  - AGENTS\.md/,
    /Other open task lanes[^\n]*: 1\n  - task\/peer/,
    /AGENTS\.md: HAI-Harness block added at the end/
  ]) assert.match(preview.stdout, expected);

  await fs.writeFile(path.join(repo, "dirty.txt"), "uncommitted\n");
  assert.match(harness(repo, "update", "--target", repo).stderr, /needs a clean checkout/);
  await fs.unlink(path.join(repo, "dirty.txt"));

  const migrated = harness(repo, "update", "--target", repo);
  assert.equal(migrated.status, 0, migrated.stderr);
  assert.deepEqual((await fs.readdir(repo)).sort(), [".git", ".gitignore", ".hai", "AGENTS.md", "README.md"]);
  assert.equal(await fs.readFile(path.join(repo, ".hai/Agents/planning.md"), "utf8"), "Engram planning\n");
  assert.equal(await fs.readFile(path.join(repo, ".hai/Human/decisions.md"), "utf8"), "Engram decisions\n");
  assert.match(await fs.readFile(path.join(repo, ".hai/Agents/onboarding.md"), "utf8"), /Apollo: system and schema architect/);
  assert.equal(await fs.readFile(path.join(repo, ".hai/Agents/apollo.md"), "utf8"), "# Apollo\n");
  assert.ok(await fs.stat(path.join(repo, ".hai/Agents/skills/schema-check/SKILL.md")));
  assert.equal(await fs.readFile(path.join(repo, ".hai/Agents/cache/ignored.txt"), "utf8"), "ignored\n");
  assert.equal(JSON.parse(await fs.readFile(path.join(repo, ".hai/.hai-harness.json"), "utf8")).checkEnabled, false);
  assert.equal(await fs.stat(path.join(repo, ".hai/AGENTS.md")).catch(() => null), null);
  const entry = await fs.readFile(path.join(repo, "AGENTS.md"), "utf8");
  assert.ok(entry.startsWith(`${own}\n<!-- hai-harness:start default=own -->`));
  // Git sees the move as renames, so history follows.
  assert.match(git(repo, "status", "--porcelain"), /^R {2}Agents\/planning\.md -> \.hai\/Agents\/planning\.md$/m);
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Migrate harness");
  const again = harness(repo, "update", "--target", repo);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /HAI-Harness updated/);
  assert.equal(git(repo, "status", "--porcelain"), "");
  assert.match(harness(repo, "migrate", "--target", repo).stdout, /nothing to migrate/);
  const doctor = harness(repo, "doctor", "--target", repo).stdout;
  assert.match(doctor, /\.hai\/Agents\/apollo\.md is not a harness file/);
  assert.match(doctor, /\.hai\/Agents\/skills\/schema-check is not a shipped skill/);

  // An unedited old whole-file entry becomes just the block.
  const fresh = await makeGitFixture(t);
  await fs.cp(path.join(projectRoot, "Agents"), path.join(fresh.repo, "Agents"), { recursive: true });
  await fs.cp(path.join(projectRoot, "Human"), path.join(fresh.repo, "Human"), { recursive: true });
  const shippedEntry = run("git", ["show", "v0.2.4:scaffold/AGENTS.md"], projectRoot);
  if (shippedEntry.status === 0) {
    await fs.writeFile(path.join(fresh.repo, "AGENTS.md"), shippedEntry.stdout);
    git(fresh.repo, "add", "-A");
    git(fresh.repo, "commit", "-m", "Root-layout install");
    assert.equal(harness(fresh.repo, "update", "--target", fresh.repo).status, 0);
    assert.match(await fs.readFile(path.join(fresh.repo, "AGENTS.md"), "utf8"), /^<!-- hai-harness:start default=own -->\n[\s\S]*<!-- hai-harness:end -->\n$/);
  }
});

test("doctor validates custom roles and skills, and traces custom role docs", async (t) => {
  const { root, project, packet } = await makePacketFixture(t);
  const roles = path.join(root, "Agents/custom/roles");
  const skills = path.join(root, "Agents/custom/skills");
  const role = (fields) => `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join("\n")}\n---\n\n# Role\n`;
  await fs.writeFile(path.join(roles, "apollo.md"), role({ name: "Apollo", description: "Schema architect.", "route-when": "schema changes", writes: "code" }));
  await fs.writeFile(path.join(roles, "hermes.md"), role({ name: "Hermes", description: "Messenger.", writes: "everything" }));
  await fs.writeFile(path.join(roles, "claudia.md"), role({ name: "Claudia", description: "Impostor.", "route-when": "always", writes: "code" }));
  await fs.writeFile(path.join(roles, "worker.md"), role({ name: "Worker", description: "Impostor.", "route-when": "always", writes: "code" }));
  await fs.writeFile(path.join(roles, "zeus.md"), role({ name: "Jupiter", description: "Mismatch.", "route-when": "x", writes: "none" }));
  await fs.mkdir(path.join(skills, "release-notes"), { recursive: true });
  await fs.writeFile(path.join(skills, "release-notes/SKILL.md"), "---\nname: release-notes\ndescription: Draft release notes.\n---\n");
  await fs.mkdir(path.join(skills, "implement"));
  await fs.writeFile(path.join(skills, "implement/SKILL.md"), "---\nname: implement\ndescription: Shadow.\n---\n");
  await fs.mkdir(path.join(skills, "empty"));
  const report = harness(project, "doctor", "--target", project).stdout;
  assert.doesNotMatch(report, /apollo\.md/);
  assert.doesNotMatch(report, /release-notes/);
  assert.match(report, /hermes\.md is incomplete \(missing route-when; writes must be code, docs, none\)/);
  assert.match(report, /claudia\.md uses a built-in role name; agents ignore it/);
  // worker is now the shared worker role's name: say so, and how to get out.
  assert.match(report, /roles\/worker\.md is named worker, which is now the name of the role Augustus and Julius share, so agents ignore it\. Rename it\./);
  assert.doesNotMatch(report, /roles\/worker\.md[^\n]*--default-role/);
  const entry = path.join(project, "AGENTS.md");
  const entryBefore = await fs.readFile(entry, "utf8");
  assert.match(entryBefore, /<!-- hai-harness:start default=own -->/);
  // A block written by an older CLI may name it as the default; the warning then says how to move the default.
  await fs.writeFile(entry, entryBefore.replace("default=own", "default=worker"));
  const asDefault = harness(project, "doctor", "--target", project).stdout;
  assert.match(asDefault, /roles\/worker\.md is named worker[^\n]*Rename it; it is this project's default role, so then run "[^"]*update --default-role <new name>" \(or own, or claudia\)/);
  await fs.writeFile(entry, entryBefore);
  assert.match(report, /zeus\.md is incomplete \(file name must be the lowercase role name \(jupiter\.md\)\)/);
  assert.match(report, /custom\/skills\/implement uses a shipped skill name/);
  assert.match(report, /custom\/skills\/empty is incomplete \(missing SKILL\.md\)/);
  // Custom role docs are traced like built-in role docs.
  assert.match(report, /no new entry: Agents\/custom\/roles/);
  await appendTrail(packet, [trailEntry(1, "user", "process", "Agents/custom/roles Apollo, Hermes, Zeus")]);
  assert.equal(acknowledge(root, "T1").status, 0);
  assert.doesNotMatch(harness(project, "doctor", "--target", project).stdout, /no new entry/);
  // A packet from before custom roles were traced stays valid until a trace adopts the path.
  const file = path.join(packet, "packet.json");
  const baseline = JSON.parse(await fs.readFile(file, "utf8"));
  delete baseline.acknowledged.paths["Agents/custom/roles"];
  baseline.acknowledged.digest = createHash("sha256").update(JSON.stringify(baseline.acknowledged.paths)).digest("hex");
  await fs.writeFile(file, JSON.stringify(baseline));
  assert.equal(harness(root, "human-sync", "status", "--target", root).status, 0);
  assert.match(harness(project, "doctor", "--target", project).stdout, /no new entry: Agents\/custom\/roles/);
});

test("without a receipt a removed block stays removed, CRLF checkouts stay current, and a BOM keeps one block", async (t) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-review-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  assert.equal(harness(project, "init", "--target", project).status, 0);
  const entry = path.join(project, "AGENTS.md");
  const receipt = path.join(project, ".hai/.hai-harness.json");
  // A byte-order mark before the block is kept and does not hide the block.
  const withBom = `\uFEFF${await fs.readFile(entry, "utf8")}`;
  await fs.writeFile(entry, withBom);
  assert.match(harness(project, "update", "--target", project).stdout, /block already current/);
  assert.equal(harness(project, "init", "--target", project).status, 0);
  assert.equal(await fs.readFile(entry, "utf8"), withBom);
  // Core files checked out with CRLF line endings are the shipped version, not edits.
  const onboarding = path.join(project, ".hai/Agents/onboarding.md");
  const crlf = (await fs.readFile(onboarding, "utf8")).replaceAll("\n", "\r\n");
  await fs.writeFile(onboarding, crlf);
  // A fresh clone: receipts are often gitignored, and the project removed the block.
  await fs.unlink(receipt);
  await fs.writeFile(entry, "# Our rules\n");
  const updated = harness(project, "update", "--target", project);
  assert.equal(updated.status, 0, updated.stderr);
  assert.doesNotMatch(updated.stdout, /Locally modified/);
  assert.match(updated.stdout, /no HAI-Harness block, so it was left alone/);
  assert.equal(await fs.readFile(entry, "utf8"), "# Our rules\n");
  assert.equal(await fs.readFile(onboarding, "utf8"), crlf);
  assert.doesNotMatch(harness(project, "doctor", "--target", project).stdout, /Core files edited/);
});

test("migrate refuses to expose ignored files and resumes a move that stopped partway", async (t) => {
  const { repo } = await makeGitFixture(t);
  for (const dir of ["Agents", "Human"]) await fs.cp(path.join(projectRoot, dir), path.join(repo, dir), { recursive: true });
  await fs.rm(path.join(repo, "Agents/custom"), { recursive: true });
  await fs.mkdir(path.join(repo, "Human/private"));
  await fs.writeFile(path.join(repo, "Human/private/notes.md"), "private\n");
  await fs.writeFile(path.join(repo, ".gitignore"), "/Human/private/\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Root-layout install with private notes");
  const preview = harness(repo, "update", "--dry-run", "--target", repo);
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /Gitignored now but not after the move[^\n]*: 1\n {2}- \.hai\/Human\/private\//);
  const refused = harness(repo, "update", "--target", repo);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /would not be after the move[\s\S]*\.hai\/Human\/private\//);
  assert.ok(await fs.stat(path.join(repo, "Agents/onboarding.md")));
  assert.equal(await fs.stat(path.join(repo, ".hai")).catch(() => null), null);

  await fs.writeFile(path.join(repo, ".gitignore"), "/Human/private/\n/.hai/Human/private/\n");
  git(repo, "commit", "-am", "Keep private notes ignored after the move");
  // A move that stopped after Agents/ is not mistaken for a finished one.
  await fs.mkdir(path.join(repo, ".hai"));
  git(repo, "mv", "Agents", ".hai/Agents");
  git(repo, "commit", "-m", "Interrupted move");
  const stopped = harness(repo, "doctor", "--target", repo);
  assert.notEqual(stopped.status, 0);
  assert.match(stopped.stdout, /stopped partway/);
  const resumed = harness(repo, "update", "--target", repo);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.match(resumed.stdout, /Moved: 1\n {2}- Human -> \.hai\/Human/);
  assert.deepEqual((await fs.readdir(repo)).sort(), [".git", ".gitignore", ".hai", "AGENTS.md", "README.md"]);
  assert.equal(await fs.readFile(path.join(repo, ".hai/Human/private/notes.md"), "utf8"), "private\n");
  git(repo, "add", "-A");
  assert.doesNotMatch(git(repo, "status", "--porcelain"), /private/);
});

test("init never makes Claudia the default; she answers only when named or opted in", async (t) => {
  // A project with no AGENTS.md: init asks nothing, even unattended, and Claudia is not the default.
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-fresh-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const installed = run(process.execPath, [cli, "init", "--target", project], project);
  assert.equal(installed.status, 0, installed.stderr);
  assert.doesNotMatch(installed.stdout, /Should agents answer/);
  let content = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
  assert.match(content, /^<!-- hai-harness:start default=own -->[\s\S]*this block does not apply/);
  assert.match(content, /Otherwise no HAI role applies/);
  assert.doesNotMatch(content, /Otherwise you are Claudia/);
  assert.match(run(process.execPath, [cli, "init", "--dry-run", "--target", await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-dry-"))], project).stdout, /name no role go to no HAI role: this project's own instructions govern/);
  // A project with its own AGENTS.md gets the same default.
  const existing = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-own-"));
  t.after(() => fs.rm(existing, { recursive: true, force: true }));
  await fs.writeFile(path.join(existing, "AGENTS.md"), "# Our rules\n");
  assert.equal(run(process.execPath, [cli, "init", "--target", existing], existing).status, 0);
  assert.match(await fs.readFile(path.join(existing, "AGENTS.md"), "utf8"), /<!-- hai-harness:start default=own -->/);
  // Opting in is explicit.
  const optIn = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-claudia-"));
  t.after(() => fs.rm(optIn, { recursive: true, force: true }));
  assert.equal(run(process.execPath, [cli, "init", "--default-role", "claudia", "--target", optIn], optIn).status, 0);
  content = await fs.readFile(path.join(optIn, "AGENTS.md"), "utf8");
  assert.match(content, /^<!-- hai-harness:start default=claudia -->[\s\S]*Otherwise you are Claudia/);
});

test("the project sets who answers an unnamed message once, in the block marker", async (t) => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "hai-harness-default-"));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const entry = path.join(project, "AGENTS.md");
  const own = "# Engram\n\nOur workflow: plan in docs/, Apollo owns schemas.\n";
  await fs.writeFile(entry, own);
  // A project with its own AGENTS.md keeps its workflow: HAI applies only when a HAI role is named.
  const installed = harness(project, "init", "--target", project);
  assert.match(installed.stdout, /name no role go to no HAI role: this project's own instructions govern/);
  let content = await fs.readFile(entry, "utf8");
  assert.ok(content.startsWith(`${own}\n<!-- hai-harness:start default=own -->\n`));
  assert.match(content, /When it names none, this block does not apply: follow this project's own instructions outside it\./);
  assert.match(content, /Otherwise no HAI role applies; do not take one or ask the user to pick\./);
  assert.doesNotMatch(content, /Otherwise you are Claudia/);
  assert.match(harness(project, "doctor", "--target", project).stdout, /name no role go to no HAI role: this project's own instructions govern/);

  // Changing it once rewrites only the block; later updates keep the choice.
  assert.equal(harness(project, "update", "--target", project, "--default-role", "claudia").status, 0);
  content = await fs.readFile(entry, "utf8");
  assert.ok(content.startsWith(`${own}\n<!-- hai-harness:start default=claudia -->\n`));
  assert.match(content, /Otherwise you are Claudia, even for a plain coding request/);
  for (const [value, message] of [["augustus", /is not one/], ["worker", /is not one/], ["apollo", /add \.hai\/Agents\/custom\/roles\/apollo\.md first/], ["Bad Name", /is not one/]]) {
    const refused = harness(project, "update", "--target", project, "--default-role", value);
    assert.notEqual(refused.status, 0, value);
    assert.match(refused.stderr, message, value);
  }
  assert.equal(await fs.readFile(entry, "utf8"), content);
  await fs.writeFile(path.join(project, ".hai/Agents/custom/roles/apollo.md"), "---\nname: Apollo\ndescription: Schema architect.\nroute-when: schema changes\nwrites: code\n---\n");
  assert.equal(harness(project, "update", "--target", project, "--default-role", "apollo").status, 0);
  assert.equal(harness(project, "update", "--target", project).status, 0);
  content = await fs.readFile(entry, "utf8");
  assert.match(content, /<!-- hai-harness:start default=apollo -->/);
  assert.match(content, /Otherwise you are Apollo, this project's default role \(`\.hai\/Agents\/custom\/roles\/apollo\.md`\)/);
  await fs.rm(path.join(project, ".hai/Agents/custom/roles/apollo.md"));
  assert.match(harness(project, "doctor", "--target", project).stdout, /names apollo as the default role, but[^\n]*apollo\.md is missing/);

  // A marker written before defaults existed means Claudia.
  await fs.writeFile(entry, `${own}\n<!-- hai-harness:start -->\nold\n<!-- hai-harness:end -->\n`);
  assert.equal(harness(project, "update", "--target", project).status, 0);
  assert.match(await fs.readFile(entry, "utf8"), /<!-- hai-harness:start default=claudia -->[\s\S]*Otherwise you are Claudia/);

  // "none" is input only: it stores own, which every released CLI reads. A hand-written none marker reads as own too.
  assert.equal(harness(project, "update", "--target", project, "--default-role", "none").status, 0);
  const ownFile = await fs.readFile(entry, "utf8");
  assert.match(ownFile, /<!-- hai-harness:start default=own -->[\s\S]*Otherwise no HAI role applies/);
  await fs.writeFile(entry, ownFile.replace("default=own", "default=none"));
  assert.equal(harness(project, "update", "--target", project).status, 0);
  assert.equal(await fs.readFile(entry, "utf8"), ownFile);

  // own and none are reserved: role files with those names never become roles or the default.
  for (const name of ["own", "none"]) {
    await fs.writeFile(path.join(project, `.hai/Agents/custom/roles/${name}.md`), `---\nname: ${name}\ndescription: x\nroute-when: x\nwrites: code\n---\n`);
    assert.equal(harness(project, "update", "--target", project, "--default-role", name).status, 0);
    assert.doesNotMatch(await fs.readFile(entry, "utf8"), /Otherwise you are (Own|None)/);
  }
  const doctorOut = harness(project, "doctor", "--target", project).stdout;
  assert.match(doctorOut, /roles\/own\.md uses a reserved name/);
  assert.match(doctorOut, /roles\/none\.md uses a reserved name/);

  // An unknown value says what the choices are.
  const unknown = harness(project, "update", "--target", project, "--default-role", "nobody");
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /no custom role named nobody[\s\S]*own \(no default role[\s\S]*claudia/);
});

function trailEntry(id, origin, area, change = `change ${id}`) {
  return `### T${id}\n- Date: 2026-09-30\n- Change: ${change}\n- Why: reason ${id}\n- Origin: ${origin}\n- Area: ${area}\n`;
}

// Installs into the project root, so the harness and its packet scope are .hai/.
// `root` is the lane's harness folder; `project` is the lane itself.
async function makePacketFixture(t) {
  const { repo } = await makeGitFixture(t);
  assert.equal(harness(repo, "init", "--target", repo).status, 0);
  assert.equal(beacon(path.join(repo, ".hai"), "--disable").status, 0);
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Install harness");
  assert.equal(harness(repo, "worktree", "create", "capture", "--target", repo).status, 0);
  const lane = laneOf(repo, "capture");
  t.after(() => fs.rm(lanesOf(repo), { recursive: true, force: true }));
  const root = path.join(lane, ".hai");
  assert.equal(harness(root, "human-sync", "init", "--target", root).status, 0);
  const status = harness(root, "human-sync", "status", "--target", root);
  assert.equal(status.status, 0, status.stderr);
  return { repo, lane, root, project: lane, packet: JSON.parse(status.stdout).packet };
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
  assert.match(code.stdout, /^Next: nothing needs doing\.$/m);
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
  assert.match(kept.stdout, /^Warning: The trail heading "### malformed heading" has no number\. It is not acknowledged yet: number it by hand as T9, then run draft again\.$/m);
  assert.match(kept.stdout, /^Next: number the heading as the warning says, then record a draft for each entry, in order: .*human-sync draft --from T<n> --kind "<decision\|open-question\|brief\|reflection\|readme>" --text "<draft>"\. The cursor moves as drafts are recorded\.$/m);
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
  const other = laneOf(repo, "other");
  // A lane made by an older CLI has no packet: simulate one.
  await fs.rm(observed(other).packet, { recursive: true });
  assert.match(harness(other, "human-sync", "--target", other).stderr, /Missing task packet[\s\S]*note also creates it/);
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
  const { root, project, packet } = await makePacketFixture(t);
  assert.equal(await fs.stat(path.join(root, "Agents/decision-trail.md")).catch(() => null), null);
  await appendTrail(packet, [trailEntry(1, "user", "product")]);
  const before = await fs.readFile(path.join(packet, "decision-trail.md"), "utf8");
  assert.equal(harness(project, "update", "--target", project).status, 0);
  assert.equal(await fs.readFile(path.join(packet, "decision-trail.md"), "utf8"), before);
  assert.equal(await fs.stat(path.join(root, "Agents/human-inbox.md")).catch(() => null), null);
  // Simulate a pre-packet recognized lane without discarding populated files.
  await fs.rm(packet, { recursive: true });
  const trail = `# Trail\n\n## Entries\n${trailEntry(1, "user", "product")}`;
  const inbox = "Captured through: T1\n\n## Drafts\n### draft\n- Status: deferred\n";
  await fs.writeFile(path.join(root, "Agents/decision-trail.md"), trail);
  await fs.writeFile(path.join(root, "Agents/human-inbox.md"), inbox);
  assert.equal(harness(project, "update", "--target", project).status, 0);
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
  const { repo, lane, root, packet } = await makePacketFixture(t);
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

test("human-sync doctor and acknowledgment bind new traces to content, not commits", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const inbox = path.join(packet, "human-inbox.md");
  await fs.appendFile(inbox, "\n### draft\n  - Status: pending note\n### later\n- Status: deferred\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /1 pending and 1 deferred/);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  await fs.appendFile(path.join(root, "Agents/project_context.md"), "\nDirection.\n");
  const stale = observed(root);
  await appendTrail(packet, [trailEntry(1, "user", "process", "Agents/project_context.md direction")]);
  const drift = harness(root, "doctor", "--target", root).stdout;
  assert.match(drift, /no new entry: Agents\/project_context\.md\. Record why: .*human-sync note --change "[^"]*" --why "<reason>" --origin "<user\|agent>" --area "<product\|design\|process\|code>"$/m);
  await fs.appendFile(path.join(root, "Agents/project_context.md"), "\nMore direction.\n");
  assert.notEqual(acknowledge(root, "T1", stale).status, 0);
  assert.equal(acknowledge(root, "T1").status, 0);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  // Staging and committing the acknowledged content is not new drift.
  git(root, "add", "Agents/project_context.md");
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  git(root, "commit", "-m", "Commit direction");
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  await appendTrail(packet, [trailEntry(2, "user", "process", "unrelated choice")]);
  assert.equal(acknowledge(root, "T2").status, 0);
  await fs.appendFile(path.join(root, "Agents/project_context.md"), "\nNew direction.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/project_context\.md/);
  await appendTrail(packet, [trailEntry(3, "user", "process", "unrelated choice")]);
  assert.match(acknowledge(root, "T3").stderr, /name every changed traced path/);
  await appendTrail(packet, [trailEntry(4, "user", "process", "Agents/project_context.md new direction")]);
  assert.equal(acknowledge(root, "T4").status, 0);
  // The plan is not traced.
  await fs.appendFile(path.join(root, "Agents/planning.md"), "\nRecorded request.\n");
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  await fs.appendFile(path.join(root, "Agents/claudia.md"), "\nRole change.\n");
  git(root, "commit", "-am", "Role change");
  await fs.appendFile(path.join(packet, "decision-trail.md"), "\nUnrelated dirty trail.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/claudia\.md/);
});

test("Momus role tracing preserves pre-Momus packet baselines until explicit acknowledgment", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const file = path.join(packet, "packet.json");
  const baseline = JSON.parse(await fs.readFile(file, "utf8"));
  // The prior schemaVersion 1 baseline covers every old traced path, but not
  // Momus. Its original digest remains valid for exactly that old path set.
  delete baseline.acknowledged.paths["Agents/momus.md"];
  const signed = (value) => {
    value.acknowledged.digest = createHash("sha256").update(JSON.stringify(value.acknowledged.paths)).digest("hex");
    return `${JSON.stringify(value, null, 2)}\n`;
  };
  const oldBytes = signed(baseline);
  await fs.writeFile(file, oldBytes);
  const continued = harness(root, "human-sync", "status", "--target", root);
  assert.equal(continued.status, 0, continued.stderr);
  assert.equal(await fs.readFile(file, "utf8"), oldBytes);
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/momus\.md/);
  assert.equal(await fs.readFile(file, "utf8"), oldBytes);

  for (const corrupt of [
    (value) => { value.acknowledged.paths["Agents/momus.md"] = null; },
    (value) => { value.acknowledged.paths["Agents/momus.md"] = "bad hash"; },
    (value) => { delete value.acknowledged.paths["Agents/claudia.md"]; }
  ]) {
    const invalid = structuredClone(baseline);
    corrupt(invalid);
    await fs.writeFile(file, signed(invalid));
    assert.match(harness(root, "human-sync", "status", "--target", root).stderr, /Invalid task packet/);
  }
  // A matching digest must not make a present array into a valid path hash.
  // Cover both the newly traced role and a formerly mandatory path.
  for (const name of ["Agents/momus.md", "Agents/claudia.md"]) {
    await t.test(`${name} refuses a hash array with a matching digest`, async () => {
      const invalid = structuredClone(baseline);
      invalid.acknowledged.paths[name] = ["a".repeat(64)];
      const invalidBytes = signed(invalid);
      await fs.writeFile(file, invalidBytes);
      const refused = harness(root, "human-sync", "status", "--target", root);
      assert.notEqual(refused.status, 0, `${name} array must be refused`);
      assert.match(refused.stderr, /Invalid task packet/);
      assert.equal(await fs.readFile(file, "utf8"), invalidBytes, "refusal must preserve the malformed packet");
    });
  }
  const badDigest = structuredClone(baseline);
  badDigest.acknowledged.digest = "0".repeat(64);
  await fs.writeFile(file, JSON.stringify(badDigest));
  assert.match(harness(root, "human-sync", "status", "--target", root).stderr, /Invalid task packet/);
  await fs.writeFile(file, oldBytes);

  await appendTrail(packet, [trailEntry(1, "user", "process", "unrelated choice")]);
  assert.match(acknowledge(root, "T1").stderr, /name every changed traced path/);
  await appendTrail(packet, [trailEntry(2, "user", "process", "Agents/momus.md new stable role")]);
  assert.equal(acknowledge(root, "T2").status, 0);
  const adopted = JSON.parse(await fs.readFile(file, "utf8"));
  assert.match(adopted.acknowledged.paths["Agents/momus.md"], /^[0-9a-f]{64}$/);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  await fs.appendFile(path.join(root, "Agents/momus.md"), "\nScoped role change.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/momus\.md/);
  await appendTrail(packet, [trailEntry(3, "user", "process", "Agents/momus.md scoped role change")]);
  assert.equal(acknowledge(root, "T3").status, 0);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
});

test("worker role tracing keeps pre-worker packets readable and reports worker.md until acknowledged", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const file = path.join(packet, "packet.json");
  const baseline = JSON.parse(await fs.readFile(file, "utf8"));
  assert.match(baseline.acknowledged.paths["Agents/worker.md"], /^[0-9a-f]{64}$/, "new packets trace worker.md");
  // A packet created before worker.md was traced has no hash for it, and a digest over the old path set.
  delete baseline.acknowledged.paths["Agents/worker.md"];
  baseline.acknowledged.digest = createHash("sha256").update(JSON.stringify(baseline.acknowledged.paths)).digest("hex");
  const oldBytes = `${JSON.stringify(baseline, null, 2)}\n`;
  await fs.writeFile(file, oldBytes);
  const continued = harness(root, "human-sync", "status", "--target", root);
  assert.equal(continued.status, 0, continued.stderr);
  assert.equal(await fs.readFile(file, "utf8"), oldBytes);
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/worker\.md/);
  assert.equal(await fs.readFile(file, "utf8"), oldBytes);
  // A present but malformed hash is still refused.
  const invalid = structuredClone(baseline);
  invalid.acknowledged.paths["Agents/worker.md"] = "bad hash";
  invalid.acknowledged.digest = createHash("sha256").update(JSON.stringify(invalid.acknowledged.paths)).digest("hex");
  await fs.writeFile(file, JSON.stringify(invalid));
  assert.match(harness(root, "human-sync", "status", "--target", root).stderr, /Invalid task packet/);
  await fs.writeFile(file, oldBytes);
  // An ordinary trace entry adopts it.
  await appendTrail(packet, [trailEntry(1, "user", "process", "Agents/worker.md shared worker role")]);
  assert.equal(acknowledge(root, "T1").status, 0);
  assert.match(JSON.parse(await fs.readFile(file, "utf8")).acknowledged.paths["Agents/worker.md"], /^[0-9a-f]{64}$/);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
});

function note(root, ...args) {
  return harness(root, "human-sync", "note", "--target", root, ...args);
}

async function packetBytes(packet) {
  return Promise.all(["decision-trail.md", "human-inbox.md", "packet.json"].map((name) => fs.readFile(path.join(packet, name), "utf8")));
}

test("worktree create starts the lane's task packet at the harness scope, and init on it changes nothing", async (t) => {
  const { repo } = await makeInstalledProject(t);
  t.after(() => fs.rm(lanesOf(repo), { recursive: true, force: true }));
  const created = harness(repo, "worktree", "create", "fresh", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /^Task packet initialized: .*hai-harness\/tasks\/[0-9a-f]{64}$/m);
  const lane = laneOf(repo, "fresh");
  const state = observed(lane);
  assert.equal(state.identity.scope, ".hai");
  assert.doesNotMatch(harness(lane, "doctor", "--target", lane).stdout, /Missing task packet|no new entry/);
  const before = await packetBytes(state.packet);
  const again = harness(lane, "human-sync", "init", "--target", lane);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /Task packet already exists: .*Nothing changed/);
  assert.deepEqual(await packetBytes(state.packet), before);
  assert.match(harness(lane, "human-sync", "init", "--migrate", "--target", lane).stderr, /already exists; preserve it/);
  // An invalid packet still refuses init.
  const metadata = path.join(state.packet, "packet.json");
  await fs.writeFile(metadata, "{}\n");
  assert.match(harness(lane, "human-sync", "init", "--target", lane).stderr, /already exists; preserve it/);
  assert.equal(await fs.readFile(metadata, "utf8"), "{}\n");

  // A checkout without a harness gets a lane and one line saying there is no packet.
  const { repo: plain } = await makeGitFixture(t);
  t.after(() => fs.rm(lanesOf(plain), { recursive: true, force: true }));
  const bare = harness(plain, "worktree", "create", "bare", "--target", plain);
  assert.equal(bare.status, 0, bare.stderr);
  assert.match(bare.stdout, /^No task packet: .* has no Agents directory\.$/m);

  // A harness nested below the Git root keeps its nested scope in the lane.
  const nested = path.join(plain, "app");
  await fs.mkdir(nested);
  assert.equal(harness(plain, "init", "--target", nested).status, 0);
  assert.equal(beacon(path.join(nested, ".hai"), "--disable").status, 0);
  git(plain, "add", "-A");
  git(plain, "commit", "-m", "Install nested harness");
  assert.match(harness(plain, "worktree", "create", "nested", "--target", nested).stdout, /^Task packet initialized: /m);
  const nestedLane = path.join(laneOf(plain, "nested"), "app");
  assert.equal(observed(nestedLane).identity.scope, path.join("app", ".hai"));
});

test("worktree create keeps the lane but makes no packet when legacy trail files are present", async (t) => {
  const { repo } = await makeInstalledProject(t);
  t.after(() => fs.rm(lanesOf(repo), { recursive: true, force: true }));
  await fs.writeFile(path.join(repo, ".hai/Agents/decision-trail.md"), `# Trail\n\n## Entries\n${trailEntry(1, "user", "product")}`);
  await fs.writeFile(path.join(repo, ".hai/Agents/human-inbox.md"), "Captured through: none\n\n## Drafts\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Legacy trail");
  const created = harness(repo, "worktree", "create", "legacy", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  const lane = laneOf(repo, "legacy");
  assert.match(created.stdout, /^No task packet: legacy Agents\/decision-trail\.md or Agents\/human-inbox\.md is in the lane\. To adopt it: .*human-sync init --migrate --target .*legacy\/\.hai$/m);
  assert.match(harness(lane, "human-sync", "status", "--target", lane).stderr, /Missing task packet/);
  assert.match(note(lane, "--change", "x", "--why", "y", "--origin", "user", "--area", "process").stderr, /Legacy Agents storage exists\. Use ".*human-sync init --migrate/);
  assert.equal(harness(lane, "human-sync", "init", "--migrate", "--target", lane).status, 0);
});

test("human-sync note appends a numbered entry and acknowledges the traced state in one step", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await fs.appendFile(path.join(root, "Agents/design.md"), "\nToken.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/design\.md/);
  const recorded = note(root, "--change", " Agents/design.md: accent token ", "--why", "The user picked teal", "--origin", "user", "--area", "design");
  assert.equal(recorded.status, 0, recorded.stderr);
  assert.match(recorded.stdout, /^Recorded T1; acknowledged Agents\/design\.md\.\nAt closeout it becomes a decision draft for the user's log\. No Human item was approved\.\n$/);
  const trail = await fs.readFile(path.join(packet, "decision-trail.md"), "utf8");
  assert.match(trail, /## Entries\n\n### T1\n- Date: \d{4}-\d{2}-\d{2}\n- Change: Agents\/design\.md: accent token\n- Why: The user picked teal\n- Origin: user\n- Area: design\n$/);
  const saved = JSON.parse(await fs.readFile(path.join(packet, "packet.json"), "utf8"));
  assert.equal(saved.acknowledged.through, "T1");
  assert.equal(saved.acknowledged.basis, "content");
  assert.equal(saved.trail, trail);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  assert.match(harness(root, "human-sync", "--target", root).stdout, /^T1 · decision · user\/design/m);
  // A plan edit alone is not drift, and a note with no traced change records a decision.
  await fs.appendFile(path.join(root, "Agents/planning.md"), "\nRecorded request.\n");
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  const assumed = note(root, "--change", "Chose weekly digests", "--why", "Not specified", "--origin", "agent", "--area", "product");
  assert.equal(assumed.status, 0, assumed.stderr);
  assert.match(assumed.stdout, /^Recorded T2; no traced file changed\.\nAt closeout it becomes an open question for the user/);
  const code = note(root, "--change", "Refactored the parser", "--why", "Clarity", "--origin", "agent", "--area", "code");
  assert.match(code.stdout, /Recorded T3[\s\S]*It stays in the trail only\. No Human item was approved\./);
  const applied = note(root, "--change", "Reflected the approved brief", "--why", "Closeout", "--origin", "user", "--area", "process", "--applies", "approved brief draft");
  assert.match(applied.stdout, /Recorded T4[\s\S]*closeout drafts nothing/);
  assert.match(await fs.readFile(path.join(packet, "decision-trail.md"), "utf8"), /### T4\n[\s\S]*- Area: process\n- Applies: approved brief draft\n$/);
  const capture = harness(root, "human-sync", "--target", root).stdout;
  assert.match(capture, /2 of 4 new trail entries/);
  assert.match(capture, /^T2 · open question/m);
  assert.doesNotMatch(capture, /^T3 ·|^T4 ·/m);
  // Content basis: committing a noted edit is not drift; a new edit is.
  await fs.appendFile(path.join(root, "Agents/project_context.md"), "\nAudience.\n");
  assert.equal(note(root, "--change", "Agents/project_context.md audience", "--why", "User said so", "--origin", "user", "--area", "product").status, 0);
  git(root, "add", "-A");
  git(root, "commit", "-m", "Context");
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
  assert.equal(note(root, "--change", "Unrelated decision", "--why", "Kept lane", "--origin", "user", "--area", "process").status, 0);
  await fs.appendFile(path.join(root, "Agents/project_context.md"), "\nMore.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/project_context\.md/);
});

test("human-sync note refuses bad input and unnamed changes without writing anything", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await fs.appendFile(path.join(root, "Agents/claudia.md"), "\nRole change.\n");
  const before = await packetBytes(packet);
  const valid = ["--why", "reason", "--origin", "user", "--area", "process"];
  const unnamed = note(root, "--change", "Something else", ...valid);
  assert.notEqual(unnamed.status, 0);
  assert.match(unnamed.stderr, /missing: Agents\/claudia\.md\. Nothing was written\. Name them in --change if this note covers them; if someone else changed them, that writer records their note first\./);
  for (const [args, pattern] of [
    [["--change", "Agents/claudia.md", "--why", "r", "--origin", "boss", "--area", "process"], /--origin must be user or agent/],
    [["--change", "Agents/claudia.md", "--why", "r", "--origin", "user", "--area", "ops"], /--area must be one of product, design, process, code/],
    [["--change", "Agents/claudia.md", "--why", "   ", "--origin", "user", "--area", "process"], /--why must not be empty/],
    [["--change", "Agents/claudia.md", "--why", "line one\nline two", "--origin", "user", "--area", "process"], /--why must be a single line/],
    [["--change", "Agents/claudia.md", "--why", "r", "--origin", "user", "--area", "process", "--applies", "a\r\nb"], /--applies must be a single line/],
    [["--change", "Agents/claudia.md", "--origin", "user", "--area", "process"], /requires --why/],
    [["--change", "Agents/claudia.md <!-- aside", ...valid], /--change must not contain "<!--"; write it in words/],
    [["--change", "Agents/claudia.md", ...valid, "--through", "T1"], /require acknowledge/]
  ]) {
    const refused = note(root, ...args);
    assert.notEqual(refused.status, 0, args.join(" "));
    assert.match(refused.stderr, pattern);
    assert.deepEqual(await packetBytes(packet), before);
  }
  for (const action of ["status", "acknowledge", "init", "capture", "checkpoint"]) {
    assert.match(harness(root, "human-sync", action, "--target", root, "--change", "x").stderr, /require note/);
  }
  // An edited acknowledged prefix refuses too.
  assert.equal(note(root, "--change", "Agents/claudia.md role", ...valid).status, 0);
  const trailFile = path.join(packet, "decision-trail.md");
  await fs.writeFile(trailFile, (await fs.readFile(trailFile, "utf8")).replace("- Why: reason", "- Why: rewritten"));
  const edited = await packetBytes(packet);
  assert.match(note(root, "--change", "later", ...valid).stderr, /earlier entries were edited\. Nothing was written/);
  assert.deepEqual(await packetBytes(packet), edited);
  assert.match(harness(root, "help").stdout, /human-sync +\[capture\|status\|init\|note\|[\s\S]*note --change <text> --why <text>/);
});

test("human-sync note numbers after hand-appended entries and gaps, with or without a final newline", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const valid = ["--why", "reason", "--origin", "agent", "--area", "code"];
  await appendTrail(packet, [trailEntry(1, "agent", "code"), trailEntry(5, "agent", "code")]);
  assert.match(note(root, "--change", "next", ...valid).stdout, /^Recorded T6;/);
  const trailFile = path.join(packet, "decision-trail.md");
  await fs.writeFile(trailFile, `${(await fs.readFile(trailFile, "utf8"))}\n${trailEntry(9, "agent", "code").trimEnd()}`);
  assert.match(note(root, "--change", "after a trail with no final newline", ...valid).stdout, /^Recorded T10;/);
  const trail = await fs.readFile(trailFile, "utf8");
  assert.match(trail, /- Area: code\n\n### T10\n- Date:/);
  const capture = harness(root, "human-sync", "--target", root);
  assert.match(capture.stdout, /5 new trail entries were agent-origin code changes/);
  assert.match(capture.stdout, /^Next: nothing needs doing\.$/m);
});

test("comment markers cannot hide entries, and the trail is replaced atomically", async (t) => {
  const { repo, root, packet } = await makePacketFixture(t);
  const trailFile = path.join(packet, "decision-trail.md");
  const inboxFile = path.join(packet, "human-inbox.md");
  // A leftover temporary file from a crashed note is ignored.
  await fs.writeFile(`${trailFile}.99999.1.tmp`, "partial");
  const mode = (await fs.stat(trailFile)).mode & 0o777;
  const valid = ["--why", "reason", "--origin", "user", "--area", "product"];
  assert.equal(note(root, "--change", "First decision", ...valid).status, 0);
  assert.equal((await fs.stat(trailFile)).mode & 0o777, mode);
  assert.deepEqual((await fs.readdir(packet)).filter((name) => name.endsWith(".tmp")), ["decision-trail.md.99999.1.tmp"]);
  for (const value of ["Arrow --> in prose", "a <!-- b"]) {
    const marker = value.includes("-->") ? "-->" : "<!--";
    assert.match(note(root, "--change", value, ...valid).stderr, new RegExp(`--change must not contain "${marker}"; write it in words`));
    assert.match(draft(root, "--from", "T1", "--kind", "decision", "--text", value).stderr, new RegExp(`--text must not contain "${marker}"`));
  }
  // An opener left by hand: note and draft refuse to append after it, and cleanup refuses.
  await fs.appendFile(trailFile, "\n<!-- unfinished aside\n");
  const opened = await packetBytes(packet);
  assert.match(note(root, "--change", "Second decision", ...valid).stderr, /decision-trail\.md has an unclosed "<!--"\. Nothing was written/);
  assert.match(draft(root, "--from", "T1", "--kind", "decision", "--text", "x").stderr, /decision-trail\.md has an unclosed "<!--"/);
  assert.deepEqual(await packetBytes(packet), opened);
  await setCaptureCursor(packet, "T1");
  const trailRefused = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.notEqual(trailRefused.status, 0);
  assert.match(trailRefused.stdout, /Task packet decision-trail\.md has an unclosed "<!--"; needs review/);
  await fs.writeFile(trailFile, opened[0].replace("\n<!-- unfinished aside\n", ""));
  await fs.appendFile(inboxFile, "\n<!-- unfinished inbox aside\n");
  assert.match(draft(root, "--from", "T1", "--kind", "brief", "--text", "x").stderr, /human-inbox\.md has an unclosed "<!--"/);
  const inboxRefused = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.notEqual(inboxRefused.status, 0);
  assert.match(inboxRefused.stdout, /Task packet human-inbox\.md has an unclosed "<!--"; needs review/);
});

test("a trail numbered out of file order or with a duplicate never lets the cursor or cleanup pass an undrafted entry", async (t) => {
  const { repo, root, packet } = await makePacketFixture(t);
  const trailFile = path.join(packet, "decision-trail.md");
  const template = await fs.readFile(trailFile, "utf8");
  for (const [entries, offender, cursor, next] of [
    [[trailEntry(1, "user", "product"), trailEntry(3, "user", "product"), trailEntry(2, "user", "product")], "### T2", "T3", "T4"],
    [[trailEntry(1, "user", "product"), trailEntry(2, "user", "product"), trailEntry(2, "user", "process")], "### T2", "T2", "T3"]
  ]) {
    await fs.writeFile(trailFile, `${template}\n${entries.join("\n")}`);
    await setCaptureCursor(packet, "none");
    const before = await packetBytes(packet);
    for (const from of ["T1", "T3", "T2"]) {
      const refused = draft(root, "--from", from, "--kind", "decision", "--text", "x");
      assert.notEqual(refused.status, 0);
      assert.match(refused.stderr, new RegExp(`The trail heading "${offender}" is out of order or duplicated\\. It is not acknowledged yet: number it by hand as ${next}, then run draft again\\. Nothing was written\\.`));
      assert.deepEqual(await packetBytes(packet), before);
    }
    assert.match(harness(root, "human-sync", "--target", root).stdout, /^Warning: The trail heading "### T2" is out of order or duplicated\./m);
    assert.deepEqual(await packetBytes(packet), before);
    // The same state with the cursor set by hand: cleanup refuses instead of passing T2.
    await setCaptureCursor(packet, cursor);
    const cleanup = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
    assert.notEqual(cleanup.status, 0, cleanup.stdout);
    assert.match(cleanup.stdout, /Task packet trail entries are out of order or duplicated; needs review/);
  }
});

test("note refuses an unnumbered heading that is not yet acknowledged; one inside the acknowledged trail sends capture to the manual form", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  const trailFile = path.join(packet, "decision-trail.md");
  const valid = ["--why", "reason", "--origin", "user", "--area", "product"];
  assert.equal(note(root, "--change", "First", ...valid).status, 0);
  await fs.appendFile(trailFile, "\n### a decision written by hand\n- Origin: user\n");
  const before = await packetBytes(packet);
  assert.match(note(root, "--change", "Second", ...valid).stderr, /The trail heading "### a decision written by hand" has no number\. It is not acknowledged yet: number it by hand as T2, then run note again\. Nothing was written\./);
  assert.deepEqual(await packetBytes(packet), before);
  await fs.writeFile(trailFile, before[0].replace("### a decision written by hand", "### T2"));
  assert.match(note(root, "--change", "Second", ...valid).stdout, /^Recorded T3;/);
  // An older lane whose acknowledged trail already holds an unnumbered heading: note still works.
  const file = path.join(packet, "packet.json");
  const saved = JSON.parse(await fs.readFile(file, "utf8"));
  const legacyTrail = `${await fs.readFile(trailFile, "utf8")}\n### unnumbered older entry\n- Origin: user\n`;
  await fs.writeFile(trailFile, legacyTrail);
  await fs.writeFile(file, `${JSON.stringify({ ...saved, trail: legacyTrail }, null, 2)}\n`);
  assert.match(note(root, "--change", "Third", ...valid).stdout, /^Recorded T4;/);
  const refused = draft(root, "--from", "T1", "--kind", "decision", "--text", "x");
  assert.match(refused.stderr, /The trail heading "### unnumbered older entry" has no number, inside the acknowledged trail\. The commands only work on a trail numbered in order, so capture for this lane is done by hand \(the manual form\)\. Nothing was written\./);
  assert.match(harness(root, "human-sync", "--target", root).stdout, /^Next: capture this lane by hand \(the manual form\)/m);
});

test("draft changes only the cursor line, refuses a resolved source, and gives each planning item its own draft", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await appendTrail(packet, [trailEntry(1, "user", "product")]);
  const before = await readInbox(packet);
  assert.match(before, /^Captured through: none\n\n/m);
  assert.equal(draft(root, "--from", "T1", "--kind", "decision", "--text", "one").status, 0);
  const after = await readInbox(packet);
  assert.ok(after.startsWith(before.replace("Captured through: none\n", "Captured through: T1\n")), after);
  assert.equal(resolve(root, "--from", "T1", "--kind", "decision", "--as", "approved").status, 0);
  assert.match(draft(root, "--from", "T1", "--kind", "decision", "--text", "again").stderr, /The decision draft from T1 was already resolved as approved\. Nothing was written\. If something changed, record a new note and draft that\./);
  assert.equal(draft(root, "--from", "T1", "--kind", "brief", "--text", "story").status, 0);
  for (const n of [1, 2]) assert.equal(draft(root, "--from", `planning#${n}`, "--kind", "open-question", "--text", `item ${n}`).status, 0);
  assert.match(await readInbox(packet), /### open question · from planning\.md#1\n[\s\S]*### open question · from planning\.md#2\n/);
  assert.match(draft(root, "--from", "planning#2", "--kind", "open-question", "--text", "dup").stderr, /already in the inbox/);
  assert.match(draft(root, "--from", "planning#0", "--kind", "open-question", "--text", "x").stderr, /--from must be T<n>, planning or planning#<n>/);
  assert.equal(resolve(root, "--from", "planning#2", "--kind", "open-question", "--as", "dropped").status, 0);
  assert.doesNotMatch(await readInbox(packet), /planning\.md#2/);
  // Planning sources may be drafted again after they are resolved.
  assert.equal(draft(root, "--from", "planning#2", "--kind", "open-question", "--text", "item 2 again").status, 0);
  assert.equal(resolve(root, "--from", "planning#1", "--kind", "open-question", "--as", "deferred").status, 0);
  assert.match(await readInbox(packet), /### open question · from planning\.md#1\n- Status: deferred\n/);
});

test("human-sync note creates the packet in a lane made by an older CLI", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await fs.rm(packet, { recursive: true });
  const recorded = note(root, "--change", "First decision", "--why", "reason", "--origin", "user", "--area", "product");
  assert.equal(recorded.status, 0, recorded.stderr);
  assert.match(recorded.stdout, /^Task packet initialized \(this lane had none\): .*\nRecorded T1; no traced file changed\./);
  assert.equal(JSON.parse(await fs.readFile(path.join(packet, "packet.json"), "utf8")).acknowledged.through, "T1");
  // A partial packet still refuses.
  await fs.rm(path.join(packet, "packet.json"));
  assert.match(note(root, "--change", "x", "--why", "y", "--origin", "user", "--area", "product").stderr, /Missing task packet/);
});

// The drift basis before content-only snapshots: last touching commit, index entry and files.
async function legacyPathHash(lane, scope, name) {
  const gitPath = `${scope}/${name}`;
  const commit = run("git", ["log", "-1", "--format=%H", "--", gitPath], lane).stdout.trim();
  const index = git(lane, "ls-files", "--stage", "--", gitPath);
  const files = [];
  const root = path.join(lane, scope);
  async function visit(relative) {
    const absolute = path.join(root, relative);
    const stat = await fs.lstat(absolute).catch(() => null);
    if (!stat) { files.push([relative, "missing"]); return; }
    if (stat.isSymbolicLink()) { files.push([relative, "symlink", await fs.readlink(absolute)]); return; }
    if (stat.isDirectory()) {
      files.push([relative, "directory"]);
      for (const child of (await fs.readdir(absolute)).sort()) await visit(`${relative}/${child}`);
    } else files.push([relative, stat.mode & 0o777, createHash("sha256").update(await fs.readFile(absolute)).digest("hex")]);
  }
  await visit(name);
  return createHash("sha256").update(JSON.stringify({ commit, index, files })).digest("hex");
}

test("a packet acknowledged under the old basis stays readable and adopts the content basis at its next note", async (t) => {
  const { lane, root, packet } = await makePacketFixture(t);
  const file = path.join(packet, "packet.json");
  const current = JSON.parse(await fs.readFile(file, "utf8"));
  const names = ["Agents/planning.md", ...Object.keys(current.acknowledged.paths)];
  const paths = {};
  for (const name of names) paths[name] = await legacyPathHash(lane, ".hai", name);
  const { basis, ...rest } = current.acknowledged;
  assert.equal(basis, "content");
  const old = { ...current, acknowledged: { ...rest, paths, digest: createHash("sha256").update(JSON.stringify(paths)).digest("hex") } };
  const oldBytes = `${JSON.stringify(old, null, 2)}\n`;
  await fs.writeFile(file, oldBytes);
  assert.equal(harness(root, "human-sync", "status", "--target", root).status, 0);
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry|Invalid task packet/);
  await fs.appendFile(path.join(root, "Agents/planning.md"), "\nRecorded request.\n");
  await fs.appendFile(path.join(root, "Agents/athena.md"), "\nRole change.\n");
  assert.match(harness(root, "doctor", "--target", root).stdout, /no new entry: Agents\/athena\.md\. /);
  assert.equal(await fs.readFile(file, "utf8"), oldBytes);
  // An unknown basis is refused.
  await fs.writeFile(file, JSON.stringify({ ...old, acknowledged: { ...old.acknowledged, basis: "commits" } }));
  assert.match(harness(root, "human-sync", "status", "--target", root).stderr, /Invalid task packet/);
  await fs.writeFile(file, oldBytes);
  assert.equal(note(root, "--change", "Agents/athena.md role", "--why", "reason", "--origin", "user", "--area", "process").status, 0);
  const adopted = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(adopted.acknowledged.basis, "content");
  assert.equal(Object.hasOwn(adopted.acknowledged.paths, "Agents/planning.md"), false);
  git(root, "add", "-A");
  git(root, "commit", "-m", "Role");
  assert.doesNotMatch(harness(root, "doctor", "--target", root).stdout, /no new entry/);
});

function draft(root, ...args) {
  return harness(root, "human-sync", "draft", "--target", root, ...args);
}

function resolve(root, ...args) {
  return harness(root, "human-sync", "resolve", "--target", root, ...args);
}

async function readInbox(packet) {
  return fs.readFile(path.join(packet, "human-inbox.md"), "utf8");
}

test("human-sync draft writes a pending draft per kind, moves the cursor past dropped entries, and keeps cleanup's refusal", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t);
  await appendTrail(packet, [trailEntry(1, "agent", "code"), trailEntry(2, "user", "product")]);
  const capture = harness(root, "human-sync", "--target", root);
  assert.match(capture.stdout, /^Next: record a draft for each entry, in order: /m);
  const first = draft(root, "--from", "T2", "--kind", "decision", "--text", " Weekly digests by default ");
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, "Drafted decision from T2 for Human/decisions.md. Captured through: T2. Nothing was written to Human/.\n");
  const inbox = await readInbox(packet);
  assert.match(inbox, /^Captured through: T2$/m);
  assert.match(inbox, /## Drafts\n\n### decision · from T2\n- Status: pending\n- Target: Human\/decisions\.md\n- Draft: Weekly digests by default\n$/);
  assert.match(harness(root, "human-sync", "--target", root).stdout, /no new trail entries after T2/);
  assert.match(harness(root, "doctor", "--target", root).stdout, /1 pending and 0 deferred/);
  for (const [kind, heading, target] of [["open-question", "open question", "Human/open_questions.md"], ["brief", "brief", "Human/brief.md"], ["reflection", "reflection", "Human/reflections.md"], ["readme", "readme", "README.md"]]) {
    const made = draft(root, "--from", "T2", "--kind", kind, "--text", `${kind} text`);
    assert.equal(made.status, 0, made.stderr);
    assert.match(await readInbox(packet), new RegExp(`### ${heading} · from T2\\n- Status: pending\\n- Target: ${target.replace(".", "\\.")}\\n- Draft: ${kind} text\\n`));
  }
  // A planning item becomes a draft and leaves the cursor where the rule puts it.
  const planning = draft(root, "--from", "planning", "--kind", "open-question", "--text", "Which plan?");
  assert.equal(planning.status, 0, planning.stderr);
  assert.match(await readInbox(packet), /### open question · from planning\.md\n- Status: pending\n/);
  assert.match(planning.stdout, /Captured through: T2\./);
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  const approved = harness(lane, "worktree", "approve", "--approved", "Draft fixture", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /6 pending/);
  assert.ok(await fs.stat(lane));
  assert.notEqual(harness(repo, "worktree", "cleanup", "task/capture", "--target", repo).status, 0);
});

test("human-sync draft refuses out-of-order, duplicate and invalid drafts without writing", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await appendTrail(packet, [trailEntry(1, "user", "product"), trailEntry(2, "agent", "design")]);
  const before = await packetBytes(packet);
  for (const [args, pattern] of [
    [["--from", "T2", "--kind", "open-question", "--text", "x"], /T1 comes before T2 and has no draft yet; draft T1 first\. Nothing was written\./],
    [["--from", "T9", "--kind", "decision", "--text", "x"], /T9 is not a numbered entry in the trail/],
    [["--from", "T1", "--kind", "verdict", "--text", "x"], /--kind must be one of decision, open-question, brief, reflection, readme/],
    [["--from", "1", "--kind", "decision", "--text", "x"], /--from must be T<n>, planning or planning#<n>/],
    [["--from", "T1", "--kind", "decision", "--text", "a\nb"], /--text must be a single line/],
    [["--from", "T1", "--kind", "decision", "--text", "a <!-- b"], /--text must not contain "<!--"; write it in words/],
    [["--from", "T1", "--kind", "decision"], /requires --text/],
    [["--from", "T1", "--kind", "decision", "--text", "x", "--as", "approved"], /--as requires resolve/]
  ]) {
    const refused = draft(root, ...args);
    assert.notEqual(refused.status, 0, args.join(" "));
    assert.match(refused.stderr, pattern);
    assert.deepEqual(await packetBytes(packet), before);
  }
  for (const action of ["status", "note", "acknowledge", "capture", "init", "checkpoint"]) {
    assert.match(harness(root, "human-sync", action, "--target", root, "--from", "T1").stderr, /require draft or resolve/);
  }
  assert.equal(draft(root, "--from", "T1", "--kind", "decision", "--text", "x").status, 0);
  const once = await packetBytes(packet);
  assert.match(draft(root, "--from", "T1", "--kind", "decision", "--text", "y").stderr, /A decision draft from T1 is already in the inbox/);
  assert.deepEqual(await packetBytes(packet), once);
  // A heading with no number after the cursor blocks a later draft.
  assert.equal(draft(root, "--from", "T2", "--kind", "open-question", "--text", "x").status, 0);
  await appendTrail(packet, ["### unnumbered\n- Origin: user\n", trailEntry(3, "user", "process")]);
  const blocked = await packetBytes(packet);
  assert.match(draft(root, "--from", "T3", "--kind", "decision", "--text", "x").stderr, /The trail heading "### unnumbered" has no number\. It is not acknowledged yet: number it by hand as T4, then run draft again\. Nothing was written\./);
  assert.deepEqual(await packetBytes(packet), blocked);
});

test("human-sync resolve records the user's answer for one draft and never writes Human/", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await appendTrail(packet, [trailEntry(1, "user", "product"), trailEntry(2, "user", "design"), trailEntry(3, "agent", "process")]);
  assert.equal(draft(root, "--from", "T1", "--kind", "decision", "--text", "one").status, 0);
  assert.equal(draft(root, "--from", "T2", "--kind", "decision", "--text", "two").status, 0);
  assert.equal(draft(root, "--from", "T3", "--kind", "open-question", "--text", "three").status, 0);
  const humanBefore = await fs.readFile(path.join(root, "Human/decisions.md"), "utf8");
  const before = await packetBytes(packet);
  for (const [args, pattern] of [
    [["--from", "T9", "--kind", "decision", "--as", "approved"], /No decision draft from T9 is in the inbox\. Nothing was written\./],
    [["--from", "T1", "--kind", "decision", "--as", "dropped", "--text", "edit"], /--text is allowed only with --as approved/],
    [["--from", "T1", "--kind", "decision", "--as", "kept"], /--as must be approved, dropped or deferred/],
    [["--from", "T1", "--kind", "decision"], /requires --as/]
  ]) {
    const refused = resolve(root, ...args);
    assert.notEqual(refused.status, 0, args.join(" "));
    assert.match(refused.stderr, pattern);
    assert.deepEqual(await packetBytes(packet), before);
  }
  const approved = resolve(root, "--from", "T2", "--kind", "decision", "--as", "approved", "--text", "two, as the user edited it");
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /^Resolved the decision draft from T2\. Recorded as approved\. This command wrote nothing to Human\/; the entry belongs in Human\/decisions\.md in this lane before the merge\.$/m);
  let inbox = await readInbox(packet);
  assert.doesNotMatch(inbox, /from T2/);
  assert.match(inbox, /### decision · from T1\n- Status: pending\n- Target: Human\/decisions\.md\n- Draft: one\n\n### open question · from T3\n/);
  assert.match(inbox, /^Captured through: T3$/m);
  assert.match(resolve(root, "--from", "T1", "--kind", "decision", "--as", "dropped").stdout, /Dropped: the draft left the inbox; its trail entry remains\./);
  assert.match(resolve(root, "--from", "T3", "--kind", "open-question", "--as", "deferred").stdout, /Deferred: it stays in the inbox/);
  inbox = await readInbox(packet);
  assert.match(inbox, /## Drafts\n\n### open question · from T3\n- Status: deferred\n- Target: Human\/open_questions\.md\n- Draft: three\n$/);
  assert.match(harness(root, "doctor", "--target", root).stdout, /0 pending and 1 deferred/);
  const records = JSON.parse(await fs.readFile(path.join(packet, "packet.json"), "utf8")).resolved;
  assert.deepEqual(records.map(({ recordedAt, ...rest }) => (assert.match(recordedAt, /^\d{4}-/), rest)), [
    { source: "T2", kind: "decision", outcome: "approved", draft: "two", text: "two, as the user edited it" },
    { source: "T1", kind: "decision", outcome: "dropped", draft: "one" },
    { source: "T3", kind: "open question", outcome: "deferred", draft: "three" }
  ]);
  assert.equal(harness(root, "human-sync", "status", "--target", root).status, 0);
  assert.equal(await fs.readFile(path.join(root, "Human/decisions.md"), "utf8"), humanBefore);
  // Capture stays byte-for-byte read-only.
  const quiet = await packetBytes(packet);
  assert.equal(harness(root, "human-sync", "--target", root).status, 0);
  assert.deepEqual(await packetBytes(packet), quiet);
});

test("closeout needs no hand edit: note, draft, resolve, then cleanup removes the lane", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t);
  assert.equal(note(root, "--change", "Weekly digests", "--why", "The user asked", "--origin", "user", "--area", "product").status, 0);
  assert.equal(draft(root, "--from", "T1", "--kind", "decision", "--text", "Digests are weekly").status, 0);
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  const approved = harness(lane, "worktree", "approve", "--approved", "Closeout fixture", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.ok(await fs.stat(lane));
  assert.equal(resolve(root, "--from", "T1", "--kind", "decision", "--as", "approved").status, 0);
  const cleaned = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout + cleaned.stderr);
  assert.match(cleaned.stdout, /Task packet retained: /);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  assert.ok(await fs.stat(path.join(packet, "packet.json")));
});

test("hand-written and command-written drafts mix", async (t) => {
  const { root, packet } = await makePacketFixture(t);
  await appendTrail(packet, [trailEntry(1, "user", "product"), trailEntry(2, "user", "process")]);
  const inboxFile = path.join(packet, "human-inbox.md");
  await fs.appendFile(inboxFile, "\n### decision · from T1\n- Status: pending\n- Target: Human/decisions.md\n- Draft: by hand\n");
  // The hand draft counts for order and cursor.
  const made = draft(root, "--from", "T2", "--kind", "decision", "--text", "by command");
  assert.equal(made.status, 0, made.stderr);
  assert.match(made.stdout, /Captured through: T2\./);
  assert.equal(resolve(root, "--from", "T1", "--kind", "decision", "--as", "approved").status, 0);
  // Remove the command-written draft by hand; every command still reads the inbox.
  await fs.writeFile(inboxFile, (await fs.readFile(inboxFile, "utf8")).replace(/\n### decision · from T2\n[\s\S]*$/, "\n"));
  assert.equal(harness(root, "human-sync", "--target", root).status, 0);
  assert.match(harness(root, "doctor", "--target", root).stdout, /looks installed/);
  assert.match(resolve(root, "--from", "T2", "--kind", "decision", "--as", "dropped").stderr, /No decision draft from T2/);
  assert.equal(draft(root, "--from", "planning", "--kind", "decision", "--text", "plan item").status, 0);
  assert.equal(resolve(root, "--from", "planning", "--kind", "decision", "--as", "deferred").status, 0);
  assert.match(await readInbox(packet), /### decision · from planning\.md\n- Status: deferred\n/);
});

test("cleanup retains current-task pending and uncaptured packets but leaves peer packets alone", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t);
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  await fs.appendFile(path.join(packet, "human-inbox.md"), "\n### current\n- Status: pending\n");
  const approved = harness(lane, "worktree", "approve", "--approved", "Packet cleanup", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /1 pending/);
  assert.match(approved.stdout, /Task packet retained: /);
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
  const peerLane = laneOf(repo, "packet-peer");
  assert.equal(harness(peerLane, "human-sync", "init", "--target", peerLane).status, 0);
  const peerPacket = JSON.parse(harness(peerLane, "human-sync", "status", "--target", peerLane).stdout).packet;
  await fs.appendFile(path.join(peerPacket, "human-inbox.md"), "\n### peer\n- Status: pending\n");
  const cleaned = harness(repo, "worktree", "cleanup", "task/capture", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout);
  assert.ok(await fs.stat(peerLane));
  assert.match(await fs.readFile(path.join(peerPacket, "human-inbox.md"), "utf8"), /pending/);
  assert.ok(await fs.stat(path.join(packet, "packet.json")));
});

test("a lane re-created with the same name and starting commit continues the earlier packet", async (t) => {
  const { repo, root, packet } = await makePacketFixture(t);
  const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.equal(harness(repo, "worktree", "cleanup", "task/capture", "--target", repo).status, 0);
  const again = harness(repo, "worktree", "create", "capture", "--target", repo);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, new RegExp(`^Task packet continues an earlier lane with the same name and starting commit: ${escaped(packet)}$`, "m"));
  assert.doesNotMatch(again.stdout, /human-sync init/);
  assert.equal(observed(root).packet, packet);
  // An invalid earlier packet keeps the refusal, with no init suggestion.
  await fs.writeFile(path.join(packet, "packet.json"), "{}\n");
  assert.equal(harness(repo, "worktree", "cleanup", "task/capture", "--target", repo).status, 0);
  const invalid = harness(repo, "worktree", "create", "capture", "--target", repo);
  assert.equal(invalid.status, 0, invalid.stderr);
  assert.match(invalid.stdout, /^No task packet: Task packet already exists; preserve it and use status or restore its checkpoint: /m);
  assert.doesNotMatch(invalid.stdout, /human-sync init/);
  assert.equal(await fs.readFile(path.join(packet, "packet.json"), "utf8"), "{}\n");
});

test("cleanup selects current packet incarnation when a completed task slug is reused", async (t) => {
  const { repo, lane, root, packet } = await makePacketFixture(t);
  await fs.writeFile(path.join(lane, "first.txt"), "first incarnation\n");
  const first = harness(lane, "worktree", "approve", "--approved", "First incarnation", "--target", lane);
  assert.equal(first.status, 0, first.stderr);
  // Every lane has a packet from creation; an empty one is not announced.
  assert.doesNotMatch(first.stdout, /Task packet retained/);
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
  const { repo, lane, root, packet } = await makePacketFixture(t);
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
  assert.equal(harness(repo, "init", "--target", repo).status, 0);
  assert.equal(beacon(path.join(repo, ".hai"), "--disable").status, 0);
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Install harness");
  return fixture;
}

test("the project copy of the CLI runs lanes and human-sync with no PATH entry and hands init and update to the package", async (t) => {
  const { repo } = await makeInstalledProject(t);
  const source = await fs.readFile(cli, "utf8");
  assert.notEqual(run("sh", ["-c", "command -v hai-harness"], repo, noHarnessEnv).status, 0);
  assert.equal(await fs.readFile(path.join(repo, ".hai/Agents/hai-harness.mjs"), "utf8"), source);
  // The project holds no packaged templates, as in a real installation.
  assert.equal(await fs.stat(path.join(repo, "scaffold")).catch(() => null), null);

  const created = projectCli(repo, repo, "worktree", "create", "field");
  assert.equal(created.status, 0, created.stderr);
  const lane = laneOf(repo, "field");
  // The lane carries its own tracked copy, so the same command works from inside it.
  assert.equal(await fs.readFile(path.join(lane, ".hai/Agents/hai-harness.mjs"), "utf8"), source);
  const status = projectCli(lane, lane, "worktree", "status");
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Branch:\s+task\/field/);
  // From inside a lane, `create` still works when pointed at the primary checkout.
  const inside = projectCli(lane, lane, "worktree", "create", "inside", "--target", repo);
  assert.equal(inside.status, 0, inside.stderr);
  assert.match(projectCli(lane, lane, "worktree", "status", "--all").stdout, /task\/inside[\s\S]*task\/field|task\/field[\s\S]*task\/inside/);
  assert.equal(projectCli(lane, lane, "human-sync", "init").status, 0);
  // the packet came from the CLI's embedded templates: the project has none, and capture reads them
  assert.match(projectCli(lane, lane, "human-sync").stdout, /no new trail entries since the trail began/);
  const doctor = projectCli(lane, lane, "doctor");
  assert.equal(doctor.status, 0, doctor.stdout + doctor.stderr);
  assert.match(doctor.stdout, /looks installed/);

  // init and update need the package's templates: the project copy points at npx instead of copying from the wrong root.
  const receipt = await fs.readFile(path.join(lane, ".hai/.hai-harness.json"), "utf8");
  const refusedInit = projectCli(lane, lane, "init", "--target", "/tmp/a project");
  assert.notEqual(refusedInit.status, 0);
  assert.match(refusedInit.stderr, /npx github:ClaudiusMa\/HAI-Harness init --target "\/tmp\/a project"/);
  assert.equal(await fs.readFile(path.join(lane, ".hai/.hai-harness.json"), "utf8"), receipt);
  assert.match(projectCli(lane, lane, "help").stdout, /node \.hai\/Agents\/hai-harness\.mjs worktree approve/);

  // Approve from the lane's own copy; the copy is deleted with the lane while it runs.
  await fs.writeFile(path.join(lane, "result.txt"), "approved\n");
  const approved = projectCli(lane, lane, "worktree", "approve", "--approved", "Field fixture");
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal(await fs.stat(lane).catch(() => null), null);
  assert.equal(git(repo, "log", "-1", "--format=%s"), "Merge task/field: Field fixture");

  // Keep a lane, then clean it up from the primary's copy with the printed command form.
  assert.equal(projectCli(repo, repo, "worktree", "create", "second").status, 0);
  const second = laneOf(repo, "second");
  await fs.writeFile(path.join(second, "second.txt"), "approved\n");
  const kept = projectCli(second, second, "worktree", "approve", "--keep-worktree", "--approved", "Second fixture");
  assert.equal(kept.status, 0, kept.stderr);
  assert.match(kept.stdout, new RegExp(`node \\.hai/Agents/hai-harness\\.mjs worktree cleanup task/second --target ${repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  const cleaned = projectCli(repo, repo, "worktree", "cleanup", "task/second", "--target", repo);
  assert.equal(cleaned.status, 0, cleaned.stdout + cleaned.stderr);
  assert.equal(await fs.stat(second).catch(() => null), null);
});

test("a lane made by hand is refused with the supported recovery and never gains forged metadata", async (t) => {
  const { repo } = await makeInstalledProject(t);
  const lane = laneOf(repo, "by-hand");
  git(repo, "worktree", "add", "-b", "task/by-hand", lane);
  await fs.writeFile(path.join(lane, "hand.txt"), "by hand\n");
  git(lane, "add", "hand.txt");
  git(lane, "commit", "-m", "Hand-made work");

  const approve = projectCli(lane, lane, "worktree", "approve", "--approved", "Hand-made");
  assert.notEqual(approve.status, 0);
  assert.match(approve.stderr, /task\/by-hand was not created by the harness/);
  assert.match(approve.stderr, /"node \.hai\/Agents\/hai-harness\.mjs worktree create <new-slug>"[\s\S]*git merge task\/by-hand/);
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
  const recovered = laneOf(repo, "recovered");
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
  assert.equal(await fs.stat(laneOf(repo, "blocked")).catch(() => null), null);
  assert.equal(await fs.readFile(path.join(common, "refs/heads/develop 3"), "utf8"), `${sideCommit}\n`);
  // Once the user has settled them, the remaining non-blocking copies never stop a lane.
  for (const rel of ["refs/heads/develop 3", "refs/heads/develop 4", "HEAD 2"]) await fs.unlink(path.join(common, ...rel.split("/")));
  for (const name of ["plan.md", "diff.md", "diff 2.md"]) await fs.unlink(path.join(repo, name));
  const created = harness(repo, "worktree", "create", "unblocked", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /Conflict copies kept \(2\)[\s\S]*config 2[\s\S]*orphan 2/);
});

test("create, approve and cleanup sweep identical duplicates so they cannot block or enter commits", async (t) => {
  const { repo } = await makeGitFixture(t);
  await fs.writeFile(path.join(repo, "base.md"), "base\n");
  git(repo, "add", "base.md");
  git(repo, "commit", "-m", "Add base");
  // An untracked sync duplicate would make the primary look dirty and refuse the lane.
  await fs.writeFile(path.join(repo, "base 2.md"), "base\n");
  const created = harness(repo, "worktree", "create", "swept", "--target", repo);
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /moved 1 redundant cloud-sync duplicate to a reversible quarantine/);
  const lane = laneOf(repo, "swept");
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

test("approve refuses to commit a conflict copy (file or directory), and --quarantine moves only an approved, untracked file", async (t) => {
  const { repo } = await makeGitFixture(t);
  for (const [name, content] of [[".gitignore", ".env\n"], ["notes.md", "notes\n"], ["tracked.md", "tracked\n"], ["tracked 2.md", "tracked copy\n"], ["src/a.js", "one\n"]]) {
    await fs.mkdir(path.dirname(path.join(repo, name)), { recursive: true });
    await fs.writeFile(path.join(repo, name), content);
  }
  git(repo, "add", "-A");
  git(repo, "commit", "-m", "Base files, one a tracked duplicate");
  assert.equal(harness(repo, "worktree", "create", "guard", "--target", repo).status, 0);
  const lane = laneOf(repo, "guard");
  await fs.writeFile(path.join(lane, "result.txt"), "result\n");
  await fs.writeFile(path.join(lane, ".env"), "SECRET=1\n"); // ignored original
  await fs.writeFile(path.join(lane, ".env 2"), "SECRET=2\n");
  await fs.writeFile(path.join(lane, "notes 2.md"), "other notes\n");
  await fs.writeFile(path.join(lane, "orphan 2.txt"), "no original\n");
  await fs.mkdir(path.join(lane, "src 2"));
  await fs.writeFile(path.join(lane, "src 2/a.js"), "two\n");
  await fs.mkdir(path.join(lane, "solo 2")); // no sibling "solo": reported at most, never a stop
  await fs.writeFile(path.join(lane, "solo 2/x.txt"), "x\n");
  const head = git(lane, "rev-parse", "HEAD");

  const refused = harness(lane, "worktree", "approve", "--approved", "Guarded", "--target", lane);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Stopped: approve would commit what looks like a cloud-sync conflict copy\. Nothing was committed\./);
  for (const copy of [".env 2", "notes 2.md", "src 2"]) assert.ok(refused.stderr.includes(path.join(lane, copy)), copy);
  assert.match(refused.stderr, /merge what is needed into the original[\s\S]*worktree sweep --quarantine <path>/);
  assert.match(refused.stderr, /intentional, rename it or stage it with `git add <path>`\. For a file, .*worktree sweep --quarantine <path>.* moves one copy aside .*but only for a path the user explicitly approved/);
  assert.ok(!refused.stderr.includes("orphan 2.txt") && !refused.stderr.includes("solo 2"), "copies with no original only report");
  assert.match(refused.stdout, /Conflict copies kept \(3\)[\s\S]*orphan 2\.txt/);
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
  // the sweep never moves a directory out of a checkout, even when the user names it
  const directory = harness(lane, "worktree", "sweep", "--quarantine", "src 2", "--target", lane);
  assert.notEqual(directory.status, 0);
  assert.match(directory.stderr, /Only a regular file can be quarantined from a checkout/);

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
  assert.ok(manifests.every((text) => /reason: user-directed with worktree sweep --quarantine; the sweep had kept it: Its content differs from the original\./.test(text)));
  assert.equal(await fs.stat(path.join(lane, ".env 2")).catch(() => null), null);
  assert.equal(await fs.readFile(path.join(lane, ".env"), "utf8"), "SECRET=1\n");
  assert.equal(await fs.readFile(path.join(lane, "orphan 2.txt"), "utf8"), "no original\n");

  // the directory copy is still refused (and alone); the user says it is intentional, so explicit staging lets approve proceed
  const stillRefused = harness(lane, "worktree", "approve", "--approved", "Guarded", "--target", lane);
  assert.notEqual(stillRefused.status, 0);
  assert.ok(stillRefused.stderr.includes(path.join(lane, "src 2")) && !stillRefused.stderr.includes(".env 2"));
  git(lane, "add", "src 2");
  const approved = harness(lane, "worktree", "approve", "--approved", "Guarded", "--target", lane);
  assert.equal(approved.status, 0, approved.stderr);
  const committed = git(repo, "ls-files");
  assert.match(committed, /^result\.txt$/m);
  assert.match(committed, /^src 2\/a\.js$/m);
  assert.match(committed, /^solo 2\/x\.txt$/m);
  assert.doesNotMatch(committed, /\.env 2|notes 2/);
});

test("kept worktree admin and task-packet directory copies stop lane commands with a reason, and a missing original index is kept", async (t) => {
  const { repo } = await makeInstalledProject(t);
  const common = path.join(repo, ".git");
  assert.equal(projectCli(repo, repo, "worktree", "create", "alpha").status, 0);
  const lane = laneOf(repo, "alpha");
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

  // an identical copy of an admin directory is redundant and moves to the quarantine whole
  await fs.cp(admin, `${admin} 2`, { recursive: true });
  const identical = projectCli(repo, repo, "worktree", "sweep");
  assert.equal(identical.status, 0, identical.stderr);
  assert.match(identical.stdout, /worktrees\/alpha 2: identical to the original directory/);
  assert.equal(await fs.stat(`${admin} 2`).catch(() => null), null);
  const stored = identical.stdout.match(/quarantine: (.+) \(manifest/)[1];
  assert.ok(await fs.stat(path.join(stored, "git/worktrees/alpha 2/HEAD")));

  // a differing copy of a worktree admin directory shows up as an extra worktree
  await fs.cp(admin, `${admin} 2`, { recursive: true });
  await fs.writeFile(path.join(`${admin} 2`, "extra"), "differs\n");
  const adminBlocked = projectCli(repo, repo, "worktree", "create", "beta");
  assert.notEqual(adminBlocked.status, 0);
  assert.match(adminBlocked.stderr, /Stopped: a cloud-sync conflict copy in Git metadata is not provably redundant/);
  assert.ok(adminBlocked.stderr.includes(`${admin} 2`));
  assert.match(adminBlocked.stderr, /Git lists a copy of a worktree admin directory as an extra worktree/);
  assert.match(adminBlocked.stderr, /node \.hai\/Agents\/hai-harness\.mjs worktree sweep --quarantine <path>/);
  assert.equal(await fs.stat(laneOf(repo, "beta")).catch(() => null), null);
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
  const sweep = async () => {
    const child = spawn(process.execPath, [cli, "worktree", "sweep", "--target", repo], { cwd: repo, stdio: ["ignore", "pipe", "pipe"] });
    const output = { stdout: "", stderr: "" };
    for (const stream of ["stdout", "stderr"]) child[stream].setEncoding("utf8").on("data", (chunk) => { output[stream] += chunk; });
    const [status] = await once(child, "close");
    return { status, ...output };
  };
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
  // Copies the CLI to <root>/<script> with a package.json of the given name two levels up from it.
  const place = async (script, packageName) => {
    const file = path.join(root, script);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.copyFile(cli, file);
    await fs.writeFile(path.join(path.dirname(path.dirname(file)), "package.json"), JSON.stringify({ name: packageName }));
    return file;
  };
  const target = path.join(root, "target");
  await fs.mkdir(target);
  assert.equal(harness(target, "init", "--target", target).status, 0);
  const update = (script, ...args) => run(process.execPath, [script, "update", "--dry-run", ...args], root, noHarnessEnv);

  // bin/hai-harness.mjs beside a package.json named hai-harness is the package
  const real = update(await place("pkg/bin/hai-harness.mjs", "hai-harness"), "--target", target);
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /Dry run complete/);
  // the same file under another package name, or under Agents/, is an installed copy
  for (const [script, name] of [["other/bin/hai-harness.mjs", "someone-else"], ["agents/Agents/hai-harness.mjs", "hai-harness"], ["plugin/.hai/Agents/hai-harness.mjs", "hai-harness"]]) {
    const refused = update(await place(script, name), "--target", target);
    assert.notEqual(refused.status, 0, script);
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
  const receipt = await fs.readFile(path.join(project, ".hai/.hai-harness.json"), "utf8");
  const live = projectCli(project, project, "update");
  assert.notEqual(live.status, 0);
  assert.match(live.stderr, /npx github:ClaudiusMa\/HAI-Harness update/);
  assert.equal(await fs.readFile(path.join(project, "AGENTS.md"), "utf8"), "the project's own entry point\n");
  assert.equal(await fs.readFile(path.join(project, ".hai/.hai-harness.json"), "utf8"), receipt);
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
    tag_name: "v90.0.0",
    html_url: "https://example.invalid/v90.0.0",
    draft: false,
    prerelease: false
  }));
  await fs.writeFile(newerManifest, JSON.stringify({
    tag_name: "v91.0.0",
    html_url: "https://example.invalid/v91.0.0",
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
  assert.ok(due.stdout.includes(`HAI-Harness 90.0.0 is available (installed: ${installedVersion})`));
  assert.match(due.stdout, /update --dry-run/);
  assert.match(due.stdout, /https:\/\/example\.invalid\/v90\.0\.0/);
  const notifiedState = JSON.parse(await fs.readFile(cachePath, "utf8"));
  assert.equal(notifiedState.lastNotifiedVersion, "90.0.0");
  assert.equal(notifiedState.lastCheckStatus, "available");

  const repeated = beacon(target, "--now", "2026-08-19T00:00:00.000Z", "--manifest", availableManifest);
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.equal(repeated.stdout, "");

  const nextRelease = beacon(target, "--force", "--now", "2026-08-19T00:00:00.000Z", "--manifest", newerManifest);
  assert.equal(nextRelease.status, 0, nextRelease.stderr);
  assert.match(nextRelease.stdout, /HAI-Harness 91\.0\.0 is available/);

  const updatedReceipt = JSON.parse(await fs.readFile(path.join(target, ".hai/.hai-harness.json"), "utf8"));
  updatedReceipt.installedVersion = "91.0.0";
  await fs.writeFile(path.join(target, ".hai/.hai-harness.json"), `${JSON.stringify(updatedReceipt, null, 2)}\n`);
  const updatedStatus = beacon(target, "--status", "--now", "2026-08-20T00:00:00.000Z", "--manifest", malformedManifest);
  assert.equal(updatedStatus.status, 0, updatedStatus.stderr);
  assert.match(updatedStatus.stdout, /Update status: current \(91\.0\.0\)/);

  assert.equal(beacon(target, "--disable").status, 0);
  // Toggling checks rewrites the receipt but keeps its core-file hashes.
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(target, ".hai/.hai-harness.json"), "utf8")).files, updatedReceipt.files);
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
    tag_name: "v90.0.0",
    html_url: "https://example.invalid/v90.0.0",
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
  assert.match(checked.stdout, /HAI-Harness 90\.0\.0 is available/);
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
  // The product's own Agents/ at the repository root is source, not a root-layout install.
  // The repository note is everything before this repository's own block.
  const repositoryNote = (await fs.readFile(path.join(root, "AGENTS.md"), "utf8")).split("<!-- hai-harness:start")[0];
  const bootstrapped = meta("bootstrap");
  assert.equal(bootstrapped.status, 0, bootstrapped.stderr);
  assert.ok(await fs.stat(path.join(target, "Agents/onboarding.md")));
  const entry = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(entry.startsWith(repositoryNote), "the repository note stays as written");
  assert.match(entry, /<!-- hai-harness:start default=own -->[\s\S]*node \.hai\/Agents\/hai-harness\.mjs[\s\S]*<!-- hai-harness:end -->\n$/);
  assert.equal(await fs.stat(path.join(target, "AGENTS.md")).catch(() => null), null);
  const records = [
    ".hai/Agents/planning.md", ".hai/Agents/project_context.md", ".hai/Agents/design.md",
    ".hai/Agents/tasks/augustus.md", ".hai/Agents/tasks/julius.md",
    ".hai/Agents/handoffs/project.md", ".hai/Agents/lessons/INDEX.md",
    ".hai/Agents/lessons/project.md", ".hai/Agents/_archive/project.md",
    ".hai/Human/brief.md", ".hai/Human/decisions.md", ".hai/Human/open_questions.md",
    ".hai/Human/reflections.md", ".hai/README.md",
    ".hai/Agents/custom/roles/apollo.md", ".hai/Agents/custom/skills/local-only/SKILL.md",
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
  for (const stable of stableSkills) await fs.writeFile(path.join(target, stable), "edited here\n");
  for (const command of ["bootstrap", "sync", "sync"]) {
    const result = meta(command);
    assert.equal(result.status, 0, result.stderr);
    for (const record of records) {
      assert.equal(await fs.readFile(path.join(root, record), "utf8"), `Project record: ${record}\n`, record);
    }
  }
  // A block the project removed stays removed on sync.
  await fs.writeFile(path.join(root, "AGENTS.md"), "Project record: AGENTS.md\n");
  // Edited core files are kept and reported, never overwritten.
  const reported = meta("sync");
  assert.equal(await fs.readFile(path.join(root, "AGENTS.md"), "utf8"), "Project record: AGENTS.md\n");
  for (const stable of stableSkills) {
    assert.equal(await fs.readFile(path.join(target, stable), "utf8"), "edited here\n");
    assert.match(reported.stdout, new RegExp(`Locally modified[\\s\\S]*\\.hai/${stable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
  // A version the receipt recorded as installed is the harness's own, so it refreshes.
  const receiptPath = path.join(target, ".hai-harness.json");
  const receipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  for (const stable of stableSkills) receipt.files[stable] = createHash("sha256").update("edited here\n").digest("hex");
  await fs.writeFile(receiptPath, JSON.stringify(receipt));
  assert.equal(meta("sync").status, 0);
  for (const stable of stableSkills) {
    assert.equal(await fs.readFile(path.join(target, stable), "utf8"), await fs.readFile(path.join(root, stable), "utf8"));
  }
  for (const command of ["bootstrap", "sync", "doctor"]) {
    const rejected = meta(command, "--force");
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /options are not supported/);
  }
  assert.notEqual(meta("unknown").status, 0);
  // The harness's own .hai copy of the CLI is an installed copy and refuses update too.
  const ownCopy = run(process.execPath, [path.join(target, "Agents/hai-harness.mjs"), "update"], root, noHarnessEnv);
  assert.notEqual(ownCopy.status, 0);
  assert.match(ownCopy.stderr, /npx github:ClaudiusMa\/HAI-Harness update/);
  // Doctor reports the removed block but rewrites nothing.
  const disabled = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  disabled.checkEnabled = false;
  await fs.writeFile(receiptPath, JSON.stringify(disabled));
  const checked = meta("doctor");
  assert.match(checked.stdout, /Update status: disabled/);
  assert.match(checked.stdout, /AGENTS\.md has no HAI-Harness block/);
  assert.equal(await fs.readFile(path.join(root, "AGENTS.md"), "utf8"), "Project record: AGENTS.md\n");
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

  // A change that needs more than a patch names its minimum version; the floor is used once.
  git(repo, "add", "package.json", "release.json");
  git(repo, "commit", "-m", "release: v0.2.2");
  git(repo, "tag", "v0.2.2");
  await fs.writeFile(path.join(repo, "release.json"), JSON.stringify({ ...releaseAfterBump, minimumNextVersion: "0.3.0" }));
  await fs.writeFile(path.join(repo, "Agents/onboarding.md"), "plugin layout\n");
  git(repo, "add", "release.json", "Agents/onboarding.md");
  git(repo, "commit", "-m", "Move the harness into .hai");
  const minorBump = await planRelease({ repoRoot: repo, apply: true });
  assert.equal(minorBump.version, "0.3.0");
  assert.equal(minorBump.packageVersion, "0.3.0");
  assert.equal(JSON.parse(await fs.readFile(path.join(repo, "release.json"), "utf8")).minimumNextVersion, undefined);
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
