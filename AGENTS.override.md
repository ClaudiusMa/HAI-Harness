# AGENTS.override.md — local operating redirect

This repository is the HAI-Harness product source. Its tracked `AGENTS.md`,
`Agents/`, and `Human/` files are the inner harness templates that ship to
installed projects; they are not this repository's live operating context.

For work on this repository, start with the version-controlled outer harness at
[`.hai/AGENTS.md`](.hai/AGENTS.md), then follow `.hai/Agents/onboarding.md`,
`.hai/Agents/project_context.md`, and the role/task routing defined there.

Plan and coordinate in `.hai/`. Modify the tracked inner product files only
when the outer task contract assigns that product-source scope.

Every inner scaffold change is incomplete until `./hai-meta sync` runs and the
outer planning, task, handoff, and confirmed-decision state is updated in the
same iteration. Keep all live project state out of the inner templates.
