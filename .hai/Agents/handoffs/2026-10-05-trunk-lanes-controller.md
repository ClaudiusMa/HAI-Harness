# Trunk lanes — controller handoff

Date: 2026-10-05
From: Claudia (session that simplified the trunk-lanes fix with the user)
Status: complete. Merged to `main` (`7911a03`) through `worktree approve`; stable `v0.2.6` published 2026-10-06 after the user merged release PR #18.

## Lane

| Role | Path / identity |
| --- | --- |
| Task worktree | `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/trunk-lanes` |
| Task branch | `task/trunk-lanes`, base `719f3dd` |
| Recorded integration | `codex/trunk-lanes` (a private fork from the old rule, same tip as `main`). Repoint to `main` before approve. |
| Primary | `/Users/claudiusma/Documents/ProductLab/HAI-Harness` on clean `main` |
| Packet (`.hai` scope) | `.git/hai-harness/tasks/43882402…c06` (trail T1–T4, one pending draft from T4). Its identity binds the integration branch, so carry trail and inbox over when repointing. |

## What the user decided

Each session works on its own branch from clean `main`, records decisions there, and merges into `main`. Conflicts go to the user. `main` must always be clean; uncommitted edits there go to the user to review and commit first. Chosen details: shared-notes conflicts keep both sides; approve stops for a re-test when `main` moved; dirty `main` blocks create and approve; keep a read-only `status --all`. Registries, locks, path claims and trunk config were rejected as over-engineering.

## Done

- CLI: main ban removed; create and approve refuse a dirty primary with a "have the user review and commit" message; approve merges the latest integration tip into the lane (re-test stop on change; abort and list files on conflict), builds a hook-checked `--no-ff` merge commit in the lane on that tip, and fast-forwards the primary with `--ff-only`; `status --all` from `git worktree list`; doctor warns on a dirty primary.
- Review: Julius found two bugs (detached lane after a failing checkout hook; `branch -d` from the wrong checkout); both fixed with a regression test.
- Tests: `node --test test/hai-harness.test.mjs` 17/17, including a grid/hover/theme replay of the field incident. `git diff --check` clean. `./hai-meta sync` done.
- Instructions updated; outer planning, project context and task files updated. Augustus's superseded design is backed up as a patch outside the repo; its handoff is marked superseded.

## Leftovers

- Remote branches `release/v0.2.5` and `release/v0.2.6` are merged but not deleted; deleting them needs the user's permission.
- The lane's original human-sync packet (`.git/hai-harness/tasks/43882402…c06`, trail T1–T4) is kept in local Git metadata by design; its only approved draft is in `Human/decisions.md`.
- Field remediation of existing projects stays with the user.
