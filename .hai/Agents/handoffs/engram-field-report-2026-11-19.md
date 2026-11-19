# Handoff - engram-field-report

Last updated: 2026-11-19 PT
From: Claudia, in the Engram field install (installed version 0.2.10)
To: next assigned HAI-Harness agent

## Why this exists

The user asked for this as a report to HAI-Harness: in the Engram field install, the harness's own live files have gone stale, and nothing in the harness noticed. This is a field observation, not a request to edit Engram. Fixes to the Engram copy are separate and need the user's OK there.

## What was observed (read from the files on 2026-11-18 and 2026-11-19)

1. **Collaboration map contradicts the lead model.** Engram's `Agents/project_context.md` section 7 still says "Claudia edits planner-owned coordination docs only. Augustus and Julius own implementation code." `onboarding.md` says such a map predates the lead model and tells agents to flag it to the user. Agents can only flag it: `update` keeps the project-owned file, and nothing detects the phrase.
2. **`planning.md` stopped tracking work.** Header: "Last updated: 2026-09-30". T-1 is `done` in the Active Queue but still `in progress` in the Backlog table. A 2026-10-21 section was appended later without updating the header. Since then, work ran in several lanes (sharing, take capture, handoffs) and none of it is in the queue.
3. **Finished task file is still live.** `Agents/tasks/augustus.md` has been `Status: done` since 2026-09-30.
4. **Lessons never swept again.** `lessons/INDEX.md`: "Last swept: 2026-09-30".

## Cause (hypothesis, uncertain)

Most work in this project runs through Engram's own workflows or through lanes that never touch `planning.md`. Nothing at session start asks Claudia to archive a finished queue or reconcile the header, and `doctor` checks line budgets, not staleness or contradictions.

## Decisions needed (upstream)

- Should `doctor` (or the session-start read) flag: the old collaboration-map wording; a `planning.md` whose header is old while lanes have merged since; an Active Queue item marked done; a task file marked done?
- Should `update` offer to refresh the collaboration map, given it is project-owned?

## Contracts / invariants

- Do not edit the Engram field install from here. Promote method changes path-by-path; never bulk-copy a field instance.
- Keep live project state out of the inner templates.

## Exact next step

- Reproduce in a fresh scaffold install: mark a queue item done, merge a lane without touching `planning.md`, and run `doctor`. Record what it reports.
