# .hai/ — our working HAI-Harness installation

We use the ordinary HAI-Harness installer and updater to develop the product itself.
This checked-in installation contains this project's live context, laid out exactly
as HAI-Harness installs into any project; the parent repository's `Agents/`, `Human/`,
and `scaffold/AGENTS.md` are reusable product templates. The repository root
`AGENTS.md` holds a repository note followed by the managed HAI-Harness block.

Contributors start with the [project records and contribution guide](../CONTRIBUTING.md).
Agents enter through the root [AGENTS.md](../AGENTS.md), then continue with this
installation's [onboarding](Agents/onboarding.md) and
[project context](Agents/project_context.md).

From the repository root, run `./hai-meta sync` after improving product source.
It delegates to `node bin/hai-harness.mjs update --target .`, which refreshes the
root block and shipped core methods and skills, and preserves project-owned records,
custom roles and skills, and any core file edited here (reported, never overwritten).
`./hai-meta doctor` runs the ordinary installation checks.

`./hai-meta bootstrap` installs missing generic files through ordinary `init`.
It does not recreate project history or rewrite the repository note; recover missing
project records from Git. The helper accepts no destructive flags and contains no project seeds.

Project context is tracked for transparency and excluded from the installable package.
Keep machine-local settings, caches, and installation receipts ignored.
