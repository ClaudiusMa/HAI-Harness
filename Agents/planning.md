## Product Planning

<!--
## How To Use This File

- Claudia owns this file.
- Keep backlog, active focus, current strategy, worker assignments, and user decisions here.
- Replace placeholders with real project state.
- Do not use this file as a worker journal.
-->

Planner-owned single source of truth for the current iteration.

Last updated: YYYY-MM-DD HH:MM TZ
Last updated by: Claudia
User check-in before implementation: no
High-cost execution approved: no

Status options: `inbox`, `ready`, `next`, `in progress`, `blocked`, `done`, `dropped`.
Type options: `feature`, `bug`, `chore`, `design`, `experiment`.
Priority options: `P0` (must now), `P1` (soon), `P2` (nice), `P3` (maybe).

### 1. Inbox (untriaged)

Use this for quick capture; we’ll later move items into the Backlog table.

- **[ ]** (type) Short description — notes / links

### 2. Backlog

Main table we’ll keep up to date. Each row is one unit of work. `planning.md` is the active planning source for the iteration.

| ID | Title | Type | Priority | Status | Owner | Notes / Links |
| --- | --- | --- | --- | --- | --- | --- |
| T-1 | Replace with real task | feature | P1 | inbox | - | Delete or overwrite this row once you have real work. |

### 3. Now (active focus)

- **[ ]** Primary active item
- **[ ]** Next active item
- **[ ]** Known blocker or dependency
- **[ ]** High-cost approval still needed, if any

### 3a. Current Iteration Strategy

- Goal:
- Why now:
  - Reason:
  - Reason:
- Context gathered:
  - Fact:
  - Fact:
  - Fact:
- Architectural decision:
  - Decision:
  - Constraint:
  - Out of scope:
- Worker split (one worker by default; two only if both queues clear the Parallel Split Gate):
  - Augustus:
  - Julius:
  - Run mode: parallel | sequential
  - Split rationale (why two queues are independent, or why the work stays in one):
- Risks / ambiguity:
  - Risk:
  - Risk:

### 3b. Implementation Steps

Assigned queue for Augustus:

1. Not assigned yet.

Assigned queue for Julius:

1. Not assigned yet.

Advancement rule:

- Continue directly to the next queued task after the current one is done.
- Pause only for a blocking user decision, an overlapping write-scope conflict, or unapproved high-cost behavior.

Verification rule:

- Use low-cost verification by default.
- Record any required high-cost verification explicitly before assigning it.

### 3c. Decision needed from user

- Decision:
- Decision:

### 4. Bugs list (optional detail)

If we want more detail on bugs, we can track them here and link from the Backlog.

| Bug ID | Title | Severity | Status | Repro steps | Notes |
| --- | --- | --- | --- | --- | --- |
| B-1 | Replace with real bug | medium | inbox | Repro steps | Notes |

### 5. Feature ideas / roadmap (optional detail)

High-level ideas that are not yet concrete tasks.

- **Idea**: Short name
- **Why**: User / product rationale
- **Rough scope**: S / M / L
- **Notes**: Links, docs, or previous sessions
