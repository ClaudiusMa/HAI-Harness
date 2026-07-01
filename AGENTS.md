# AGENTS

This project uses [HAI-Harness](https://github.com/ClaudiusMa/HAI-Harness), a repo-as-truth collaboration layer for humans and AI agents.

## Where to look

- `Agents/` — the agent operating layer. Shared execution context, role definitions, planner state, task contracts, handoffs, and lessons. **This is your scope.**
- `Human/` — the human workspace (product thinking, decisions, open questions). **Do not read `Human/` unless the user explicitly instructs it.**

## Design guide

- `Agents/design.md` is the project's design guide — the single source of truth for concrete visual style (tokens, components, spacing, type, states, voice).
- **Before building or editing any UI, read `Agents/design.md` and match it.** The design reviewers (Athena, Hephaestus) check the artifact's adherence to it.
- Fill it in for your project. If you already have a design system elsewhere (a shared brand repo, a component library, or a Figma spec), repoint this section at that source and keep `Agents/design.md` as a short pointer to it.

## Start here

Before doing anything else, read [`Agents/onboarding.md`](Agents/onboarding.md). It defines:

- the file graph and what each file means,
- the active role you are in (Claudia, Augustus, Julius, Athena, or Hephaestus) and its required read order,
- the rules of collaboration that you must follow for the rest of the session.

If the user has not told you which role you are in, ask before proceeding.

## Operating rules (summary)

- The repo is the only source of truth. Do not act on chat history or assumed memory.
- One role per chat session. No role switching mid-session.
- Cross-role collaboration happens through `Agents/planning.md`, task docs, and handoff notes — never through chat history.
- Do not move from clarification into implementation planning without an explicit user check-in.
- Do not run high-cost behavior without an explicit user check-in.

The full rules live in [`Agents/onboarding.md`](Agents/onboarding.md). Read it now.
