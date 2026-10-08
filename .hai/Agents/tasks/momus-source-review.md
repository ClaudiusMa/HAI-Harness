# Momus source review

Date: 2026-10-07
Parent/controller: Claudia, 01a114d7-547a-7dd0-91a1-f820fe414af0
Assigned role: Julius, fresh read-only review worker. No role switching or source edits.
Lane: /Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/momus-debugger-design
Write scope: none; return evidence/findings to parent. Source is frozen; independent forward testing mutates only a disposable /private/tmp fixture. No shared mutable setup.

Read this lane's outer .hai/AGENTS.md, onboarding.md, project_context.md, julius.md, this task and skills/code-review/SKILL.md. The implementation contract is tasks/momus-implementation.md and evidence is handoffs/momus-implementation.md. Review HEAD-to-working-tree plus new files in the assigned product scope. Do not read Human or unrelated historical queues.

User accepted the Momus debugger design and required Claudia to route it automatically when useful, without burdensome extra loops. Validate selective routing, clear parent/worker authority, diagnosis-only handling, evidence and retry gates, continuity/reuse and independent review without an automatic third reviewer. Distinguish actual automatic host enforcement from procedural agent instructions.

Scope: new Agents/momus.md and Agents/skills/debugging/SKILL.md; targeted source scaffold/onboarding/Claudia/worker/traffic-control/human-scribe changes; README; bin/hai-harness.mjs registration and pre-Momus packet compatibility; new/affected tests. Preserve generated task-role behavior, prior packet refusals and populated installed state. Inspect specific callers/paths needed to establish these behaviors; avoid a whole-repo audit.

Check the packet compatibility boundary especially: absent newly introduced Momus hash, prior mandatory hashes and digest checks, drift/acknowledgment and malformed/null values. Execute focused offline tests or additional meaningful isolated checks only if they resolve a concrete concern. No full suite, build, dependencies, network checks, source mutation or integration.

Source freeze evidence is /private/tmp/hai-momus-implementation-01a114d7/source-freeze.json. Return actionable findings with source line/trigger/consequence/correction, checked scope, actual command results and remaining limits. No findings is valid. Also report whether shared startup instructions stay selective/cheap and any repeated coordination that can be removed without weakening the contract. Do not create a report file yourself.

## Closeout status, 2026-10-07

Independent source review complete; one P3 hash-array validation finding corrected and rechecked with no remaining assigned finding. Evidence: ../handoffs/momus-source-review.md. Reviewer read-only, no active writer.
