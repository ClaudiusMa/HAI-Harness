# Calibration evals

Maintainer-side tooling for HAI-Harness development. It is not shipped to users.

Every harness rule is a bet that a model is weak at something. This suite tests, for a
given host and model, whether a harness variant helps or hurts compared with no harness
(or with another variant), scenario by scenario, so rules that a newer model no longer
needs can be found and removed.

Zero dependencies: Node and Git (tested with Node 26.13). Everything runs from this folder.

## Files

| Path | What it is |
|---|---|
| `calibrate.mjs` | The command: `list`, `run`, `report` |
| `lib/runner.mjs` | Runs one scenario under one variant on one host and saves the record |
| `lib/variants.mjs` | Installs a variant into a fresh copy of the fixture; finds lanes; picks the tree to score |
| `lib/scripted-user.mjs` | The deterministic scripted user |
| `lib/checks.mjs`, `lib/check-worker.mjs`, `lib/check-context.mjs` | Runs each check in its own Node process; helpers checks use |
| `lib/clay-club-checks.mjs` | Behavior checks shared by scenarios A, B and C |
| `lib/usage.mjs` | Token counting from host session records (ports of `claude_usage.py` and `usage.py`) |
| `lib/report.mjs` | Aggregation, tables and verdicts |
| `lib/adapters/` | `claude` (Claude Code headless), `codex` (Codex non-interactive), `stub` (canned) |
| `scenarios/<id>/` | `scenario.json` (prompts, reply policy, limits), `fixture/`, `checks.mjs`, `stub/` |
| `test/calibrate.test.mjs` | `node --test .hai/evals/test/` from the repository root; stub host only |
| `results/` | Saved run records (created by the first real run). A calibration's records are committed together with its report, as the October pilot's usage files were. |

Historical records, kept as they are: `protocol.json` and `product-prompts.json` (the
frozen 2026-10-12 pilot; its original fixture is gone and only file hashes remain),
`haiku-2026-10-14/` (usage of the Haiku pilots), and `claude_usage.py`, `usage.py` and
`controller_buckets.py` (the scripts those pilots used). Scenario A reuses the three prompts
from `product-prompts.json` and recreates a Clay Club starter from them.

## Scenarios

`node calibrate.mjs list` prints these. Each folder is self-contained.

| Id | Tests | Main measures |
|---|---|---|
| **A** `a-same-chat-build` | Overhead on a plain three-request build in one chat (the earlier pilot, now automated). Quality should be equal; this is the cost regression. | tokens, time, calls, subagents, interruptions |
| **B** `b-discussion-build` | Five discussion turns with reversals (layout rejected, 8 → 6 places, notes field added then dropped, duplicate rule changed), then build and a follow-up. Does the result follow the latest decisions? | `failed_stale` (stale-requirement errors) |
| **C** `c-fresh-chat` | A's request 1 in one host session; requests 2 and 3 in a new session that only has the repository. | `lostRequirements` (failed request-1 checks), `session2Seconds`, `session2CallsBeforeFirstEdit` |
| **D** `d-ambiguous-visual` | "Bigger photos, the price in the corner, and the badge in green" on a menu with two card sections and two badges. The scripted user holds one reading (`hiddenReading` in `scenario.json`) and reveals it only when asked. | `askedFirst`, `wrongBuilds` |
| **E** `e-misplaced-bug` | Every second invoice in a batch loses its discount. The user blames `src/render.js`; the cause is `rules.reverse()` mutating shared state in `src/pricing.js`. | `causeFound`, `fixAttempts`, red herring left alone, regression test added |
| **F** `f-risk-review` | Add the signed-in user to crash reports (data that leaves the device, through an interface shared with a worker). Seeded defect: `sanitize()` strips personal fields only at the top level, so `user: page.user` leaks email, phone and name. | `leak`, `defectCaught`, worker still works |

A, C and D matter most for the harness's claims. Each has failure modes a strong model can
hit (for example A's `edit_own_email_case`, B's trimmed duplicate rule, E's regression
test check, F's nested leak), so a scenario every variant passes is a finding in itself:
it no longer discriminates and should be made harder.

### Checks

- Every check is deterministic and needs no installed dependency. Behavior checks import
  the agent's modules in Node; the Clay Club fixture documents a small store API in its
  README (`signup.js`, `createSignup({ storage })`) so the rules can be tested without a
  page. Both conditions see the same README.
- Kinds: `auto` (scored), `transcript` (scored; reads the agent's replies, for example
  "asked before building"), `browser` (needs a rendered page; listed with `pass: null` and
  left out of the score, never approximated).
- D's CSS checks read the stylesheet statically with a small rule reader. Their
  descriptions say what they read; an unusual but valid structure can be misjudged, so
  look at the run folder when a D result surprises you.
- The suite's own test checks that each scenario's reference solution (`stub/solution/`)
  passes every scored check and that the untouched fixture fails most of them.

## Per-run record

Each run saves `results/<run id>.json` with the variant (label, source path, commit,
dirty flag, baseline commit), host settings, model label, every agent call (message, reply,
files changed in the primary checkout and in lanes, probe result, scripted-user rule), the
check results and these metrics:

`checksPassed`/`checksTotal`/`passRate`, `browserChecks`, `wrongBuilds` (agent calls that
changed files and left the tree contradicting the intended reading; scenario D's probe),
`interruptions` (extra turns the scripted user had to answer), `totalTokens`,
`uncachedInput` (input that was not a cache read), `modelCalls`, `subagents`,
`wallSeconds` (sum of host call durations), `agentCalls`, `failed_<tag>` per check tag,
and the scenario metrics in the table above. `capped` marks a run that hit its turn cap;
`aborted` holds a host error that stopped the run.

`userConfig` lists the host's user-level instruction and settings files (Claude:
`CLAUDE.md`, `settings.json`, `settings.local.json` in the config folder; Codex:
`AGENTS.md`, `AGENTS.override.md`, `config.toml` in `CODEX_HOME`) as path (home shown as
`~`), whether each is present, and a SHA-256 of its content. Content is never stored.
Runs do not isolate these files, because isolating them would also drop the operator's
login. The report warns instead (see below).

## Variants

- `none`: the bare fixture.
- A HAI-Harness source tree, as a path or `label=path`. The runner copies the fixture into
  `<run>/project`, commits it, then runs that tree's own
  `node bin/hai-harness.mjs init --target <run>/project --default-role claudia` and commits
  again, so `worktree create` sees a clean primary. HAI task lanes land in
  `<run>/_worktrees/project/<slug>`, inside the run folder.
- Any checkout or lane works, which is how the current harness, a lean harness or a
  harness with one component removed will be compared. Component-removal variants are not
  part of this suite yet: make each one as a branch or lane and pass its path.
- For the Claude host, when the variant installed `AGENTS.md` and the fixture has no
  `CLAUDE.md`, the adapter adds a one-line `CLAUDE.md` (`@AGENTS.md`), as this repository
  does, because Claude Code reads `CLAUDE.md`. Codex reads `AGENTS.md` itself.

Scoring uses the primary checkout when it moved past the baseline; otherwise the most
recently changed lane, and the record lists unintegrated lanes (`artifact`).

## Scripted user

Deterministic. After every agent reply it decides whether the agent is waiting (a question
or a go-ahead / approval request in the closing part of the reply; "let me know if..."
alone does not count). If so it answers from the scenario's reply policy:

1. `clarifications` (scenario D): every matching rule's answer, from the hidden reading.
2. Integration requests ("worktree approve", merge, integrate): "Yes, approve and integrate it."
3. Go-ahead and confirmation requests: "Yes, go ahead."
4. Anything else: a fixed fallback ("I have nothing to add... use your best judgement").

Discussion turns (`answerQuestions: false`, scenario B) are never answered; the next
scripted turn is the answer. `followUps` (scenario E) fire when the agent is not waiting
and a probe says the bug is still there, up to `maxTimes`. Every answer counts as an
interruption. Limits per scenario: `maxAgentCalls` (total) and `maxRepliesPerTurn`.

## Running a calibration when a new model ships

1. Pick the variants: `none`, the current harness (this checkout or the released tag in a
   separate checkout) and any candidate (a lean lane, a component-removed branch).
   Commit each variant's tree first so its commit is recorded; a dirty tree is flagged.
2. Smoke-test the plumbing on one cheap scenario with one repeat:

   ```sh
   node .hai/evals/calibrate.mjs run --host claude --model <model> --effort medium \
     --scenario d --variant none --variant current=. --repeats 1 \
     --permission-mode auto --max-budget-usd 5
   ```

3. Run the full set with at least three repeats (order is counterbalanced: the variant
   list rotates each repeat):

   ```sh
   node .hai/evals/calibrate.mjs run --host claude --model <model> --model-label <label> \
     --scenario all --variant none --variant current=. --variant lean=../_worktrees/HAI-Harness/lean-core \
     --repeats 3 --permission-mode auto
   ```

   Codex: `--host codex --model <model> --effort <level>`.
4. Report: `node .hai/evals/calibrate.mjs report --base none --model <label>`.
5. A rule whose component-removed variant shows `no measurable effect` or `helps` against
   the full harness (use `--base current`) is a removal candidate. Record the decision and
   the report in the planning records.

Host options:

- `--host-bin <path>` (or `CLAUDE_BIN` / `CODEX_BIN`) when the CLI is not on `PATH`.
- Claude defaults: `--permission-mode acceptEdits`, `--permission-prompts none` (anything
  that would prompt is denied instead of hanging), `--strict-mcp-config` (no MCP servers;
  `--allow-mcp` to keep yours), `--add-dir <run folder>` so lanes are reachable.
  Most real runs need `--permission-mode auto` so the agent can run Git and Node.
  `--subagent-model` sets `CLAUDE_CODE_SUBAGENT_MODEL`; `--max-budget-usd` caps each call.
- Codex defaults: `-s workspace-write` with the run folder as an extra writable root.
- `--dangerous-bypass` is the only way to get a full permission bypass
  (`--dangerously-skip-permissions` / `--dangerously-bypass-approvals-and-sandbox`). Use it
  only in a sandboxed machine.
- `--host-arg <arg>` (repeatable) passes anything else through.
- Repeatable flags: `--variant`, `--host-arg` and `--scenario` (`--scenario d --scenario c`
  is the same as `--scenario d,c`; a scenario named twice runs once). Any other flag given
  twice stops with an error instead of keeping the last value.
- `--workdir <dir>`: where run folders go (default: the OS temporary folder). It refuses
  anything under `~/Documents` or `~/Desktop` and any folder inside a Git repository.
- `--no-keep` deletes each run folder after scoring; by default it is kept for inspection
  and its path is printed.
- `--call-timeout-min` (default 30) per host call.

No model name is built in. Without `--model` the host's default runs and the record says
`host-default`; use `--model-label` to name it in reports.

## Reading the report

One table per scenario, model and host; one row per variant; every metric is the mean over
runs, with the run count always shown (`±` is the standard deviation of the pass rate).
Below each table, every variant gets a verdict against `--base` (default `none`):

- `inconclusive` whenever either cell has fewer than `minRuns` (3) runs, when quality
  signals disagree, or when a pass-rate change is within noise.
- `helps` / `hurts` on quality: the pass-rate difference is at least `qualityMargin` (5
  points) and at least `qualityZ` (2) standard errors; or the summed per-run difference in
  error events (`wrongBuilds`, `failed_stale`, `failed_request1`) is at least `errorMargin`
  (0.5).
- At equal quality: `hurts` when tokens or time exceed `tokenRatio` / `timeRatio` (1.25×);
  `helps` when tokens are below 1/1.25 without a time penalty; otherwise
  `no measurable effect`.

A table whose runs differ on any user-level file (a different hash, present in some runs
and absent in others, or runs saved without a fingerprint) carries a **Warning** line that
names the files. Differences in such a table may come from the operator's setup rather
than from the variant: rerun, or compare only runs made with the same files.

Change thresholds with `--thresholds file.json` (any subset of the keys in
`lib/report.mjs` `DEFAULT_THRESHOLDS`). `--json` prints the aggregate instead.

## Cost (rough, unmeasured for this suite)

The earlier scenario-A pilots used 4–8 million tokens per variant run, almost all of it
cache reads (the Haiku pilot: 4.06M without harness, 5.4–7.6M with it). Guesses for the
others: B and C about 1–1.5× A, D, E and F about 0.5–2M each. One variant × six scenarios ×
three repeats is therefore roughly 50–90M tokens, and a two-variant calibration roughly
100–180M, mostly cached input. Run D, E and F first: they are the cheapest and the most
likely to show a quality difference. Measure the real figure on the first run and replace
this estimate.

## What is not automated

- `browser` checks (layout at 375px and 1280px, visual direction, the price over the photo
  in D, the cancel-edit flow in A and C). Open the kept run folder and check by hand.
- Judging the quality of the agent's report to the user beyond the transcript checks.
- Isolation from the operator's own host configuration: user-level instructions, settings,
  hooks and plugins still load in real runs. This is deliberate (isolation would drop the
  login). Each record fingerprints the main files and the report warns when compared runs
  differ; hooks and plugins outside those files are not fingerprinted. MCP servers are off
  by default for Claude.
- Agent code runs on this machine during checks (imported in a child process with a
  timeout, under the run folder).
- A real run of either host adapter end to end. See the handoff
  (`../Agents/handoffs/calibration-evals.md`) for what was and was not verified.
