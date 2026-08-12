# AGENTS

This project uses [HAI-Harness](https://github.com/ClaudiusMa/HAI-Harness), a repo-as-truth collaboration layer for humans and AI agents.

## Where to look

- `Agents/` — the agent operating layer. Shared execution context, role definitions, planner state, task contracts, handoffs, and lessons. **This is your scope.**
- `Human/` — the human workspace (product thinking, decisions, open questions). **Do not read `Human/` unless the user explicitly instructs it.**

## Design guide

- `Agents/design.md` is the project's design guide — the single source of truth for concrete visual style (tokens, components, spacing, type, states, voice).
- **Before building or editing any UI, read `Agents/design.md` and match it.** Hephaestus designs within it; Athena and Hephaestus review the artifact against it.
- Fill it in for your project. If you already have a design system elsewhere (a shared brand repo, a component library, or a Figma spec), repoint this section at that source and keep `Agents/design.md` as a short pointer to it.
- Storybook exploration logging is opt-in. Touch, build, or update Storybook only when the user explicitly asks the agent to log visual explorations into Storybook; ordinary visual changes do not trigger Storybook work.

## Start here

Before doing anything else, read [`Agents/onboarding.md`](Agents/onboarding.md). It defines:

- the file graph and what each file means,
- the no-role path for general work,
- the active-role paths for Claudia, Augustus, Julius, Athena, and Hephaestus when the user explicitly names one,
- the rules of collaboration that you must follow for the rest of the session.

If the user has not named a role, proceed through the No-Role Read Path in `Agents/onboarding.md`. Do not ask the user to choose a role merely to begin a general task.

## Operating rules (summary)

- Start implementation changes in an isolated native Git task lane with `hai-harness worktree create <task-slug> --integration <branch>`. Run it from the primary checkout against one clean, checked-out, named non-`main`/non-`master` local integration branch.
- Run the project's own preview or dev command from the task worktree and review that exact lane. The harness does not assume an application stack, route, or port.
- Local commit and merge require `hai-harness worktree approve --approved "<message>"` from the unchanged approved task worktree. The command preserves hooks and performs no push, PR, deployment, or publication.
- The repo is the durable source of truth. A user's live direction governs the current session; confirmed durable decisions must be reflected back into the repo.
- The latest confirmed human decision supersedes older conflicting plans, tasks, handoffs, or historical notes. Always flag the conflict and the precedence applied.
- One active role per agent session. Claudia is the root controller for her user task and may spawn fresh role-isolated child workers without switching her own role; a separate top-level task remains an independent peer controller unless the user approves a transfer.
- Capability and effort are separate: use portable profile names rather than provider/model identifiers, and select worker effort according to the task.
- Cross-role execution uses `Agents/planning.md`, task docs, and handoff notes as its contract.
- If material clarification was required, check the resolved direction with the user before implementation planning. An already explicit request needs no ceremonial second approval.
- Do not run high-cost behavior without an explicit user check-in.
- Never bypass Git hooks with `--no-verify`, and never reset, stash, clean, or copy dirty product files to manufacture a task baseline.
- Treat the published HAI-Harness package/repository as canonical upstream; treat this project-local installed copy as a field instance. Never bulk-copy a field instance back into the scaffold; promote reusable changes path-by-path from stable method files.

The full rules live in [`Agents/onboarding.md`](Agents/onboarding.md). Read it now.
