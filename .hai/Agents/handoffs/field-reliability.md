# Handoff - field-reliability

Last updated: 2026-10-07 (second and final fix round after the recheck)
From: Augustus (child of Claudia)
To: independent re-reviewer, then Claudia (agent replay and closeout)

## Status

- Done: all four requirements implemented in lane `task/field-reliability` (base `b711df0`), plus two fix rounds (eleven items from the independent review, then five items from the recheck); focused tests green; `./hai-meta sync` re-run; mirror parity checked. Nothing committed, merged, pushed or released.
- In progress: none. Writer slot is released.
- Not started (Claudia / reviewer): re-review of the fix round; live agent replay of the startup block; outer `planning.md` and decision updates; `./hai-meta doctor` (see Limits).

## Files touched or in scope

Product source: `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `scaffold/AGENTS.md`, `Agents/onboarding.md`, `Agents/claudia.md`, `Agents/skills/human-scribe/SKILL.md`, `Agents/skills/traffic-control/SKILL.md`, `README.md`, root `AGENTS.md` (one paragraph, fix item 8).
Scope extension from round one (flag for review): `Agents/augustus.md` and `Agents/julius.md`, one line each (mechanical `node Agents/hai-harness.mjs` substitution required by "every installed instruction").
Outer: `.hai/Agents/project_context.md` (one Session bootstrap line, fix item 8, by Claudia's instruction). Mirrors only through `./hai-meta sync`: `.hai/AGENTS.md`, `.hai/Agents/{onboarding,claudia,augustus,julius}.md`, `.hai/Agents/skills/{human-scribe,traffic-control}/SKILL.md`, `.hai/Agents/hai-harness.mjs` (new, byte-identical to `bin/hai-harness.mjs`).
Not edited by me: outer planning, task files, packet, Human state, and Claudia's `.hai/Agents/handoffs/field-reliability-replay.md`. `.hai/Agents/planning.md` has a different hash from my first-round snapshot; I never edited it (Claudia did between rounds), and sync leaves it alone.

## How each requirement is met (current behavior)

1. Startup block. `scaffold/AGENTS.md` "Start here" is five steps (update check; role pick; Claudia never edits product code; lane before any write for every role with clean-primary check, in-project CLI, stop on CLI failure, no `git worktree add` or hand-written `hai*` metadata; conflict copies). Role pick now matches only when the message "addresses you as, or assigns you" a role (or the task contract does); misspellings count; a mere mention ("spawned by Claudia", "ask Augustus to fix X") assigns nothing; otherwise Claudia. `onboarding.md` and `claudia.md` carry the same wording by reference, not a copy of the block.
2. In-project CLI. `init` installs `bin/hai-harness.mjs` as `Agents/hai-harness.mjs`; `update` refreshes it; `doctor` requires it. `init` and `update` run only from the positively identified package: the script is `<root>/bin/hai-harness.mjs` and `<root>/package.json` has name `hai-harness` (second round, item 1; it replaces the earlier `scaffold/AGENTS.md` heuristic, which let a project with its own `scaffold/AGENTS.md` run `update` from its installed copy and overwrite its files). Every other location is an installed copy: `init`/`update` exit 1 and print the `npx github:ClaudiusMa/HAI-Harness <cmd> <args>` form (the `.hai` copy also says "run ./hai-meta sync (or ./hai-meta bootstrap)"). Lane, human-sync and doctor commands run with no PATH, npm or network, including from a lane's own copy. Every printed hint uses `cliCommand`: `node <script path>`, relative to the working directory when inside it (`node Agents/hai-harness.mjs` in a project, `node bin/hai-harness.mjs` in this repo), absolute otherwise; never a bare `hai-harness`. Docs and README use the project form; a test scans every installed `.md` for a bare command.
3. Hand-made lanes. `approve`, `cleanup`, `human-sync` and `worktree status` say the lane was not created by the harness and give the recovery (commit pending work, `create <new-slug>` from the clean primary, `git merge <branch>` in the new lane, approve there, ask the user before removing the old lane). No mention of `git config` or key names; the commands inside use `cliCommand`.
4. Conflict copies (`<name> <N>`, N 2-99). Scope: Git common dir (refs, HEAD, index caches, worktree admin dirs, task packets; not loose `objects/xx`, not the quarantine) plus untracked non-ignored files in the primary and current lane (cleanup also the lane being removed). Quarantine: `<common>/hai-harness/quarantine/<UTC stamp>-<pid>/{git|tree/<checkout>}/<relative path>` with `manifest.txt`. Moved only when byte-identical to the original; a loose `refs/` copy whose commit is contained in the real ref; or an `index <N>` file whose original `index` exists (item 4: reason now says it may hold staged state and can be restored from the manifest; a missing original index keeps and reports). A copy that vanishes mid-sweep (another sweep took it) is skipped as handled, including when the rename hits ENOENT (item 7). Everything else is kept and reported with both paths, why and next step; tracked files are never candidates.
   - Stops `create|approve|cleanup|sweep` (kept and blocking, items 2 and 3): a kept copy of a ref, of `HEAD`, of a `worktrees/<name>` admin directory (Git lists it as an extra worktree) or of a `hai-harness/tasks/<id>` directory (cleanup would fail with "Invalid task packet identity"). The stop message states what was moved before it ("N redundant copies were moved ... nothing else was changed", or "Nothing was changed.") (item 5).
   - `approve` additionally refuses (before `git add -A`, item 1) when a kept untracked, non-ignored copy in the lane being approved has an existing original with different content (`notes 2.md` vs `notes.md`, `.env 2` vs ignored `.env`), or when an untracked directory sits beside a directory of the original name (`src 2/` beside `src/`, found with `git ls-files --others --exclude-standard --directory -z`; second round, item 2). It names each path, says it looks like a sync conflict copy, tells the user to merge/rename/remove it or have a user-approved file path moved with `--quarantine`, and says that if a listed path is intentional, renaming it or staging it explicitly with `git add <path>` lets approve proceed (item 3). Orphan numbered files and directories (no original) only report.
   - `worktree sweep --quarantine <path>` (item 6) moves exactly one named copy (Git metadata file or directory, or an untracked regular file in the primary or current lane) into the same quarantine; the manifest says `reason: user-directed; the sweep had kept it: ...` and `directed: by the user`. A relative path is resolved against `--target` (default the current directory; item 5, stated in the help text). It refuses non-copy names, tracked files, files whose owning repository is not this checkout (a nested repository or submodule, checked with `git rev-parse --show-toplevel` in the file's directory; item 4), paths outside the repository, and directories in checkouts. Installed instructions say to use it only for a path the user explicitly approved.
   - `doctor` runs the same planner and only warns.

## Design choices to explain

- `worktree sweep` (and its `--quarantine` form) exists because the instructions must name a runnable sweep; it calls the same functions as `create|approve|cleanup`.
- Packet templates are embedded in the CLI (`packetTemplates`) since `human-sync init` previously read `scaffold/task-packet/*`; a test checks the created packet files equal those scaffold files.
- `doctor` works from the installed copy (needs no package root); contract over the earlier planning note.
- Sweep runs before the clean-primary check and before `git add -A`; planning drops a kept item whose copy vanished while it was judged (concurrent sweeps); stamp folders carry the process id so two sweeps in one millisecond never share a folder.

## Contracts / invariants

- Never hard-delete: the only unlink is of a verified copy after a cross-volume copy into the quarantine. Never touch tracked files. `--quarantine` only on a user-approved path.
- The installed copy must never run `init`/`update`.
- `bin/hai-harness.mjs` stays the single source; `Agents/hai-harness.mjs` exists only in installed projects (this repo's is `.hai/Agents/hai-harness.mjs`).

## Verification

- Ran (in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/field-reliability`):
  - `node --check` on `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `.hai/Agents/hai-harness.mjs`; `git diff --check`; `cmp bin/hai-harness.mjs .hai/Agents/hai-harness.mjs`: pass.
  - `node --test test/hai-harness.test.mjs` after the second fix round: **34 tests, 34 pass, 0 fail** (about 73 s). After the first fix round it was 32/32, after round one 28/28, baseline 24/24. No other suite, no installs, no network.
  - Second-round tests: "init and update run only from the identified package; every other location is an installed copy" (item 1: real `bin/` layout runs; other package name and an `Agents/` copy beside a package-looking root are refused; a project with its own `scaffold/AGENTS.md` and `package.json` keeps its `AGENTS.md` and receipt when `update` is tried from its installed copy); "approve refuses an untracked directory copy, and staging it explicitly is the way through" (items 2 and 3, orphan directory `solo 2/` not a stop, `--quarantine` of a directory refused, `git add` then approve succeeds); "--quarantine resolves relative paths against --target and refuses files owned by a nested repository" (items 4 and 5, with a same-named decoy in the calling directory left untouched).
  - Fix-round tests (offline temp fixtures): "approve refuses to commit a kept conflict copy, and --quarantine moves only an approved, untracked one" (item 1 incl. `.env 2` vs ignored `.env`, orphan stays report-only, HEAD and index unchanged after refusal; item 6 refusals for non-copy name, tracked file, missing file, and user-directed moves with manifest marking; approve then succeeds without the copies); "kept worktree admin and task-packet directory copies stop lane commands ... and a missing original index is kept" (items 2, 3, 4, plus `--quarantine` of a directory as the way out); "simultaneous sweeps hand each duplicate to exactly one of them" (item 7: two concurrent processes over 60 duplicate pairs; both exit 0, no stop or kept text, moved counts sum to 60, 60 files in quarantine); "a package-side script in an Agents directory is not mistaken for the project copy" (item 10).
  - Extended existing tests: partial-quarantine stop message (item 5) and new stop header; new `index` reason text; hint form (`node Agents/hai-harness.mjs ...` in the project copy, `retry: node .../bin/hai-harness.mjs worktree cleanup` from a source run, no bare `hai-harness`); the `.hai` copy's update refusal mentions `./hai-meta sync` (item 8).
  - Ad hoc (scratch, not committed): two concurrent sweeps over 300 pairs with a debug print in the ENOENT branch: 146 and 154 renames lost the race, sum 300, no errors, no leftovers, so the ENOENT path is genuinely exercised.
- Not run: any broader suite; `./hai-meta doctor` (it would scan this real repository's `.git`, which holds real conflict copies; it only reports, but the brief bars scans of real repos); any sweep or create against a real repository; real iCloud; Windows.
- Status: verified for the tested cases.

## Startup-block scenario check (text trace, no agents spawned; Claudia runs the live replay)

Text under test: `scaffold/AGENTS.md` "Start here" steps 1-5 (identical in `.hai/AGENTS.md`).

1. Unnamed coding request ("show me the transition code and change the bounce"): update check; no role addressed or assigned, so Claudia; no code search or edits until the Claudia read order in `onboarding.md` is complete; then `git status --short` on the primary (dirty -> stop), `node Agents/hai-harness.mjs worktree create <slug>` (CLI missing or failing -> stop and tell the user), then write the contract in the lane and spawn a worker.
2. "claudida, ...": addressed with an obvious misspelling of Claudia, so the same chain with Claudia named.
3. "augustus, ...": addressed: after the update check, onboarding.md then augustus.md and the worker read path; step 3 does not apply; lane named by the contract or handoff, else clean-primary check and `worktree create`; stop on CLI failure.
4. New probe (fix item 9): "ask Augustus to fix the nav" or "spawned by Claudia": a mention assigns nothing, so the session is Claudia (case 1), not Augustus.
- Gaps the text does not close (for the replay): nothing forbids Claudia from reading product code after the read order (only edits); a session started inside a lane with no contract or handoff names no lane and will try `create` from the lane and be refused with the primary's path.

## Sync result

`./hai-meta sync` re-run at the end of the second fix round: exit 0; 28 of 28 sync paths byte-identical between source and `.hai/`. In this last sync only `.hai/Agents/hai-harness.mjs` and `.hai/Agents/onboarding.md` changed (the other mirrors were already current). Preserved: `planning.md`, task files, handoffs, lessons, `_archive/`, `Human/`; `project_context.md` changed only by the one line above. No real development state in inner templates.

## Limits and open risks

- Documented limit (not changed, per Claudia): the name pairing only recognizes N 2-99 and treats any `<name> <N>` beside an existing `<name>` as a copy, so a legitimate `Chapter 3.md` beside `Chapter.md` is reported if it differs; and a byte-identical "stub" counterpart is moved even when the pairing is coincidental (reversible through the manifest).
- `approve`'s guard covers untracked, non-ignored files and untracked directories in the lane that have an existing original sibling. Ignored copies, copies without an original (orphans are printed), and a copy directory nested inside a wholly untracked directory (`git ls-files --directory` collapses it) still pass through `git add -A`.
- The working-tree sweep sees untracked non-ignored regular files only (not conflict-named directories or ignored files).
- Existing real conflict copies (this repo's `.git/worktrees/task-cleanup/index 2`, the portfolio `.git` copies) were not touched or scanned; cleaning them is a separate, user-approved run after the sweep is accepted.
- `doctor` does not compare the installed CLI copy with the package version; it only checks that it exists.
- `hai-defer` markers: none added.

## Exact next step

- Re-reviewer: read-only check of the fix round in `bin/hai-harness.mjs` (`sweepConflictCopies` guard and stop messages, `readerOf`, `quarantineNamedCopy`, `moveToQuarantine` outcome handling, `cliCommand`), the Start here wording, and the probes above. Then Claudia runs the live agent replay and the outer closeout.
