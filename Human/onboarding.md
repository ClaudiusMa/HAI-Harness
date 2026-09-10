# Human Onboarding

<!--
## How To Use This File

- Read this file first when you return to the project.
- Keep this file stable unless your collaboration method changes.
- Treat `Human/` as human-owned thinking space. Move anything agents need into `Agents/` before delegating.
-->

Start here when you return to the project.

## Purpose

`Human/` is the human-owned workspace for product thinking, decision-making, and open questions. Its visibility is determined by the project's sharing and version-control policy; the folder name does not make its contents private. Agents do not read this folder by default.

## Read Order

1. Read [brief.md](brief.md).
2. Read [decisions.md](decisions.md).
3. Read [open_questions.md](open_questions.md).
4. Read [reflections.md](reflections.md).

## Working Rules

- Changes in `Human/` do not automatically reach agents.
- Before delegating work, translate anything agents need into the agent-facing docs under `Agents/`.
- If you want a read-only alignment check between `Human/` and `Agents/`, invoke the `guardian` skill explicitly.
- If you want a critical decision recorded in the human log, invoke the `decision-logger` skill explicitly.
