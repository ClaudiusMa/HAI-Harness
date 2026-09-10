# Augustus Tasks

Planner-owned execution contract. Last updated: 2026-09-10 by Claudia.

## Assigned Queue

- Status: implementation complete; reviewed by Claudia; awaiting explicit local integration approval
- Outcome: one product-neutral `AGENTS.md` convention governs both HAI-Harness development and installed projects; no `CLAUDE.md` or provider-specific current workflow is required.
- Lane: assigned sibling task worktree on bootstrap branch `codex/product-neutral-agents`, created by the pre-change CLI from clean `local-integration` at `38e0b96`. Do not rename this in-flight branch; new lanes must demonstrate the neutral convention.
- Sequence:
  1. Make root `AGENTS.md` the repository's universal outer-harness redirect and move the distributable `AGENTS.md` template to a clearly owned scaffold path.
  2. Update init, update, doctor, packaging, and self-hosting sync to install the scaffold template as target-root `AGENTS.md` without shipping the repository redirect as the template.
  3. Delete root `CLAUDE.md` and `AGENTS.override.md`; remove their current links, preservation fixtures, and current-state claims.
  4. Replace Codex-specific worktree branches, metadata keys, errors, documentation, and forced co-author trailer with provider-neutral behavior. Preserve legacy branch approval only if a focused compatibility test proves it is needed and keep legacy naming out of the default path.
  5. Reframe current README language around AI agents generally. Do not rewrite immutable Git history or historical records merely because they name old branches or tools.
  6. Add deterministic regression coverage for installed `AGENTS.md`, absent provider-specific instruction files, neutral task-lane behavior, and no forced provider attribution.
  7. Run `./hai-meta sync`, update outer self-hosting guidance and this task's results, and report evidence to Claudia.
- Write scope: root `AGENTS.md`, scaffold/template source, `bin/hai-harness.mjs`, `package.json`, `test/hai-harness.test.mjs`, `README.md`, `CONTRIBUTING.md`, deletion of `CLAUDE.md` and `AGENTS.override.md`, synced stable `.hai` files, `.hai/README.md`, `.hai/Agents/project_context.md`, and this task's verification-results section. No other product or Human files.
- Read-only/preserve: `.hai/Human/`, discovery direction, historical handoffs/archives, unrelated branches/worktrees, machine-local settings, and package/update privacy boundaries. Claudia owns planning, decisions, and lesson state.
- Acceptance: a fresh install receives the reusable template at root `AGENTS.md`; this repository itself starts at root `AGENTS.md` and routes into `.hai`; no root `CLAUDE.md` or `AGENTS.override.md` remains; default task lanes and metadata are provider-neutral; commits receive no forced provider co-author; current docs do not position HAI-Harness as Claude/Codex-specific; sync preserves project-owned state.
- Verification: low-cost focused tests for changed installer/worktree/self-hosting behavior; syntax check; `./hai-meta sync`; `./hai-meta doctor`; stable-source parity; local-link and package-boundary inspection; provider-name and privacy scans of current prospective tracked content; `git diff --check`. Do not run broad/full tests without user check-in.
- Approval: implementation is authorized by the user's 2026-09-10 direction. Local commit/merge, push, PR, tag, release, and publication are not authorized.
- Dependencies: one sequential worker; no parallel writer. Traffic is CLEAR.

## Stop Conditions

- Report a source/field-state boundary violation, unexplained lane drift, broken assumption, or necessary scope expansion.
- Never reset, stash, clean, bypass hooks, or write to another worktree.
- No remote acts. Preserve lane if integration fails.

## Verification results — 2026-09-10

- Syntax passed for `bin/hai-harness.mjs` and `test/hai-harness.test.mjs`.
- Authorized focused tests passed 3/3: worktree lifecycle and legacy-lane approval compatibility; init/update/doctor installation behavior; self-hosting sync preservation. The broad/full test suite was not run.
- `./hai-meta sync` completed with 24 stable paths updated, 0 created, and the lesson index plus both generated worker task queues preserved. `./hai-meta doctor` passed (`Update status: unknown/offline`).
- Stable-source parity passed 24/24 after sync. Deployment-aware local-link inspection checked 75 links with 0 missing.
- `npm pack --dry-run --json` used `/private/tmp/hai-harness-npm-cache-product-neutral` and reported the expected 39-file package: `scaffold/AGENTS.md` is included; the repository redirect, `.hai/`, `CONTRIBUTING.md`, `hai-meta`, `CLAUDE.md`, and `AGENTS.override.md` are excluded.
- Current/default product and installed guidance contains no Claude, Codex, or OpenAI naming. Remaining provider strings are confined to explicitly labeled legacy-compatibility code/tests, negative absence assertions, immutable history, and this in-flight lane's pre-change bootstrap record.
- The narrow `.claude/settings.local.json` ignore remains private configuration hygiene, not a workflow dependency: no current code or guidance reads it, and removing it would make a known machine-local settings file easier to publish accidentally.
- High-signal credential, private-project-name, Google Workspace-link, and absolute-local-path scans found no matches after Claudia generalized the task-lane record.
- `git diff --check` passed. No commit, merge, push, PR, tag, release, or publication was performed.
