# HAI-Harness

HAI-Harness is a collaboration architecture for both humans and AI agents. 

*Author's Note: In my own testing, whether spinning up a rapid 0-to-1 demo or tackling complex long-running tasks, using this harness consistently outperforms using Claude Code out of the box. My core assumption is that every product needs its own independent harness layer—one that governs both human and AI. Open to discussion on this.*

## The Philosophy: Horsepower & Transmission

In this system, humans and AI are peers. Both humans and AI are the high-octane fuel driving the project. They provide the raw cognitive horsepower.

But raw intelligence isn't enough without a system to direct it. Left alone, AIs act like amnesiac interns—they forget instructions from 100 turns ago and hallucinate progress. Humans aren't much better—we forget why we made a product decision three months ago, or we step on each other's toes when collaborating.

The collaboration harness built on one simple idea: humans and AI don’t need more context—they need accurate context. It treats humans and AIs as equals in a shared operating system, using the repository as the absolute source of truth.

- **If a decision isn't written in the repo, it doesn't exist.**
- **We don't rely on model memory, and we don't rely on human memory.** 
- **Every participant must read the current state and explicit handoff files before taking action.**

## The Roadmap & Current Progress

### ✅ Where We Are Right Now (Layer 1: The Management System)

We have built the foundational architecture for memory, context isolation, and task routing. 

- `Human/`: The durable human memory. It holds context across different work sessions and synchronizes multiple human collaborators. Agents don't read this unless explicitly instructed.
- `Agents/`: The execution layer. Shared context, task queues, and handoff files.
- Roles: "Claudia" plans. "Augustus" and "Julius" execute. No role-switching mid-session.
- Handoffs: Workers pass the baton via explicit markdown files (`Agents/handoffs/`), not chat history.

### ⏳ Next: Concurrency & Team Mode (Layer 2)

*The Problem:* Throwing multiple agents at a codebase causes chaotic pile-ups and overlapping edits. 

*The Fix:* A true "Team Mode." Agents will get isolated workspaces and point-to-point communication. We will use strict state-machine routing so workers are physically blocked from touching code until the planner approves the dependency graph.

### ⏳ Next: The Evaluator (Layer 3)

*The Problem:* LLMs are blindly confident. They will mark a feature as "done" even when the UI is broken or the logic is flawed.

*The Fix:* Splitting execution and evaluation. We will introduce a dedicated adversarial `Evaluator` agent. Running in an isolated sandbox, its only job is to aggressively try to break the worker's output.

### ⏳ Next: Agentic Infra & Background Sweeping

*The Problem:* Over time, lessons, patterns, and handoffs bloat into noisy overhead.

*The Fix:* - **Auto-Sweeping:** A background process that runs while we sleep to silently deduplicate, compress, and organize the `lessons/` folder.
- **Pluggable Hooks:** Custom CI-style checkpoints where specific scripts or linters can automatically halt an agent if it breaks an architectural rule.

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

`update` only refreshes the stable scaffold (role docs, onboarding files, `AGENTS.md`). It **never** overwrites your project-specific files: `brief.md`, `decisions.md`, `open_questions.md`, `reflections.md`, `project_context.md`, `planning.md`, `tasks/`, `handoffs/`, `lessons/`, `patterns.md`, `graveyard.md`, `_archive/`, `skills/`.

If you want a full reset (overwrite everything from the latest version), use:

```sh
npx github:ClaudiusMa/HAI-Harness init --force
```

Preview either command with `--dry-run` first.

## How to Operate the Harness (The User Guide)

### 1. Repo-as-Truth
As OpenAI found in their agent experiments: *If it is not in the repository, it does not exist.* Slack messages, your internal mental model, and previous chat history do not matter. The only reality the agent can see is the files on disk.
* **Do not** assume the agent remembers a rule just because you talked about it 20 prompts ago. 
* **Do** force the system to write it down permanently.

### 2. Context Reset (Chat Sessions are Disposable)
In Anthropic's engineering post-mortems, they noted that even with massive token windows, models suffer from "amnesiac intern syndrome." Performance plummets as the chat gets longer because the model gets confused by its own bloated history. 
* **Never** keep one massive chat window open for an entire project.
* **Kill the Session:** When a task gets complex or the chat feels long, close the chat entirely. 
* **The Fresh Start:** Open a completely new, blank chat session. A clean context window equipped with a strict handoff document will always outperform a bloated chat history.

### 3. The Standard Workflow & Active Skills
A passive markdown file is useless if it's outdated. OpenAI's experiments proved that agents will ignore rules in a passive document unless they are enforced. This workflow relies on active **Skills**—lightweight agent tools designed to actively maintain the system.

When you sit down to work, follow this loop:

1. **Draft the Intent:** Use an AI to help you write `Human/brief.md`, `decisions.md`, and open questions based on your raw ideas.
2. **Talk to Claudia & Log Decisions:** Talk to "Claudia" (the planner agent) to discuss what needs to be done. Because unrecorded decisions simply don't exist, trigger the **`decision-logger`** skill when you make an architectural choice to immediately save it to `Human/decisions.md`.
3. **Define the Reality:** Have Claudia write `Agents/project_context.md` to establish your architecture and system rules so the coding agents have a map.
4. **Audit the Alignment:** Run the **`guardian`** skill. Long-running agents inherently drift away from the original plan over time. `guardian` acts as a read-only auditor that scans the repo to verify your `Human/` intent and the `Agents/` execution reality still match.
5. **Generate the Plan:** Claudia automatically writes the execution plan in `Agents/planning.md` and assigns the specific task contracts to the worker slots (Augustus and Julius).
6. **Execute, Handoff, and Reset:** Switch to an execution agent (Augustus/Julius) in a *new chat session*. Let them work through the task contract. Before the context window degrades, trigger the **`handoff`** skill. 
7. **Capture Lessons:** If a task fails or gets messy, trigger the **`retrospective`** skill. Models will confidently repeat the same mistakes in new chat sessions unless the failure is distilled into a clean, reusable lesson in `Agents/lessons/`.

## TerraTech / Alex Design Team Simulator (Demo App)

This branch includes a Next.js demo for the **TerraTech design team simulator** — a multi-agent workspace where **Alex** (design-system worker) collaborates with the design team on TerraTech tokens, components, and artboards.

### Run the demo

```bash
pnpm install
pnpm dev
```

Then open:

- [http://localhost:3000/terratech](http://localhost:3000/terratech) — TerraTech brand demo
- [http://localhost:3000/workspace](http://localhost:3000/workspace) — Cohort multi-agent workspace with Alex design canvas

Apply Supabase migrations before using the workspace:

```bash
supabase db push
```
