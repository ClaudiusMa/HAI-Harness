# Plugin layout

Owner: Claudia (lead, one writer in this lane). Updated 2026-10-16.
Status: executable. Design approved 2026-10-12 ("yes"); rebased on v0.2.10 (lead model) 2026-10-16. The first delegated worker stopped on a usage limit before any source change. Review: fresh read-only reviewer, deep tier, high effort (installer, CLI and migration are risk areas).

## Problem

Field evidence (Engram, 0.2.4 → 0.2.9): `update` overwrote the project's own root `AGENTS.md` and its locally edited `Agents/onboarding.md` and `Agents/claudia.md`, deleting the custom Apollo role and breaking its routing. Root `AGENTS.md` and every role/method file sit in `scaffoldPaths` and are copied unconditionally; nothing records what was shipped; there is no extension point, so customizing means editing core files. `init` skips an existing `AGENTS.md`, so such projects are never wired in.

## Confirmed direction (user, 2026-10-08)

- HAI acts as a plugin: everything it ships or stores lives in one `.hai/` folder in the user's project.
- Root `AGENTS.md` belongs to the user. HAI owns only a marked block that holds the startup rules.
- Users keep their own custom skills and custom agents (roles) across updates.
- An unnamed message is always Claudia. Claudia sees custom roles and routes to them; design this carefully so agents do not make mistakes.

## Requirements

### R1 Layout

```
<project>/AGENTS.md                    user-owned; HAI block between markers
<project>/.hai/Agents/                 today's internal layout (onboarding, role docs, skills, planning, tasks, handoffs, lessons, designs, _archive, hai-harness.mjs, check-for-update.mjs)
<project>/.hai/Agents/custom/roles/    project roles (README.md shipped; everything else project-owned)
<project>/.hai/Agents/custom/skills/   project skills (README.md shipped; everything else project-owned)
<project>/.hai/Human/
<project>/.hai/.hai-harness.json       receipt
```

- `--target` is the project root for `init`, `update`, `migrate` and `doctor`. If `--target` is itself a directory named `.hai`, refuse and print the project-root form (prevents `.hai/.hai`).
- No `.hai/AGENTS.md` in the new layout; the root block is the only entry.
- In-project CLI is `.hai/Agents/hai-harness.mjs`. Every installed instruction, skill and README example says `node .hai/Agents/hai-harness.mjs …`. Lane and human-sync commands work from that copy with no PATH entry, npm or network, from the primary or from inside a lane. The human-sync packet scope for a new-layout project is `.hai`.
- HAI writes nothing outside `.hai/` except the `AGENTS.md` block. No provider-specific files.

### R2 Root `AGENTS.md` block

- Markers `<!-- hai-harness:start -->` and `<!-- hai-harness:end -->`, each on its own line. The first line inside says the block is managed by HAI-Harness and edits belong outside it.
- Content: the current lean startup gate, rewritten for `.hai/` paths and the R5 role rules. It is always loaded: keep it at roughly today's length. Source stays `scaffold/AGENTS.md` (the block body).
- `init`: no `AGENTS.md` → create one containing only the block. Existing file without markers → append the block after one blank line; never change other content.
- `update`: exactly one well-formed block → replace only between the markers; every byte outside stays identical. No markers → do not add it back; report that agents will not see HAI startup and that `init` restores it. Duplicate, nested or unbalanced markers → leave the file untouched and report.
- `doctor` reports a missing or malformed block.

### R3 Never overwrite a user's edit

- Core files: the stable method files `update` refreshes today (root `AGENTS.md` is now the block), plus `custom/roles/README.md` and `custom/skills/README.md`.
- The receipt records the sha256 of each core file as written by `init`, `update` or `migrate`.
- Ship a generated list of every historical content hash of each core file across `main` history, including the old whole-file root `AGENTS.md` and `scaffold/AGENTS.md`, so installs from any release or any `main` commit (`npx github:` installs the default branch) are recognized. Commit the generator script; add a test that the current source hashes are in the list.
- `update`, per core file: missing → create. Matches the receipt or a known shipped hash → replace. Otherwise → leave untouched and list it under "Locally modified — kept" with the next step: move the customization into `custom/` or `project_context.md`, then run `update --accept-upstream <path>` for that one path. `--dry-run` prints the same classification.
- Retired core files (shipped before, no longer shipped, e.g. `.hai/AGENTS.md`): pristine → remove and list as retired; modified → keep and report. Never delete anything else.
- Project state (planning, context, design, tasks, handoffs, lessons, archive entries, `Human/`, `custom/` contents) is never written by `update` beyond today's create-if-missing generic files.

### R4 Migration of existing installs

- Legacy root layout: `<target>/Agents/onboarding.md` exists and `<target>/.hai/Agents/onboarding.md` does not. `update` on it changes nothing and prints the `migrate --dry-run` command.
- New `migrate [--dry-run]`, packaged CLI only (like `init`/`update`):
  - Refuse unless the working tree is clean, so the move is reviewable in a task lane.
  - Move `Agents/` → `.hai/Agents/`, `Human/` → `.hai/Human/`, receipt → `.hai/.hai-harness.json`. Use `git mv` for tracked content.
  - Root `AGENTS.md`: matches a known shipped whole-file version → replace it with the block only. Otherwise keep the user's content, append the block, and report that any old harness text in it needs the user's review. A legacy `.hai/AGENTS.md` (Engram's case) → retire if pristine, otherwise keep and report.
  - Apply R3 to core files; modified ones are kept and reported.
  - Report, never move or rewrite: non-core files at `Agents/` top level that look like roles (e.g. `Agents/apollo.md`) and non-shipped skills under `Agents/skills/`, each with a hint to move it to `custom/roles/` or `custom/skills/` and add the R5 header; project-owned files mentioning root-relative `Agents/` or `Human/` paths or `node Agents/hai-harness.mjs`; other open `task/*` lanes (warn that they merge `main` after migration; do not block).
  - Re-running on a migrated project is a no-op. Dry run writes nothing.
- This repository: `hai-meta` targets the repository root (`update --target <root>`). Root `AGENTS.md` keeps its repository note and gains the block; the outer `.hai/AGENTS.md` is retired. The product source `Agents/` and `Human/` at this repository's root must not be read as a legacy install (`.hai/Agents/onboarding.md` exists → new layout).

### R5 Custom roles and skills, with careful visibility

Role file `custom/roles/<name>.md` (filename is the lowercase name) with frontmatter:

```
---
name: Apollo
description: one line, what this role does
route-when: one line, the requests Claudia sends here
writes: code | docs | none
---
```

The body holds the role's read path and rules. Skill: `custom/skills/<name>/SKILL.md` with `name` and `description` frontmatter, like shipped skills.

Rules, worded tightly across the block, `onboarding.md` and `claudia.md` (including its delegation-trigger list) without long duplication. Keep every v0.2.10 lead-model rule intact:

1. An unnamed message is Claudia, always. A custom role is never the default.
2. A message that addresses or assigns a built-in or custom role by name takes that role (misspellings count); a mere mention assigns nothing. For a name that is not built in, check `.hai/Agents/custom/roles/<name>.md`; if it does not exist, the session is Claudia.
3. Built-ins win. A custom role or skill whose name matches a built-in role (Claudia, Momus, Augustus, Julius, Athena, Hephaestus) or shipped skill is ignored and reported.
4. Core rules bind every custom role: the block's Always rules and onboarding's Core Rules (lanes, clean primary, approvals, `Human/` boundary, outward acts). A custom role may add or narrow rules, never loosen them. When its file conflicts, follow the core rule and tell the user.
5. Claudia at intake lists `custom/roles/` and reads frontmatter only. A custom role whose `route-when` clearly matches the request is a delegation trigger, like Momus for an unclear bug or Hephaestus for unresolved design: the project asked for that routing by writing it. She spawns or reuses that role as a child with the usual contract (one writer per lane, tier and effort chosen per task) and names the role and its `writes` level in it. Otherwise she leads as usual. A `docs` or `none` role never receives code changes. If a built-in and a custom route both fit, or two custom roles fit, she asks the user. Every custom routing choice appears in her plan.
6. Invalid frontmatter (missing field, unknown `writes`) → Claudia does not route to it and `doctor` reports it. A user may still address it by name; the agent warns that the role file is incomplete.
7. Custom skills: read `custom/skills/` frontmatter when choosing a method; load one when the contract names it or its description clearly fits. Shipped skills win on a name collision.
8. Custom role docs are traced like built-in role docs: human-sync traced paths include `Agents/custom/roles`.

`doctor` validates custom role and skill frontmatter and name collisions. The shipped `custom/roles/README.md` and `custom/skills/README.md` explain the format with one short example each.

### R6 Docs

`README.md` (install, update, layout, custom roles and skills, migration; state that this is a layout change and how to migrate), `CONTRIBUTING.md` and `.hai/README.md` for the `hai-meta` target change, the repository note in root `AGENTS.md` (the block itself arrives through sync), and `Human/onboarding.md` if it names paths.

## Write scope

Product: `bin/hai-harness.mjs`, the hash generator script and shipped hash list (list must ship in the package, e.g. under `scaffold/`), `test/hai-harness.test.mjs`, `scaffold/AGENTS.md`, `Agents/**` method files and the new `Agents/custom/*/README.md`, `Agents/check-for-update.mjs`, `Human/onboarding.md`, `README.md`, `CONTRIBUTING.md`, `hai-meta`, `package.json` only if `files` needs it, the root `AGENTS.md` repository note, `.hai/README.md`. Other outer `.hai/` paths change only through `./hai-meta sync`. Evidence: `.hai/Agents/handoffs/plugin-layout.md`. Outer planning, this contract, project context and the packet are Claudia's as lead; `Human/` only through `human-scribe` with approval.

## Method and sequence

Claudia builds, following `.hai/Agents/skills/implement/SKILL.md`. Work only in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/plugin-layout`, branch `task/plugin-layout`. Run the CLI as `node bin/hai-harness.mjs`.

1. R3 ownership guard and hash list (everything else builds on it).
2. R1 layout and R2 block in `init`/`update`/`doctor`, then R4 `migrate`.
3. R5 rules in the block, onboarding, `claudia.md` and the custom READMEs; doctor validation; traced paths.
4. Remaining instruction, skill and README paths (R1 command form) and R6 docs.
5. Focused tests with offline fixtures:
   - init: no `AGENTS.md` → block-only file; existing `AGENTS.md` → block appended, original bytes intact; everything else under `.hai/`; nothing else written outside it.
   - update: block refreshed in place with user text above and below byte-identical; removed block not re-added; malformed markers untouched and reported; `--target <x>/.hai` refused.
   - ownership: edited core file kept and reported; pristine older version replaced; `--accept-upstream` replaces exactly one path; dry-run classification matches the real run; receipt hashes recorded; pristine retired file removed, edited one kept.
   - Engram-shaped migrate: root layout, custom root `AGENTS.md`, Apollo edits in `onboarding.md` and `claudia.md`, `Agents/apollo.md`, a custom skill under `Agents/skills/`, legacy `.hai/AGENTS.md`, populated planning and `Human/`. After migrate: user `AGENTS.md` content intact plus block; Apollo edits preserved and reported; `apollo.md` and the custom skill reported with move hints; project state byte-identical; second run is a no-op; dirty tree refused; dry run writes nothing.
   - worktree create/approve/cleanup and human-sync run from `.hai/Agents/hai-harness.mjs` with no `hai-harness` on PATH.
   - doctor: custom role missing frontmatter, built-in name collision, invalid `writes` → reported.
   - this repository's shape (root product `Agents/` plus `.hai/Agents/`) → treated as new layout.
6. `./hai-meta sync` (now the root target). Check: root `AGENTS.md` repository note intact plus block; `.hai/AGENTS.md` retired; outer project state preserved; source/outer mirror parity.
7. Written scenario check: state the first actions the block and onboarding require for an unnamed coding request; "Apollo, …" with a valid custom role; "ask Apollo to …" (a mention); an unnamed schema-change request where Apollo's `route-when` matches; a message naming a role that does not exist; a custom role file named `claudia.md`; an Apollo file that says "commit directly to main". Live agent replays of these openings follow review, only if the user asks (the paired test waits until the harness is declared ready to deploy).
8. Report files, results and limits in `.hai/Agents/handoffs/plugin-layout.md`; freeze source for the independent read-only review; Claudia fixes confirmed findings.

Dependencies: one writer; the reviewer waits for frozen source. `node --test test/hai-harness.test.mjs` is the focused suite. No dependency installation, network checks, or mutation of real projects outside test fixtures. Approval boundary: execution approved 2026-10-12; local commit/merge, push and release unapproved. Do not commit.
