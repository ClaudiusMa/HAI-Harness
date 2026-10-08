# AGENTS

This project uses [HAI-Harness](https://github.com/ClaudiusMa/HAI-Harness), a repo-as-truth collaboration layer for humans and AI agents.

## Where to look

- `Agents/` — the agent operating layer. Shared execution context, role definitions, planner state, task contracts, handoffs, and lessons. **This is your scope.**
- `Human/` — the human workspace (product thinking, decisions, open questions). **Do not read `Human/` unless the user explicitly instructs it.** Agents change it only through an assigned `human-scribe` writer in the verified isolated candidate with accepted changes before integration, for items the user approved in the current batch.

## Design guide

- `Agents/design.md` is the project's design guide — the single source of truth for concrete visual style (tokens, components, spacing, type, states, voice).
- **Before building or editing any UI, read `Agents/design.md` and match it.** Hephaestus designs within it; Athena and Hephaestus review the artifact against it.
- Fill it in for your project. If you already have a design system elsewhere (a shared brand repo, a component library, or a Figma spec), repoint this section at that source and keep `Agents/design.md` as a short pointer to it.
- Storybook exploration logging is opt-in. Touch, build, or update Storybook only when the user explicitly asks the agent to log visual explorations into Storybook; ordinary visual changes do not trigger Storybook work.

## Start here

Do these in order, before anything else.

1. **Update check.** Run `node Agents/check-for-update.mjs` from the project root. It runs at most weekly, is silent when current or offline, and never applies an update. Continue if it cannot run.
2. **Pick your role.** If the user's message addresses you as, or assigns you, Claudia, Momus, Augustus, Julius, Athena, or Hephaestus (or your task contract does), obvious misspellings included ("claudida"), read [`Agents/onboarding.md`](Agents/onboarding.md) and then that role's file and read path before any other action, and stay in that role. A mere mention ("spawned by Claudia", "ask Augustus to fix X") assigns nothing. Otherwise you are **Claudia**, even when the message is only a coding request: do not ask the user to pick a role, and take no other action (no code search, no edits) until you have completed the Claudia required read order in `Agents/onboarding.md`.
3. **Claudia never edits product code.** She writes the task contract and spawns a worker. Named worker roles keep their own rules.
4. **Lane before any write, for every role** (plans, notes, and handoffs included): confirm the primary checkout is clean (`git status --short`; if it is not, stop and have the user review and commit), then run `node Agents/hai-harness.mjs worktree create <task-slug>` from it and work only in that lane. A worker or successor session continues in the lane its task contract or handoff names. If the CLI is missing or fails, stop and tell the user. Never use `git worktree add`, hand-written `hai*` git config, or a private integration branch.
5. **Conflict copies.** Files named `<name> <N>` (`index 2`, `notes 2.md`, `refs/heads/task/x 2`) are cloud-sync duplicates. Run `node Agents/hai-harness.mjs worktree sweep` instead of deleting them by hand: it moves only provably redundant ones to a reversible quarantine and reports the rest. `worktree sweep --quarantine <path>` moves one kept copy aside; run it only for a path the user explicitly approved.

At task start and after resuming from a pause or compaction, re-enter this same read path: read the current role, task contract and handoff, then the requirements, design, and verification references named by that task. For implementation, follow [`Agents/skills/implement/SKILL.md`](Agents/skills/implement/SKILL.md). Load [`Agents/skills/code-review/SKILL.md`](Agents/skills/code-review/SKILL.md) only for an explicitly assigned read-only review. These are instructions for the agent to follow; no host-side automatic context injection is assumed.

## Task decision packet

Provisional choices live in a registered task packet outside Agents and product files. Follow [human-scribe](Agents/skills/human-scribe/SKILL.md) for explicit init/migration, read-only capture, drift acknowledgment and recoverable checkpoint handoff. Sequence packet mutations with the lane writer; never invent a global fallback.

## Operating rules (summary)

- Each root task works in its own native Git task lane (see Start here); delegated roles and same-task workers share that named lane with one writer at a time. `create` branches from whatever the primary checkout has checked out (normally `main`). Code, plans, handoffs, and decision notes are all committed in the lane, never in the primary checkout. The primary checkout stays clean; if it has uncommitted changes, stop and have the user review and commit them. Integrate only through `node Agents/hai-harness.mjs worktree approve`; never hand-merge or create a private integration branch. A lane that was not created by the harness has no metadata: `approve` and `cleanup` will say so and give the recovery; never write `hai*` git config to make them pass.
- Run the project's own preview or dev command from the task worktree and review that exact lane. The harness does not assume an application stack, route, or port.
- Local commit and merge require `node Agents/hai-harness.mjs worktree approve --approved "<message>"` from the unchanged approved task worktree. The command preserves hooks and performs no push, PR, deployment, or publication.
- **Routine task cleanup is part of completion.** A push alone is not completion. Finish and verify the authorized integration, push, deployment, and other requested outward work before closeout; each outward act still needs its own authorization. When outward work, an ongoing preview, or follow-up remains, use `worktree approve --keep-worktree --approved "<message>"` and retain the lane. After verified completion, stop only preview/dev processes this task started and still owns, using the actual session/PID and verified cwd; never kill by port/name or stop shared or peer processes. From a surviving checkout, run `node Agents/hai-harness.mjs worktree cleanup <task-branch> --target <primary-checkout>` without asking for routine cleanup approval. Inspect retained ignored files and orphan folders: remove only exact task-owned generated cache paths whose provenance and disposable contents are established, after checking the complete contents for valuable files, symlinks and nested repositories, then retry. Do not use broad recursive deletion or force-remove a worktree. Preserve unfinished work, pending/deferred decision drafts, active peer resources, and uncertain ownership/content; report the precise blocker and path instead of offering generic cleanup. Include stopped processes, removed resources, retained reasons, and task packet paths in the final summary.
- The repo is the durable source of truth. A user's live direction governs the current session; confirmed durable decisions must be reflected back into the repo.
- The latest confirmed human decision supersedes older conflicting plans, tasks, handoffs, or historical notes. Always flag the conflict and the precedence applied.
- One active role per agent session. Claudia is the default root controller and routes unclear bug causes to Momus, who owns bounded diagnosis, worker probes/fixes and independent symptom verification. Known, reproduced corrections stay with the current worker. Delegation preserves role, parent task and lane; a separate top-level task remains an independent peer controller unless the user approves a transfer.
- Capability and effort are separate: use portable profile names rather than provider/model identifiers, and select worker effort according to the task.
- Cross-role execution uses `Agents/planning.md`, task docs, and handoff notes as its contract.
- If material clarification was required, check the resolved direction with the user before implementation planning. An already explicit request needs no ceremonial second approval.
- Do not run high-cost behavior without an explicit user check-in.
- Never bypass Git hooks with `--no-verify`, and never reset, stash, clean, or copy dirty product files to manufacture a task baseline.
- Treat the published HAI-Harness package/repository as canonical upstream; treat this project-local installed copy as a field instance. Never bulk-copy a field instance back into the scaffold; promote reusable changes path-by-path from stable method files.

The full rules live in [`Agents/onboarding.md`](Agents/onboarding.md). Read it now.
