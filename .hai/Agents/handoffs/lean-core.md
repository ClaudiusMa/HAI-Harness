# Handoff - lean-core

Last updated: 2026-11-23
From: builder subagent (no HAI role) for the master session
To: master session (independent review and behavior replay)

## Status

- Done: rule inventory (`.hai/evals/assumptions.json`, 124 rules: 34 kept, 80 merged, 4 changed, 6 removed); onboarding split into a shared core plus new core file `Agents/lanes.md` (lane create, integrate, conflict copies, preview, closeout and cleanup); lead-only method moved into `Agents/claudia.md`; read paths stated once in the core; worker docs, Momus, `implement`, `debugging`, `code-review` and `handoff` reworded; stale spots fixed; the 2026-11-22 local-runs contract change applied; word-budget test added.
- In progress: none.
- Not started: behavior replay (master session's job); decision-trail entry and `Human/decisions.md` draft for the local-runs rule (master session).

## Follow-up 1 (2026-11-22 contract, finished 2026-11-23)

- Part A items 1-16 applied (design guide on the worker line; spec-gate shape, UI checker and rejection reset in the core; traffic control as a standing rule; custom-role path; `update` keeps edited core files; `lanes.md` in doctor's required paths and its test; shared-data class in the AGENTS approval line; update-check fallback, Momus planning default and "marked as waiting" restored; README gates line; outer project_context line 59; direct-address roles; asking needs no lane; "just do it" covers the build only; blank design guide; `human-scribe --target .`; inbox step only on resume).
- Part B applied: Momus may write probes and fixes while holding the incident lane's slot (`momus.md`, `debugging`, `claudia.md` Bugs and Review, core Momus line, `traffic-control`, `human-scribe`, `guardian`, README).
- Budgets now 2,200 (worker) and 5,800 (lead counting `implement`); actual 2,167 and 5,564.
- Inventory: 130 rules (32 kept, 77 merged, 9 changed, 6 removed, 6 new).

## Files touched or in scope

- Product: `scaffold/AGENTS.md`, `Agents/onboarding.md`, `Agents/lanes.md` (new), `Agents/claudia.md`, `Agents/augustus.md`, `Agents/julius.md`, `Agents/momus.md`, `Agents/athena.md`, `Agents/hephaestus.md` (duplicates and stale lines only), `Agents/planning.md`, `Agents/project_context.md`, `Agents/tasks/TEMPLATE.md`, `Agents/custom/roles/README.md`, skills `implement`, `debugging`, `code-review`, `handoff`, `human-scribe` (Origin rule moved in), `lesson-logger` (check-in wording).
- `bin/hai-harness.mjs`: `Agents/lanes.md` added to `scaffoldPaths` only.
- `test/hai-harness.test.mjs`: new test "startup reading paths stay within their word budgets".
- Generated: `scaffold/shipped-hashes.json`; `.hai/` mirrors and root `AGENTS.md` block via `./hai-meta sync`.
- Outer by hand: `.hai/Agents/project_context.md` (line 62 `decision-logger` to `human-scribe`; verification sentence and Git-and-safety line brought to the local-runs rule).

## Contracts / invariants

- The owner's decisions listed under "Must survive unchanged" in the contract keep their trigger and effect; the go-ahead definition moved from `claudia.md` to the core so every root session has it.
- High-cost gate replaced by the 2026-11-22 local-runs rule, owned by onboarding "Lanes, runs and outward acts". Athena's design High-Cost Behavior section is unchanged.
- No provider, model or version named in shipped docs.

## Verification

- Ran: `node scripts/shipped-hashes.mjs` (39 paths, 240 hashes); `./hai-meta sync`; `npm test` (46 pass, 0 fail); `git diff --check` (clean); `cmp` of each changed core file against its `.hai/` mirror (all match); `./hai-meta doctor` (only warning: missing task packet in this lane).
- Word counts after Follow-up 1: worker path 5,672 to 2,167; lead path (AGENTS block + onboarding + lanes + claudia + implement) 9,822 (without implement) to 5,564.
- Not run: any agent behavior replay; no live install into a field project.
- Status: limited inspection only for behavior.

## Blockers / decisions needed

- See the final report's "Decisions needed" list.

## Exact next step

- Master session: review the diff and run the behavior replay against `.hai/evals/assumptions.json`, especially R043/R046/R130 (Momus writing his own fix, and a fresh reader for a risk-area fix), R125 (a role addressed directly with no contract) and R127 ('just do it' does not cover a check-in run).
