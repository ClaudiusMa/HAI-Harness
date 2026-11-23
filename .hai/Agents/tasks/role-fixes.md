# Task contract — role-fixes

Written 2026-11-23 by the master session (plain assistant, no HAI role) for one builder subagent.
Lane: `/Users/claudius/Documents/ProductLab/_worktrees/HAI-Harness/role-fixes` (branch `task/role-fixes`, base `16b5c41`). No other agent is writing in this repository.

## The owner's words (verbatim)

2026-11-23, asked "Are all the roles fixed or just the momus?", the owner was told three role issues were not done and what the master session would do about two of them:

> 1. Merge Augustus and Julius into one worker role, keeping both names working so existing habits and installs do not break.
> 2. Require the UI checker only when the spec table has more than one row or the build was previously rejected.
> 3. Leave Athena and Hephaestus as they are.

Asked "Fix the remaining role issues while the baseline waits on your login?", the owner answered:

> Yes, fix roles

Earlier standing direction (2026-11-22): the harness "was built from the less intelligent model", it should "work well with the lates model inteligentce", and "use your best judgement".

## Background

`Agents/augustus.md` and `Agents/julius.md` are the same file twice; only the name differs. Two copies drift, and the pair hides that there is one worker role with two named slots. Separately, every UI build, including a one-word text change, currently requires a second agent (a fresh read-only checker) before the user sees it. A replay agent on a clean install flagged that as heavy for trivial changes.

Read first: `Agents/onboarding.md`, `Agents/claudia.md`, `Agents/augustus.md`, `Agents/momus.md`, `Agents/tasks/TEMPLATE.md`, the role and path lists near the top of `bin/hai-harness.mjs` (`taskRoles`, `scaffoldPaths`, `builtInRoles`, `tracedPaths`, `laterTracedPaths`, doctor's `requiredPaths`), `.hai/evals/assumptions.json` (the rule inventory), and `.hai/Agents/handoffs/lean-core.md`. `README.md` and `CONTRIBUTING.md` explain the source-to-`.hai/` workflow.

## Change 1 — one worker role, two names

Design (decided by the master session; do not change it without reporting why):

- **New core file `Agents/worker.md`.** It holds the whole worker contract: everything now under "Working rules" in `augustus.md`, written once for "the worker" whose name is Augustus or Julius. Its queue is `tasks/<your name>.md`.
- **`Agents/augustus.md` and `Agents/julius.md` stay, as name files.** Each is a line or two: this name is a worker slot, its queue is `tasks/<name>.md`, the role is defined in [worker.md](worker.md). Keeping the files means every existing pointer still resolves (generated task files that say "Read first … ../augustus.md", handoffs, project notes), installs need no migration, and the installer's role lists stay as they are.
- **Per-worker project bias.** The optional "Default Scope" and "Avoid By Default" sections leave the name files. A project that wants a durable bias for one worker records it in its own `project_context.md`; say so in `worker.md` in one sentence, and give the `Agents/project_context.md` template one optional line for it. An install that already filled those sections has an edited core file, which `update` keeps and reports as it does today; nothing more is needed.
- **Read path.** In the core, the worker line becomes: your name file, [worker.md](worker.md), `tasks/<you>.md`, and the rest as now. `Agents/tasks/TEMPLATE.md`'s "Read first" line adds `worker.md` after the name file.
- **Names keep working.** "Augustus, …" and "Julius, …" still assign the worker role; Claudia still has two named slots for the Parallel Split Gate; `tasks/augustus.md` and `tasks/julius.md` are still generated and never overwritten. Nothing in `scaffold/AGENTS.md` needs to change.
- **Installer (`bin/hai-harness.mjs`), registration only:** add `Agents/worker.md` to `scaffoldPaths`, to doctor's `requiredPaths`, and to `tracedPaths` together with `laterTracedPaths` (the existing mechanism that lets a packet created before a path was traced stay readable). Reserve `worker` as a custom-role name the same way built-in names are reserved, with doctor reporting a custom role that uses it. Change nothing else in the CLI.

Tests to add or extend in `test/hai-harness.test.mjs`:

- install puts `worker.md` in place; doctor reports it when missing;
- the two name files are identical apart from the name, and each links `worker.md`;
- `update` over an install whose `augustus.md` is the previously shipped version replaces it with the name file and adds `worker.md`; an install with an edited `augustus.md` keeps it and reports it;
- a task packet created before this change stays readable and reports `Agents/worker.md` as unacknowledged drift, the way the existing Momus test does for `momus.md`;
- a custom role named `worker` is refused or reported like a built-in name;
- the word-budget test counts the worker path as core + name file + `worker.md` + `implement`, still at or under 2,200 words. The path is at 2,167 now, so the name file must be tiny and `worker.md` no longer than today's rules. If you cannot stay under 2,200 without dropping a rule, keep the rule and report it.

## Change 2 — the separate UI checker only when it pays

Current rule (`Agents/claudia.md`, Check; one sentence in the core): every UI build gets a fresh read-only checker before the user sees it.

New rule:

- A UI build gets the fresh read-only checker when its confirmed spec table has **two or more rows**, or when **an earlier build of the same request was rejected**.
- Otherwise (a one-row UI change on its first attempt, or a change with no spec table such as a bug fix that restores documented behavior), the builder's own evidence stands: one line per row and a screenshot for anything visual.
- Everything else about the checker is unchanged: fresh, read-only, fast tier, sees only the user's verbatim words and the screenshots, one pass, a mismatch goes back to the builder or to the user when the words allow both readings.
- Why, in a clause: an independent reader earns its cost where a misreading is likely (several items, or a reading that already failed once), not on a one-word change.

This supersedes part of the 2026-11-04 spec-gate decision (its requirement 3 gave every UI build a checker). Do not change when the spec table itself is required, the `Assumed` list, the go-ahead rule, or the rejection reset.

Apply it in `Agents/claudia.md` (owning location) and the core's one sentence, and anywhere else the old wording appears (`implement`, `README.md` if it describes the checker). Keep the lead path at or under 5,800 words.

## Not in scope

Athena and Hephaestus; the go-ahead and spec-table triggers; Momus; lanes; the local-runs rule; the calibration suite under `.hai/evals/` other than `assumptions.json`. Do not write `.hai/Human/decisions.md` or `.hai/Agents/planning.md`; the master session does that with the owner's approval.

## Mechanics this repository requires

- Product source is the repository root (`Agents/`, `scaffold/`, `bin/`). `.hai/` is this repository's own installed copy; change it only through `./hai-meta sync`.
- After changing core files, from the lane root: `node scripts/shipped-hashes.mjs`, then `./hai-meta sync`, then `npm test` (about 80 seconds, no network), then `git diff --check`. Check the mirrors match.
- Update `.hai/evals/assumptions.json`: mark the affected rules `changed` with decision date 2026-11-23, and add any new rule.
- Update `README.md` passages that describe the worker roles or the checker. Shipped docs never name a provider, model or version.
- Where a test pins text you moved, update the assertion so it checks the same intent; never delete a check to make the suite pass.
- Write the handoff `.hai/Agents/handoffs/role-fixes.md` from `handoffs/TEMPLATE.md`.

Work only inside this lane, with absolute paths. Do not edit the primary checkout at `/Users/claudius/Documents/ProductLab/HAI-Harness` or any other lane. Do not commit, run `worktree approve`, push, or open a pull request; leave changes uncommitted. Do not spawn other agents; the master session runs the independent review and replays after you report.

## Done when

Both changes applied; tests added; hashes regenerated, sync run, mirrors match, `npm test` passes, `git diff --check` clean; inventory and handoff updated.

## Final report (to the master session, not the owner)

For each change: every file touched and what changed. Word counts for the worker and lead paths. Test results with the actual commands and counts. What you did not verify. Anything in the design above you think is wrong, with the reason; do not silently deviate.

---

# Follow-up 1 (2026-11-23) — review findings and replay gaps

Your pass was re-tested by the master session (50 of 50), reviewed by an independent reader (sound, no rule lost, nothing breaks a normal existing install), and replayed twice on clean installs: "Julius, …" on an install upgraded from the previous version, and a one-row footer change through Claudia, which started no checker. Both held. Your template deviation ("for a worker") and both README sentences are accepted. Eight small corrections remain.

From the review:

1. **A custom role already named `worker`.** If a project has `custom/roles/worker.md`, and especially if it is the block's default role, doctor now says agents ignore it while the block still routes unnamed messages to it, and `--default-role worker` is refused. Make doctor's warning for this name say what is true and how to get out: `worker` is now the shared worker role's name; rename the custom role, and if it is this project's default, run `update --default-role <new name>` (or `own` or `claudia`). Cover it in the doctor test. Keep the change to that message.
2. **Custom-role read path.** The core says a custom role follows "the worker path", which now begins with a name file and `worker.md`, neither of which is the custom role's. Word it so a custom role picks up the worker path from the task file on.
3. **`traffic-control`.** "Augustus and Julius are the default worker roles" becomes two slots of one worker role.
4. **Tests that restate wording.** Reduce the checker test to what guards behavior: the old every-UI-build wording is absent from both files, and each file's trigger names both conditions (two or more rows; an earlier rejection). Loosen the exact-sentence pin of the `project_context.md` sentence in the worker test the same way.

From the replays:

5. **Spec-table skip missing from the core.** `claudia.md` says to skip the table for a single-item change whose wording allows one reading (the go-ahead still applies). The core's spec-gate line omits that, so a non-Claudia role reads the two as contradictory. State the exception in the core.
6. **`worker.md` against `implement`.** "Fix an obvious, reproduced, bounded bug directly" reads as covering any bug the worker meets, while `implement` says to report what is outside the contract. Make `worker.md` say a bug inside the contract's scope; one outside it is reported, not fixed.
7. **Blank design guide.** The header text in `Agents/design.md` reads as blocking any UI work while the guide is unfilled, even a text-only edit. Make it apply when the work needs a style value the guide does not define; work that needs none proceeds.

Budgets stay: worker path at or under 2,200 words (you are at 2,193, so items 5 and 6 need words trimmed elsewhere on that path), lead path at or under 5,800. If you cannot fit without dropping a rule, keep the rule and report the count.

Same mechanics and limits as before: hashes, `./hai-meta sync`, `npm test`, `git diff --check`, mirrors, inventory and handoff updated, nothing committed, no other agents. Report once, item by item, with the test count and the two word counts.
