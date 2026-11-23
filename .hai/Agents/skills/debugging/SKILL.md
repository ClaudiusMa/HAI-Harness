---
name: debugging
description: Diagnose and repair a reported bug using discriminating evidence, one scoped correction at a time, and a check of the original symptom. Use for uncertain causes or failed repairs; known, reproduced corrections can use the same method without a separate coordinator.
---

# Debugging

Work within the task's expected behavior, scope, lane and authority. The lane's writer uses this directly for an obvious, reproduced, bounded fix; Claudia routes unclear causes, failed repairs without an established cause, and intermittent, runtime or cross-component investigations to [Momus](../../momus.md). An ordinary bug or test failure needs no new agent, report or review.

## Establish the incident

Keep one task-centric handoff with expected versus actual behavior, failing inputs and environment, parent controller, lane and candidate, authority, prior applied fixes and the cumulative count of unsuccessful ones, and the next action, so a resume or a new worker keeps the incident. For a simple case a few lines suffice.

Reproduce with an existing focused command, test or agent-operated interaction, or else a tiny fixture, browser or manual steps, or captured failure evidence, and record the actual observation and steps. Never invent a baseline or revert user or peer work to get one. Ask only for missing behavior, access or an interaction you cannot perform.

## Diagnose before changing behavior

Separate observations from hypotheses. Test a falsifiable hypothesis with the cheapest check that tells it apart from the alternatives, and record the result as supported, rejected or inconclusive. Prefer an existing debugger, REPL, test, trace or profiler to new instrumentation. Source, test or config probes belong to whoever holds the lane's writer slot (Momus himself, or the worker he handed the fix to), who also removes them. Keep logs small, task-marked and redacted.

For an intermittent failure, use a bounded observation plan; a clean run proves only its tested conditions. When evidence cannot support a cause, report not reproduced or inconclusive and name the missing evidence. Never present a speculative repair as a proven cause.

## Apply one correction and recheck

- Explain the supported cause, gaps, one causal correction and the symptom check. Existing repair authority carries through the loop; diagnosis-only stays read-only. Material behavior decisions, wider scope, runs that need a check-in ([onboarding](../../onboarding.md)) and outward acts keep their gates.
- The writer applies one coherent correction, adds regression coverage where it catches the real failure, runs the checks that establish the fix, and returns the actual diff. Undo a failed probe or fix only through its owner's attributable edits after inspecting the diff, preserving baseline, user and peer work. Never stack speculative corrections, or reset, stash or clean a lane.
- Re-run the original symptom and neighboring behavior on the final candidate after probes are removed. For UI bugs inspect the rendered interaction at the relevant viewport and theme; a typecheck is not enough. For harness bugs compare the latest instruction with the actual role, task and lane. When routed, Momus does this check himself, whoever wrote the fix. Debugging alone triggers no extra review; a fix in a risk area, or one the user asks to have checked, gets a fresh reader who did not write it.
- Label the result a verified correction, a mitigation (with its checked scope and limits) or unverified. Retained instrumentation needs a reason, owner and revisit condition.

## Bound the loop

Record each unsuccessful applied fix (writer, candidate, prediction, changes, result, evidence for the next attempt) in the handoff. A failing baseline, a diagnostic probe or an unavailable environment is not an applied fix. Continue only when new evidence supports the next correction.

Stop before a fourth unsuccessful applied fix for the same incident, and sooner for no useful new evidence, missing access, unclear authority, a scope or resource collision, or a serious new regression. A new session, worker, slug or resume never resets the count. Then report the explanations tried, the unresolved evidence and the access, product or architecture decision needed; three failures alone do not prove an architecture defect. More attempts or wider scope need a revised, authorized approach recorded with the history.

Close with the supported cause, correction, fresh symptom evidence, limits and next owner. Keep integration, publication and cleanup status separate from verified behavior.
