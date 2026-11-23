# Handoff - calibration-evals

Last updated: 2026-11-23 (Follow-up 1 applied)
From: builder subagent (lane `calibration-evals`)
To: master session, then whoever runs the first paid calibration

## Status

- Done: maintainer-side calibration suite in `.hai/evals/`: runner, six scenarios (A–F),
  scripted user, `claude` / `codex` / `stub` host adapters, report with verdicts, README,
  and a `node --test` suite (14 tests, stub host only). All uncommitted in the lane.
- In progress: nothing.
- Not started: component-removal variants (they depend on wording the `lean-core` lane is
  changing); any paid calibration run.

## Files touched or in scope

- `.hai/evals/calibrate.mjs`, `.hai/evals/lib/**`, `.hai/evals/scenarios/**`,
  `.hai/evals/test/calibrate.test.mjs`, `.hai/evals/README.md`
- This handoff.
- Left as they were (historical): `protocol.json`, `product-prompts.json`,
  `haiku-2026-10-14/`, `claude_usage.py`, `usage.py`, `controller_buckets.py`.
- Not created: `.hai/evals/assumptions.json` (owned by `lean-core`).

## Contracts / invariants

- Runs execute only under the OS temporary folder or a `--workdir`; `safeRunRoot` refuses
  `~/Documents`, `~/Desktop` and any folder inside a Git repository. Lanes land in
  `<run>/_worktrees/project/<slug>` inside the run folder.
- No adapter defaults to a blanket permission bypass; only `--dangerous-bypass` does.
- No model name in the runner, adapters or scenarios (a test enforces it).
- A variant is installed with its own `bin/hai-harness.mjs init --default-role claudia`;
  `none` is the bare fixture. Both get identical prompts.
- Checks are deterministic, dependency-free and run one per Node process with a timeout;
  `browser` checks are listed but never scored.

## Verification

- Ran after Follow-up 1 (2026-11-23): `node --test .hai/evals/test/` from the lane root:
  16 pass, 0 fail. The two new tests cover repeated `--scenario` (runs d, c, e in order;
  duplicates once; `--host`/`--model` twice fail; report filter by list) and the user-config
  fingerprint (no content in the saved record; no warning when files match; a warning
  naming only the changed file after one file changes).
- Ran (first pass): `node --test .hai/evals/test/` from the lane root: 14 pass, 0 fail (about 33s).
  Covers six scenarios present; variant install (`none` bare, harness installed with
  `default=claudia`, clean baseline commit, `CLAUDE.md` import for the Claude host only);
  multi-turn scripted run with go-ahead and integration answers; fresh-session break
  (scenario C, new session on session 2; a stub step that demands a new session aborts a
  resumed run); scoring (every scenario's reference solution passes all scored checks; the
  untouched fixture fails most; browser checks unscored); lane scoring for unintegrated
  work; D wrong builds and asking first, B stale errors, E fix attempts and follow-ups, F
  leak and defect caught; scripted-user rules; turn cap; report verdicts (inconclusive
  below 3 runs, helps, hurts on cost, hurts on quality, no measurable effect, noisy
  inconclusive, configurable `minRuns`); CLI run + report with counterbalanced order;
  safety refusals; adapter argument defaults; no hard-coded model names.
- Ran: `node calibrate.mjs run --host stub --scenario all --variant none --variant current=<lane>`
  then `report`: all 12 runs completed, metrics as expected from the stub scripts.
- Plumbing calls (3 allowed, 3 used, each with a timeout):
  1. Claude Code adapter, new session, cheapest alias: the standalone CLI
     (`~/Library/Application Support/Claude/claude-code/2.1.328/.../claude`, not on `PATH`)
     answered `Not logged in · Please run /login` (no model call, cost 0). Blocked; not retried.
     The adapter parsed the JSON result (`session_id`, `is_error`, `result`) and surfaced the
     error. Resume, usage fields and transcript lookup were never exercised for real.
  2. Codex adapter, new session (`codex exec`, codex-cli 0.171.0-alpha.13 inside
     ChatGPT.app, not on `PATH`): reply `alpha`, thread id parsed from `thread.started`,
     per-call usage from `turn.completed` matched the rollout totals from `codexUsage`.
  3. Codex adapter, resume (`codex exec resume <id>`): same thread id, the model recalled
     the earlier word. Finding: after resume, `turn.completed` usage equals the thread's
     cumulative total, so per-call usage in Codex records is marked `cumulative`; run
     metrics come from the rollout files.
- Not run: any scenario against a real model; any browser check; the Codex sandbox's
  extra writable root (`sandbox_workspace_write.writable_roots`) with a real lane; Claude
  permission modes in a real run.
- Status: verified for the tested case (stub host); host adapters only plumbing-checked as
  listed above.

## Blockers / decisions needed

- Claude Code CLI on this machine is not logged in (`claude auth` / `/login` in a
  terminal). Until then the Claude adapter cannot run.
- Design questions, settled in contract Follow-up 1 (2026-11-22):
  1. `CLAUDE.md` stays in the Claude adapter only; `init` does not create it (AGENTS.md
     is the single entry per the 2026-09-10 decision).
  2. User config is not isolated (that would drop the login). Done: each record has
     `userConfig` (path with `~`, present flag, SHA-256; never content) and the report
     prints a Warning line when compared runs differ on any of those files.
  3. Unintegrated work stays scored from the lane and flagged.
  4. The Clay Club store API stays.
  5. Results stay in `.hai/evals/results/`; the README now says a calibration's records
     are committed with its report.
  6. Thresholds stay until real runs exist.
- Also fixed in Follow-up 1: a repeated `--scenario` silently kept the last value. It now
  accumulates (`--scenario d --scenario c` = `--scenario d,c`, duplicates run once), and
  any other non-repeatable flag given twice fails with a clear message. The report's
  `--scenario` filter takes the same list.

## Exact next step

- Log the Claude Code CLI in, then run the README's smoke test on scenario D with one
  repeat and a budget cap, and inspect the kept run folder and record before any full run.
