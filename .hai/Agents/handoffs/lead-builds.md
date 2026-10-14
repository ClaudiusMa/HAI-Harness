# Handoff - lead-builds

Last updated: 2026-10-14
From: direct session (no role routing)
To: the user, for review and local integration approval

## Status

- Done:
  - read the whole system before any edit: every role doc, skill, template, startup file, the CLI and doctor, and the tests;
  - lead-model edits;
  - 36/36 focused tests, sync and parity, and a scenario walk-through of each workflow.
- Not started: the user's review of the decision drafts, local integration, one confirming test run (only when the user calls it ready to deploy), and release.

## Why

The paired tests showed that delegating every build costs a hand-off on each step, with no quality gain:
- Clay Club (3 steps): about 1.3–1.9× tokens and 2–2.3× time.
- CapWords (one shot): 2.3× cost and 2.8× time.

Community practice agrees:
- [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system): multi-agent use is about 15× chat tokens, and coding is less parallelizable.
- [Cognition](https://cognition.com/blog/multi-agents-working): one writer, while other agents contribute thinking.
- [LangChain](https://blog.langchain.com/how-and-when-to-build-multi-agent-systems): splitting suits read-heavy work, not write-heavy work.

The user approved the lead model on 2026-10-14 ("Make sense. Let's do it"). They asked that every existing workflow keep working, and that the change be treated as a system upgrade, not a single-file edit.

## The one changed assumption

Before: Claudia never writes product code, so every build is delegated. After:
- Claudia records the request, then builds in the task lane by default, with one writer per lane.
- She delegates without asking only on a trigger:
  - the user asks or names a role;
  - heavy prior discussion or a near-compaction context;
  - wide reading, where read-only helpers return summaries;
  - a risk-area review;
  - pieces that clear the Parallel Split Gate;
  - an unclear bug (Momus);
  - unresolved visual intent (Hephaestus).
- Delegation mechanics, integrate-once, compaction, risk-based review and quality-first routing are kept.
- A delegated worker now defaults to Claudia's own model and effort, and is escalated on evidence.

## System map: each workflow, its purpose, and how it still works

| Workflow | Purpose | Before | After | Still works because |
|---|---|---|---|---|
| Intake and role selection (`AGENTS.md`) | right method at startup | default Claudia, named roles | unchanged; Claudia's read order now also checks handoffs addressed to her | role selection untouched; the tests' six-role, three-step and word-budget checks pass (399/450 words) |
| Lanes and integration (CLI) | isolation, clean main, one merge | worker ran approve | the lane's writer runs approve: Claudia or the worker | the CLI is role-neutral; integrate-once is unchanged |
| Planning (`planning.md`) | iteration truth | queues for workers | records each request's requirements, rejected options and acceptance; Builder field; queues only when delegating | the same file, owner and trace duty |
| Worker contracts (`tasks/`) | execution contract | every build | only delegated builds | template and generated files unchanged; the doctor budgets still apply |
| Implementation (`implement`) | build method | assigned workers | every build, from the planning entry or the task contract | the same method and gates |
| Code review (`code-review`) | independent check | findings went to the worker | Claudia fixes her own builds' findings, or routes them to the producing worker | the reviewer is still fresh and never the implementer; the risk areas are unchanged |
| Debugging (`debugging`, Momus) | discriminating diagnosis, 3-fix stop | the worker kept known fixes | the lane's writer keeps known fixes; unclear bugs go to Momus; Claudia hands Momus's repair worker the writer slot | Momus never writes code; the loop and stop rules are unchanged |
| Design (Hephaestus) | build-ready, non-code contracts | handoff to the assigned worker | handoff to the lane's builder | still non-code; ambiguous visuals still go to Hephaestus first (trigger 7) |
| Design review (Athena) | enterprise review, fixes assigned | to the producing worker | to the producer: Claudia or the worker | the read order identifies the producer from planning and handoffs |
| Decision records (`human-scribe`, packet) | the human approves what reaches Human | an assigned writer in an isolated candidate | Claudia writes the approved batch in her lane, or the worker holding the slot does | the same trail, capture, batch and approval; still written before integration |
| Lessons (`lesson-logger`) | turn failures into safeguards | Claudia-owned | unchanged; lessons now also apply to Claudia's own builds | the same owner and ladder |
| Traffic control | concurrency safety | CLEAR led to spawning workers | CLEAR lets the controller build in its own lane or spawn its worker | the census, states and peer rules are unchanged; a duplicate-writer check already exists |
| Guardian | alignment audit | planner/worker boundary | lead/worker boundary: two writers, a delegation with no trigger, a non-coding role editing product files | the same read-only audit |
| Model routing | quality-first | tiered by category | defaults to Claudia's model and effort; lighter only when safe; deeper for risk; escalate on evidence | still quality-first and names no model |

Installed projects keep their own `project_context.md` and `planning.md`. Onboarding now says an old collaboration map there predates the lead model and should be flagged to the user. This repo's outer `.hai/Agents/project_context.md` is updated in this lane.

## Routing revision (2026-10-14)

- User direction: "Worker model should be decided by Claudia. Don't default on same model … when it goes to less reasoning task I want the system use less reasoning and when it requires higher it adopt to higher. This part need to be smart"; never name a model.
- Ponytail check:
  - [repo](https://github.com/DietrichGebert/ponytail) and [releases](https://github.com/DietrichGebert/ponytail/releases) through v5.2.0 on 2026-10-13: no model or effort routing;
  - `/ponytail lite|full|ultra` sets code-minimalism intensity;
  - `hooks/ponytail-subagent.js` re-injects the ruleset by agent type and never changes model or effort.
- The closest precedent is the user's own 2026-09-24 Ponytail decision: no automatic top capability for routine review, and escalate on concrete risk.
- Community reference: the [agent-routing skill](https://www.skills.sh/oaustegard/claude-skills/agent-routing). Checkable work runs cheap behind a verifier, judgment runs higher, and it warns against reflexive up-tiering.
- Delivered in `claudia.md`:
  - routing decided per task from five signals: checkability, judgment, blast radius, breadth, track record;
  - fast/low behind a verifier, standard/medium, deep/high;
  - start lighter when only checkable capability is in doubt; go higher when judgment or risk is in doubt;
  - escalate on evidence; never lower mid-task;
  - trigger 8, routine bulk work, goes to a fast-tier worker. Small edits stay with Claudia.
- Also updated: onboarding, AGENTS.md (410/450 words), README and the task template's `Model tier / effort` field.
- Verification: 36/36 tests pass, sync parity holds, and there are no model, provider or host names anywhere in scaffold, Agents or Human.

## Files touched

- Rewritten: `Agents/claudia.md`.
- Edited:
  - `Agents/onboarding.md` and `scaffold/AGENTS.md`;
  - the roles `athena.md`, `hephaestus.md` and `momus.md`;
  - the skills `debugging`, `code-review`, `implement`, `handoff`, `traffic-control`, `guardian` and `human-scribe`;
  - the templates `planning.md` and `project_context.md`;
  - `Human/onboarding.md`, `README.md` and `CONTRIBUTING.md`.
- Outer: `.hai/Agents/project_context.md`, planning, this handoff and the contract.
- Not changed:
  - `augustus.md`, `julius.md` and the tasks template, which still serve delegated work;
  - the CLI and the tests.

## Contracts / invariants

- Athena, Hephaestus and Momus never edit product files.
- Each lane has one writer at a time. Peer controllers are never workers.
- Human approval, integration approval, high-cost and outward-act gates are unchanged.
- No model or provider names appear in harness files.

## Verification

- Ran:
  - `node --test test/hai-harness.test.mjs`: 36/36;
  - `git diff --check`;
  - `./hai-meta sync` with source/outer parity;
  - a sweep for old-model wording ("planning-only", "producing worker", "worker lane", and others), all resolved;
  - a scenario walk-through of every row in the map above.
- Not run:
  - a live agent replay. The user asked for one test only when the harness is ready to deploy.

## Exact next step

1. The user reviews the decision drafts.
2. On approval, write them to `Human/decisions.md` in this lane, run `worktree approve`, then clean up.
3. Run one confirming test only when the user declares the harness ready to deploy.
