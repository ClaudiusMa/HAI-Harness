# .hai/ — our working HAI-Harness installation

We use the ordinary HAI-Harness installer and updater to develop the product itself.
This checked-in installation contains this project's live context; the parent
repository's `Agents/`, `Human/`, and `scaffold/AGENTS.md` are reusable product
templates. The repository root `AGENTS.md` is the universal redirect into this
outer operating layer.

Contributors start with the [project records and contribution guide](../CONTRIBUTING.md).
Agents enter through the root [AGENTS.md](../AGENTS.md), then continue with this
installation's [AGENTS.md](AGENTS.md), [onboarding](Agents/onboarding.md), and
[project context](Agents/project_context.md).

From the repository root, run `./hai-meta sync` after improving product source.
It delegates to `node bin/hai-harness.mjs update --target .hai`, including shipped
skills, and preserves project-owned records and additional local skills.
`./hai-meta doctor` runs the ordinary installation checks.

`./hai-meta bootstrap` installs missing generic files through ordinary `init`.
It does not recreate project history or rewrite the repository redirect; recover missing project
records from Git. The helper accepts no destructive flags and contains no project seeds.

Project context is tracked for transparency and excluded from the installable package.
Keep machine-local settings, caches, and installation receipts ignored.
