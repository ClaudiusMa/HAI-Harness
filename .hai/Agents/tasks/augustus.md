# Augustus Tasks

Planner-owned contract. Updated 2026-09-24 by Claudia.

## Assigned Queue

- Status: checked and approved for local integration and push to origin main
- Task / outcome: a push to origin `main` publishes a stable GitHub Release without a manual release step.
- Read first: outer onboarding, project context, Augustus role, [implement](../skills/implement/SKILL.md), this contract, and [auto release](../handoffs/auto-release.md).
- Active now: implement the release planner and the GitHub Action that runs it.
- Next: focused tests, then `./hai-meta sync` for any stable scaffold wording. Stop before commit, merge, push, tag, or publish.
- Lane: from the primary checkout, create and check out local integration branch `codex/auto-release` from current `main` (`0cef892`), then `hai-harness worktree create auto-release --integration codex/auto-release`. Edit only in `task/auto-release`.
- Files / write scope: `package.json` and `release.json` only as the planner's inputs/outputs under test fixtures, not a live version bump in this commit; `README.md` release-discipline section; a dependency-free release planner under the repo; `.github/workflows/` for the push-to-`main` action; `test/hai-harness.test.mjs` for the planner. Stable outer mirrors only through `./hai-meta sync` when a shipped scaffold sentence changes.
- Preserve: beacon notice-only behavior, project-state preservation on `update`, provider neutrality, the existing `0.2.0` version until the action publishes, `.hai/` planning except the sync of stable method text.
- Acceptance: on push to `main`, the action runs the planner. If installable product paths changed since the last `vX.Y.Z` tag, it bumps the patch, keeps `package.json` and `release.json` on that same version, sets `releaseNotesUrl` to `https://github.com/ClaudiusMa/HAI-Harness/releases/tag/v<version>`, writes a short summary, commits those two files, tags `v<version>`, and publishes a stable GitHub Release. The release commit does not publish again. A push that only changes `.hai/` does not publish. With no prior tag, the next version is `0.2.1`.
- Acceptance: README tells maintainers this happens on push to origin `main` and no longer asks them to tag or publish by hand.
- Existing patterns: dependency-free Node, `release.json` schema already read by tests, GitHub Actions `GITHUB_TOKEN` with `contents: write`. No new npm dependency.
- Dependencies: none. Do not write the lean-harness worktree.
- Verification: focused planner tests covering no-prior-tag to `0.2.1`, product-path change bumps patch, `.hai/`-only and release-commit skips, and version files stay equal. Syntax and diff checks. No networked GitHub call.
- User-approved to execute: yes.
- High-cost approval: not granted.
- Local commit/merge: not approved.
- Outward acts authorized: none in this iteration. The workflow is the future outward act.

## Stop Conditions

- Report ambiguity, broken assumptions, unrelated drift, scope expansion, or required high-cost work.
- Never reset, stash, clean, bypass hooks, commit, merge, push, tag, or publish under this contract.
