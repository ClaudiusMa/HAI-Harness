# .hai/ — the harness on top of the harness

This directory is a **version-controlled development instance of HAI-Harness** used to develop
the HAI-Harness product that lives in the parent repository. We use the harness
to build the harness.

- You are in the **outer** harness. The **inner** harness (the product) is the
  parent repo's tracked files (`../Agents/`, `../Human/`, `../bin/`, `../AGENTS.md`).
- Start at [AGENTS.md](AGENTS.md) → [Agents/onboarding.md](Agents/onboarding.md),
  then read [Agents/project_context.md](Agents/project_context.md) for how the two
  layers relate and where workers make product changes.
- Root [`../AGENTS.override.md`](../AGENTS.override.md) is the managed Codex
  redirect into this outer harness. `hai-meta bootstrap` and `hai-meta sync`
  refresh it so future sessions do not mistake the tracked inner templates for
  live project instructions.
- Project context here is version-controlled but excluded from the installable package.
  Keep machine-local settings and receipts ignored. To refresh the product's scaffold
  changes, run `../hai-meta sync` from the repo root. To recreate it, run
  `../hai-meta bootstrap`.
