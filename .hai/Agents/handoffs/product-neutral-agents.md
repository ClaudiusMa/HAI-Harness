# Product-neutral AGENTS handoff

- Date: 2026-09-10
- Owner: Claudia
- Producer: Augustus
- Lane: pre-change bootstrap branch `codex/product-neutral-agents`, integrating into `local-integration`
- Status: implementation reviewed and integrated locally as `e867e7c`; combined transparency closeout verification passed 5/5 tests

## Result

- Root `AGENTS.md` is now the single repository-development entry and routes into `.hai/`.
- The installable root entry moved to `scaffold/AGENTS.md`; init, update, doctor, packaging, and self-hosting install it as target-root `AGENTS.md`.
- Root `CLAUDE.md` and `AGENTS.override.md` are deleted.
- New task lanes use `task/<slug>` with provider-neutral metadata; already-open legacy lanes remain approvable through explicit compatibility handling.
- Commit and merge messages no longer receive forced provider attribution.

## Verification

- Focused changed-behavior tests: 3/3 passed; the broad/full suite was not run.
- Syntax, sync, doctor, 24/24 stable parity, 75/75 local links, 39-file package boundary, provider-neutrality scan, privacy scan, and `git diff --check` passed.
- `.claude/settings.local.json` remains narrowly ignored as machine-local privacy hygiene; no current workflow reads or requires it.

## Next action

The user's 2026-09-10 request to push all described changes to remote main supersedes the earlier pending approvals. Augustus combines the transparency closeout and returns the clean integration commit to Claudia for the authorized origin/main push. No tag or release is authorized.
