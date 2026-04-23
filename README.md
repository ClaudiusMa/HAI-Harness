# HAI-Harness

HAI-Harness is a collaboration harness for both humans and AI agents.

Its job is simple:

- locate the correct context
- remove the noise
- give the minimum correct context to the correct human or agent

The repository is the source of truth. If context matters across sessions, roles, or decisions, it belongs in the repo rather than only in chat history.

## High-Level Philosophy

HAI-Harness is not mainly about storing more context. It is about routing less context, more precisely.

Correct context means:

- relevant to the current participant
- sufficient for the current task
- minimal enough to avoid noise, drift, and wasted effort

The harness applies to both humans and AI agents. They are all participants in the same operating system.

One way to think about it:

- humans and AI are the water
- the harness is the water mill
- the repository is the machinery that turns flow into useful work

Without structure, energy gets wasted as repeated explanation, stale assumptions, and context overload. The harness exists to direct that flow.

## Core Purpose

HAI-Harness gives each participant only the context they should load now.

It does that by structuring the repository into clear layers:

- `Human/` for human judgment, decisions, open questions, and reflections
- `Agents/` for shared execution context, planner state, worker task contracts, handoffs, and reusable lessons

This separation helps, but it is not the main point. The main point is precise context routing with the repository as the only durable source of truth.

## Repository Map

- [Human/onboarding.md](Human/onboarding.md): where the human starts
- [Agents/onboarding.md](Agents/onboarding.md): mandatory first read for every agent
- [Agents/project_context.md](Agents/project_context.md): durable shared context
- [Agents/planning.md](Agents/planning.md): planner-owned active queue
- [Agents/tasks/](Agents/tasks/): execution contracts for worker roles
- [Agents/handoffs/](Agents/handoffs/): task baton passes for later sessions
- [Agents/lessons/](Agents/lessons/): compact reusable learnings
- [Agents/skills/](Agents/skills/): small role-like workflows for specific doc operations

## Roles

- `Claudia`: planner and orchestrator
- `Augustus`: worker slot assigned by the planner
- `Julius`: worker slot assigned by the planner

Each chat/session gets exactly one active role. Roles do not switch mid-session.

## Working Model

1. Human thinks in `Human/`.
2. Planner translates approved work into `Agents/planning.md` and task files.
3. A worker reads onboarding, role doc, task doc, and current handoff.
4. The worker executes only within role boundaries.
5. Handoffs and lessons preserve continuity across later chats.

## Starter Files

This repository is structured as starter templates, not a real product repo.

The important working files are already prepared to copy into another repository and fill in:

- [Human/](Human/)
- [Agents/](Agents/)

Critical files include:

- [Human/brief.md](Human/brief.md)
- [Human/decisions.md](Human/decisions.md)
- [Human/open_questions.md](Human/open_questions.md)
- [Human/reflections.md](Human/reflections.md)
- [Agents/project_context.md](Agents/project_context.md)
- [Agents/planning.md](Agents/planning.md)
- [Agents/tasks/augustus.md](Agents/tasks/augustus.md)
- [Agents/tasks/julius.md](Agents/tasks/julius.md)

## Principles

- The repository is the source of truth.
- Correct context beats broad context.
- Minimum sufficient context beats maximum available context.
- Humans and AI follow the same routing discipline.
- Planner state should be explicit and centralized.
- Workers should receive execution contracts, not vague goals.
- Preserve continuity with handoffs and lessons instead of relying on chat memory.
- Require explicit approval before high-cost or risky actions.

## Suggested Adoption Order

1. Replace [Human/brief.md](Human/brief.md) with your own product thesis.
2. Replace [Agents/project_context.md](Agents/project_context.md) with your real architecture and rules.
3. Rewrite [Agents/planning.md](Agents/planning.md) to reflect your active backlog.
4. Update worker task files under [Agents/tasks/](Agents/tasks/).
5. Keep handoffs and lessons small, current, and task-specific.

## Skills

The repo includes a few lightweight doc skills:

- `guardian`: read-only alignment audit between human and agent layers
- `decision-logger`: append a durable human decision
- `handoff`: refresh a task baton-pass note
- `retrospective`: capture reusable lessons from a messy task
