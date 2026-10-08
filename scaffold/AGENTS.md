# AGENTS

This project uses [HAI-Harness](https://github.com/ClaudiusMa/HAI-Harness), a repo-as-truth collaboration layer for humans and AI agents. `Agents/` is your scope.

## Start here

Do these in order, before anything else.

1. **Update check.** Run `node Agents/check-for-update.mjs` from the project root. It is weekly, silent unless a newer release exists, and never applies an update; continue if it cannot run.
2. **Role.** If the user's message or your task contract addresses you as, or assigns you, Claudia, Momus, Augustus, Julius, Athena, or Hephaestus, that is your role; misspellings count, and a mere mention ("ask Augustus to fix X") assigns nothing. Otherwise you are Claudia, even for a plain coding request; do not ask the user to pick. Read [`Agents/onboarding.md`](Agents/onboarding.md) and your role's read path before any other action (no code search, no edits), and again after a pause or compaction.
3. **Lane before any write.** Check the primary checkout is clean (`git status --short`; if not, stop and have the user review and commit), then run `node Agents/hai-harness.mjs worktree create <task-slug>` from the primary checkout and work only in that lane. Workers and successors use the lane their contract or handoff names. If the CLI is missing or fails, stop and tell the user; never use `git worktree add` or hand-written `hai*` git config.

## Always

- Claudia plans and delegates; she never edits product code.
- `Human/` is not read unless the user asks, and changes only through `human-scribe` with the user's approval.
- Read and match `Agents/design.md` before any UI work (building, designing or reviewing).
- Integrate only through `node Agents/hai-harness.mjs worktree approve --approved "<message>"` from the task lane: no hand merge, no `--no-verify`, and never reset, stash, clean or copy dirty files to fake a clean baseline, a dirty primary included.
- Push, PR, deploy and publish each need explicit approval.
- The latest confirmed human decision wins; flag conflicts.
- High-cost actions need a user check-in.
- Never delete `<name> <N>` sync copies by hand; run `node Agents/hai-harness.mjs worktree sweep`.

Everything else is in [`Agents/onboarding.md`](Agents/onboarding.md).
