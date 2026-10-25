# Handoff — shared worktrees root

- Date: 2026-10-21
- From: Claudia (built in lane `task/shared-worktrees-root`)
- Scope: `bin/hai-harness.mjs` (`taskLaneRoot`, `legacyTaskLaneRoot`, `createWorktree`, `cleanupWorktree`), `test/hai-harness.test.mjs`, README "Native task worktrees", `Agents/onboarding.md`, `scaffold/shipped-hashes.json`, outer `.hai/` sync, planning and project context.

## Result

- New lanes go to `<dirname(primary)>/_worktrees/<basename(primary)>/<slug>`, through the one helper that both `create` and `cleanup` use.
- `cleanup` (and therefore `approve`) accepts a lane that is registered at either the new path or the legacy `<primary>-worktrees/<slug>` path. Every existing refusal still applies to both paths.
- The hand-made-lane recovery message now names the worktree that actually holds the branch.

## Verification

- `node --test test/hai-harness.test.mjs`: 45/45.
  - A new test checks that a lane is created at the shared path and that no `-worktrees` folder appears.
  - The same test moves a lane to the legacy path, then runs approve `--keep-worktree` and cleanup on it.
- `git diff --check` is clean. `node scripts/shipped-hashes.mjs` and `./hai-meta sync` ran, and `.hai/Agents/hai-harness.mjs` is identical to `bin/`.
- Fixed in passing: the beacon fixtures faked "newer" releases v0.3.0 and v0.4.0, which broke once the installed version reached 0.3.0. They now use v90 and v91.

## Independent review

A fresh read-only reviewer found no safety regressions.

Fixed after the review:
- The README move command needs `mkdir -p` first.
- The recovery message named the wrong path.

Accepted and documented:
- A symlinked `_worktrees` makes cleanup refuse. This fails safe and existed before with the old sibling folder.

Not checked: Windows paths and case-insensitive path comparison. The latter was already present before this change.

## Remaining

- Integration needs the user's approval through `worktree approve`. Push needs separate approval, and the release workflow then bumps 0.3.0 → 0.3.1.
- Existing lanes are moved by the user after `update`. This lane itself sits at the legacy path, because it was created by the old CLI.
