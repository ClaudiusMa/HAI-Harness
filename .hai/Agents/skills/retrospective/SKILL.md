---
name: retrospective
description: Deprecated compatibility entrypoint for older task contracts. Route confirmed process failures to the lesson-logger skill instead.
---

# Retrospective (retired)

This write path is retired. Do not create a retrospective or update `patterns.md` / `graveyard.md`.

Claudia should use [../lesson-logger/SKILL.md](../lesson-logger/SKILL.md) to disposition a confirmed failure into a deterministic check, a Standing Gate, a capped conditional lesson, or discard. Workers and reviewers place evidence in their normal report or handoff; they do not write lesson state.
