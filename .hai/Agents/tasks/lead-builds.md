# Lead builds

Owner: the user's direct session (no role routing). Updated 2026-10-14.
Status: implemented and verified in the lane. Waiting for the user's review and local integration approval. No push or release is authorized.

## Requirements

The user approved this on 2026-10-14 ("Make sense. Let's do it").

1. Claudia records the request and builds in the task lane by default, with one writer per lane.
2. She delegates without asking only on a trigger:
   - the user asks or names a role;
   - heavy prior discussion or a near-compaction context;
   - wide reading;
   - risk-area review;
   - pieces that clear the Parallel Split Gate;
   - an unclear bug (Momus);
   - unresolved visual intent (Hephaestus).
3. Every existing workflow keeps working: design, design review, debugging, review, decision records, lessons, traffic control, guardian, and lanes and integration. The change is treated as a system upgrade.
4. A delegated worker defaults to Claudia's own model and effort; it is lighter only where quality is safe, deeper for risk areas, and escalated on evidence.

## Write scope

- Product method files: roles, skills, templates, onboarding, `scaffold/AGENTS.md`, README, CONTRIBUTING and Human onboarding.
- Outer mirrors only through `./hai-meta sync`.
- Outer project context, planning, this contract and the handoff.
- The CLI and tests are unchanged.

## Verification

- 36/36 tests pass.
- `git diff --check` is clean, sync is done and parity holds.
- The sweep for old wording is clean, and the workflow walk-through is in `../handoffs/lead-builds.md`.
- One confirming test runs only when the user declares the harness ready to deploy.
