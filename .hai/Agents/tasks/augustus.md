# Augustus Tasks

Planner-owned contract. Updated 2026-09-30 by Claudia.

## Assigned Queue

- Status: implemented. User approved commit and push to origin/main on 2026-09-30. Do not tag or publish v0.2.3.
- Task / outcome: a product push opens a release pull request and stops. After the user merges that pull request, the workflow publishes the tag and GitHub Release.
- Read first: outer onboarding, project context, Augustus role, [implement](../skills/implement/SKILL.md), and this contract. Work only in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/release-after-review` on `task/release-after-review`.
- Active now: change the release planner and the Release workflow, plus the README release paragraph and focused planner tests.
- Next: run the focused release-planner tests, then stop.
- Lane: already created from clean integration `codex/release-after-review` at `2603e98369a4d07abc0cb9480144a8d08c8d924b`. Do not create another worktree. Do not touch the primary checkout. It is on local `main` with an unrelated dirty handoff.
- Files / write scope:
  - `.github/scripts/plan-release.mjs`
  - `.github/workflows/release.yml`
  - `test/hai-harness.test.mjs`
  - `README.md` release-discipline paragraph only
- Preserve: product-path rules, patch bump, first version `0.2.1`, and the skip for `.hai/`-only pushes. Do not auto-merge. Do not publish v0.2.3 as a side effect of an unrelated push. Do not change branch protection, Actions permissions, package version, or `release.json`.
- Acceptance:
  - A product change whose version is not yet bumped returns `publish: true` and `action: "prepare"`.
  - The workflow, for `prepare`, pushes `release/<tag>`, opens a pull request, and stops. It does not merge, tag, or create a GitHub Release in that job.
  - The pull request text tells the reviewer to review and merge, and says the tag and GitHub Release are created after the merge reaches `main`.
  - A tip commit `release: vX.Y.Z`, or a merge commit from `release/vX.Y.Z`, whose package version equals that version and whose tag is missing, returns `publish: true` and `action: "tag"`.
  - The workflow, for `tag`, tags that main commit and creates the GitHub Release. It does not commit or open another pull request.
  - The same release tip, once the tag exists, returns `publish: false`.
  - A later non-release tip does not publish just because package metadata is ahead of the latest tag.
- Existing patterns: planner behavior lives in `.github/scripts/plan-release.mjs` and is covered by the release-planner tests in `test/hai-harness.test.mjs`. The workflow only carries out the plan.
- Dependencies: none. Do not write the lean-harness, auto-release, or lesson-learning-cycle worktrees.
- Verification: `git diff --check` and `node --test --test-name-pattern "release planner" test/hai-harness.test.mjs` from the task worktree. Do not run the full suite.
- User-approved to execute: yes.
- High-cost approval: not granted.
- Local commit/merge: approved 2026-09-30.
- Outward acts authorized: push to origin/main. No tag and no GitHub Release.

## Stop Conditions

- Report ambiguity, broken assumptions, unrelated drift, scope expansion, or required high-cost work.
- Never reset, stash, clean, bypass hooks, commit, merge, push, tag, or publish under this contract.
