---
name: handoff
description: Fast task handoff. Use at the end of a task segment or before another role resumes the work in a later chat/session to update a task-centric handoff note with status, touched files, contracts, blockers, verification, and the exact next step.
---

# Handoff

Leave the next agent a short, reliable baton pass for the current task: at the end of a task segment, before another role takes over, or before a pause that resumes in a later chat.

- **Read only what the note needs:** the worker's task file, or the request's `planning.md` entry when Claudia built the work; the existing handoff; touched files or the diff only to state accurately what changed.
- **Write** `Agents/handoffs/{task-id}.md` (or a short slug matching the task file) from [TEMPLATE.md](../../handoffs/TEMPLATE.md). Keep one current note per task and overwrite stale sections instead of appending session logs.
- Write concrete facts about the task, not the worker. Name the exact files and constraints that matter. If nothing was verified, say so; spell out any blocker that needs the user.
- Record a material compromise's location, limit and revisit condition, including any `hai-defer:` comment's file and line, under Contracts / invariants.
- A handoff changes no other file, apart from keeping the task file's handoff path accurate when it already has one.
