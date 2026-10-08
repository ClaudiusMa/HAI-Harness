# Momus design review

Date: 2026-10-07
Owner/controller: Claudia, parent 01a114d7-547a-7dd0-91a1-f820fe414af0
Assigned role: Julius, read-only worker; no role switching or implementation
Lane: /Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/momus-debugger-design
Write scope: none. Return findings/replay transcript to the parent.
Dependencies: the proposal is frozen while reviewed; no parallel writer.
Method: read-only review using the scoped reasoning/evidence rules in code-review; this is a workflow design, not a product diff or installed skill.

## Read path and contract

Read .hai/AGENTS.md, .hai/Agents/onboarding.md, project_context.md, julius.md, this task, and handoffs/2026-10-07-momus-debugger-proposal.md in the named lane. Read code-review only for this assignment. Do not read Human or historical unrelated queues. Parent planning authorizes this bounded review.

User asked for an agent named Momus to investigate reported broken behavior, report findings, have a worker try the fix, independently verify and loop back on failure. This iteration is a design proposal, not permission to install or implement Momus.

## Review and directed replay

Identify material contradictions, missing authority/evidence transitions, excessive orchestration or uncontrolled looping. Report evidence and precise correction direction, including what you did not verify.

For each fixture below, actually apply the proposed role/workflow rules and return a compact decision transcript: current owner, next action, allowed worker scope, necessary evidence, forbidden claim and terminal/loop status. These are synthetic agent decision replays; do not imply actual bug execution.

1. Delegated UI repair: Claudia approves a local fix for a Save button that silently drops text on mobile. Momus can operate a browser but no automated test exists. Worker says typecheck passed. Explain the reproduction and verification needed, and whether another user approval is needed for the already scoped fix.
2. Intermittent failure: three blank-screen reports with captured timestamps, no local repro. A worker offers to change an arbitrary timeout. Explain the next discriminating probe and final claim limits.
3. Retry/resume: the same incident history records three unsuccessful applied fixes. A new worker/session offers a fourth and suggests a new incident slug to reset the count. Decide the next action.
4. Diagnose-only: user asks Momus why export fails, explicitly says no edits. Logs point to a stale token. Decide what may be done and whether token rotation/deployment is authorized.
5. Probe boundary: delegated Momus needs two log statements to distinguish hypotheses, but only Augustus may edit source. A peer owns the preview process. Explain worker/probe authority and sequencing.
6. Cleanup candidate: initial verification passes with probe instrumentation, then the worker removes the logs and the symptom returns. Decide status and the evidence required before a fixed claim.

Acceptance: diagnosis/producer separation is preserved; no false fixed claims; local authority flows without redundant check-ins; UI/intermittent cases do not deadlock; shared resources and attempt history are protected. State any inability to execute a fixture rather than filling the report with a predicted result.
