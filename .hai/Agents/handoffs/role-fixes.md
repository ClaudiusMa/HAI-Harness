# Handoff - role-fixes

Last updated: 2026-11-23
From: builder subagent (no HAI role) for the master session
To: master session (independent review and behavior replay)

## Status

- Done: Change 1 (one worker role, two names) and Change 2 (UI checker only for two or more spec rows or a previously rejected request), tests, shipped hashes, `./hai-meta sync`, rule inventory.
- In progress: none.
- Not started: behavior replay; decision-trail entry and `Human/decisions.md` draft superseding requirement 3 of the 2026-11-04 spec-gate decision (master session, with the owner's approval). Nothing committed.

## Follow-up 1 (2026-11-23, review findings and replay gaps)

- Done, items 1-7: doctor's warning for a custom role named `worker` (with the move-the-default hint when the block names it), covered in the doctor test; custom-role read path picks up the worker path from `tasks/<you>.md` on; `traffic-control` names two slots of one worker role; checker test reduced to "old wording absent, trigger names both conditions" and the `project_context` pin loosened; core spec-gate line states the single-item skip (table, not go-ahead); `worker.md` limits the direct bug fix to the contract's scope and reports one outside it; `Agents/design.md` header applies only when the work needs an undefined style value.
- Trims to fit: `worker.md` opening sentence shortened, "rather than asking for a coordinator" dropped (covered by "directly"), name files end "Its role: [worker.md](worker.md).", core checker sentence shortened.
- Ran: `node scripts/shipped-hashes.mjs` (40 paths, 254 hashes); `./hai-meta sync` (6 updated); `npm test` (50 pass, 0 fail); `git diff --check` clean; mirrors match.
- Word counts: worker path 2,199 / 2,200; lead path 5,652 / 5,800.
- Inventory: R128 changed; notes on R016, R086, R131 (131 rules: 75 merged, 32 kept, 12 changed, 6 removed, 6 new).
- `Agents/design.md` is project-owned, so the header change reaches new installs only; this repository's own `.hai/Agents/design.md` was not touched.

## Files touched or in scope

- New core file `Agents/worker.md`: the former "Working rules" of `augustus.md`, written once; one clause sends a per-name standing default or guardrail to `project_context.md`.
- `Agents/augustus.md`, `Agents/julius.md`: name files (slot, queue link, link to `worker.md`); identical apart from the name. Default Scope / Avoid By Default sections removed.
- `Agents/onboarding.md`: worker read line is now name file, `worker.md`, `tasks/<you>.md`, ...; spec-gate checker sentence narrowed.
- `Agents/claudia.md`: Check bullet narrowed (trigger, the "otherwise" case, the why clause); header comment points at the shared worker role.
- `Agents/tasks/TEMPLATE.md`: Read first adds `../worker.md` (for a worker) after the name file.
- `Agents/project_context.md` (template): one optional line for a per-worker default.
- `Agents/custom/roles/README.md`: `Worker` listed among built-in names.
- `README.md`: one sentence on the shared worker role; custom-role rule notes `worker` is reserved.
- `bin/hai-harness.mjs`: `Agents/worker.md` in `scaffoldPaths`, `roleDocs` (so `tracedPaths`), `laterTracedPaths`, doctor `requiredPaths`; new `reservedRoleNames = [...builtInRoles, "worker"]` used by `--default-role` validation and the custom-role doctor check. Nothing else.
- `test/hai-harness.test.mjs`: see Verification.
- Generated: `scaffold/shipped-hashes.json`; `.hai/` mirrors via `./hai-meta sync`.
- By hand: `.hai/evals/assumptions.json` (R021, R081 changed; R016, R004, R009, R086-R089 notes/locations; new R131), this handoff.

## Contracts / invariants

- "Augustus, ..." and "Julius, ..." still assign the worker role; `tasks/augustus.md` and `tasks/julius.md` are still generated and never overwritten; `scaffold/AGENTS.md` unchanged; `builtInRoles` and `generatedTaskRoles` unchanged.
- Checker shape unchanged: fresh, read-only, fast tier, only the user's verbatim words and screenshots, one pass, mismatch to the builder or to the user when the words allow both readings. Spec-table triggers, `Assumed`, go-ahead and rejection reset unchanged.
- No provider, model or version named.

## Verification

- Ran: `node scripts/shipped-hashes.mjs` (40 paths, 252 hashes); `./hai-meta sync` (7 updated, `worker.md` created); `npm test` (50 pass, 0 fail); `git diff --check` (clean); `cmp` of each changed core file against its `.hai/` mirror.
- New or extended tests: install places `worker.md`, doctor reports it missing, update restores it; name files identical apart from the name and link `worker.md`; update over the previous shipped `augustus.md`/`julius.md` with no `worker.md` replaces both and creates `worker.md`, an edited `augustus.md` is kept and reported; a pre-worker packet stays readable, reports `Agents/worker.md` as drift, refuses a malformed hash, and adopts it on a trace; a custom role `worker.md` is reported as a built-in name and `--default-role worker` is refused; word budget counts core + name file + `worker.md` + `implement`; checker-rule wording pinned in `claudia.md` and the core.
- Mutation check: with the `laterTracedPaths` and `reservedRoleNames` additions reverted, the three tests that depend on them fail.
- Word counts: worker path 2,193 (budget 2,200; was 2,167); lead path 5,640 (budget 5,800; was 5,564).
- Not run: any agent behavior replay; no install into a field project.
- Status: verified for the tested cases; behavior limited to inspection.

## Blockers / decisions needed

- The 2026-11-04 spec-gate decision's requirement 3 is superseded; the decision record is the master session's to write with the owner.
- The worker path has 7 words of headroom.

## Exact next step

- Master session: review the diff, then replay a one-row UI change (no checker expected), a two-row UI change and a rebuild after rejection (checker expected), and "Julius, ..." on an install updated from the previous shipped version.
