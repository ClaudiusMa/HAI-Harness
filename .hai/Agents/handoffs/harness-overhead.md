# Handoff - harness-overhead

Last updated: 2026-10-13
From: direct session (no role routing, at the user's request)
To: the user, for review and local integration approval

## Status

- Done: diagnosis of the 2026-10-12 Sol-medium pilot, instruction changes, focused suite, sync and parity.
- Not started: re-running the paired pilot against this lane (needs the Codex supervisor); local integration; release.

## Diagnosis (trace of all 7 harness session logs)

| Bucket | Tokens | Cause |
|---|---:|---|
| Controller total | 7.20M | more than the whole standard run (4.10M) |
| → polling | 2.70M | 40 `wait_agent` calls at 10s; each re-sent 55–110K context |
| → harness CLI | 1.34M | worktree, `human-sync` init/acknowledge/status every request, update check |
| → re-running worker checks | 1.10M | request 3 browser checks repeated by the controller |
| → worker chatter | 0.71M | progress messages woke the controller (10 rounds) |
| Implementers ×3 | 3.99M | fresh worker per request; each re-read docs and code |
| Reviewers ×3 | 1.08M | 0 findings |

Time: about 6.4 of the ~7.9 extra minutes was pre-spawn setup (51/38/59s), review plus closeout (~1–1.5 min per request), and controller checks.

## User decision (2026-10-13)

- The user kept the split: "the reason i do split work is to make the context clean, there will be alot of product deicusssion in claudia context, that shoudl not polute the engineer context."
- The user approved the other fixes: "others look good to me."
- Fix 1 (Claudia implements single-stream work directly) is withdrawn. The isolation works both ways: product discussion stays out of the engineer's context, and code, test output and browser state stay out of Claudia's. In long discussion sessions it can also save tokens.

## Files touched

- `scaffold/AGENTS.md`: a same-session message does not re-read; the delegation invariant states its isolation purpose. 357 of 450 words.
- `Agents/onboarding.md`: risk-based Review rule; Claudia accepts worker evidence; delegation mechanics summary; same-session read rule.
- `Agents/claudia.md`:
  - New rules: context isolation as the reason, with the contract as the only bridge; one engineer per lane; wait, don't poll; risk-based review; read order not re-run in session; one bookkeeping pass per request.
  - Removed: the default-role intro (already decided by AGENTS.md) and the duplicated cleanup and task-packet paragraphs (both now point to onboarding).
- `Agents/augustus.md`, `Agents/julius.md`: report once; a follow-up contract continues the loaded context.
- `Agents/skills/implement/SKILL.md`: one final evidence report that the controller relies on.
- `Agents/tasks/TEMPLATE.md`: `Rejected options (do not build)` field.

## Follow-up (2026-10-14)

- The Haiku 5.5 pilot showed 1.87× tokens and 2.29× time, with 13/13 for both. Merge-per-request closed the lane, so every follow-up got a cold worker. See [harness-overhead-eval](harness-overhead-eval.md).
- User direction: "we need to rely on model compacting context rather than do hard reset (start a new session even for same worker role)".
- Changes:
  - onboarding: integrate once per task, not per request; delegation summary keeps the worker through compaction.
  - claudia.md: one engineer per lane, named and kept open; "Compact, don't reset"; approval asked once per task.
  - augustus/julius: after compaction, re-read the contract and handoff and continue; never ask to be replaced.
- Verification: 36/36, `git diff --check`, sync parity. Re-running the Haiku pilot against this change is pending.
- Spawn authorization (2026-10-14): the first v2 re-run stopped to ask the user whether it could spawn a worker. The host says not to start subagents unless the user asks, and the harness only said "delegates" (onboarding had also been softened to "assign"). `scaffold/AGENTS.md`, onboarding and claudia.md now state that the installed harness is the owner's standing request to spawn or reuse workers, so Claudia never asks. AGENTS.md is 372 of 450 words; 36/36 pass.

## Model and effort routing (2026-10-14)

- User direction: agents should use different models and reasoning levels by task, so work that doesn't need high reasoning runs faster and cheaper, and the harness must name no model ("dont sepcify on model tho, cuz it shoudl not only work in claude but also other products").
- claudia.md has a new Model and effort routing section:
  - fast, standard and deep tiers with effort per task type, chosen by Claudia herself (no separate routing agent, which would add a hop);
  - tiers mapped onto whatever the host's spawn tool offers;
  - one-tier escalation after two failed verifications;
  - a reviewer runs at or above the implementer's tier.
- The same change also updates:
  - onboarding, momus, human-scribe and README wording;
  - a task template `Model tier / effort` field;
  - the AGENTS.md delegation invariant;
  - the worker-reuse wording: message the existing worker, and re-spawning for a follow-up is a mistake.
- Verification: 36/36 tests pass, sync parity holds, and the diff adds no model or provider names.

## Contracts / invariants

- Claudia still never edits product code.
- Lanes, approve, Human approval and outward-act gates are unchanged.
- Review stays mandatory for the listed risk areas.

## Verification

- Passed:
  - `node --test test/hai-harness.test.mjs`: 36/36.
  - `git diff --check`: clean.
  - `./hai-meta sync`: 7/7 source/outer parity.
- Size: onboarding plus claudia went from 43,565 to 43,557 bytes. Removing duplicates paid for the new rules, so the startup did not shrink.
- Not run: the live pilot re-run, a discussion-heavy scenario, and a fresh-chat continuity scenario. All three are in [harness-overhead-eval](harness-overhead-eval.md).

## Approval (2026-10-14)

- The user approved all four decision records and the local merge ("approve all"). The records are written to `.hai/Human/decisions.md` in this lane, and the packet inbox is empty.
- Final review fixes: the AGENTS.md invariant is quality-first; peer tasks have their own bullet; waiting covers host completion notices. 36/36 pass, AGENTS.md is 382/450 words, and the diff adds no model names.
- Test policy from the user: no more pilot runs until the harness is declared ready to deploy; then one paired test (protocol in [harness-overhead-eval](harness-overhead-eval.md)).

## Exact next step

1. The user reviews the lane.
2. On approval, run `node bin/hai-harness.mjs worktree approve --approved "<message>"` from the lane.
3. Re-run the pilot against the integrated source before any release claim about cost.
