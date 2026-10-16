# Handoff - harness overhead regression eval

Last updated: 2026-10-13
From: direct session
To: whoever runs the next paired pilot

The 2026-10-12 Sol-medium pilot becomes a standing regression check, plus two scenarios that test what the harness is for. Files are in [`../../evals/`](../../evals):
- `protocol.json` and `product-prompts.json`: the frozen pilot.
- `usage.py`: sums root and descendant Codex session usage.
- `controller_buckets.py`: splits one session's tokens by activity. Its totals run slightly high because of duplicate token events, so use `usage.py` for totals.

## Scenario A: same-chat build (the existing pilot)

- Same fixture, same three prompts, same model and effort. Run the standard condition, then the harness, in separate repositories and chats. Install the harness from the commit under test.
- Measure the sum of root request durations, `python3 -I usage.py <root-thread-id> --days <yyyy/mm/dd>…`, and the 13 independent checks.
- Baseline (cf3aefe): 2.99× tokens, 1.68× time, 13/13 for both.
- Budget after this change: ≤1.35× tokens and ≤1.3× time, with no lost checks. The split keeps a few controller turns per request, so parity is not expected here.
- Also check `controller_buckets.py` on the root:
  - polling turns ≤ 1–2 per request;
  - no controller browser or test re-runs;
  - one implementer session reused across all three requests;
  - no reviewer unless a listed risk area is touched.

## Scenario B: discussion-heavy build (tests the user's reason for the split)

- Before the first build request, hold 4–6 product turns:
  - explore two layouts and reject one;
  - set capacity to 8, then revise it to 6;
  - drop a "notes" field the user first asked for;
  - change the email-duplicate rule once.
- Then give the build and follow-up prompts.
- Measure tokens and time, and also stale-requirement errors: any rejected or superseded option that appears in the app (8 seats, the notes field, the rejected layout, the old duplicate rule).
- Expectation: the harness worker builds from the contract only and makes fewer stale-requirement errors. On tokens, the gap narrows or reverses as the discussion grows.

## Scenario C: fresh-chat continuity

- After scenario A's first request, end the chat and give requests 2 and 3 in a new chat in each condition. In the harness condition this goes through the repository's planning and handoff state.
- Measure the time to the first correct edit, any lost requirements from request 1, and tokens.

## Limits

- One run per scenario is a pilot, not a population claim. Counterbalance the order when repeating.
- The scripts read the local Codex session format as of 2026-10. Re-check the field names after a Codex update.

## Result: Haiku 5.5 scenario A, 2026-10-14 (lane source, uncommitted)

Both conditions ran in Claude Code desktop with the same model (`claude-haiku-5-5`), medium effort and auto permission mode. Subagents were forced to Haiku with `CLAUDE_CODE_SUBAGENT_MODEL`. All 123 model calls were Haiku, with no advisor calls. Fixtures: `~/Documents/ProductLab/hai-haiku-eval/{standard,harness}` from the original starter commit. Usage files: [`../../evals/haiku-2026-10-14/`](../../evals/haiku-2026-10-14).

| | No harness | Updated harness | Ratio |
|---|---:|---:|---:|
| Build time (3 requests) | 237s (99/57/81) | 543s (163/176/204) | 2.29× |
| Total tokens | 4.06M | 7.58M | 1.87× |
| Uncached input | 93K | 340K | 3.6× |
| Model calls | 40 | 83 (27 controller + 16/18/22 workers) | 2.1× |
| Independent checks | 13/13 | 13/13 | — |
| Extra user interactions | 0 | 3 merge approvals | — |

What the fixes changed:
- No polling: 27 controller calls, against 102 in the Sol pilot.
- No automatic reviewers.
- The controller did not re-run worker checks ("I did not re-run these checks myself").

Still over budget (≤1.35× tokens, ≤1.3× time), for two reasons:
1. **A fresh worker per request.** The harness asks for merge approval after each request, the merge closes the lane, and each follow-up creates a new lane and a new worker. "One engineer per lane" therefore never triggers. Each worker starts cold at about 50K tokens of context and re-reads the code.
2. **A controller floor.** Every controller call carries the host's base context (about 68–104K tokens), so 27 coordination calls cost 2.44M even without polling.

Other observations:
- The harness app has a misaligned waitlist row at 375px.
- The harness app seeds 2 sample bookings on first load, so a new visitor sees 4 of 6 places. Both apps meet the README sample rule.
- Only the harness left reviewable history: three hook-checked merge commits. The standard left uncommitted files.
- Process limit: the harness session was user-started, so it correctly refused a request relayed from another session and asked its user. Requests 2 and 3 were pasted by the user. That 6s turn and the three approval turns (about 6s each) are excluded from build time.

## Result: Haiku 5.5 v3 (integrate once + explicit spawn authority), 2026-10-14

The setup was the same as the first Haiku run, on a fresh fixture `hai-haiku-eval/harness3`. The worker-reuse wording was added after this run started, so v3 still spawned one worker per request. The user pasted requests 2 and 3, because the harness refused relayed requests. The user's message "approve. then <request 3>" caused one mid-task merge. Auto mode's classifier blocked the first `worktree approve` as a destructive git action; it succeeded after the user's second approval.

| | No harness | Harness v1 | Harness v3 |
|---|---:|---:|---:|
| Build time | 237s | 543s (2.29×) | 543s (2.29×): 175s for request 1, 368s for requests 2–3 |
| Total tokens | 4.06M | 7.58M (1.87×) | **5.40M (1.33×)** |
| Uncached input | 93K | 340K | 290K |
| Model calls | 40 | 83 | 65 (22 controller + 14/12/17 workers) |
| Independent checks | 13/13 | 13/13 | 13/13 |

Findings:
- **Tokens are within budget.** The three workers together used 3.36M, less than the standard session's 4.06M, because each started at about 50K tokens of context instead of growing to about 130K. The controller added 2.05M.
- **Time is not within budget.** Cold workers were slower than the warm session on every request: 138/122/152s against 99/57/81s. Worker 2 spent 33s before its first edit, rewrote `app.js` whole, and started and stopped its own preview. The controller added about 30–40s per request for intake, spawn and report.
- **Trade-off to measure next (v4, worker reuse):** a reused worker keeps code and preview state, which should cut time. Its context grows like the standard session's, so tokens may rise toward about 1.5×. Expected floor for this task with mandatory delegation: about 1.3–1.5× on both measures.
