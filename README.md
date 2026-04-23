# HAI-Harness

HAI-Harness is a collaboration architecture for both humans and AI agents. 

## The Philosophy: Horsepower & Transmission

In this system, humans and AI are peers. Both humans and AI are the high-octane fuel driving the project. They provide the raw cognitive horsepower.

But raw intelligence isn't enough without a system to direct it. Left alone, AIs act like amnesiac interns—they forget instructions from 100 turns ago and hallucinate progress. Humans aren't much better—we forget why we made a product decision three months ago, or we step on each other's toes when collaborating.

The harness solves context loss for everyone. It treats humans and AIs as equals in a shared operating system, using the repository as the absolute source of truth.

- If a decision isn't written in the repo, it doesn't exist.
- We don't rely on model memory, and we don't rely on human memory. 
- Every participant must read the current state and explicit handoff files before taking action.

## The Roadmap & Current Progress

### ✅ Where We Are Right Now (Layer 1: The Management System)

We have built the foundational architecture for memory, context isolation, and task routing. 

- **`Human/`**: The durable human memory. It holds context across different work sessions and synchronizes multiple human collaborators. Agents don't read this unless explicitly instructed.
- **`Agents/`**: The execution layer. Shared context, task queues, and handoff files.
- **Roles**: "Claudia" plans. "Augustus" and "Julius" execute. No role-switching mid-session.
- **Handoffs**: Workers pass the baton via explicit markdown files (`Agents/handoffs/`), not chat history.

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