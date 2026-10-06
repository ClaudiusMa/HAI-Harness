# Trunk lanes implementation handoff

Date: 2026-10-05
From: Augustus
To: Claudia
Status: **superseded** — the user rejected this registry/lock design as over-engineered; the controller replaced it in the same lane with the simple model (see [controller handoff](2026-10-05-trunk-lanes-controller.md)). Kept as evidence only; none of the features below ship.

## Changed paths (product + inner templates)

- `bin/hai-harness.mjs` — trunk resolution (`.hai-harness.json` `trunk`, default main/master); `worktree create` trunk vs branch kinds, `--path`, `--sequence-after`, `--controller`, lane registry; locked approve with refresh gate; trunk candidate + `--ff-only`; `worktree refresh`; `worktree status --all`; doctor trunk/lane warnings; `update` preserves `trunk`.
- `test/hai-harness.test.mjs` — trunk lane, overlap, lock, refresh gate, status `--all`, doctor warning, `trunk` preserve tests; adjusted protected-branch error assertion.
- `scaffold/AGENTS.md`, `Agents/onboarding.md`, `Agents/claudia.md`, `Agents/skills/traffic-control/SKILL.md`, `Agents/skills/human-scribe/SKILL.md`, `README.md`, `CONTRIBUTING.md` — lane/trunk integration rules per contract Step 5.
- `.hai/` stable mirrors refreshed by `./hai-meta sync` (onboarding, claudia, skills, AGENTS.md, etc.). Outer `planning.md`, `tasks/augustus.md`, handoffs, lessons, `project_context.md`, and `Human/` were not overwritten by sync (preserved list in sync output).

## Commands and results

| Command | Result |
| --- | --- |
| `node --check bin/hai-harness.mjs` | exit 0 |
| `git diff --check` | exit 0 (no conflict markers) |
| `node --test test/hai-harness.test.mjs` | **17 pass, 0 fail** (was **15 pass** before new cases) |
| `./hai-meta sync` | exit 0; 27 stable files updated under `.hai/`; 3 preserved (`lessons/INDEX`, `tasks/augustus.md`, `tasks/julius.md`) |

## Tests added / covered

- Trunk create → approve → fast-forward trunk via detached candidate; trunk clean; integrate lock absent after success.
- Overlap refusal and `--sequence-after` acceptance while first lane still active.
- Approve refused while `integrate.lock` held.
- Refresh gate refusal on shared path change, then success after `worktree refresh` (with manual conflict resolution in test).
- `status --all` stale declared path and integration-ahead count.
- Doctor warning when trunk primary has dirty planner file.
- `update` preserves configured `trunk` key.
- Existing develop integration lifecycle, legacy `codex/` approve, and human-sync suite unchanged.

## Not tested

- Concurrent integration lock contention beyond single-holder refusal (no multi-process race).
- Cross-machine registry or lock behavior.
- Host-level write prevention / sandboxing.

## Ambiguities resolved

- **Primary not on trunk, no `--integration`:** kept prior behavior (current branch as branch-kind integration) when trunk name cannot be resolved or primary ≠ trunk; trunk kind only when primary equals resolved trunk.
- **Porcelain path parsing:** doctor planner warnings use flexible `porcelainPath()` because some Git output uses a single-column status prefix.
- **Refresh conflicts:** CLI leaves merge in progress; test resolves manually (matches contract).

## Instruction wording uncertainty

- None blocking; CONTRIBUTING still documents optional named integration branch for non-trunk primaries alongside trunk-first example.
