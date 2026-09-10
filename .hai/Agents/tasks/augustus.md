# Augustus Tasks

Planner owns this execution contract. Augustus uses it as the current queue. Historical queues belong under `Agents/_archive/tasks/`.

Keep this file execution-only. Do not copy product rationale, option analysis, or planner strategy here.

## Assigned Queue

- Status: done
- Task / outcome: implement installed-user update discovery without automatic updates, telemetry, repeated notices, or project-state loss
- Read first: `../onboarding.md` → `../project_context.md` → `../augustus.md` → this file
- Active now: none
- Next in sequence: none; future `v0.2.0` tag/Release/publication work requires a new explicit assignment and outward-act approval
- Queue order and priority: P0 — (1) version/release and installed-state contracts; (2) cached dependency-free checker and startup routing; (3) CLI init/update/doctor integration; (4) deterministic tests; (5) README/release documentation; (6) privacy and syntax verification; (7) `../../hai-meta sync` and outer closeout evidence
- Files / write scope: inner `../../package.json`, `../../release.json` or the chosen single release-manifest equivalent, `../../bin/hai-harness.mjs`, `../../test/hai-harness.test.mjs`, `../../AGENTS.md`, `../../Agents/onboarding.md`, one dependency-free checker under `../../Agents/`, `../../README.md`; stable outer mirrors changed only by `../../hai-meta sync`
- Read-only / preserve: all project-owned installed planning, context, design, worker queues, handoff entries, lesson state, archive entries, and Human workspace content; all unrelated inner source; current `.hai/` planning, decisions, tasks, handoffs, and lessons except sync-managed stable method mirrors
- Current handoff: none
- Dependencies: sequence the user-approved local merge of `codex/readme-currentness` before creating the new lane; preserve the resulting baseline exactly
- Verification: passed — `npm test` 4/4; CLI and checker syntax; `git diff --check`; bounded privacy scan; package dry run with checker/release metadata; same-iteration outer sync with planning/tasks/lessons preserved; authoritative `../../hai-meta doctor` reports `current (0.2.0)`; release discovery is gated on GitHub's latest published stable Release and rejects drafts, prereleases, invalid tags, malformed data, and oversized responses
- User-approved to execute: yes — product policy confirmed 2026-08-14, subject to the dependency and approval gates above
- High-cost approval: granted 2026-08-14 for the focused `npm test` verification in this queue
- Outward acts authorized: completed — exact merge `b5db1722c273b183ac231def3af2aa7ab9ff54f1` pushed to `origin/main` and verified; no further outward acts authorized

## Stop Conditions

- Stop before further writing until Claudia assigns a new queue.
- Stop before any tag, GitHub Release, package publication, or announcement without explicit approval.
- Stop before any commit/merge approval, push, tag, release, package publication, or external announcement unless that exact outward act is authorized.
- Stop for a broken assumption, scope expansion, missing high-cost approval, or unapproved outward act.
