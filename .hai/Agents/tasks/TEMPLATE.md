# {{ROLE_NAME}} Tasks

Planner owns this execution contract. {{ROLE_NAME}} uses it as the current queue. Historical queues belong under `Agents/_archive/tasks/`.

Keep this file execution-only. Do not copy product rationale, option analysis, or planner strategy here.

## Assigned Queue

- Status: unassigned
- Task / outcome: none
- Read first: `../onboarding.md` → `../project_context.md` → `../{{ROLE_SLUG}}.md` → this file
- Active now: none
- Next in sequence: none
- Queue order and priority: none
- Method reference: none
- Model tier / effort: none (fast, standard or deep; low, medium or high; deciding signals: checkability, judgment, blast radius, breadth, track record)
- User's words (verbatim request text, not the discussion): none
- Spec table (one row per item: what the user sees, what changes, between which values, what stays fixed): none
- Assumed (decisions the user's words do not state, each confirmed by the user before this contract was assigned): none
- Spec confirmed by user: no (date and the user's words; required before building anything the user will look at, or a request that names two or more items)
- Rejected attempts (built X; user meant Y — build none of these again): none
- Requirements / design references: none
- Files / write scope: none
- Acceptance criteria: none
- Rejected options (do not build): none
- Existing patterns / interfaces to reuse or preserve: none
- Read-only / preserve: all project-owned files until assigned
- Current handoff: none
- Dependencies: none
- Verification: none assigned
- Routed lessons / Standing Gates: none; list matching rule and its source when applicable
- Required worker evidence: one line per spec row with what you observed (a screenshot for anything visual), then the observed result and links to durable artifacts; distinguish instructions/scenario inspection from an executed replay or check
- User-approved to execute: no
- High-cost approval: not granted
- Outward acts authorized: none

For implementation assignments, name `../skills/implement/SKILL.md`. For an explicitly assigned read-only review, name `../skills/code-review/SKILL.md` instead. Include the specific requirements, design, and verification references the worker needs to complete the assignment; do not route a review through the implementation method.

## Stop Conditions

- Stop before writing until Claudia assigns a clear, approved queue with explicit scope and verification.
- Stop before writing anything the user will look at, or a request that names two or more items, while `Spec confirmed by user` is `no`; stop and report when the spec table and the user's words disagree.
- Stop for a broken assumption, scope expansion, missing high-cost approval, or unapproved outward act.
