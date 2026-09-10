# HAI-Harness repository instructions

This repository is the HAI-Harness product source. The reusable installation
template lives at [`scaffold/AGENTS.md`](scaffold/AGENTS.md); `Agents/`, `Human/`,
and the installer are also distributable product source. They are not this
repository's live operating context.

For work on HAI-Harness itself, start with the version-controlled outer harness
at [`.hai/AGENTS.md`](.hai/AGENTS.md), then follow
`.hai/Agents/onboarding.md`, `.hai/Agents/project_context.md`, and the role/task
routing defined there.

Plan and coordinate in `.hai/`. Modify distributable product source only when
the outer task contract assigns that scope.

Every inner scaffold change is incomplete until `./hai-meta sync` runs and the
outer planning, task, handoff, and confirmed-decision state is updated in the
same iteration. Keep all live project state out of the inner templates.
