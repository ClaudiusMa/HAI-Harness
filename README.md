# HAI-Harness

HAI-Harness is a repo-as-truth collaboration architecture for humans and AI agents.

**Want to contribute or understand where the project is heading?** Start with the [contributor guide and project records](https://github.com/ClaudiusMa/HAI-Harness/blob/main/CONTRIBUTING.md).

*Author's Note: In my own testing, whether spinning up a rapid 0-to-1 demo or tackling complex long-running tasks, this harness consistently improves on an unstructured agent workflow. My core assumption is that every product needs its own independent harness layer—one that governs both human and AI. Open to discussion on this.*

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

- `Human/`: The durable human memory. It holds context across different work sessions and synchronizes multiple human collaborators. Agents keep it current for you and change it only with your approval; they don't read it unless explicitly instructed.
- `Agents/`: The operating layer for current product truth, planning, task contracts, design contracts, handoffs, lessons, and archived history.
- When the user names no role, the session is Claudia; follow the Claudia required read order in `Agents/onboarding.md`.
- Claudia plans and orchestrates without editing product code. Augustus and Julius execute planner-assigned queues. For unclear bug causes, failed repairs without an established cause, or investigations needing runtime/intermittent/cross-component evidence, Claudia selectively routes to [Momus](Agents/momus.md). Known, reproduced, bounded fixes stay with the current worker using [debugging](Agents/skills/debugging/SKILL.md); an ordinary bug does not add another agent or report cycle.
- Hephaestus owns non-code human-interface design and design review. Athena independently reviews enterprise product design. Both work against `Agents/design.md`.
- Active task authority lives in `Agents/planning.md` and `Agents/tasks/`; handoffs carry the contract across role boundaries, not chat memory.
- Confirmed decisions, broken assumptions, high-cost behavior, and outward acts have explicit gates.

### ✅ Layer 2: Coordinated Team Mode — Operational

*The Problem:* Throwing multiple agents at a codebase causes chaotic pile-ups and overlapping edits.

The repository-level coordination system is operational:

- Claudia is the root controller for the user task and spawns fresh role-isolated Augustus or Julius child workers without changing her own role.
- A separately created top-level task is a peer controller, not spare worker capacity. Moving ownership between controllers requires explicit user approval and an accepted handoff.
- Capability profile and reasoning effort are separate: Claudia uses the portable `reasoning-controller` profile, implementation children use `fast-worker`, and effort is selected independently for the task. Harness files do not pin providers, model names, or versions.
- A strict Parallel Split Gate rejects concurrent work unless write scopes, dependencies, verification, and mutable setup are independent.
- Worker contracts record exact scope, ordering, preservation requirements, approval state, verification, and stop conditions.
- Workers report broken assumptions back to Claudia and the user instead of silently widening scope.
- Native CLI worktree lanes isolate implementation on `task/<task-slug>` branches and gate hook-preserving local integration on explicit approval.
- The `traffic-control` skill performs a read-only census across peer-controller tasks and the current task's child workers, then returns exactly one state: `CLEAR`, `SEQUENCE`, `TRANSFER_REQUIRED`, or `BLOCKED`.
- Fast Resume avoids a full repeat census only when the same root controller resumes the same child worker in the same worktree with unchanged or narrower scope and no relevant drift.

HAI-Harness supplies the durable contracts, Git isolation, and coordination method; it deliberately uses the host agent platform for task transport and child-worker execution rather than implementing its own agent runtime or scheduler.

### 🟡 Layer 3: Evaluation — Started, Domain-Specific

*The Problem:* LLMs are blindly confident. They will mark a feature as "done" even when the UI is broken or the logic is flawed.

What exists now:

- Execution and design evaluation are separate responsibilities.
- Athena performs read-only enterprise product-design review and assigns concrete fixes to the producing worker.
- Hephaestus creates durable, build-ready interface contracts and can review the resulting implementation without modifying product code.
- Review findings and implementation corrections move through explicit design artifacts and handoffs.
- Momus owns bounded diagnosis, worker probes/fixes and independent verification of the original symptom on the final candidate. You can also name Momus directly. Existing repair authority carries through; diagnosis-only stays read-only. He reuses an authorized same-task worker and handoff, stops after three unsuccessful applied fixes by default, and can satisfy an assigned independent source review when he did not implement the change.

What is not built yet:

- A general adversarial `Evaluator` covering application logic, security, reliability, performance, and UI behavior.
- An evaluator running in a harness-provided isolated sandbox.
- A mandatory pass/fail evaluation gate that can block completion automatically.

Design review and bounded bug symptom verification are available; the general adversarial evaluator remains future work.

### 🟡 Layer 4: Agentic Infrastructure & Background Sweeping — Started

*The Problem:* Over time, lessons, patterns, and handoffs bloat into noisy overhead.

What exists now:

- `lesson-logger` promotes confirmed failures toward deterministic checks or capped Standing Gates before retaining conditional lesson files.
- `Agents/lessons/INDEX.md` is the capped always-loaded routing layer and intake-sweep cursor.
- The retired retrospective, patterns, and graveyard paths remain as compatibility tombstones.

Still planned:

- **Auto-Sweeping:** A background process that deduplicates, compresses, and organizes lessons and stale coordination history.
- **Pluggable Hooks:** CI-style checkpoints where scripts or linters can halt work that breaks an architectural rule.

Today, archive structure and compact promotion exist, but background cleanup and automatic execution of project-specific checks remain future work.

## Installing HAI-Harness Into An Existing Project

HAI-Harness is a repository overlay, not a runtime dependency. It adds the `Agents/` and `Human/` collaboration layer plus a root `AGENTS.md` entry point alongside the project files you already have. It does not replace your app structure.

### First-time install

From inside an existing project:

```sh
cd your-existing-project
npx github:ClaudiusMa/HAI-Harness init
```

After install you'll have:

- `AGENTS.md` at the project root — the provider-neutral entry point for AI agents. It points the agent at `Agents/onboarding.md` and explicitly tells it not to read `Human/`.
- `Agents/` — the agent operating layer, including `Agents/hai-harness.mjs`, the project's own dependency-free copy of the CLI. Agents run lanes with `node Agents/hai-harness.mjs …`, which needs no PATH entry, npm, or network.
- `Human/` — your human-owned workspace for product thinking. Visibility follows your project's sharing and version-control policy; agents do not read it by default.
- `.hai-harness.json` — the installed-version receipt and update-check preference.

Verify the install at any time:

```sh
npx github:ClaudiusMa/HAI-Harness doctor
node Agents/hai-harness.mjs doctor
```

### Safe scaffold updates

HAI-Harness evolves. To pull the latest role definitions and onboarding files without touching your project-specific content:

```sh
npx github:ClaudiusMa/HAI-Harness update
```

`update` refreshes stable method files and generic infrastructure: the root entry point, the project's copy of the CLI (`Agents/hai-harness.mjs`), onboarding and role methods, task/handoff/lesson/archive templates and README files, reusable skills, and `Human/onboarding.md`. It creates a missing lesson index or generated worker task file but never replaces populated project state.

Project-authored planning, context, design, worker queues, handoff entries, lesson index/content, legacy decision trail and inbox entries, archive entries, and Human workspace content remain untouched. Preview the refresh with `--dry-run`; reserve `init --force` for an intentional full reset. `init` and `update` carry the packaged templates, so they run only from the published package; the project copy of the CLI refuses them and prints the `npx github:ClaudiusMa/HAI-Harness …` command to run instead.

### Update Beacon

Installed projects run `node Agents/check-for-update.mjs` at session startup. The dependency-free checker makes at most one weekly HTTPS `GET` to GitHub's latest published Release endpoint. It sends no project content, identifiers, file paths, telemetry, or account data. Drafts, prereleases, and version metadata merged to `main` cannot trigger a notice; only a published stable GitHub Release can. Current and offline checks are silent; when a newer stable release exists, the checker shows one notice for that release and offers:

```sh
npx github:ClaudiusMa/HAI-Harness update --dry-run
```

The beacon never downloads or applies an update. Disable or re-enable it for a project with:

```sh
node Agents/check-for-update.mjs --disable
node Agents/check-for-update.mjs --enable
```

`doctor` reports the cached or newly checked state as `current`, `update available`, `disabled`, or `unknown/offline`. The `.hai-harness.json` receipt records only the installed version, stable channel, and project preference; `init` and `update` refresh its installed version while preserving an opt-out. Cadence, cached results, and last-notified state stay in Git-local metadata (or the user's local cache outside Git), so routine checks do not dirty the project worktree. Teams that commit installed harness files should decide explicitly whether the stable receipt belongs in version control.

### Source task template and installed task state

The published upstream contains only `Agents/tasks/TEMPLATE.md`. During `init`, HAI-Harness renders project-local `Agents/tasks/augustus.md` and `Agents/tasks/julius.md` from that template. Those generated files become project-owned queue state: `update` creates either one if missing, but never overwrites a populated installed task file. This prevents live or historical assignments from a field instance from leaking back into the distributable scaffold.

### Native task worktrees

```sh
node Agents/hai-harness.mjs worktree create my-task --integration develop
node Agents/hai-harness.mjs worktree status
node Agents/hai-harness.mjs worktree approve --approved "Complete my task"
```

Create runs from the clean primary checkout and creates `task/<task-slug>` from the branch it has checked out, normally `main`. `worktree status --all` lists lanes and the files they share. Approval runs from the task lane and preserves Git hooks. It first merges the latest `main` into the lane. If that brought changes, it stops so you can re-test. If it conflicts, it changes nothing and lists the files. Otherwise it fast-forwards `main` to a local merge commit. A dirty primary checkout blocks both create and approve. No push, PR, deployment, or publication is performed.

Lanes must come from `worktree create`. A branch made with plain `git worktree add` has no recorded integration branch or base, so `approve` and `cleanup` say it was not created by the harness and explain the recovery: create a real lane from the clean primary, run `git merge <that branch>` inside it, and approve from there. Never set `hai*` git config by hand to make them pass.

### Cloud-sync conflict copies

Projects kept in iCloud Drive or a similar sync service can collect duplicates named `<name> <N>` (`index 2`, `notes 2.md`, `refs/heads/task/x 2`), including inside `.git`, where a ref copy surfaces as `fatal: bad object`. Repositories and lanes stay where they are and keep syncing. Instead, `worktree create`, `approve`, and `cleanup` sweep the Git common directory, registered worktree admin directories, harness task packets, and untracked files in the primary and the current lane before they act; `node Agents/hai-harness.mjs worktree sweep` does the same on demand, and `doctor` reports the findings without moving anything.

A copy moves to a reversible quarantine (a dated folder under the Git common directory's `hai-harness/quarantine/`, same relative paths, with a manifest) only when it is provably redundant: byte-identical to the original, a loose ref copy whose commit is already contained in the real ref, or a Git `index <N>` cache copy. Tracked files are never touched and nothing is deleted. Everything else is kept and reported with both paths and a next step. A kept copy that Git or the harness reads (a ref, `HEAD`, a worktree admin directory, a task-packet directory) stops the lane commands until you resolve it, and `approve` refuses while a differing sync duplicate of an existing file, or an untracked directory beside a directory of the original name, sits in the lane it would commit; if such a path is intentional, renaming it or staging it explicitly with `git add` lets approve proceed. For a path you have approved, `node Agents/hai-harness.mjs worktree sweep --quarantine <path>` moves that one copy (Git metadata, or an untracked file of this checkout; a relative path is resolved against `--target`, default the current directory) into the same quarantine; its manifest line is marked user-directed.

### Keeping Human/ current

Agents keep Human records current through [human-scribe](Agents/skills/human-scribe/SKILL.md), and you approve every batch. Provisional why-entries and pending/deferred drafts live outside Agents and product files in task-owned Git common metadata. The packet identity binds the canonical task branch, base, integration and physical harness scope. Root and `--target .hai` are separate scopes; there is no global inbox fallback.

In a recognized task lane, explicitly adopt the scope once:

```sh
node Agents/hai-harness.mjs human-sync init --target .
node Agents/hai-harness.mjs human-sync status --target .
node Agents/hai-harness.mjs human-sync --target .
```

Use `init --migrate` instead when both legacy Agents trail/inbox files exist. It verifies exact copies, saves a supersession receipt, then retires the sources; partial or populated storage is never blindly overwritten. Initialization adopts the current state as baseline and cannot reconstruct earlier history. `status` returns the physical packet directory, identity, HEAD and snapshot. Append trace entries and drafts only there, serialized with the task lane writer.

Default capture is offline, deterministic and read-only: no model or network call occurs in the CLI. It filters entries after the inbox cursor, preserving malformed-item review and duplicate suppression. The skill drafts user decisions and agent assumptions, and Claudia presents pending and deferred items in one batch. An assigned writer deduplicates and applies only approved Human items in the verified isolated candidate with accepted changes before integration. Approved README drafts go to a worker lane. Unreviewed and deferred choices remain provisional.

`doctor` warns about waiting drafts and dirty or committed traced-path drift. After appending a valid new trace entry naming every changed traced path, use the exact observations from `status`:

```sh
node Agents/hai-harness.mjs human-sync acknowledge --through T1 --head <HEAD> --snapshot <digest> --target .
node Agents/hai-harness.mjs human-sync checkpoint --output /private/checkpoints/task.json --target .
```

Replace the placeholders and use the actual new trace ID. Acknowledgment does not approve Human drafts; committing an acknowledged dirty change requires another trace and acknowledgment. The checkpoint parent must exist and its new file must be outside every registered repository worktree. Packets remain in Git common metadata after lane cleanup, but Git push/fetch never transfers them. Transfer the checkpoint explicitly for cross-machine recovery and reconcile the original identity; import automation is not implemented. Retain the lane and packet for unfinished work and record the physical packet/checkpoint in its handoff.

Automatic session attachment, submit freezing, full lifecycle/host write enforcement, generation fencing and distributed coordination remain pending.

### Prompt-hygiene diagnostics

`doctor` checks required scaffold files and flags live startup context above generous limits: 1,200 lines for `Agents/planning.md` and 400 lines for each worker task file. Move completed queues and historical evidence to `Agents/handoffs/` or `Agents/_archive/`.

### Source and visual-work boundaries

This repository is the canonical published HAI-Harness upstream. Installed copies are field-instance evidence, not trees to bulk-copy back; promote reusable method changes path-by-path. Storybook exploration logging is opt-in: ordinary visual changes must not touch, build, or update Storybook unless the user explicitly asks the agent to log visual explorations there.

### Release discipline

A push to origin `main` runs the release planner automatically. When installable product paths changed since the last `vX.Y.Z` tag (`Agents/`, `Human/`, `bin/`, `scaffold/`, `package.json`, `release.json`, `README.md`, `LICENSE`, `hai-meta`), the workflow bumps the shared patch version in `package.json` and `release.json` and opens a pull request. It stops there. That pull request is created only when the repository allows GitHub Actions to create pull requests. After you review and merge that pull request, the workflow tags `v<version>` on that merge and publishes the stable GitHub Release. The workflow does not merge the pull request. A `.hai/`-only push does not publish, and a later push does not publish an untagged version that is already in `package.json`. The Update Beacon remains notice-only: installed projects learn about the release but never auto-apply it. Package publication and any external announcement stay separate outward acts.

## Current Limitations

- HAI-Harness is a repository overlay with native Git task-lane helpers, not a general agent runtime or sandbox.
- The review layer is currently design-specific, not a comprehensive correctness evaluator.
- Enforcement is primarily procedural: agents follow `AGENTS.md`, role boundaries, task scopes, and approval gates. Deterministic policy enforcement remains future infrastructure.
- Background sweeping and execution of project-specific Tier 0 checks are not automated yet; the compact index, promotion ladder, and hook-preserving local Git workflow are available now.

## How to Operate the Harness (The User Guide)

### 1. Repo-as-Truth

Live user direction can correct stale repository state during a session. But only durable repository state can reliably coordinate a future session.

* **Do not** assume an agent or person remembers a rule because it appeared earlier in a chat.
* **Do** flag conflicts, follow the latest confirmed human decision, and write durable conclusions back through the owning role.

### 2. Treat Sessions as Replaceable

Long conversations accumulate stale assumptions. The harness makes a fresh context safe because authority lives in current plans, task files, design contracts, and handoffs.

* Start a fresh session when context becomes noisy or responsibility changes.
* Keep one role per agent session; do not impersonate another role midstream.
* Claudia remains the root controller and spawns fresh role-isolated child workers when the host platform supports it.
* Treat separately created top-level tasks as peer controllers. Sequence around them or request an explicit ownership transfer; never repurpose them as workers.
* Before pausing or changing ownership, leave a task-centric handoff that states verified facts and the exact next step.

### 3. The Standard Workflow & Active Skills

A passive markdown file loses value when it becomes stale. This workflow combines current execution contracts with focused **Skills** that maintain decisions, alignment, handoffs, and lessons.

When you sit down to work, follow this loop:

1. **Draft the Intent:** `Human/brief.md`, `decisions.md`, and open questions capture the human side of the project. Agents keep them current with your approval and read `Human/` only when explicitly authorized.
2. **Plan With Claudia:** Claudia acts as the root controller, clarifies the request, maintains Current Product Truth, and records strategy in `Agents/planning.md`.
3. **Approve Human Updates:** Agents trace why they changed agent docs. At closeout, **`human-scribe`** shows the drafted decisions and open questions in one batch, and writes only what you approve.
4. **Define Durable Context:** Keep architecture, boundaries, and non-negotiable rules in `Agents/project_context.md`; keep iteration state out of it.
5. **Audit Alignment When Needed:** The read-only **`guardian`** compares authorized `Human/` intent with the agent operating layer and reports mismatches without resolving them.
6. **Design When Needed:** Hephaestus creates a non-code contract under `Agents/designs/`; Claudia then assigns implementation. Athena can independently review enterprise design quality.
7. **Assign the Queue:** Claudia records dependencies, write scopes, approvals, stop conditions, verification, capability profile, and effort in `Agents/planning.md` and the Augustus/Julius task files. Parallel work is allowed only when the Parallel Split Gate passes.
8. **Isolate and Execute:** Claudia spawns a fresh role-isolated child worker and creates a native task worktree from the clean primary checkout. Run implementation and the project's own preview/dev command in that exact lane.
9. **Control Traffic:** When controllers, child workers, or mutable scopes may overlap, use **`traffic-control`** to return `CLEAR`, `SEQUENCE`, `TRANSFER_REQUIRED`, or `BLOCKED` before adding motion. Use Fast Resume only for the same settled controller/child/worktree lane without scope growth or drift.
10. **Evaluate and Approve:** Athena or Hephaestus can issue design-review handoffs. After focused checks and review, explicit `worktree approve` commits and merges locally; remote acts remain separate.
11. **Learn and Archive:** Claudia uses **`lesson-logger`** only for confirmed preventable failures, routing them to checks, Standing Gates, or capped conditional lessons. Move superseded task/handoff history under `Agents/_archive/`.

## Developing this project

We use HAI-Harness to develop itself through the same local-source installer and
updater used by other projects. The repository root `AGENTS.md` routes contributors
into the checked-in `.hai/` operating layer, while `scaffold/AGENTS.md` is installed
as the root entry point in other projects. The [contributor guide](https://github.com/ClaudiusMa/HAI-Harness/blob/main/CONTRIBUTING.md)
links current direction, confirmed decisions, active work, open questions, and
recorded history, and explains the source-to-`.hai/` workflow.
Development records, the root redirect, and `hai-meta` are tracked in the repository
but excluded from the installable package. Machine-local settings, caches, and
installation receipts remain ignored.
