# Project Context

<!--
This is the OUTER harness for developing the HAI-Harness product. Keep durable
architecture and process truth here. Iteration state belongs in planning.md.
-->

## Product

- **Product:** HAI-Harness, a repo-as-truth collaboration layer for humans and AI agents.
- **Product source:** the tracked parent repository, one level above `.hai/`.
- **Development operating layer:** this version-controlled `.hai/` harness.
- **Users:** teams that need accurate, durable collaboration context without depending on chat or model memory.

## Two-layer ownership

### Inner harness — distributable product source

The installable product consists of reusable artifacts:

- `../scaffold/AGENTS.md` and `../Agents/` — installable operating templates and skills;
- `../Agents/planning.md` — blank planning template only;
- `../Agents/tasks/TEMPLATE.md` — the only upstream task file;
- `../Human/` — blank human-workspace templates;
- `../bin/hai-harness.mjs`, tests, package metadata, README, and license.

Never store HAI-Harness development plans, assignments, decisions, handoffs, lessons, or history in the inner tree. Installed field instances may contain real state; they are evidence, never upstream source to bulk-copy back.

### Outer harness — HAI-Harness product-development truth

All real work for building HAI-Harness lives here:

- `planning.md` — current product truth, strategy, queue, and completion evidence;
- `tasks/augustus.md` and `tasks/julius.md` — live worker assignments;
- `handoffs/`, `lessons/`, and `_archive/` — task evidence and history;
- `Human/decisions.md` — confirmed durable human decisions;
- other `.hai/Human/` files — human-owned product thinking.

All substantive `.hai/` project context is version-controlled for transparency; machine-local settings and receipts remain ignored. No outer operating state ships in the package. Claudia plans here and never writes product source. Workers read assignments here and edit the inner product files named by those assignments.

## Session bootstrap

- The tracked root `AGENTS.md` is the universal repository entry point and must redirect development sessions to `.hai/AGENTS.md` and this outer harness.
- `scaffold/AGENTS.md` is distributable product source and installs as target-root `AGENTS.md`; the repository redirect must never ship as that template.
- Future sessions read outer onboarding, outer project context, the active role, outer planning, and only the task/handoff/lesson context routed from there.

## Required inner-to-outer closeout

An inner product change is incomplete until the same iteration performs all of the following:

1. Verify the inner product change with task-appropriate low-cost checks.
2. Run `./hai-meta sync` from the parent repository so the outer harness adopts stable scaffold and skill improvements.
3. Update outer `planning.md` and relevant outer task/handoff evidence.
4. Log confirmed durable decisions in outer `Human/decisions.md` through `decision-logger`.
5. Confirm inner templates contain no real HAI-Harness development state.

`hai-meta` is a thin wrapper around the ordinary local-source CLI with `.hai/` as its target: bootstrap delegates to `init`, sync to `update`, and doctor to `doctor`. It contains no project-state seeds, redirect generation, or extra skill-copy step. Checked-in project records and root redirects are canonical; bootstrap fills missing generic files and cannot reconstruct lost project history.

`./hai-meta sync` refreshes stable method files, the upstream task template, and shipped skills through the ordinary updater. It must preserve outer planning, project context, generated task queues, handoffs, lesson state, archives, and human state.

## Current product capabilities and rules

- Native CLI task lanes create sibling `task/<task-slug>` worktrees from a clean, named, checked-out non-main integration branch and store provider-neutral branch metadata.
- Task-lane approval preserves compatibility for lanes created under the retired naming convention, but all new lanes use the neutral convention and commits receive no forced provider attribution.
- Local commit/merge requires explicit approval and preserves Git hooks; push, PR, deploy, and publication remain separate acts.
- `traffic-control` reconciles overlapping controllers, writers, generated outputs, mutable verification, and outward targets.
- `lesson-logger` promotes confirmed preventable failures toward deterministic checks, Standing Gates, or capped conditional lessons.
- `doctor` flags mandatory prompt-state pollution above 1,200 planning lines or 400 lines per generated worker task file.
- Storybook exploration logging is opt-in and runs only when the user explicitly asks to log visual explorations there.

## Git and safety boundaries

- Track `.hai/` project context, root `AGENTS.md`, and `hai-meta` under the 2026-09-09 transparency decision. Keep machine-local settings, caches, and receipts ignored; do not place private external project material in public context.
- Never merge or push to `main` without explicit user authorization.
- Never reset, stash, clean, or copy dirty work to manufacture a task baseline.
- Builds, dependency installation, broad test runs, migrations, networked checks, and outward acts retain their normal approval gates.

## Current discovery direction — 2026-09-09

- Move from personal tool to product through discovery of context continuity during returning, switching, and handing off among humans and AI.
- Teammates is the explanatory relationship framing; alternative relationship exploration is not a research priority.
- Audience: nontechnical/less technical builders including small business owners using AI, plus experienced builders collaborating with people or multiple agents.
- Research design and prototype scope remain undecided. Do not execute the suggested six-interview plan as an approved assignment.
- Existing architecture may change based on discovery. Confirmed decisions live in `.hai/Human/decisions.md` (relative to the product root).
