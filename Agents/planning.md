# Product Planning

<!--
## How To Use This File

- Claudia owns this file.
- Keep current product truth, backlog, active strategy, worker assignments, approvals, and user decisions here.
- Replace placeholders with real project state.
- Keep completed evidence concise and move bulk history to `_archive/`.
- Do not use this file as a worker journal.
-->

Planner-owned single source of truth for the current iteration.

Last updated: YYYY-MM-DD HH:MM TZ
Last updated by: Claudia
User check-in after material clarification: not required
High-cost execution approved: no
Outward acts approved: none

Status options: `inbox`, `ready`, `next`, `in progress`, `blocked`, `done`, `dropped`.
Type options: `feature`, `bug`, `chore`, `design`, `experiment`.
Priority options: `P0` (must now), `P1` (soon), `P2` (nice), `P3` (maybe).

## Governing Rule

- The latest confirmed human decision supersedes every older conflicting decision, plan, task, handoff, or historical note.
- Apply clear precedence to keep work moving, but always flag the conflict and update the stale durable source through its owning role.
- Archived material is evidence only. It is never executable unless this plan or the current worker task explicitly restates it.

## Current Product Truth

Keep this short. Record only the latest durable facts needed to interpret the active queue.

- Product direction:
- Current scope boundary:
- Non-negotiable constraint:
- Latest decision that supersedes older material:

## 1. Inbox (untriaged)

- **[ ]** (type) Short description — notes / links

## 2. Backlog

| ID | Title | Type | Priority | Status | Owner | Notes / Links |
| --- | --- | --- | --- | --- | --- | --- |
| T-1 | Replace with real task | feature | P1 | inbox | - | Delete or overwrite this row once real work exists. |

## 3. Active Queue

### <Task ID> — <Title>

- **Status:** ready / in progress / blocked / done
- **Priority:** P0 / P1 / P2 / P3
- **Owner sequence:** Claudia → Hephaestus/Athena if needed → Augustus/Julius → review
- **Current handoff:** `handoffs/<file>.md`, or none
- **Design contract:** `designs/<artifact>/design.md`, or none
- **Dependencies:** exact artifact, ordering, external state, or independent
- **User-approved execution:** no
- **High-cost approval:** not required / pending / approved
- **Outward-act approval:** none; each push, PR, deploy, message, or other external act must be named explicitly

Required outcome:

1. Observable result.
2. Preservation constraint.
3. Stop condition.

Completion evidence:

- Files or surfaces changed:
- Low-cost verification passed:
- High-cost verification run or intentionally not run:
- Remaining user-owned verification:

### 3a. Current Iteration Strategy

- Goal:
- Why now:
- Context gathered:
  - Fact:
  - Fact:
- Architectural or product decision:
  - Decision:
  - Constraint:
  - Out of scope:
- Worker split:
  - Augustus:
  - Julius:
  - Parallel Split Gate result:
- Risks / ambiguity:
  - Risk:

### 3b. Implementation Queues

Assigned queue for Augustus:

1. Not assigned.

Assigned queue for Julius:

1. Not assigned.

Advancement rule:

- Continue directly to the next approved queued task after the current one is complete.
- Pause for a blocking user decision, broken assumption, write-scope collision, missing high-cost approval, or unapproved outward act.

Verification rule:

- Use low-cost verification by default.
- Record high-cost verification explicitly before assigning or running it.
- Never claim rendered, integration, or networked acceptance when it was not performed.

### 3c. Decision Needed From User

- Decision:
- Why it blocks:
- Options already ruled out:

## 4. Bugs (optional detail)

| Bug ID | Title | Severity | Status | Repro steps | Notes |
| --- | --- | --- | --- | --- | --- |
| B-1 | Replace with real bug | medium | inbox | Repro steps | Notes |

## 5. Feature Ideas / Roadmap

- **Idea:** Short name
- **Why:** User or product rationale
- **Rough scope:** S / M / L
- **Notes:** Links, dependencies, or previous decisions

## 6. Archived State

- Retired handoffs: [`_archive/handoffs/`](_archive/handoffs/)
- Delivered or superseded worker queues: [`_archive/tasks/`](_archive/tasks/)
- Older planner snapshots: [`_archive/`](_archive/)
