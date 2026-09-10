# Product-neutral AGENTS handoff

- Date: 2026-09-10
- Owner: Claudia
- Producer: Augustus
- Lane: pre-change bootstrap branch `codex/product-neutral-agents`, integrating into `local-integration`
- Status: implementation complete, focused verification passed, Claudia review passed, local integration approval pending

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

Obtain explicit user approval before running local `worktree approve`. No push, pull request, tag, release, package publication, or other remote act is authorized.
