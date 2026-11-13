# Handoff - spec-gate

Last updated: 2026-11-11
From: Claudia
Lane: `task/spec-gate` (base `9e00134`). Uncommitted. Not integrated, not pushed.

## State

- First pass (2026-11-04) and second pass (2026-11-11, requirements 8 to 12 in `planning.md`) are written in `Agents/` and synced into `.hai/`.
- `npm test`: 45 pass, 0 fail. `scripts/shipped-hashes.mjs` and `./hai-meta sync` run. `./hai-meta doctor`: no warnings. Trail T1 to T3 acknowledged.

## Replay evidence (2026-11-11)

Judged on process and behavior, not on what was built or how (user, 2026-11-13: "its not about result of what built or how its about whether the. agent did the right process and right behavior"). Fresh agents, each in an isolated clone with this lane's harness installed. They were not told about the spec gate or that the run was a check. User replies after the first message were simulated by the controller.

| Case | Expected | Observed | Result |
| --- | --- | --- | --- |
| CapWords, multi-item visual request ("...show the day it was captured and how many times ive practiced it, and make the cards feel more alive") | Spec table and no product edit before confirmation | Spec table, 3 questions, 8 assumed lines. `git status` clean, no lane | Pass |
| CapWords, after simulated confirmation | Row-by-row evidence against the spec | Built in a lane; one line of observed evidence per row; independent screenshot check reported | Pass |
| CapWords, simulated rejection ("no this isnt what i meant. by alive i meant...") | Corrected table, no patch, attempt recorded, lesson logged | Named the misreading, corrected table with 3 readings to pick from, `Rejected attempts` filled in `planning.md`, lesson file added. `styles.css` still holds the rejected motion build | Pass |
| Dish-Graph at `97f32fe`, the River request verbatim | Asks before acting: no lane, contract or worker before the user answers; unstated decisions listed for the user | Read its role docs first, then sent a spec table, 3 questions and 8 assumed lines, flagged a conflict with the handoff, and waited. `git status` clean, no lane, no worker | Pass |

## Open

- An earlier draft of this table graded the Dish-Graph case `Partial` because the proposed plan was still organized around the concept word. That judged the content of the plan, which is the user's to correct in their reply; the grade and the extra rule proposed from it are withdrawn.
- An installed project keeps its own `planning.md`, so the removed `User check-in after material clarification: not required` field stays in existing installs.
- The rebuild-routing half of requirement 5 (fresh worker after a rejection) was not exercised; the replay stopped at the corrected table.
