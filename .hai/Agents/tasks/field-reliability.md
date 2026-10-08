# Field reliability

Owner: Augustus child of the current Claudia. Updated 2026-10-07.
Status: approved to execute 2026-10-07. Peer lane `task/momus-debugger-design` edits overlapping files and is not ready; do not read from, wait for, or touch it. Work from this lane's base.

## Requirements

1. Startup block in `scaffold/AGENTS.md`, kept short because it is the only always-loaded file. For every role: confirm the primary checkout is clean, then create the lane with the in-project CLI before writing anything; if the CLI is missing or fails, stop and report — never `git worktree add`, never hand-written lane metadata. Role selection: a role named in the user's message (obvious misspellings count) reads its role file before any other action; otherwise the session is Claudia and reads the `claudia.md` read order before any tool call other than the update check. Claudia-only line: never edit product code; write the contract and spawn a worker. Named worker roles keep their existing rules. Align `Agents/onboarding.md` and `Agents/claudia.md` without duplicating long text.
2. In-project CLI. `init` and `update` install the dependency-free CLI as `Agents/hai-harness.mjs` (a stable method file `update` refreshes and `doctor` checks). Every installed instruction, skill and README lane example uses `node Agents/hai-harness.mjs …`. From that copy, `worktree create|status|approve|cleanup` and `human-sync` work with no PATH, network or npm; any packaged templates they need ship with it. `init`/`update` invoked from the in-project copy print the `npx github:ClaudiusMa/HAI-Harness …` form instead of copying from the wrong root. Commands must also work when run from inside a lane.
3. Hand-made lanes: when `approve` or `cleanup` find a `task/*` branch without harness metadata, the message says the lane was not created by the harness and gives the supported recovery; it never suggests setting `hai*` git config by hand.
4. iCloud conflict copies, cleaned as we go. Repos and lanes stay where they are and keep syncing; no Git-dir relocation and no change to lane location. Sync tools leave duplicates named `<name> <N>` (e.g. `index 2`, `refs/heads/task/x 2`, `HEAD 2`, `notes 2.md`). `worktree create|approve|cleanup` sweep the Git common dir, the registered worktree admin dirs, the harness task packets, and untracked files in the primary and the current lane; `doctor` reports the same findings without moving anything. A copy is redundant and moves to a reversible quarantine (a dated folder under the Git common dir's `hai-harness/`, preserving relative paths, with a short manifest) only when: its content is byte-identical to the original; or it is a loose ref copy whose commit is already contained in the original ref; or it is an `index <N>` cache copy. Everything else (differing content, missing original, a ref copy not contained in the original) is kept and reported with both paths and a plain next step. Never hard-delete; never quarantine tracked files. The sweep must not block normal commands unless a kept copy is a ref or HEAD that could change what Git sees; then stop with the explanation. Installed instructions say: when you see such copies, run the CLI sweep instead of deleting by hand.

## Write scope

Product: `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `scaffold/AGENTS.md`, `Agents/onboarding.md`, `Agents/claudia.md`, skills that show lane commands, `README.md` lane/install sections. Outer mirrors only through `./hai-meta sync`. Evidence: `.hai/Agents/handoffs/field-reliability.md`. Do not edit outer planning, task files, packet or Human state.

## Method and sequence

Read `.hai/AGENTS.md`, outer onboarding/project_context, `.hai/Agents/augustus.md`, this contract, then `.hai/Agents/skills/implement/SKILL.md`. Work only in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/field-reliability`, branch `task/field-reliability`.

1. Requirement 2, then 3 (shared CLI surface), then 4, then 1 (instructions name the final commands).
2. Focused tests with offline Git fixtures: init installs `Agents/hai-harness.mjs`; lane create/approve/cleanup and human-sync run from the installed copy with no `hai-harness` on PATH; update refreshes it; doctor flags it missing; hand-made lane message; conflict-copy sweep (simulated copies, not real iCloud): identical file, contained ref copy and `index 2` quarantined with manifest; differing file and uncontained ref copy kept and reported; tracked files untouched; doctor reports without moving.
3. Scenario check of the startup block text against three openings — an unnamed coding request, "claudida, …", "augustus, …" — and state the first actions the text requires. Claudia runs the live agent replay afterwards; do not spawn agents.
4. `./hai-meta sync`; check mirror parity and preserved outer state.
5. Report files, results and limits in `.hai/Agents/handoffs/field-reliability.md`; release the writer slot for an independent read-only review.

Dependencies: one serial worker; reviewer waits for frozen source. No dependency installation, network checks, broad suite, real iCloud mutation, or sweeps of real repositories outside test fixtures. Approval boundary: execution approved 2026-10-07; local commit/merge, push and release unapproved. Do not commit.
