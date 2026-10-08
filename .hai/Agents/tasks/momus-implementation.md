# Momus implementation

Date: 2026-10-07
Controller: Claudia, parent 01a114d7-547a-7dd0-91a1-f820fe414af0
Assigned role: Augustus, implementation worker; do not switch roles
Lane: /Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/momus-debugger-design
Branch/base: task/momus-debugger-design / b711df0747ca1186594d8350e379b9f0e5290630
Dependencies: one sequential implementation queue, followed by independent read-only review. No parallel source writer.
Method: outer Agents/skills/implement/SKILL.md; use skill-creator at /Users/claudiusma/.codex/skills/.system/skill-creator/SKILL.md for the new product skill.

## User authority

User accepted the Momus design and said: "i might barely call out momus to do tasks, claudia should know when to do it ... implement ... make sure that this is a real improvement on harness than a burdensome extra loops". Implementation is authorized. Commit/merge, push, release and deployment are not authorized.

The proposal/evaluation in outer handoffs are design evidence, not instructions to copy wholesale. Latest user direction adds selective automatic Claudia routing and a light fast path. Resolve routine implementation details yourself within this contract.

## Write scope

- Product: Agents/momus.md; Agents/skills/debugging/SKILL.md; targeted changes to Agents/onboarding.md, claudia.md, augustus.md, julius.md, skills/traffic-control/SKILL.md and skills/human-scribe/SKILL.md only where necessary for bounded Momus authority, worker reuse or tracing; scaffold/AGENTS.md; bin/hai-harness.mjs registration; relevant focused tests in test/hai-harness.test.mjs; concise README usage/routing documentation. Avoid unrelated edits or broad refactors.
- Outer: stable method/role mirrors written by ./hai-meta sync. Do not edit project planning, project context, existing tasks/handoffs/lessons or Human state. Add/update your task handoff at .hai/Agents/handoffs/momus-implementation.md. Report every traced mirror path changed; Claudia will trace and acknowledge after you release writes.
- Disposable local evaluation fixtures: only exact task-owned paths under /private/tmp. Return their paths, raw request, observable symptoms and commands. Do not modify live projects or install dependencies.

## Required behavior

1. Claudia chooses Momus without user invocation when the cause is unclear, an attempted repair failed without an established cause, or investigation needs intermittent/runtime/cross-component evidence. Keep obvious, reproduced, bounded corrections with the current worker. An ordinary bug or test failure must not automatically create another agent/report/review cycle. Workers may apply the debugging method directly on the fast path.
2. Momus owns the bounded diagnosis -> worker probe/fix -> independent symptom verification loop. Existing repair authority flows through without repeated approval; diagnosis-only stays diagnosis-only. Retain parent/current task and role identity. Explicit named Momus entry still works; default unnamed work remains Claudia.
3. When there is an already authorized same-task worker, Momus may coordinate that named worker within the parent-delegated incident contract. Otherwise create at most one repair/probe worker at a time. No commandeering peer controllers/workers/resources, no duplicate lanes, and no product/test/config/instrumentation edits by Momus.
4. Use minimal existing tools and a check that catches the exact symptom. Accept browser/manual/captured evidence where appropriate. Separate observation, hypothesis and supported cause; do not require a logging server, NDJSON, a fixed number of hypotheses or perfect reproducibility.
5. Verify the original symptom against the final candidate after probe cleanup. Useful regression tests must catch the real bug pattern, not mirror wording/implementation. One scoped correction at a time; rejected changes can be undone only by their owner without touching baseline/peer edits. Mitigation and unverified results remain clearly labeled.
6. Default stop after three unsuccessful applied fixes for the same incident; persist attempts across resumes/worker changes. Stop sooner for no useful new evidence, missing access, scope/authority collisions or serious new regression. New slug/session is not a retry-budget reset. Wider scope and additional attempts need a revised authorized approach.
7. Reuse one task-centric handoff/incident report; simple cases need only short evidence in the existing handoff. Momus's independent source review can satisfy an assigned existing code-review obligation if he did not implement the change; do not mandate a third agent or duplicate Claudia review. Keep normal escalation for concrete risks.
8. Add Momus and debugging to installer/update/doctor and trace coverage without generating a permanent Momus task queue. Keep source templates free of this project's decisions/history. Native lane lifecycle and approval/cleanup semantics remain unchanged.
9. Keep mandatory startup routing short and the new method compact, preferably roughly a page each for role/skill unless concrete behavior requires more. Do not append the long proposal to startup context. No new configuration, runtime service, provider names, dependency, CLI command or general incident database.

## Sequence and verification

- Inspect current installer callers/tests and stable operating files; implement the smallest complete, coherent change satisfying the behavior above.
- Validate skill frontmatter using bundled quick_validate.py when available; if its dependency is unavailable, report it and validate syntax/frontmatter with an existing local alternative without installing anything.
- Add and execute focused lifecycle tests: fresh install provides Momus/debugging; update adds missing new files and preserves populated queues/context/Human; doctor detects missing role/skill; new role changes participate in existing human-sync trace duty. Avoid wording-match tests.
- Run Node syntax and git diff --check, and ./hai-meta sync in this lane. Verify protected outer state before/after sync and stable source/mirror parity. A dry-run may precede sync; never use force/init to refresh the outer instance.
- Prepare one tiny isolated real-bug fixture for blind forward testing under /private/tmp, with a clear user-visible expected behavior, native installed harness/task lane as needed, a focused runnable failing check, and no external dependencies. Choose a case that benefits from diagnosis beyond a mechanical known fix. Do not expose the cause, intended fix or expected routing to the future evaluator; give those only privately to the parent if needed to score results. No deliberate corruption of live projects.
- Return exact changes, commands/results, fixture paths, context/loop overhead, unresolved risks and scope limits in your handoff. Release the writer slot and stop. Do not launch your own review/evaluation or change packet state.

## Closeout status, 2026-10-07

Implementation, sync, correction and independent verification complete; accepted Human write complete. Source frozen, no active worker; local integration approval pending. Evidence: ../handoffs/momus-implementation.md.
