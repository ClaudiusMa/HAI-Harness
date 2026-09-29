# Augustus Tasks

Planner-owned contract. Updated 2026-09-29 by Claudia.

## Assigned Queue

- Status: rechecked. User approved local integration and push to origin `main` on 2026-09-29. Do not re-edit the wording.
- Task / outcome: an unnamed user message starts the session as Claudia.
- Read first: outer onboarding, project context, Augustus role, [implement](../skills/implement/SKILL.md), this contract, and [default Claudia](../handoffs/default-claudia.md).
- Active now: replace the no-role startup path with Claudia as the default role.
- Next: `./hai-meta sync` from this task worktree, then stop. Do not commit, merge, push, or publish.
- Lane: already created. Edit only in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/default-claudia` on `task/default-claudia`. Do not create another worktree. Do not switch the primary checkout.
- Files / write scope:
  - `Agents/onboarding.md`
  - `scaffold/AGENTS.md`
  - `README.md` (the Layer 1 bullet that describes the no-role path)
  - `Agents/claudia.md` (one sentence that an unnamed user message makes the session Claudia)
  - Stable outer mirrors of those method files only through `./hai-meta sync`
- Preserve: Claudia does not write product code. Explicitly naming Augustus, Julius, Athena, or Hephaestus still selects that role for the session. A child worker whose contract names Augustus or Julius stays in that role. Do not ask the user to choose a role. Do not add a runtime detector, CLI, test that only mirrors wording, provider name, or host-injection mechanism. Leave root `AGENTS.md` as the development redirect. Leave planner files (`planning.md`, this task file, the handoff) unchanged.
- Acceptance:
  - A message that names no role follows Claudia's required read order and stays Claudia.
  - A message that names Augustus, Julius, Athena, or Hephaestus follows that role.
  - Spawned worker contracts are not rewritten into Claudia.
  - The no-role read path is no longer the startup instruction in onboarding, the installable `AGENTS.md`, or the README Layer 1 bullet.
  - `./hai-meta sync` leaves `.hai/AGENTS.md` equal to `scaffold/AGENTS.md` and `.hai/Agents/onboarding.md` equal to `Agents/onboarding.md`.
- Existing patterns: method text in onboarding and `scaffold/AGENTS.md`; sync via `./hai-meta` from the repo root of this worktree.
- Dependencies: none. Do not write the lean-harness or auto-release worktrees.
- Verification: `git diff --check`. `./hai-meta sync`, then confirm the two mirror pairs above. Do not run the full test suite. Run `node --test` only if you change an existing assertion.
- User-approved to execute: yes.
- High-cost approval: not granted.
- Local commit/merge: not approved.
- Outward acts authorized: none.

## Stop Conditions

- Report ambiguity, broken assumptions, unrelated drift, scope expansion, or required high-cost work.
- Never reset, stash, clean, bypass hooks, commit, merge, push, tag, or publish under this contract.
