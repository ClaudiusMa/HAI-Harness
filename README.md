# HAI-Harness

HAI-Harness is a document-first collaboration method for humans and coding agents.

It separates:

- human thinking from agent execution
- planning from implementation
- live work from cross-session memory

This repository is intentionally published as a method repo, not a real product repo. Where examples are useful, the docs use a fictional sample product so the workflow stays concrete without exposing private project context.

## Core Idea

Use `Human/` for product judgment, thesis, decisions, and unresolved questions.

Use `Agents/` for:

- shared execution context
- role boundaries
- planner-owned queue state
- worker task contracts
- task handoffs
- reusable lessons

The human does not dump raw thinking straight into agent execution. The planner translates what matters into the agent-facing layer first.

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
- `Augustus`: data, persistence, services, and backend-heavy work
- `Julius`: UI, interaction, and user-facing behavior

Each chat/session gets exactly one active role. Roles do not switch mid-session.

## Working Model

1. Human thinks in `Human/`.
2. Planner translates approved work into `Agents/planning.md` and task files.
3. A worker reads onboarding, role doc, task doc, and current handoff.
4. The worker executes only within role boundaries.
5. Handoffs and lessons preserve continuity across later chats.

## What Is Example Content

The following files contain fictional example content so the method is understandable on its own:

- [Human/brief.md](Human/brief.md)
- [Agents/project_context.md](Agents/project_context.md)
- [Agents/planning.md](Agents/planning.md)
- [Agents/tasks/](Agents/tasks/)
- [Agents/handoffs/](Agents/handoffs/)
- [Agents/lessons/](Agents/lessons/)

When adopting the harness for a real project, replace those examples with your own project context and live task state.

## Principles

- Keep human reflection private until it is ready to be translated.
- Make planner state explicit and centralized.
- Give workers execution contracts, not vague goals.
- Preserve session continuity with short handoffs instead of long chat history.
- Require explicit approval before high-cost or risky actions.
- Prefer clarity over cleverness in both docs and delegation.

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
