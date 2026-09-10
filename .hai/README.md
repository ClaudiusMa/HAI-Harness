# .hai/ — our working HAI-Harness installation

We use the ordinary HAI-Harness installer and updater to develop the product itself.
This checked-in installation contains this project's live context; the parent
repository's `Agents/`, `Human/`, and `AGENTS.md` are reusable product templates.

Contributors start with the [project records and contribution guide](../CONTRIBUTING.md).
Agents start at [AGENTS.md](AGENTS.md), [onboarding](Agents/onboarding.md), and
[project context](Agents/project_context.md). The checked-in root
[AGENTS.override.md](../AGENTS.override.md) and [CLAUDE.md](../CLAUDE.md) route sessions here.

From the repository root, run `./hai-meta sync` after improving product source.
It delegates to `node bin/hai-harness.mjs update --target .hai`, including shipped
skills, and preserves project-owned records and additional local skills.
`./hai-meta doctor` runs the ordinary installation checks.

`./hai-meta bootstrap` installs missing generic files through ordinary `init`.
It does not recreate project history or rewrite redirects; recover missing project
records from Git. The helper accepts no destructive flags and contains no project seeds.

Project context is tracked for transparency and excluded from the installable package.
Keep machine-local settings, caches, and installation receipts ignored.
