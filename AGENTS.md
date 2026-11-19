# HAI-Harness repository instructions

This repository is the HAI-Harness product source. The reusable installation
templates live at the repository root: `Agents/`, `Human/`, and
[`scaffold/AGENTS.md`](scaffold/AGENTS.md) (the source of the managed block below),
plus the installer in `bin/`. They are not this repository's live operating context.

This repository's own harness lives in `.hai/`, installed like any project's.
When the user names a HAI role (for example "Claudia, ..."), follow the
HAI-Harness block below; it routes you to `.hai/Agents/onboarding.md`,
`.hai/Agents/project_context.md`, and the role/task routing defined there. When
no role is named, take no HAI role: work as a plain assistant under these
repository instructions.

Plan and coordinate in `.hai/`. Modify distributable product source only when
the outer task contract assigns that scope.

Every inner scaffold change is incomplete until `./hai-meta sync` runs and the
outer planning, task, handoff, and confirmed-decision state is updated in the
same iteration. Keep all live project state out of the inner templates.

<!-- hai-harness:start default=own -->
<!-- Managed by HAI-Harness: update rewrites everything between these markers. Keep your own instructions outside them. -->

## HAI-Harness

This project uses [HAI-Harness](https://github.com/ClaudiusMa/HAI-Harness), a repo-as-truth collaboration layer for humans and AI agents. Its files live in `.hai/`; `.hai/Agents/` is your scope.

### Start here

When the user's message or your task contract names a HAI role (step 2), do these in order, before anything else. When it names none, this block does not apply: follow this project's own instructions outside it.

1. **Update check.** Run `node .hai/Agents/check-for-update.mjs` from the project root. It runs weekly, prints only when a newer release exists and never updates; continue if it fails.
2. **Role.** If the user's message or your task contract addresses you as, or assigns you, Claudia, Momus, Augustus, Julius, Athena, Hephaestus, or a custom role with a file at `.hai/Agents/custom/roles/<name>.md`, that is your role; misspellings count, and a mere mention ("ask Augustus to fix X") assigns nothing. Otherwise no HAI role applies; do not take one or ask the user to pick. Custom roles follow every rule here and never replace built-ins. Read [`.hai/Agents/onboarding.md`](.hai/Agents/onboarding.md) and your role's read path before any other action (no code search, no edits), and again after a pause or compaction; a new message in the same session continues, so do not re-read.
3. **Lane before any write.** Check the primary checkout is clean (`git status --short`; if not, stop and have the user review and commit), then run `node .hai/Agents/hai-harness.mjs worktree create <task-slug>` from the primary checkout and work only in that lane. Workers and successors use the lane their contract or handoff names. If the CLI is missing or fails, stop and tell the user; never use `git worktree add` or hand-written `hai*` git config.

### Always

- No build without the user's go-ahead in chat; visible or multi-item work first gets a spec table and assumptions; rejections get a corrected table, not a patch.
- Claudia leads: she plans and, by default, builds in the lane herself, one writer per lane. She spawns or reuses a worker only on a delegation trigger in onboarding (you ask, heavy prior discussion or a rejected build, wide reading, risk review, parallel pieces, an unclear bug, unresolved design, routine bulk work, a custom role whose `route-when` matches), without asking: this block is the owner's standing request.
- `.hai/Human/` is read only when the user asks and changes only through `human-scribe` with their approval.
- Read and match `.hai/Agents/design.md` before any UI work (building, designing or reviewing).
- Integrate only through `node .hai/Agents/hai-harness.mjs worktree approve --approved "<message>"` from the task lane: no hand merge, no `--no-verify`, and never reset, stash, clean or copy dirty files to fake a clean baseline, a dirty primary included.
- Push, PR, deploy, publish and high-cost actions each need explicit approval.
- The latest confirmed human decision wins; flag conflicts.
- Never delete `<name> <N>` sync copies by hand; run `node .hai/Agents/hai-harness.mjs worktree sweep`.

Everything else is in [`.hai/Agents/onboarding.md`](.hai/Agents/onboarding.md).
<!-- hai-harness:end -->
