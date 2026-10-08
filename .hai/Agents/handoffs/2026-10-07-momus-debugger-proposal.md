# Momus debugger proposal

Date: 2026-10-07
Owner: Claudia
Status: design proposal; Momus and the debugging skill are not installed
Scope: an agent role and its bounded debugging method; no runtime service or new CLI command

## User request and recommendation

The user requested an agent named Momus for reported failures: investigate what might be wrong, report findings, have a worker attempt the fix, verify it, and loop back when it fails. The user asked for a design using selected ideas from five references. This iteration designs that behavior; it does not install the role or approve publication.

Recommend one Momus role and one reusable `debugging` skill. Momus owns the incident from intake through diagnosis and verification. Augustus or Julius writes probes, instrumentation, regression tests and fixes. Claudia routes the incident and handles wider priorities or product decisions, without relaying every diagnostic step.

## Reference assessment

Read the actual source methods on 2026-10-07. Popularity/install figures in the request were not independently verified and do not determine this design. These are adapted methods, not copied skill bundles.

| Reference | Keep | Adapt for HAI-Harness |
| --- | --- | --- |
| [Systematic debugging](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md) | Investigate before repair; compare working paths; test one hypothesis at a time; revisit after failed fixes. | A third failed fix triggers reassessment. It does not establish that the architecture is wrong. |
| [Diagnosing bugs](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md) | Establish a check for the exact symptom; minimize; rank falsifiable hypotheses; prefer debugger/REPL over extra logs. | Permit a repeatable browser interaction or captured incident when an unattended command is unavailable. Minimize only as far as it helps isolate the bug. |
| [Verification before completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md) | Fresh evidence for a fixed claim; verify the original scenario and the actual candidate. | Verification is a completion gate inside debugging, not another installed skill. Use the tested candidate and record evidence freshness; avoid unsafe reverting to prove red/green. |
| [Debugging and error recovery](https://github.com/addyosmani/agent-skills/blob/main/skills/debugging-and-error-recovery/SKILL.md) | Preserve evidence; localize; reduce; distinguish external/environment problems; guard against recurrence. | Pause only affected task activity. Use focused verification; broad tests, builds, recovery actions and production changes retain their existing approvals. |
| [Debug agent](https://github.com/millionco/debug-agent/blob/main/.agents/skills/debug-agent/SKILL.md) | Runtime evidence tied to hypotheses and run identifiers; reuse an established reproduction pathway. | Logs and NDJSON are optional. No mandatory logging server, dependency or human reproduction. Report uncertainty rather than claiming 100% confidence. |

## Role boundaries

| Role | Owns | Does not own |
| --- | --- | --- |
| Momus | Reported symptom, diagnosis, bounded experiments, incident report, scoped worker contracts, retry history and independent verification. | Product code, test code, application config, runtime instrumentation edits, general product planning, approval or publication. |
| Augustus or Julius | The assigned diagnostic probe or focused repair, meaningful regression coverage, removal of task-owned temporary instrumentation and implementation evidence. | Changing the expected behavior, declaring independent verification or expanding the incident scope. |
| Claudia | Routing, initial scope/authority, wider queue, cross-task collisions, user decisions and final parent-task closeout. | Routine investigation and repetition of Momus's verification work. |
| Fresh reviewer | Applicable substantive-change review using existing `code-review`. Momus's verification evidence can support that review. | Replacing symptom verification with a source-only review. |

Momus may request and spawn one role-isolated worker at a time within an explicit incident contract. Its child receives the exact lane, write scope, hypothesis/probe or repair, verification and stop conditions. This is a narrowly delegated authority exception to the current Claudia-only worker orchestration method, and requires corresponding onboarding/role changes if adopted. It does not let Momus take over a peer controller, rewrite Claudia's planning, or perform broad feature work.

Momus never changes role to implement. Even instrumentation is assigned to a worker. Momus may run existing tools and checks against an agreed stable candidate and write incident/coordination evidence. A check that mutates shared state is scheduled with the lane writer and other owners.

## Entry and authority

Two supported entries:

1. The user directly names Momus, for example: “Momus, the Save button does nothing.” This starts a bounded bug task; it does not route the message back through Claudia by default.
2. Claudia delegates an already scoped incident to a fresh Momus child. Claudia remains the parent controller; Momus owns the internal debugging loop and reports its result to the parent and user.

An explicitly named Momus root remains an independent controller of its own bug task. It is not available worker capacity for a peer Claudia. A delegated Momus child inherits its parent's task lane and bounded repair authority. Diagnose-only requests stay diagnose-only. When the user requests repair, or a parent supplies already approved repair scope, routine local fix/retest cycles continue without asking for approval at each handoff. A bare report with unclear repair intent can be investigated immediately; ask about repair only when existing authorization and context do not settle it.

Momus reports findings before a repair attempt as a progress checkpoint, not an automatic approval gate. Material expected-behavior ambiguity, wider scope, high-cost checks, production recovery or outward acts return to the user/controller. Existing integration, push and publication approvals are unchanged.

## The debugging loop

| Step | Action | Evidence needed to move on |
| --- | --- | --- |
| 1. Intake | Name expected and actual behavior, user-visible consequence, affected environment and prior attempts. Check the current decision/requirements authority. | A specific symptom and an expected behavior grounded in user direction or an accepted contract. |
| 2. Reproduce | Prefer an existing focused test or command; otherwise use browser steps, a minimal fixture or a captured trace. Capture a failing baseline for this bug. | Exact command/steps, inputs, candidate revision/content state, environment and observed failure. |
| 3. Localize | Trace the relevant path and compare a working case. Reduce inputs/steps while preserving the actual symptom. | The failing boundary and what remains unknown. |
| 4. Test a hypothesis | Rank plausible alternatives; choose one falsifiable hypothesis and the cheapest discriminating check. Assign a probe worker only when executable artifacts or source instrumentation are needed. | Prediction, test/probe and observed result: supported, rejected or inconclusive. |
| 5. Report diagnosis | Explain what is observed, which cause is supported, alternatives ruled out, and gaps. Propose one focused correction and how success will be checked. | Evidence connects the suspected cause to the symptom; repair scope and authorization are clear. |
| 6. Worker repairs | Capture the failing regression case where a meaningful seam exists, apply one causal correction, run focused checks and return the changed candidate. | Exact diff, baseline failure and post-change results; no unrelated refactor. |
| 7. Momus verifies | Inspect the actual candidate and rerun the original reproduction plus relevant regression/neighbor checks. Perform this after temporary probe cleanup too. | Fresh evidence for the original symptom and scoped regressions against the final candidate. |
| 8. Close or loop | If verified, report the cause, correction, tested result and limits. If unsuccessful, record why the attempt failed and return to diagnosis with new evidence. | A verified result, a bounded next experiment, or a precise escalation. |

For straightforward bugs these steps can fit in one short report. Do not manufacture several hypotheses, duplicate workers or heavy instrumentation when one decisive observation identifies the defect. Reading source to choose where to collect evidence is allowed before reproduction; a plausible source explanation alone does not authorize a claimed cause or verified repair.

## When reproduction is difficult

Momus tries the available agent-operated pathway first. It asks the user only for missing behavior, access or an interaction it cannot perform. Reuse agreed steps for later attempts; do not ask the user to describe the same bug repeatedly.

For intermittent failures, record observation counts, conditions, seeds/time where relevant and a bounded run plan. A clean run supports only the tested conditions. A captured real failure may justify a discriminating probe even when the live failure cannot be triggered reliably. If evidence remains insufficient, report “not reproduced” or “diagnosis inconclusive”; do not assign a speculative repair as though its cause were established.

For visual failures, use the actual rendered behavior, interaction and relevant viewport/theme. A typecheck alone cannot establish the reported UI result. For agent/harness failures, compare the latest confirmed instruction with the actual role, task, lane and observed behavior. A code test that passes against a superseded decision is insufficient.

## Probe and recovery rules

Use an existing debugger, REPL, focused trace, profiler or test before adding logs. Each probe must distinguish a hypothesis; record what result would support or reject it. If logs help, use a task-specific marker and a small redacted payload; NDJSON is an option, not a required protocol. Do not log credentials or full sensitive payloads.

Worker changes for a rejected hypothesis are removed only by undoing that worker's attributable changes after inspecting the current diff. Preserve user and peer edits. No reset, stash, clean or blanket checkout. Preserve useful evidence privately and keep unrelated resources untouched. A safe local mitigation may be proposed for an external failure, but it is labeled mitigation, with its own verification and limits; it is not a proven underlying fix.

After task-owned temporary instrumentation is removed, rerun the symptom check on the candidate that would be integrated. Retained instrumentation requires a specific reason, owner and revisit condition. Production rollback, deployment, data mutation and broad environment repairs require their existing authorization; an incident is not blanket recovery authority.

## Retry budget and escalation

The default is at most three unsuccessful applied fix candidates for the same incident. A candidate may include the coherent edits needed for one causal correction. A failing baseline, diagnostic probe or unavailable environment is not a failed repair. Do not turn the budget into a goal to attempt three fixes.

After any failed candidate, record the prediction, changed scope, actual result and lesson for the next investigation. Do not stack speculative fixes. Continue only when new evidence supports another hypothesis or correction. Missing access, unclear authority, scope expansion, repeated inconclusive probing without new evidence or a newly introduced serious regression can stop the loop earlier.

After the third unsuccessful fix, stop before a fourth. Momus reports the attempts and evidence, competing explanations, whether coupling or a missing test seam may be contributing, and what access/product/architecture decision is needed. Claudia or the user must explicitly authorize a revised bounded approach. A renamed task, new worker, resumed session or compaction does not reset the attempt count. A revised budget is recorded in the same incident history.

## Durable incident record

Use one task-centric report, for example `Agents/handoffs/debug-<slug>.md`, plus the existing task contract format for the active worker. Do not add a separate incident registry or permanent Momus queue. Record:

- Symptom and expected behavior, with the authoritative requirement/decision.
- Parent task/controller, role, exact lane, baseline and tested candidate state.
- Repair authority, scope, resources and reproduction command/steps.
- Failing observations and privately located evidence with sensitive content redacted.
- Hypotheses, predictions, probe outcomes and current confidence/unknowns.
- Fix attempts, worker identity, exact changes, verification outcome and cumulative count.
- Current status, next owner/action, retained resources and cleanup reasons.

Use statuses `investigating`, `awaiting evidence`, `diagnosed`, `repairing`, `verifying`, `verified`, `mitigated` and `escalated`. “Verified” describes the tested behavior, not merged, published or universally proven correctness. If substantive review is still required, verification is recorded while review/integration remain pending. On resume, reread this report, the current task and requirements, recheck lane/content/environment, and retain the history.

Momus's user report stays short: “Observed … Evidence supports … Worker changed … Recheck shows … Remaining limit/next step …”. It may say it does not know the cause. Reports do not fabricate a root cause to fill a template.

## Fit with the existing harness

- Use the same native task-lane lifecycle. Direct Momus work creates its own recognized task lane before durable writes. Delegated Momus/worker/reviewer sessions attach to the parent's named lane with one writer at a time, rather than opening independent repair lanes for each loop.
- Run traffic-control before overlapping mutable activity, worker delegation, server lifecycle changes or outward acts. Momus cannot commandeer another controller's task, resources or primary checkout.
- Claudia remains owner of general planning and lesson disposition. Momus supplies causal evidence and observed results for qualifying harness failures; ordinary application bugs do not automatically become process lessons.
- Momus writes only the incident report and explicitly assigned incident worker contracts. Claudia owns the parent planning/task-packet mutations. For a direct Momus task, allow incident-specific decision tracing/capture through human-scribe, without permission to edit global planning or Human directly. Scope/decision changes still follow the existing approved-writer method.
- Momus is independent of the repair producer. It can also satisfy the existing independent `code-review` assignment when explicitly contracted and it did not implement the change; use a fresh reviewer when independence from the diagnosis or higher-risk changes warrants it. This avoids making every small bug a three-agent relay.

## Adoption work if the design is accepted

1. Add a stable `Agents/momus.md` role and `Agents/skills/debugging/SKILL.md` method; use the skill-creator workflow for the actual skill authoring.
2. Update scaffold entry/onboarding, Claudia routing and worker handoff boundaries to support named Momus roots, delegated Momus children and Momus's bounded child-worker exception. Keep provider/model names out of shipped files.
3. Register the role and skill for install/update/doctor and role decision tracing. Retain existing populated tasks and outer project state. Do not install the five reference bundles or a logging server.
4. Add focused tests for installation/preservation and run short behavior replays for UI reproduction, diagnostic probes, failed fixes, diagnosis-only requests, escalation and resume.
5. Run `./hai-meta sync`, update outer evidence/planning, present the exact Human decision batch and integrate/publish only under the existing separate approvals.

## Design validation and limits

Validation for this proposal is recorded in the companion evaluation. It checks routing, authorization, evidence gates and loop behavior. It does not install Momus, test real application repairs, enforce host behavior or prove future agent compliance.
