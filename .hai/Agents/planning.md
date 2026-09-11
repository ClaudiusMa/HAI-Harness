# Product Planning

Planner-owned source of truth for developing the HAI-Harness product. Product source lives one level up; all real planning stays in this outer `.hai/` instance.

Last updated: 2026-09-11
Last updated by: Claudia
User check-in after material clarification: yes — product-neutral `AGENTS.md` direction confirmed 2026-09-10; direct local and remote `main` publication reaffirmed 2026-09-11
Verification approved: combined full tests, syntax checks, sync, doctor, package-boundary inspection, and privacy scans for the approved integration
Local integration approved: yes and complete — combined result integrated as `3ec129f`
Remote acts approved: complete — combined result pushed to `origin/main` on 2026-09-11; no tag or release

## Current Product Truth

- Project context in `.hai/`, root agent redirects, and `hai-meta` is version-controlled; machine-local settings and receipts stay ignored. Earlier private-only policies below are superseded history.

- The tracked inner repository is the distributable HAI-Harness product and contains templates only, never HAI-Harness development state.
- This outer `.hai/` harness owns all real plans, worker assignments, handoffs, lessons, and confirmed human decisions for building the product.
- The upstream task surface is only `../Agents/tasks/TEMPLATE.md`; `init` generates project-local role task files and `update` preserves populated installed queues.
- Every inner scaffold change must be followed in the same iteration by `./hai-meta sync` from the repository root plus outer planning/decision/task closeout.
- Root `AGENTS.md` must be the single product-neutral development entry point for this repository and route agents to the outer `.hai/` harness. The installable root-agent template must live in scaffold source rather than competing for that path.
- The current harness contract must not depend on provider-specific instruction files, branch namespaces, Git metadata keys, or forced co-author attribution.
- Storybook exploration logging is explicit-user-triggered only.
- Installed harnesses should discover new releases through a default-on, anonymous check no more than weekly, notify only once a newer actionable release is available, and never auto-apply updates.
- Update discovery must preserve the existing boundary: stable scaffold files may refresh, while project-authored planning, context, design, queues, handoffs, lessons, archives, and Human content remain untouched.
- Update Beacon version `0.2.0` is merged and present on remote `main` at `b5db1722c273b183ac231def3af2aa7ab9ff54f1`; it is not yet a published GitHub Release, so installed beacons will not announce it prematurely.

## Completed Iteration — 2026-08-02 reusable harness extraction

- **Status:** done
- **User direction:** extract only scalable harness improvements from a private field instance and remove every source/field-state pollution path.
- **Delivered inner product changes:**
  - CLI-native task worktree create/status/approve flow with clean-base, explicit-approval, hook-preserving local integration guards;
  - traffic-control and compact lesson-promotion scaffolds;
  - prompt-hygiene diagnostics for oversized live planning/task context;
  - explicit Storybook opt-in rule;
  - canonical upstream versus installed field-instance boundary;
  - upstream-only task template with generated, project-owned installed worker queues;
  - compatibility tombstones for the retired retrospective/patterns/graveyard lesson path.
- **Explicitly excluded:** field-specific routes, ports, static preview server, builds/exports/deployments, product design-system policy, project lessons/history, field-specific skills.
- **Verification:** `npm test` 2/2; `node --check bin/hai-harness.mjs`; `git diff --check`; source `Agents/tasks/` contains only `TEMPLATE.md`.
- **High-cost/outward work:** none performed.
- **Synchronization and future routing:** `./hai-meta sync` and `./hai-meta doctor` passed; stable inner improvements are present in this outer harness; the managed, gitignored root `AGENTS.override.md` now routes future Codex sessions here and enforces same-iteration outer closeout.

## Active Queue

- Product-neutral implementation and transparency closeout are complete. The user reaffirmed direct local and remote `main` publication on 2026-09-11, superseding the earlier pending gates.
- Product-neutral implementation merged locally as `e867e7c`; the closeout lane combines that result with human-workspace visibility corrections and reconciled publication records. The planning conflict was resolved by preserving both outcomes and the latest authorization.
- Root `AGENTS.md` routes development into `.hai/`; `scaffold/AGENTS.md` installs into user projects. New task lanes and metadata are provider-neutral, with compatibility for existing lanes and no forced provider attribution.
- Human onboarding and README now describe human ownership and project-controlled visibility. Prior transparency/self-hosting work was verified on remote `main` at `38e0b96`; the originally rejected push remains historical evidence only.
- Combined verification passed: full tests 5/5, sync of 24 stable paths, doctor (update status unknown/offline), diff check, scan of 84 tracked files with no high-signal privacy matches, and the 39-file package boundary with scaffold included and development records excluded.
- Contract: [Augustus](tasks/augustus.md); [product-neutral handoff](handoffs/product-neutral-agents.md); [transparency handoff](handoffs/context-transparency.md). Verification and publication are complete: `origin/main` contains combined integration commit `3ec129f`; a final coordination-only closeout commit records this state. Discovery remains unassigned.

- Discovery intake, 2026-09-09: user confirmed product discovery direction and audience. Research activities, participant count, schedule, and first prototype remain undecided; no research execution or implementation queue is assigned.
- Focus: context continuity during returning, switching, and handoffs among humans and AI. Teammates is the explanatory framing.
- Audience: nontechnical/less technical builders including small business owners using AI, plus experienced builders collaborating with people or multiple agents.
- Earlier H-5 implementation is complete. Historical backlog below is not the new discovery roadmap.

## Completed Iteration — 2026-08-14 Update Beacon

- **Outcome:** installed projects now perform a dependency-free, default-on update check at most weekly and show one actionable notice per newer published stable release; checks are silent when current/offline and never auto-apply updates.
- **Privacy and repository behavior:** no project identifiers or content are sent; cadence and last-notified state remain Git-local or in the user's external cache; the stable receipt stores installed version/channel/opt-out only; routine checks keep the project worktree clean.
- **Release gating:** discovery uses GitHub's latest published Release endpoint and rejects drafts, prereleases, invalid tags, malformed responses, and oversized responses. Version metadata on `main` alone cannot trigger a notice.
- **Verification:** `npm test` 4/4; CLI/checker syntax; `git diff --check`; bounded privacy scan with zero matches; package dry run; same-iteration outer sync; authoritative `./hai-meta doctor` reports `current (0.2.0)`.
- **Integration:** predecessor README task `fad4c2a` merged as `9d3a56a`; Update Beacon task `82f08b2` merged as `b5db172`; local integration is clean.
- **Remote:** exact merge `b5db1722c273b183ac231def3af2aa7ab9ff54f1` pushed without force to `origin/main` and verified by `git ls-remote`. GitHub reported the protected-branch pull-request rule was bypassed for the authorized direct push.
- **Not performed:** no tag, GitHub Release, package publication, or announcement.

## Next-Iteration Intake Contract

1. Start from root `AGENTS.md`, then read `.hai/AGENTS.md`, outer onboarding, project context, the named role, and this plan.
2. Record new strategy and assignments only in `.hai/Agents/planning.md` and `.hai/Agents/tasks/`.
3. Workers edit the tracked inner product source; inner planning/task templates remain generic.
4. After inner scaffold changes, run `./hai-meta sync` before completion.
5. Update this plan, the relevant outer task/handoff, and confirmed outer decisions so a fresh session has the exact next context.

## Backlog

| ID | Title | Type | Priority | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| H-2 | General adversarial evaluator | feature | P2 | inbox | Correctness/security/reliability evaluation beyond design review |
| H-3 | Deterministic runtime routing/state machine | feature | P2 | inbox | Enforce dependency and approval gates mechanically |
| H-4 | Lesson/prompt-state automation | chore | P2 | inbox | Automate bounded sweeping without expanding always-loaded context |

## Decision Needed From User

- Decide separately whether to tag and publish stable GitHub Release `v0.2.0`; until then, Update Beacon correctly treats the implementation as unreleased.

## Completed — 2026-09-09 context transparency

- User authorized tracking substantive project context, agent redirects, and the sync helper. Remote publication requires explicit authorization for the concrete destination and branch.
- Updated tracking policy and generated instructions; superseded private-only instructions remain historical evidence in dated decisions.
- Generalized unrelated private field-project names before publication.
- Verified shell syntax, sync, doctor, four CLI tests, and package boundary; local settings and receipts remain ignored.
- **Integration and publication:** transparency merge `1ad318af2ac62d384fc35698cbab844a35736daf` and subsequent self-hosting merge `38e0b964e27f5260f7861a06e7b5d32af43b4c76` are on local integration and live remote `main`, verified 2026-09-10. The original blocked push did not execute; a later publication reached the remote.
- **Privacy closeout:** Claudia completed a full scan of all 81 tracked files; no sensitive patterns were found beyond normal attribution/test email. The installable package still excludes development context, root redirects, and the helper.
- **Follow-up — 2026-09-10:** user approved simple self-hosting and contributor access, including local integration. Replaced embedded seeds and bulk copying with ordinary CLI delegation; published contributor navigation in the working diff. `npm test` 5/5, shell syntax, sync, doctor, local links, 24-path parity, project-state hashes, and the unchanged 39-file package boundary passed. Reviewed by Claudia and approved for local integration from `codex/transparency-sync-docs`; no remote acts authorized.
- **Historical publication gate:** automatic approval review rejected the initial push before execution. That rejection is historical; live remote verification above establishes that publication subsequently completed. No new push is needed for those merged changes; future changes retain their normal approval gates.
- **Handoff:** [context transparency](handoffs/context-transparency.md). Discovery direction and its undecided research/prototype scope remain unchanged.
