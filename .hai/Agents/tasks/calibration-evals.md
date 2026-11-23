# Task contract — calibration-evals

Written 2026-11-22 by the master session (plain assistant, no HAI role) for one builder subagent.
Lane: `/Users/claudius/Documents/ProductLab/_worktrees/HAI-Harness/calibration-evals` (branch `task/calibration-evals`, base `ca365f8`). A second agent is working in a sibling lane, `lean-core`, at the same time; its scope is listed under "Not yours".

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

Every HAI-Harness rule is a bet that a model is weak at something. Field failures have added rules since September; nothing removes one when a newer model no longer needs it. The owner wants a way to test, per model, which parts of the harness still earn their keep.

The existing eval cannot answer that:

- It has one scenario (a three-request "Clay Club" signup app). Both conditions score 13/13, so it measures only overhead.
- Scenarios B (discussion-heavy build) and C (fresh-chat continuity) are written down in `.hai/Agents/handoffs/harness-overhead-eval.md` but have no recorded run. They test what the harness is for.
- It is run by hand, and `protocol.json` is pinned to one model.
- The original fixture lived outside the repository and is gone; only file hashes remain in `protocol.json`.

## What to build

A maintainer-side calibration suite in `.hai/evals/` (development context; it is never shipped to users). Given a host, a model label and a set of harness variants, it runs each scenario under each variant, scores the result, and reports whether each variant helped or hurt.

1. **Variants.** A variant is `none` (the bare fixture) or a HAI-Harness source tree given as a path, installed into a copy of the fixture with that tree's own `bin/hai-harness.mjs init` and `--default-role claudia`, so the same prompt text reaches both conditions. Any checkout or lane can be a variant, which is how "current harness", "lean harness" and "one component removed" will be compared later. Do not write component-removal patches now: they depend on wording the `lean-core` lane is changing.

2. **Scenarios.** Each is a self-contained folder: fixture, scripted user turns, a reply policy for questions the agent asks, checks, and a short statement of which harness behavior it tests. Build these six; the first, third and fourth matter most.
   - A — same-chat build (the existing three prompts in `product-prompts.json`). Kept as the overhead regression.
   - B — discussion-heavy build: several product turns with reversals before the build request. Measures stale-requirement errors (a rejected or superseded option appearing in the result).
   - C — fresh-chat continuity: request 1 in one session, requests 2 and 3 in a new session. Measures requirements lost across the break.
   - D — ambiguous multi-item visual request with one intended reading held by the scripted user. Measures whether the agent asked before building and whether it built the wrong thing.
   - E — a bug whose cause is not where the symptom appears. Measures whether the cause was found and how many fix attempts were applied.
   - F — a change in a risk area (shared interface or data that leaves the device) with a seeded defect an independent reviewer should catch.

   Design the tasks so a strong model can still fail them; a scenario that every variant passes tells us nothing. Recreate a Clay Club starter fixture for scenario A from the prompts and `protocol.json` scoring list.

3. **Scoring.** Checks must be deterministic and need no installed dependency. Where a check needs a rendered page, mark it `browser` and leave it out of the automated score rather than approximating it. Per run, record: checks passed and total, wrong-build events, user interruptions (extra turns the scripted user had to answer), tokens (total and uncached input), model calls, subagent count, and wall time. Reuse the counting logic in `claude_usage.py` and `usage.py` where it fits.

4. **Scripted user.** Deterministic by default: a reply policy per scenario answers confirmation requests, go-ahead requests and integration approvals, and in scenario D answers questions from the hidden intended reading. Cap the number of turns.

5. **Host adapters.** One for Claude Code headless mode, one for Codex non-interactive mode, and a `stub` adapter that replays canned behavior so the runner can be tested without a model. Check the real flags with each CLI's `--help` on this machine before writing an adapter; do not rely on memory. Model label, host and effort are flags; no model name is hard-coded anywhere.

6. **Report.** A command that aggregates saved runs into one table per scenario (variant × metric) and, for a variant compared with a named base, a verdict: `helps`, `no measurable effect`, `hurts` or `inconclusive`. Always print the number of runs, and return `inconclusive` below three runs per cell. Thresholds are configurable.

7. **Docs.** `.hai/evals/README.md`: what each scenario measures, how to run a calibration when a new model ships, how to read the report, a rough cost estimate per full run (the earlier pilots used 4–8 million tokens per scenario-A run), and what is not automated. Leave the old files in place and say in the README that `protocol.json` and `haiku-2026-10-14/` are historical records.

## Safety limits

- Every run executes in a fresh directory under the operating system's temporary folder (or a `--workdir` the caller passes), laid out so that harness task lanes land inside that same run folder. Never run a scenario inside `~/Documents/ProductLab` or any real repository, and never create a folder at the ProductLab top level.
- The adapters must not default to a blanket permission bypass. Make any such mode an explicit flag the caller passes.
- Paid model runs are not part of this task. Validate the runner with the stub adapter. You may make at most three trivial calls on the cheapest available model, each with a timeout, only to confirm an adapter's plumbing (session id, resume, usage fields). If a call is blocked or hangs, stop trying and report it.
- No dependency installs.

## Write scope

- `.hai/evals/**`, except `.hai/evals/assumptions.json` (the `lean-core` lane owns that file; do not create it).
- `.hai/Agents/handoffs/calibration-evals.md` (use `.hai/Agents/handoffs/TEMPLATE.md`).

## Not yours

Everything else, including `Agents/`, `scaffold/`, `bin/`, `test/`, `package.json`, `README.md`, `.hai/Agents/planning.md` and `.hai/Human/`. You may read all of it. You may read `.hai/Human/decisions.md`: the owner asked for this review.

Work only inside this lane. Do not edit the primary checkout at `/Users/claudius/Documents/ProductLab/HAI-Harness` or any other lane. Do not commit, run `worktree approve`, push, or open a pull request; leave your changes uncommitted in the lane.

## Done when

- The runner, six scenario folders, three adapters and the report command exist.
- A `node --test` suite for the runner passes using the stub adapter, covering at least: variant install, a multi-turn scripted run, a fresh-session break, scoring, and the report verdicts including `inconclusive`.
- The README and handoff are written.

## Final report (to the master session, not the owner)

State what exists and where; what you verified and how, with the commands and results; what you did not verify (say plainly which adapters never ran against a real model); any scenario you could not finish; and the design questions you want settled. Do not describe unverified parts as working.

---

# Follow-up 1 (2026-11-22) — design questions settled, two small changes

The master session re-ran your suite (14 of 14 pass) and a stub run with a report. The owner said to use best judgment, so your six design questions are settled as follows.

1. **`CLAUDE.md` for Claude runs:** keep it in the adapter only. The 2026-09-10 decision makes `AGENTS.md` the single entry and leaves host pointers to the host's own integration, so `init` does not create it.
2. **User config in real runs:** do not isolate it; isolation would also drop the operator's login. Instead, record in each run record which user-level instruction and settings files were present (path and content hash, never content), and have the report print a warning when records being compared differ on them. **Change needed.**
3. **Unintegrated work:** keep scoring it from the lane and flagging it. Leaving work unmerged until the user approves is the harness following its rule.
4. **Store API in the Clay Club fixture:** acceptable; it shapes both conditions equally.
5. **Results location:** keep `.hai/evals/results/`, and say in the README that a calibration's records are committed with its report, as the October pilot's were.
6. **Thresholds:** leave them; revisit after the first real runs.

One more change: a repeated `--scenario` flag silently keeps only the last one (`--scenario d --scenario c` ran only `c`). Make a repeated flag either accumulate or fail with a clear message, and cover it in the test suite.

Same lane, same limits, no model calls. Report once: what changed, and the test result.
