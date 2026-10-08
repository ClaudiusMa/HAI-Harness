# Handoff - field-reliability

Last updated: 2026-10-07 (code-quality pass applied on top of the merge and the lean AGENTS.md)
From: Augustus (child of Claudia)
To: independent re-reviewer, then Claudia (agent replay and closeout)

## Status

- Done: all four requirements implemented in lane `task/field-reliability` (base `b711df0`), plus two fix rounds (eleven items from the independent review, then five items from the recheck); focused tests green; `./hai-meta sync` re-run; mirror parity checked. Local commits in the lane: `55589b4` (lane state) and `c4ad49d` (merge of `main` = Momus `5e5f420`); the lean-AGENTS.md change is on top, uncommitted. Nothing merged into `main`, pushed or released.
- In progress: none. Writer slot is released.
- Not started (Claudia / reviewer): re-review of the fix round; live agent replay of the startup block; outer `planning.md` and decision updates; `./hai-meta doctor` (see Limits).

## Files touched or in scope

Product source: `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `scaffold/AGENTS.md`, `Agents/onboarding.md`, `Agents/claudia.md`, `Agents/skills/human-scribe/SKILL.md`, `Agents/skills/traffic-control/SKILL.md`, `README.md`, root `AGENTS.md` (one paragraph, fix item 8), `Agents/design.md` (header comment only: it told readers to point `AGENTS.md` at an outside design system, which the lean AGENTS.md no longer hosts).
Scope extension from round one (flag for review): `Agents/augustus.md` and `Agents/julius.md`, one line each (mechanical `node Agents/hai-harness.mjs` substitution required by "every installed instruction").
Outer: `.hai/Agents/project_context.md` (one Session bootstrap line, fix item 8, by Claudia's instruction). Mirrors only through `./hai-meta sync`: `.hai/AGENTS.md`, `.hai/Agents/{onboarding,claudia,augustus,julius}.md`, `.hai/Agents/skills/{human-scribe,traffic-control}/SKILL.md`, `.hai/Agents/hai-harness.mjs` (new, byte-identical to `bin/hai-harness.mjs`).
Not edited by me: outer planning, task files, packet, Human state, and Claudia's `.hai/Agents/handoffs/field-reliability-replay.md`. `.hai/Agents/planning.md` has a different hash from my first-round snapshot; I never edited it (Claudia did between rounds), and sync leaves it alone.

## How each requirement is met (current behavior)

1. Startup block. `scaffold/AGENTS.md` is now 312 words: a one-line intro, "Start here" with three steps (update check; role; lane before any write), an "Always" list of eight one-line invariants, and a closing pointer to `Agents/onboarding.md`. Role pick matches only when the message or task contract addresses or assigns a role (Claudia, Momus, Augustus, Julius, Athena, Hephaestus; misspellings count; a mere mention assigns nothing); otherwise Claudia, who reads onboarding before any code search or edit. Step 3 checks the primary is clean, runs `node Agents/hai-harness.mjs worktree create <task-slug>`, and stops on CLI failure (no `git worktree add`, no hand-written `hai*` config). A test caps the file at 450 words, three steps and eight invariants. `onboarding.md` and `claudia.md` carry the detail.
2. In-project CLI. `init` installs `bin/hai-harness.mjs` as `Agents/hai-harness.mjs`; `update` refreshes it; `doctor` requires it. `init` and `update` run only from the positively identified package: the script is `<root>/bin/hai-harness.mjs` and `<root>/package.json` has name `hai-harness` (second round, item 1; it replaces the earlier `scaffold/AGENTS.md` heuristic, which let a project with its own `scaffold/AGENTS.md` run `update` from its installed copy and overwrite its files). Every other location is an installed copy: `init`/`update` exit 1 and print the `npx github:ClaudiusMa/HAI-Harness <cmd> <args>` form (the `.hai` copy also says "run ./hai-meta sync (or ./hai-meta bootstrap)"). Lane, human-sync and doctor commands run with no PATH, npm or network, including from a lane's own copy. Every printed hint uses `cliCommand`: `node <script path>`, relative to the working directory when inside it (`node Agents/hai-harness.mjs` in a project, `node bin/hai-harness.mjs` in this repo), absolute otherwise; never a bare `hai-harness`. Docs and README use the project form; a test scans every installed `.md` for a bare command.
3. Hand-made lanes. `approve`, `cleanup`, `human-sync` and `worktree status` say the lane was not created by the harness and give the recovery (commit pending work, `create <new-slug>` from the clean primary, `git merge <branch>` in the new lane, approve there, ask the user before removing the old lane). No mention of `git config` or key names; the commands inside use `cliCommand`.
4. Conflict copies (`<name> <N>`, N 2-99). Scope: Git common dir (refs, HEAD, index caches, worktree admin dirs, task packets; not loose `objects/xx`, not the quarantine) plus untracked non-ignored files in the primary and current lane (cleanup also the lane being removed). Quarantine: `<common>/hai-harness/quarantine/<UTC stamp>-<pid>/{git|tree/<checkout>}/<relative path>` with `manifest.txt`. Moved only when byte-identical to the original; a loose `refs/` copy whose commit is contained in the real ref; or an `index <N>` file whose original `index` exists (item 4: reason now says it may hold staged state and can be restored from the manifest; a missing original index keeps and reports). A copy that vanishes mid-sweep (another sweep took it) is skipped as handled, including when the rename hits ENOENT (item 7). Everything else is kept and reported with both paths, why and next step; tracked files are never candidates.
   - Stops `create|approve|cleanup|sweep` (kept and blocking, items 2 and 3): a kept copy of a ref, of `HEAD`, of a `worktrees/<name>` admin directory (Git lists it as an extra worktree) or of a `hai-harness/tasks/<id>` directory (cleanup would fail with "Invalid task packet identity"). The stop message states what was moved before it ("N redundant copies were moved ... nothing else was changed", or "Nothing was changed.") (item 5).
   - `approve` additionally refuses before `git add -A` through its own `assertNoCopiesToCommit(lane)`, called from `approveWorktree` after the sweep and the metadata checks: it reads `git ls-files --others --exclude-standard -z` once and, for every untracked path, takes the topmost component named like a copy whose original sibling exists (so `notes 2.md` vs `notes.md`, `.env 2` vs an ignored `.env`, and `src 2/` beside `src/` at any depth). It names each path, says it looks like a sync conflict copy, tells the user to merge/rename/remove it or use `--quarantine` for a user-approved file, and says that renaming it or staging it with `git add <path>` lets approve proceed. Orphan numbered files and directories (no original) only report. Directory copies no longer appear in doctor or sweep reports; only this guard sees them.
   - `worktree sweep --quarantine <path>` (item 6) moves exactly one named copy (Git metadata file or directory, or an untracked regular file in the primary or current lane) into the same quarantine; the manifest reason reads `user-directed with worktree sweep --quarantine; the sweep had kept it: ...`. A relative path is resolved against `--target` (default the current directory; item 5, stated in the help text). It refuses non-copy names, tracked files, files whose owning repository is not this checkout (a nested repository or submodule, checked with `git rev-parse --show-toplevel` in the file's directory; item 4), paths outside the repository, and directories in checkouts. Installed instructions say to use it only for a path the user explicitly approved.
   - `doctor` runs the same planner and only warns.

## Design choices to explain

- `worktree sweep` (and its `--quarantine` form) exists because the instructions must name a runnable sweep; it calls the same functions as `create|approve|cleanup`.
- Packet templates are embedded in the CLI (`packetTemplates`) since `human-sync init` previously read `scaffold/task-packet/*`. `scaffold/task-packet/` was deleted in the code-quality pass (nothing else read it; `package.json` `files` lists the whole `scaffold` directory, so no change there); no test compares the embedded templates with files on disk. The project-copy test proves `human-sync` works from an installed project that has no such files.
- `doctor` works from the installed copy (needs no package root); contract over the earlier planning note.
- Sweep runs before the clean-primary check and before `git add -A`; planning drops a kept item whose copy vanished while it was judged (concurrent sweeps); stamp folders carry the process id so two sweeps in one millisecond never share a folder.

## Contracts / invariants

- The CLI never deletes data: the sweep only renames copies into the quarantine (a move that fails, for example across volumes, leaves the copy in place and reports it as kept). Never touch tracked files. `--quarantine` only on a user-approved path.
- The installed copy must never run `init`/`update`.
- `bin/hai-harness.mjs` stays the single source; `Agents/hai-harness.mjs` exists only in installed projects (this repo's is `.hai/Agents/hai-harness.mjs`).

## Verification

- Ran (in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/field-reliability`):
  - `node --check` on `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `.hai/Agents/hai-harness.mjs`; `git diff --check`; `cmp bin/hai-harness.mjs .hai/Agents/hai-harness.mjs`: pass.
  - `node --test test/hai-harness.test.mjs` on the merged tree with the lean AGENTS.md: **36 tests, 36 pass, 0 fail** (about 78 s): 33 from this lane plus 3 from Momus. The count was 37 before the code-quality pass (the directory-copy test was folded into the approve-guard test); earlier: 34/34 after the second fix round, 32/32 after the first, 28/28 after round one, baseline 24/24. No other suite, no installs, no network. The install test now also asserts `scaffold/AGENTS.md` is at most 450 words, has three start steps and at most eight invariants, and names all six roles.
  - Second-round tests: "init and update run only from the identified package; every other location is an installed copy" (item 1: real `bin/` layout runs; other package name and an `Agents/` copy beside a package-looking root are refused; a project with its own `scaffold/AGENTS.md` and `package.json` keeps its `AGENTS.md` and receipt when `update` is tried from its installed copy); the `src 2/` directory-copy cases (items 2 and 3: orphan directory `solo 2/` not a stop, `--quarantine` of a directory refused, `git add` then approve succeeds), now inside the approve-guard test; "--quarantine resolves relative paths against --target and refuses files owned by a nested repository" (items 4 and 5, with a same-named decoy in the calling directory left untouched).
  - Fix-round tests (offline temp fixtures): "approve refuses to commit a conflict copy (file or directory), and --quarantine moves only an approved, untracked file" (item 1 incl. `.env 2` vs ignored `.env`, orphan stays report-only, HEAD and index unchanged after refusal; item 6 refusals for non-copy name, tracked file, missing file, and user-directed moves with manifest marking; approve then succeeds without the copies); "kept worktree admin and task-packet directory copies stop lane commands ... and a missing original index is kept" (items 2, 3, 4, plus `--quarantine` of a directory as the way out); "simultaneous sweeps hand each duplicate to exactly one of them" (item 7: two concurrent processes over 60 duplicate pairs; both exit 0, no stop or kept text, moved counts sum to 60, 60 files in quarantine); "a package-side script in an Agents directory is not mistaken for the project copy" (item 10).
  - Extended existing tests: partial-quarantine stop message (item 5) and new stop header; new `index` reason text; hint form (`node Agents/hai-harness.mjs ...` in the project copy, `retry: node .../bin/hai-harness.mjs worktree cleanup` from a source run, no bare `hai-harness`); the `.hai` copy's update refusal mentions `./hai-meta sync` (item 8).
  - Ad hoc (scratch, not committed): two concurrent sweeps over 300 pairs with a debug print in the ENOENT branch: 146 and 154 renames lost the race, sum 300, no errors, no leftovers, so the ENOENT path is genuinely exercised.
- Not run: any broader suite; `./hai-meta doctor` (it would scan this real repository's `.git`, which holds real conflict copies; it only reports, but the brief bars scans of real repos); any sweep or create against a real repository; real iCloud; Windows.
- Status: verified for the tested cases.

## Startup-block scenario check (text trace, no agents spawned; Claudia runs the live replay)

Text under test: the 312-word `scaffold/AGENTS.md` (identical in `.hai/AGENTS.md`).

1. Unnamed coding request ("show me the transition code and change the bounce"): step 1 update check; step 2 no role addressed or assigned, so Claudia, who reads `onboarding.md` and the Claudia read order before any code search or edit; step 3 `git status --short` on the primary (dirty -> stop), `node Agents/hai-harness.mjs worktree create <slug>` (CLI missing or failing -> stop and tell the user); Always: she writes the contract in the lane and delegates, no product edits.
2. "claudida, ...": addressed with a misspelling of Claudia, so the same chain.
3. "augustus, ...": addressed: update check, onboarding.md then augustus.md and the worker read path; lane named by the contract or handoff, else clean-primary check and `worktree create`; stop on CLI failure.
4. "ask Augustus to fix the nav" or "spawned by Claudia": a mention assigns nothing, so Claudia (case 1).
5. New in the lean text: "Momus, ..." selects Momus; re-reading onboarding after a pause or compaction is stated in step 2.
- Gaps (for the replay): nothing forbids Claudia from reading product code after the read order (only edits); a session started inside a lane with no contract or handoff will try `create` from the lane and be refused with the primary's path. The lean text no longer repeats the task-packet, cleanup and Storybook rules, so the replay should confirm agents still reach them through onboarding.

## Merge of main (Momus) and lean AGENTS.md

Merge `c4ad49d` brought `5e5f420` into the lane (`git merge --no-commit --no-ff main`, committed after tests and sync). Six conflicted files; each kept both intents and no behavior choice was needed:

- `scaffold/AGENTS.md`: lane's Start here kept, Momus added to the role list in step 2; Momus's operating-rules text (root-task lane, delegated roles and same-task workers share the named lane with one writer) merged with this lane's command form and hand-made-lane sentence. Superseded by the lean rewrite below.
- `Agents/onboarding.md`: Momus-eligible Review line taken from `main`; "One lane per task" merged (delegated sessions reuse the parent's lane; new root task creates one with the project CLI); cloud-sync bullet kept; role bullets merged (role-pick wording from this lane, Momus in the explicit-role list, `main`'s cross-role bullet with the debugging skill).
- `test/hai-harness.test.mjs`: both sides kept in the two hunks (installed CLI copy lines plus Momus/debugging removal for the upgrade test and doctor check).
- `.hai/Agents/planning.md`: both sides kept verbatim (two "Last updated" lines, then the field-reliability and Momus iteration sections in that order). Claudia may want to tidy the duplicate header line.
- `.hai/AGENTS.md`, `.hai/Agents/onboarding.md`: mirrors, regenerated from the resolved sources by `./hai-meta sync`.
Auto-merged cleanly and kept as is: Momus's CLI list entries (`Agents/momus.md`, `Agents/skills/debugging/SKILL.md` in install, doctor and traced lists, plus the pre-Momus packet hash tolerance), role docs, skills, README. Momus's new files contain no `hai-harness` commands, so there was nothing to convert; the installed-docs scan test covers them. After the merge: 37 tests pass (34 of this lane plus 3 from Momus).

Word counts (`wc -w`): AGENTS.md 1,259 (merged state) / 1,051 (`main`) -> 312; onboarding 3,076 (merged) / 2,781 (`main`) -> 2,965; together 4,335 / 3,832 -> 3,277. This lane's onboarding additions were compacted to two sentences per bullet, and one clause was added where a removed rule was missing.

| Removed from AGENTS.md | Lives now in |
| --- | --- |
| `Agents/` is your scope | One-line intro in AGENTS.md; onboarding Purpose |
| `Human/` unread unless asked; changed only via human-scribe with approval | Kept in Always; onboarding Purpose and the "Agents maintain Human/" bullet; Task packet coordination |
| Design guide: single source of truth, match it, Hephaestus/Athena review against it | Always (read before UI work); `augustus.md`/`julius.md` Frontend rule; `athena.md` and `hephaestus.md` read paths; `design.md` header |
| Design guide: fill in or repoint to an outside design system | `Agents/design.md` header (reworded here: it said "point AGENTS.md at that source") |
| Storybook is opt-in | Onboarding Core Rules, "Storybook is explicit-user-triggered" |
| Update check details | Onboarding first Core Rule; AGENTS.md step 1 |
| Re-enter the read path after a pause or compaction; implement skill; code-review only when assigned; no host injection assumed | AGENTS.md step 2 (re-read); onboarding Worker read order step 6 and the Implementation and Review bullets; "no host injection" was descriptive and dropped |
| Task decision packet section | Onboarding "Task packet coordination" (same text) |
| One lane per root task, delegated roles share it; hand-made lane has no metadata, never forge `hai*` config | AGENTS.md step 3; onboarding "One lane per task" (compacted) and "The primary checkout stays clean" |
| Preview/dev from the task worktree | Onboarding "Run the project's own preview/dev command..." |
| Local commit/merge only via `worktree approve`, hooks preserved, no push/PR/deploy/publish | Always (approve, outward acts); onboarding "After focused verification and review..." |
| Routine task cleanup paragraph | Onboarding "Routine task cleanup is part of completion" (identical text); `claudia.md` |
| Repo is the durable source of truth; live direction governs | Onboarding "Latest decision wins" (one clause added here) |
| Latest confirmed decision supersedes older plans | Kept in Always; onboarding "Latest decision wins" and "Flag conflicts" |
| One active role per session; Claudia default root controller; Momus routing; delegation keeps role, parent and lane; peer controllers | Onboarding role and cross-role bullets and Role Index; `claudia.md` "Bug routing" |
| Capability and effort are separate | Onboarding "Capability and effort are separate" |
| Cross-role execution through planning, task docs, handoffs | Onboarding "Cross-role collaboration..." and file semantics |
| Check resolved direction after clarification | Onboarding "If material clarification was required..." |
| High-cost actions need a check-in | Kept in Always; onboarding |
| No `--no-verify`; no reset, stash, clean or dirty-file copying | Kept in Always; onboarding "The primary checkout stays clean"; `claudia.md` Worktree routing |
| Published package is canonical upstream; installed copy is a field instance | Onboarding "Keep source and field instances distinct" |
| Conflict copies: sweep, quarantine | Always (one line); onboarding "Cloud-sync conflict copies" (compacted) |

## Code-quality pass (reviewer's TAKE list)

Behavior unchanged except where noted. Line counts versus commit `c4ad49d` (merge commit; the lean-AGENTS.md step added 7 test lines before this pass): `bin/hai-harness.mjs` +66 / -95 (1,773 -> 1,744 lines, net -29); `test/hai-harness.test.mjs` +58 / -82 (net -24; versus the state just before this pass, 1,750 -> 1,719 lines, net -31). `scaffold/task-packet/` deleted (-25 lines).

- TAKE 1: approve guard is its own `assertNoCopiesToCommit(lane)`; removed `guardApprove`, `wouldCommit`, the `unsafe` block, the `open` filter tweak, `originalExists`, `findTreeConflictDirectories`, `treeDirectoryItem` and the extra `--directory` listing. One `ls-files --others` read, topmost copy-named component with an existing original. It runs inside `approveWorktree` after the primary/metadata checks (not in the dispatcher) so approve from the primary still gets its own "run from a task worktree" error first. The sweep and doctor no longer report untracked directory copies; tests updated, and the directory-copy test is folded into the approve-guard test (T2).
- TAKE 2: `registeredLaneRoots` removed; `conflictScope(target, { laneBranch })` finds the lane among the worktrees it already lists.
- TAKE 3: EXDEV cross-volume fallback, its `copyFile`/`rm`/`unlink` calls and the `fsConstants` import removed; a failed rename is reported through the existing "could not be moved" kept path.
- TAKE 4: `stop(headline, lines, footer)` builds both thrown messages; `quarantineAdvice` is the one shared `--quarantine` sentence (the two footers keep their meaning; the approve footer now says "for a file, only for a path the user explicitly approves ..." in the shared wording).
- TAKE 5: a single `runsFromProject` const; the `item.directory` flag and its `readerOf` guard are gone, so a kept FILE at `worktrees/<name> N` or `hai-harness/tasks/<name> N` now also blocks (a file there breaks cleanup's namespace check anyway; behavior change noted); `userDirected` folded into the manifest `reason`; `conflictScope` roots via `Promise.all(realpath)` + `Set`. `fileDigest` still streams.
- TAKE 6: nothing but the parity test read `scaffold/task-packet/*` (grep over code, docs, skills, README, `package.json` `files`, `hai-meta`, `.github`; `files` lists the whole `scaffold` dir). Deleted `scaffold/task-packet/`, the parity assertion and the stale comment. The project-copy test now proves the embedded templates by running `human-sync` capture in an installed project.
- TAKE 7: tried and reverted. A shared `compareWithOriginal(item, stat, original)` measured 36 non-blank lines for the helper plus both deciders versus 33 before, and it needed a subtle ref condition (`!(original?.isFile() && await sameContent(...))`), so it was not clearly simpler. `decideGitCopy`/`decideTreeCopy` keep their original tails (minus the `directory` and `originalExists` flags, and the unused `rel` parameter of `decideRefCopy`).
- TAKE 8: `sameTree`/`treeFingerprint` kept; the admin-directory test now first shows an identical `worktrees/alpha 2` copy being quarantined whole.
- TAKE 10a: the `own` hint (`./hai-meta sync`) removed from `main()`; the self-hosting assertion adjusted.
- Tests T1 (five redundant `-worktrees` cleanups removed; the pre-existing one in `makePacketFixture` stays), T2, T3 (`place()` simplified, no scaffold writes), T4 (duplicated update refusal removed, `--target "/tmp/a project"` quoting kept), T5 (`spawn` + `once`).
- Skipped as instructed: 9 (`--quarantine` for tree files stays), 10b (unreachable `assertSafeBranch` messages stay). `lexists` is a small new helper that replaced three inline `lstat` existence checks.

## Sync result

`./hai-meta sync` after the code-quality pass: exit 0; 30 of 30 sync paths byte-identical between source and `.hai/`. Only `.hai/Agents/hai-harness.mjs` changed; no file added or removed; planning, task files, handoffs, lessons, `_archive/` and `Human/` untouched.

## Limits and open risks

- Documented limit (not changed, per Claudia): the name pairing only recognizes N 2-99 and treats any `<name> <N>` beside an existing `<name>` as a copy, so a legitimate `Chapter 3.md` beside `Chapter.md` is reported if it differs; and a byte-identical "stub" counterpart is moved even when the pairing is coincidental (reversible through the manifest).
- `approve`'s guard (`assertNoCopiesToCommit`) refuses any untracked, non-ignored path with a copy-named component whose original sibling exists, at any depth. Ignored copies and copies without an original (orphans are printed) still pass through `git add -A`. A tracked copy-named directory that gains a new untracked file while its original sibling exists is also refused until the file is staged or renamed (a false positive with a one-command way through).
- The working-tree sweep sees untracked non-ignored regular files only (not conflict-named directories or ignored files).
- Existing real conflict copies (this repo's `.git/worktrees/task-cleanup/index 2`, the portfolio `.git` copies) were not touched or scanned; cleaning them is a separate, user-approved run after the sweep is accepted.
- `doctor` does not compare the installed CLI copy with the package version; it only checks that it exists.
- `hai-defer` markers: none added.

## Exact next step

- Claudia: review the code-quality pass and the TAKE 7 verdict, then commit the uncommitted work on top of `c4ad49d` (lean AGENTS.md, `Agents/design.md`, onboarding compaction, the code-quality pass, the `scaffold/task-packet/` deletion) and run the live agent replay of the startup openings against the 312-word AGENTS.md, including prompts that need the cleanup, Storybook and task-packet rules.

## Quality fixes after critique (2026-10-08, Augustus, uncommitted in the lane)

Claudia's rule-by-rule critique of `c4ad49d:scaffold/AGENTS.md` found two losses and three weaker wordings in the 312-word file. Fixed with the fewest words (AGENTS.md now 337 words, still three start steps and eight Always lines):

- L1 approve location: the integrate line now says `worktree approve ...` "from the task lane"; onboarding's approve bullet says it runs "from the unchanged approved task worktree and never the primary".
- L2 clean baseline: the Always line now reads "never reset, stash, clean or copy dirty files to fake a clean baseline, a dirty primary included" (step 3 already says to stop and have the user commit); onboarding's "primary checkout stays clean" bullet forbids the same whether the dirty tree is the primary or another lane.
- W1 step 1: the update check is "silent unless a newer release exists".
- W2: "Read and match `Agents/design.md`".
- W3: step 3 runs `worktree create` "from the primary checkout".

Verification: `./hai-meta sync` exit 0 (30 paths refreshed; only `.hai/AGENTS.md` and `.hai/Agents/onboarding.md` changed); `cmp` parity for `AGENTS.md`, `onboarding.md` and the CLI copy; `node --test test/hai-harness.test.mjs` 36/36 with no test edits (none asserts the changed text; the 450-word cap still holds); `git diff --check` clean. Not run: live agent replay of C and D (Claudia), Julius's recheck.

Human log: the user-approved 2026-10-07 decision entry (installed CLI, lane-first startup, conflict-copy cleaning, short AGENTS.md) was appended to `.hai/Human/decisions.md` as the human-scribe writer, verbatim, with no other Human file touched. The matching packet draft and trail entry are Claudia's to retire or acknowledge.

Reviewer wording fixes (same day): a kept copy-named FILE under `worktrees/` or `hai-harness/tasks/` now gets its own accurate stop explanation (the directory wording is unchanged), via an `item.directory` flag set in `decideGitCopy`; the approve-guard footer is rewritten as plain sentences around a reworded shared `quarantineAdvice`; the design-choices line about packet templates no longer implies a template-versus-scaffold test. Tests 36/36 (one regex adjusted), CLI copy in `.hai` byte-identical.
