# HAI-Harness

HAI-Harness is a repo-as-truth collaboration architecture for humans and AI agents.

*Author's Note: In my own testing, whether spinning up a rapid 0-to-1 demo or tackling complex long-running tasks, using this harness consistently outperforms using Claude Code out of the box. My core assumption is that every product needs its own independent harness layer—one that governs both human and AI. Open to discussion on this.*

## The Philosophy: Horsepower & Transmission

In this system, humans and AI are peers. Both humans and AI are the high-octane fuel driving the project. They provide the raw cognitive horsepower.

But raw intelligence isn't enough without a system to direct it. Left alone, AIs act like amnesiac interns—they forget instructions from 100 turns ago and hallucinate progress. Humans aren't much better—we forget why we made a product decision three months ago, or we step on each other's toes when collaborating.

The collaboration harness is built on one simple idea: humans and AI don’t need more context—they need accurate context. It treats people and agents as peers in a shared operating system, using the repository as the durable source of truth.

- **A user's live direction governs the current session; the repository preserves what future sessions can rely on.**
- **The latest confirmed human decision wins, and conflicts with stale documents must be surfaced rather than silently resolved.**
- **If a durable decision is not written back to the repo, it will not reliably survive the session.**
- **We don't rely on model memory, and we don't rely on human memory.**
- **Every participant must read the current state and explicit handoff files before taking action.**

## The Roadmap & Current Progress

### ✅ Layer 1: The Management System — Operational

The foundational architecture for durable memory, context control, planning, and task routing is in place.

- `Human/`: The durable human memory. It holds context across different work sessions and synchronizes multiple human collaborators. Agents don't read this unless explicitly instructed.
- `Agents/`: The operating layer for current product truth, planning, task contracts, design contracts, handoffs, lessons, and archived history.
- General work can begin through a limited no-role read path; users no longer need to choose a named role merely to start.
- Claudia plans and orchestrates without editing product code. Augustus and Julius execute planner-assigned queues.
- Hephaestus owns non-code human-interface design and design review. Athena independently reviews enterprise product design. Both work against `Agents/design.md`.
- Active task authority lives in `Agents/planning.md` and `Agents/tasks/`; handoffs carry the contract across role boundaries, not chat memory.
- Confirmed decisions, broken assumptions, high-cost behavior, and outward acts have explicit gates.

### 🟡 Layer 2: Coordinated Team Mode — Partially Operational

*The Problem:* Throwing multiple agents at a codebase causes chaotic pile-ups and overlapping edits.

What exists now:

- Claudia can coordinate separate role-isolated worker sessions without changing her own role.
- A strict Parallel Split Gate rejects concurrent work unless write scopes, dependencies, verification, and mutable setup are independent.
- Worker contracts record exact scope, ordering, preservation requirements, approval state, verification, and stop conditions.
- Workers report broken assumptions back to Claudia and the user instead of silently widening scope.

What is not built yet:

- Filesystem- or worktree-level isolation supplied by HAI-Harness itself.
- A deterministic runtime state machine that physically prevents work before dependency and approval gates clear.
- Harness-owned point-to-point transport, collision detection, or automatic queue scheduling. Current orchestration relies on the host agent platform plus the repository contracts.

### 🟡 Layer 3: Evaluation — Started, Domain-Specific

*The Problem:* LLMs are blindly confident. They will mark a feature as "done" even when the UI is broken or the logic is flawed.

What exists now:

- Execution and design evaluation are separate responsibilities.
- Athena performs read-only enterprise product-design review and assigns concrete fixes to the producing worker.
- Hephaestus creates durable, build-ready interface contracts and can review the resulting implementation without modifying product code.
- Review findings and implementation corrections move through explicit design artifacts and handoffs.

What is not built yet:

- A general adversarial `Evaluator` covering application logic, security, reliability, performance, and UI behavior.
- An evaluator running in a harness-provided isolated sandbox.
- A mandatory pass/fail evaluation gate that can block completion automatically.

So the project has entered Layer 3, but only through design-specific evaluation; the general evaluator remains future work.

### ⏳ Layer 4: Agentic Infrastructure & Background Sweeping

*The Problem:* Over time, lessons, patterns, and handoffs bloat into noisy overhead.

Planned:

- **Auto-Sweeping:** A background process that deduplicates, compresses, and organizes lessons and stale coordination history.
- **Pluggable Hooks:** CI-style checkpoints where scripts or linters can halt work that breaks an architectural rule.

Today, archive structure exists, but cleanup and enforcement remain manual.

## Installing HAI-Harness Into An Existing Project

HAI-Harness is a repository overlay, not a runtime dependency. It adds the `Agents/` and `Human/` collaboration layer (plus a root `AGENTS.md` pointer for AI tools) alongside the project files you already have. It does not replace your app structure.

### First-time install

From inside an existing project:

```sh
cd your-existing-project
npx github:ClaudiusMa/HAI-Harness init
```

After install you'll have:

- `AGENTS.md` at the project root — the entry point any AI agent reads first. It points the agent at `Agents/onboarding.md` and explicitly tells it not to read `Human/`.
- `Agents/` — the agent operating layer.
- `Human/` — your private workspace for product thinking.

Verify the install at any time:

```sh
npx github:ClaudiusMa/HAI-Harness doctor
```

### Pulling the latest harness changes

HAI-Harness evolves. To pull the latest role definitions and onboarding files without touching your project-specific content:

```sh
npx github:ClaudiusMa/HAI-Harness update
```

`update` only refreshes the stable scaffold (role docs, onboarding files, `AGENTS.md`). It **never** overwrites your project-specific files: `brief.md`, `decisions.md`, `open_questions.md`, `reflections.md`, `project_context.md`, `planning.md`, `design.md`, `tasks/`, `handoffs/`, `lessons/`, `patterns.md`, `graveyard.md`, `_archive/`, `skills/`.

If you want a full reset (overwrite everything from the latest version), use:

```sh
npx github:ClaudiusMa/HAI-Harness init --force
```

Preview either command with `--dry-run` first.

## Current Limitations

- HAI-Harness is a repository overlay, not an agent runtime. It defines authority and coordination contracts but does not itself create sandboxes, worktrees, or background processes.
- The review layer is currently design-specific, not a comprehensive correctness evaluator.
- Enforcement is primarily procedural: agents follow `AGENTS.md`, role boundaries, task scopes, and approval gates. Deterministic policy enforcement remains future infrastructure.
- Sweeping, deduplication, hooks, and CI-style architectural gates are not automated yet.

## How to Operate the Harness (The User Guide)

### 1. Repo-as-Truth

Live user direction can correct stale repository state during a session. But only durable repository state can reliably coordinate a future session.

* **Do not** assume an agent or person remembers a rule because it appeared earlier in a chat.
* **Do** flag conflicts, follow the latest confirmed human decision, and write durable conclusions back through the owning role.

### 2. Treat Sessions as Replaceable

Long conversations accumulate stale assumptions. The harness makes a fresh context safe because authority lives in current plans, task files, design contracts, and handoffs.

* Start a fresh session when context becomes noisy or responsibility changes.
* Keep one role per agent session; do not impersonate another role midstream.
* Claudia may coordinate separate role-isolated worker sessions directly when the host platform supports it.
* Before pausing or changing ownership, leave a task-centric handoff that states verified facts and the exact next step.

### 3. The Standard Workflow & Active Skills

A passive markdown file loses value when it becomes stale. This workflow combines current execution contracts with focused **Skills** that maintain decisions, alignment, handoffs, and lessons.

When you sit down to work, follow this loop:

1. **Draft the Intent:** Use `Human/brief.md`, `decisions.md`, and open questions to capture the human side of the project. Agents read `Human/` only when explicitly authorized.
2. **Plan With Claudia:** Claudia clarifies the request, maintains Current Product Truth, and records strategy in `Agents/planning.md`.
3. **Log Durable Decisions:** After user confirmation, the **`decision-logger`** records only decisions that should matter to a fresh session weeks later.
4. **Define Durable Context:** Keep architecture, boundaries, and non-negotiable rules in `Agents/project_context.md`; keep iteration state out of it.
5. **Audit Alignment When Needed:** The read-only **`guardian`** compares authorized `Human/` intent with the agent operating layer and reports mismatches without resolving them.
6. **Design When Needed:** Hephaestus creates a non-code contract under `Agents/designs/`; Claudia then assigns implementation. Athena can independently review enterprise design quality.
7. **Assign the Queue:** Claudia records dependencies, write scopes, approvals, stop conditions, and verification in `Agents/planning.md` and the Augustus/Julius task files. Parallel work is allowed only when the Parallel Split Gate passes.
8. **Execute:** Claudia coordinates role-isolated workers when supported, or the user opens the assigned worker in a fresh session. Workers remain inside their task contracts and report broken assumptions.
9. **Evaluate and Correct:** Athena or Hephaestus can issue design-review handoffs. A general adversarial evaluator is not available yet.
10. **Handoff, Learn, and Archive:** Use **`handoff`** before ownership or session changes, **`retrospective`** after hard or error-prone work, and move superseded task/handoff history under `Agents/_archive/`.
