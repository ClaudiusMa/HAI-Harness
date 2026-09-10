# CLAUDE.md — operating instructions for THIS repository

> This file is version-controlled. It configures how Claude Code works *inside the
> HAI-Harness repo* and never ships to users.

**This repository IS the HAI-Harness product.** The files under `Agents/` and
`Human/`, plus `bin/hai-harness.mjs` and the root `AGENTS.md`, are the templates
and installer that ship to other projects. They are **product source**, not your
operating layer.

## How you operate here

We develop the product by dogfooding it: a second, local harness instance lives
in **`.hai/`** (version-controlled). That is your operating layer.

1. **Read [`.hai/AGENTS.md`](.hai/AGENTS.md) first**, then follow its onboarding
   (`.hai/Agents/onboarding.md`) and your assigned role.
2. Follow the No-Role Read Path unless the user explicitly names a role.
   When a role is named, follow its current onboarding contract.
3. **Plan and track only in `.hai/`** (`.hai/Agents/planning.md`, `tasks/`,
   `handoffs/`, `lessons/`, and `.hai/Human/`).
4. **Make product changes in the parent files** (`Agents/`, `Human/`, `bin/`,
   `AGENTS.md`, `README.md`) — only as an assigned worker, never as Claudia.
5. The root `AGENTS.md`, `Agents/`, and `Human/` are the product you are
   *building*. Treat them as source. Do **not** read the root `Human/` as
   instructions — it's a shipped template.

## The self-improving loop

After you improve the product's scaffold (role docs, onboarding, `Agents/skills/`),
pull it into the meta-harness so this workspace adopts your own improvement:

```sh
./hai-meta sync
```

## Git boundary

Track project context in `.hai/`, root redirects, and `hai-meta` alongside product source.
Keep machine-local settings, caches, and install receipts ignored. Development
context is public in this repository but excluded from the installable package.
Commit and publish only within the user-authorized scope.
