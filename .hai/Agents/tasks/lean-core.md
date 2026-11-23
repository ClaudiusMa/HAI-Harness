# Task contract — lean-core

Written 2026-11-22 by the master session (plain assistant, no HAI role) for one builder subagent.
Lane: `/Users/claudius/Documents/ProductLab/_worktrees/HAI-Harness/lean-core` (branch `task/lean-core`, base `ca365f8`). A second agent is working in a sibling lane, `calibration-evals`, at the same time; its scope is listed under "Not yours".

## The owner's words (verbatim)

2026-11-22, first message:

> check all roles, instrauciotns, workflow, etc
> from your best judgemtn and community advice
> what are some imrpovements and adjusgment I need to have
> the harness was built from the less intelligent model, and I want it work well with the lates model inteligentce
> there also should be a way to auto adjust and tese or update or whatever, so when model get smarter the harenss dont limit it

2026-11-22, go-ahead:

> you need to have different sub agent ideally using opus to solve the problme for you
> you will be the master agent report and discuss with me
> use your best judgement
> i dont see a reason why we cant have multiple agents doing both at the same time

## Why this task exists

The installable harness docs were written for a weaker model. Three things now work against a stronger one:

- **Reading load.** Before her first action Claudia reads about 9,800 words of shipped method (`scaffold/AGENTS.md` 450, `Agents/onboarding.md` 4,338, `Agents/claudia.md` 5,034), plus project files. A worker reads about 5,700 (`onboarding.md`, `augustus.md` 589, `skills/implement/SKILL.md` 745), and most of onboarding is lead-only. A 2026 study of repository context files found agents follow them, cost rises by over 20%, and success does not improve; they help only for non-standard practices.
- **Duplication.** The read order is stated in three places, the delegation triggers in three, the cleanup rule in two, the task-packet paragraph in several role docs. Copies drift: `onboarding.md` line 96 still says Athena assigns fixes to "the worker who produced it", which predates the lead-builds decision.
- **Wording.** Current models follow instructions precisely. Stacked prohibitions and generic how-to that a capable model does unprompted make the agent rigid without protecting anything.

## What to build

The same rules, stated once, in far fewer words, so each role reads only what it needs. This lane preserves behavior: it changes how rules are organized and worded, not what the owner decided.

1. **Rule inventory first.** Before editing, list every distinct rule in the shipped docs (`scaffold/AGENTS.md`, `Agents/onboarding.md`, the role docs, the skills, the templates). Give each an id and one of three kinds:
   - `policy` — the owner's decision about control or workflow (find the decision in `.hai/Human/decisions.md` where one exists and record its date);
   - `safety` — protects Git state, data, or approvals mechanically;
   - `capability` — compensates for a model weakness (role confusion, forgetting, generic method).

   Save it as `.hai/evals/assumptions.json`. After the rewrite, add each rule's new location, or `removed` with the reason. This file is both your proof that nothing was lost and the list the calibration suite will later test against.

2. **Split onboarding.** Produce a short shared core every role reads, and move lead-only material to where only Claudia reads it. Workers, Momus, Athena and Hephaestus should read the core, their role doc and their contract. Adding or renaming a core file is allowed; register it in the installer's file lists.

3. **State each rule once.** Give every rule one owning location; elsewhere, link to it.

4. **Reword for a model that follows instructions precisely.** Say the outcome and the reason (the failure it prevents) instead of stacking prohibitions. Keep flat prohibitions for irreversible actions, safety and approvals. Remove role-lock repetition and generic method a capable model applies without being told; in the skills (`implement`, `debugging`, `code-review`, `handoff`), keep what is specific to this harness: what evidence to report, where to write, scope limits, stop conditions. Leave the craft content in `hephaestus.md` and `athena.md` alone apart from duplicated or stale lines; those files load only when the role is named.

5. **Fix the stale spots.**
   - `.hai/Agents/project_context.md` line 62 routes decisions through the retired `decision-logger`; it is `human-scribe` now.
   - `Agents/onboarding.md` line 96 (Athena and "the worker").
   - `Agents/skills/handoff/SKILL.md` embeds a template that lacks the `Rejected attempts` and `Failure reflection` sections `Agents/handoffs/TEMPLATE.md` has; keep one template.
   - `Agents/project_context.md` (the template) says "Always read a file before editing it, even mid-session."
   - Live docs still mention the retired `patterns.md`, `graveyard.md`, `retrospective` and `decision-logger` paths; drop the mentions. Keep the tombstone files themselves.

6. **Budget tests.** Extend the existing AGENTS.md word-budget test in `test/hai-harness.test.mjs` to cover the worker startup path and the lead startup path, so the docs cannot grow back unnoticed.

Targets, counting shipped method files only: worker path at or under 2,000 words; lead path at or under 5,500 words; the AGENTS.md block no larger than today (450 words, three start steps, eight invariants). If meeting a target would mean dropping a rule, keep the rule and report the miss.

## Must survive unchanged in trigger and effect

Wording may tighten; the behavior may not change. These are the owner's confirmed decisions or mechanical safety, and several are being discussed with the owner separately:

- every build waits for the user's go-ahead in chat (2026-11-19), with its exceptions and what never counts as a go-ahead;
- the spec gate: its triggers, the spec table, the `Assumed` list, the user's words travelling verbatim, the per-row evidence, the read-only checker for a UI build, and a rejection resetting to the spec;
- Claudia builds by default and delegates only on the listed triggers, without asking (2026-10-14); one writer per lane; one engineer per lane; wait instead of polling; compaction instead of a new session;
- worker tier and effort chosen per task from the five signals; no provider, model or version named anywhere;
- risk-based independent review and its list of risk areas;
- Momus's loop, including that he does not write product code and stops after three unsuccessful applied fixes;
- the check-in before high-cost actions, as narrowed by the contract change below;
- lanes through the project CLI, a clean primary checkout, integration only through `worktree approve` with explicit approval, integrate once per task, routine cleanup, conflict-copy handling, no `--no-verify`, no reset, stash or clean;
- push, pull request, deploy and publish each needing their own approval;
- `Human/` read only when asked and written only through `human-scribe` with approval; the decision trail;
- the default-role behavior and custom-role rules;
- the update check being notice-only;
- lessons through `lesson-logger` and Standing Gates.

If you believe one of these should change, write it under "Decisions needed" in your handoff. Do not change it.

## Contract change — local runs need no check-in (2026-11-22)

The owner decided this while you were working. Asked "Should local builds, test runs and installs run without a check-in?", the owner answered:

> Yes, allow local

This is the one behavior change in this lane. It replaces the old high-cost list (app builds, full test runs, dependency installation, broad migrations or backfills, networked verification, long-running scans). Why: that list stopped the builder from verifying its own work, which is the check a capable agent most needs to run.

The rule to write, once, with links from elsewhere:

- **Runs without a check-in:** work that executes on this machine in the task lane. That covers app builds, test runs including the full suite, typechecks and linters, local preview or dev servers, and installing the dependencies the project already declares.
- **Still needs a check-in:** anything that spends money or a metered quota (paid APIs, paid model runs, cloud resources); reaches a live system outside this machine, other than downloading declared dependencies; changes shared or durable data (a migration or backfill against a real database); or cannot be undone by discarding the lane.
- **Project limits win.** A project can set tighter or looser limits in its own `project_context.md`.
- **Long local runs.** The agent says a run will take a while and carries on; it does not ask.
- **Verification default.** With local checks free, the builder runs the checks that establish the result (the project's own tests and build), not the cheapest ones. Replace "use low-cost verification by default" wording accordingly.
- **Unchanged:** push, pull request, deploy and publish each keep their own approval. Adding a new dependency stays under the existing implement and risk-review rules. Athena's "High-Cost Behavior" section is about expensive design changes, a different thing; leave it.

Apply it everywhere the old list or its fields appear: the High-Cost Behavior section of `Agents/claudia.md`, the onboarding core, the `scaffold/AGENTS.md` invariant (within its word budget), the `Agents/planning.md` and `Agents/tasks/TEMPLATE.md` fields, the `Agents/project_context.md` template ("High-cost validation should stay opt-in"), the `implement` and `debugging` skills, and `Agents/momus.md`.

Your write scope gains two passages in the outer `.hai/Agents/project_context.md`: the "Git and safety boundaries" line that lists builds, dependency installation and broad test runs as gated, and the "Project-specific verification" sentence that keeps full suites and builds behind an approval gate. Bring both in line with this rule.

In the inventory, record this as kind `policy`, decision date 2026-11-22, superseding the old list. List it under "materially reworded" in your report. Do not write `.hai/Human/decisions.md`; the master session drafts that entry for the owner's approval.

## Mechanics this repository requires

- Product source is the repository root (`Agents/`, `Human/`, `scaffold/`, `bin/`). `.hai/` is this repository's own installed copy. Edit product source, never the `.hai/` mirrors by hand, except the one outer file named in step 5.
- After changing core files, run `node scripts/shipped-hashes.mjs`, then `./hai-meta sync`, both from the lane root. Check the mirrors match.
- Run `npm test` in the lane (about 80 seconds, no network). Where a test pins text you moved, update the assertion so it still checks the same intent; never delete a check to make the suite pass.
- Run `git diff --check`.
- In `bin/hai-harness.mjs`, change only what registering an added, renamed or removed core file needs.
- `README.md` and `CONTRIBUTING.md`: change only passages that describe structure you changed.

## Write scope

- `Agents/**`, `scaffold/**`, `test/hai-harness.test.mjs`, and the limited edits to `bin/hai-harness.mjs`, `README.md` and `CONTRIBUTING.md` described above.
- `.hai/` mirrors, only through `./hai-meta sync`; `.hai/Agents/project_context.md` line 62.
- `.hai/evals/assumptions.json`.
- `.hai/Agents/handoffs/lean-core.md` (use the handoff template).

## Not yours

`.hai/evals/**` other than `assumptions.json` (the `calibration-evals` lane), `.hai/Agents/planning.md`, `.hai/Human/**`, `package.json`, `release.json`, `.github/`. You may read all of it. You may read `.hai/Human/decisions.md`: the owner asked for this review.

Work only inside this lane. Do not edit the primary checkout at `/Users/claudius/Documents/ProductLab/HAI-Harness` or any other lane. Do not commit, run `worktree approve`, push, or open a pull request; leave your changes uncommitted in the lane. Do not run a behavior replay with other agents; the master session runs an independent review and replay after you report.

## Done when

- The inventory accounts for every rule: kept (with location), merged (with location), or removed (with reason).
- Hashes regenerated, sync run, mirrors match, `npm test` passes, `git diff --check` is clean.
- The handoff is written.

## Final report (to the master session, not the owner)

Give the before and after word counts for the worker path and the lead path; the count of rules kept, merged and removed; every rule you removed or materially reworded, with the reason; the test results with the actual commands; any target you missed and why; what you did not verify; and your "Decisions needed" list. Do not describe unverified parts as working.

---

# Follow-up 1 (2026-11-22) — review findings, replay gaps, and the Momus change

Your first pass was reviewed by an independent reader and replayed by five fresh agents on a clean install. Verdict: sound, no owner decision lost, all five replays held the gates. This follow-up closes what they found. Same lane, same mechanics, same limits as above. Report Part A and Part B separately.

Your two open questions are settled: the go-ahead definition stays in the shared core, and the lead budget counts `implement`.

## Part A — behavior-preserving corrections

From the review (a rule's reach shrank, or a statement is wrong):

1. **Design guide on the worker path.** The old worker docs told a worker to read `design.md` before UI work and follow any design contract its handoff names. That now sits only in the `AGENTS.md` block, which a host may not load into a child session. Put one clause on the worker's own path (the core's worker line or `implement`). No rule that binds a worker may depend on the block.
2. **Spec-gate reach for non-Claudia root sessions.** The core keeps the triggers but only links to `claudia.md` for the rest. Restore to the core, in a sentence or two: the table's row shape (one row per item: what the user sees, what changes, between which values, what stays fixed), that a UI build gets a fresh read-only checker, and that a rejected build is never patched (correct the table, record the attempt, report the failure evidence). Detail stays in `claudia.md`.
3. **Traffic control is a standing rule.** It is now only a Startup step, so nothing sends Claudia back to it when overlap appears mid-session. State it as: at startup and whenever overlap appears, before new delegation, shared verification, generated-output rewrites, server changes or outward acts.
4. **Custom-role read path.** Restore "then follow the worker path for any contract or handoff addressed to you".
5. **`update` and edited core files.** `onboarding.md` says `update` replaces core files. The CLI keeps and reports a core file the project edited. Say that.
6. **`doctor` and `lanes.md`.** Add `Agents/lanes.md` to doctor's required paths, and cover it in the doctor test if that test lists required files.
7. **Block invariant.** Name the shared-or-durable-data class in the `scaffold/AGENTS.md` approval line if the 450-word budget allows.
8. **Small drops to restore:** the update-check fallback (run it if the entry block did not); Momus not loading global planning by default; in the go-ahead rule, that a build step inside a proposal is marked as waiting for the go-ahead.
9. **README.** Line 35 still describes the old high-cost gate. Bring README passages that describe the gate, or Momus (Part B), in line with the new rules.
10. **Outer `.hai/Agents/project_context.md` line 59** says "low-cost checks"; align it with the verification default. It is in your write scope now.

From the replays (agents had to guess; the old docs had the same gaps):

11. **A non-Claudia role the user addresses directly, with no contract.** State once what it does. The user is the assigner. The go-ahead and spec rules apply to it as to any root. It creates its own lane as a root session at its first write, records the user's words, spec and go-ahead in its own task file (`tasks/<role>.md`; Momus uses the incident handoff), reports to the user, and closes out through `lanes.md`. Change the task template's stop condition so it reads "until Claudia, or the user addressing you directly, assigns…".
12. **Asking needs no lane.** A proposal, spec table or question writes nothing, so the lane is created at the first write. Both Claudia replays read it this way; say it in a clause.
13. **"Just do it" covers the build only.** A paid, external or irreversible run asked for in the same message still needs its own check-in. Say so where the exception is defined.
14. **An unfilled design guide.** When `design.md` is still the blank template, the agent says so, proposes values that fit the existing look, and asks whether to record them. Put this in `design.md`'s own header, which costs the startup paths nothing.
15. **`human-scribe` target.** It offers `.` or `.hai` without saying which an installed project uses. The CLI resolves both to the same packet there (`harnessRootFor`). Say: run with `--target .` from the lane root.
16. **Claudia's Startup step on inbox drafts.** A new task has no packet at intake. Word the step as applying when resuming a task that has one.

Budgets after these additions: worker path (core + role doc + `implement`) at or under 2,200 words; lead path, now counting `implement`, at or under 5,800. Update the test constants and its comment, which should say the worker count is the shipped files a worker is told to read and that the block is capped separately. If you need more than these, report it instead of raising them.

## Part B — Momus may probe and fix (owner-delegated decision, 2026-11-22)

Asked "Should Momus be allowed to write probes and fixes himself?", the owner answered:

> use your best judgment

The master session decided yes. This supersedes the part of the 2026-10-07 decision that has Momus coordinate a worker for every probe and fix. Why: forcing a second agent for every unclear bug adds a hand-off and a cold start without adding independence, and the agent that found the cause is the best placed to test it.

The rule to write:

- **Momus writes.** In an incident he may write probes, instrumentation, the fix and its regression test himself, in the incident lane, while he holds its writer slot. One writer per lane still holds: when Claudia delegates an incident she hands the slot to Momus, and he hands it back with his report.
- **Authority is unchanged.** Diagnosis-only stays read-only. A repair still needs the user's go-ahead under the ordinary rule, or the repair authority the delegating contract carries.
- **He still verifies the symptom.** After removing his probes he re-checks the original symptom on the final candidate and reports the evidence, labelling a mitigation or an unverified result as such.
- **Independence where it pays.** A fix in a risk area (the existing risk-area list), or one the user asks to have checked, gets a fresh reader who did not write it, under the existing review rule. Momus cannot be the independent reviewer of a fix he wrote.
- **A worker is optional.** He may still hand a sizeable or mechanical fix to a worker under the ordinary delegation triggers; then the worker holds the slot and Momus verifies, as today.
- **Unchanged:** the stop before a fourth unsuccessful applied fix; obvious, reproduced, bounded fixes staying with the lane's current writer; a named Momus root being a peer controller; Claudia owning planning, lessons and packet changes for a delegated incident.

Apply it wherever the old loop is described: `Agents/momus.md`, the `debugging` skill, the Bugs section of `Agents/claudia.md`, the Momus line in the core, `traffic-control` and `human-scribe` where they describe his worker, and the README passages about him. In the inventory, mark the affected rules `changed`, decision date 2026-11-22, origin "owner delegated the choice to the master session".

## Done when

Hashes regenerated, sync run, mirrors match, `npm test` passes, `git diff --check` clean, the inventory and handoff updated. Report Part A item by item (done, or why not), then Part B: every file and rule it touched. The master session re-runs the tests and replays afterwards; do not run replays yourself.
