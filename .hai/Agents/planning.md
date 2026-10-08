# Product Planning

Planner-owned source of truth for developing the HAI-Harness product. Product source lives one level up; all real planning stays in this outer `.hai/` instance.

Last updated: 2026-10-07 — Momus verified; local integration approved
Last updated by: Claudia
User check-in: 2026-10-05 — user rejected the registry/lock design as over-engineered. Model: each session opens its own branch, works there, records decisions, and merges into main; conflicts go to the user. Main must always be clean; uncommitted edits there go to the user to review and commit first. Chosen: shared-notes conflicts resolved by keeping both sides; approve stops for a re-test when main moved; dirty main blocks; keep a read-only `status --all`.
Verification: `node --test test/hai-harness.test.mjs` 17/17 in `task/trunk-lanes`; `git diff --check` clean; `./hai-meta sync` done.
Local integration approved: 2026-10-05 — user approved the decision entry and the merge into `main` ("appraove and release").
Remote acts approved: 2026-10-05 — push `main` so the release workflow opens the version PR; merging that PR still needs the repository's required GitHub reviews.

## Current iteration — Momus debugger implementation, 2026-10-07

- Authority: user accepted the T1/T2 Momus design batch and instructed implementation with T3 selective Claudia routing and a light worker fast path. The isolated approved Human writer recorded that combined decision once, preserving the prior log and retiring only T1/T2/T3 drafts. User approved local integration on 2026-10-07 ("yes merge to main"). Push, release and other outward acts remain unapproved.
- Status: source implementation, ordinary stable sync, focused checks, independent source review/correction recheck and installed real-bug/synthetic evaluation complete. Source is frozen; no active child writer. User approved native local integration; the command receipt and Git history record its exact commits.
- Contract: [implementation](tasks/momus-implementation.md); accepted change/evidence in [handoff](handoffs/momus-implementation.md), [source review](handoffs/momus-source-review.md) and [installed workflow evaluation](handoffs/momus-forward-test.md). Review correction [contract](tasks/momus-review-fix.md) is complete.
- Behavior: Claudia uses Momus for unclear causes, unexplained unsuccessful repairs or evidence-heavy failures without requiring user invocation. Known, reproduced bounded defects stay with the current worker. One debugging skill; reuse authorized worker/lane/handoff, no mandatory third reviewer/repeated repair approval; independent final symptom verification and cumulative three-failed-fix stop.
- Verification: original installer/update/doctor/legacy packet tests 2/2; fresh reviewer expanded focused checks 3/3. Review found RegExp coercion accepting malformed path-hash arrays; primitive-string correction and two independently failing-before/passing-after regressions resolve it. Corrective worker and independent reviewer each passed affected Momus family 3/3. Syntax/diff/skill validation and ordinary sync/parity/protected-state checks passed. All 29 stable source/mirrors match; original 38 protected records preserved through installation, 48 protected intake files preserved through correction before its receipt append.
- Real workflow: fresh installed-fixture Claudia automatically chose Momus, who diagnosed cross-list autosave overwrite, coordinated one Augustus fix and independently verified original symptom plus 5/5 tests and eligible source review. One applied fix, zero failed fixes, no redundant review/lane/approval. Parent independently reran 5/5 after evaluator controller usage interruption. Three later synthetic decisions chose direct known fix, Momus with reused worker after unclear failed repair, and stop before a speculative fourth after three failures. See evaluation for interruption/tooling limits; no full suite, build, network, production/retry-runtime or host enforcement claim.
- Controller/lane: Claudia, parent `01a114d7-547a-7dd0-91a1-f820fe414af0`; native `task/momus-debugger-design`, base `b711df0`, integration local `main`. At approval intake primary was clean at the base, tracking ref ahead by two release commits. Native local commit/merge is now authorized; no remote refresh or outward act is authorized.
- Traffic: CLEAR for isolated task closeout under verified latest human parallel-work authority in peer `task/field-reliability` planning (2026-10-07, proceed now while Momus remains a separate lane). That lane overlaps source/methods but owns no Momus resources. Native approval must bring the second integrating lane up to date with main and stop for focused recheck or user conflict resolution as required. Preserve peer field-reliability and retained task-cleanup duplicate-named records; no transfer or cross-lane edits/messages. One current parent writer only.
- Context cost: startup adds 344 words for Claudia and 199 for one worker; 1,415 new role/method words load on demand. No new service, permanent task queue, registry, config, dependency or CLI command. Inner templates contain generic method only; all task evidence/accepted project decisions remain outer.
- Prior design/evidence: [proposal](handoffs/2026-10-07-momus-debugger-proposal.md) and [design evaluation](handoffs/2026-10-07-momus-debugger-evaluation.md) remain historical proposal-stage records, superseded by accepted implementation/evaluation above.
- Packet: Git common `hai-harness/tasks/26f680f7eb474de7cf4f16c160b89c0c5c089978ad1639179bb7703e7b8df084`, outer `.hai`. Parent owns final trace/acknowledgment/capture. Retain lane through committed-state packet acknowledgment, then clean the completed lane through the native command; no ongoing task-owned process. Disposable autosave fixture/candidate retained as test evidence; no peer cleanup performed.

## Current iteration — task completion cleanup, 2026-10-06

- Status: implementation, method sync, focused checks, independent review/recheck and approved Human decision write complete. User approved the concrete decision entry and local commit/merge on 2026-10-06 ("approve"). Both review findings corrected with regression coverage. Native integration and automatic lane cleanup are authorized; Git history and the command receipt record their exact commits. No push or release authorized.
- Authority: user accepted the scoped automatic task-completion cleanup improvement ("let's do the improvement"). Implementation and local commit/merge approved; push and release are not authorized.
- Outcome: agents clean completed task resources without another routine approval prompt; uncertain ownership, useful leftover work, unfinished decisions and active peer use are preserved and reported.
- Lane: `task/task-cleanup`, sibling `HAI-Harness-worktrees/task-cleanup`, base `3a7bdbb`; primary remains clean on `main`.
- Traffic: CLEAR. Controller is current parent chat `01a1139b-cf3f-7b30-b91f-f64e0110fa23` (Claudia). Census: primary plus this new task lane only, no overlapping active HAI-Harness peer in visible inventory, no owned children before assignment. One lane writer at a time; no shared server/build or outward act.
- Queue: Augustus implements lifecycle instructions and focused CLI cleanup, runs focused tests/replay and sync; Julius reviews read-only; Augustus fixes confirmed findings; Claudia records completion evidence and presents the Human batch.
- Contract: [task-cleanup](tasks/task-cleanup.md); evidence: [task-cleanup](handoffs/task-cleanup.md).
- Evidence: 9 initial focused fixtures passed; affected reruns passed after refinements; fresh reviewer independently ran 7 checks and 4 final regressions. Process replay observed owned SIGTERM/peer survival and safe retention/retry. Four source/method mirrors match; sync preserved 54 initial and 59 final outer-state files. No broad suite, actual deployment, Windows or concurrent-mutation verification.
- Reviewed fixes: select packets by branch plus base so historical reused-slug packets remain preserved without blocking current cleanup; reject missing/duplicate required packet sections before empty-draft cleanup.
- Completion boundary: the exact approved decision was written once to outer Human/decisions.md by the isolated assigned writer, preserving the prior log. Its pending draft is retired. Approve retains the lane briefly for committed-state packet acknowledgment; cleanup then removes the completed merged lane automatically. No task-owned preview process was started outside isolated test fixtures, whose teardown completed.
- Dependencies: sequential single worker and fresh review of the same behavior. No registry, background service, process scanner or broad deletion.
- Verification: focused offline Git fixtures for completed/unfinished/retained lanes and useful leftovers, instruction replay with observable actions, syntax/diff check, `./hai-meta sync` and source/outer parity. No full suite, dependency installation or network verification.
- Packet: physical Git common `hai-harness/tasks/850cde22f1408210088c9a2412f107376547d3b1d0e96e876ed074970ed5d4c2`, outer `.hai` identity. Controller owns packet/planning mutations while worker is idle; worker reports any synchronized role trace changes before closeout.

## Current iteration — trunk lanes, 2026-10-05

- Status: **released**. Merged to `main` as `7911a03` through the new `worktree approve` (lane repointed to `main`; no re-test stop because `main` had not moved). Release PR #18 merged by the user; stable `v0.2.6` published 2026-10-06. Lane and private `codex/trunk-lanes` branch removed; this closeout ran in its own lane. Independent review (Julius, fast model): two confirmed findings fixed — a failing checkout hook could leave the lane detached, and `branch -d` ran against the wrong checkout for a secondary integration worktree; regression test added. Advisory: human-sync drift after a refresh merge is documented in human-scribe. Controller handoff: [2026-10-05-trunk-lanes-controller](handoffs/2026-10-05-trunk-lanes-controller.md).
- Field diagnosis (portfolio, three peer Claudias): the ban on integrating into `main` made every Claudia invent a private `codex/<task>-integration` branch and hand-merge into `main` unchecked; planner files were edited directly in the `main` checkout.
- Delivered: `create` branches from the primary's checked-out branch, including `main`; `approve` merges the latest `main` into the lane first (stops for re-test, or aborts and lists files on conflict), then fast-forwards `main` to a hook-checked merge commit built in the lane; dirty primary blocks both; read-only `status --all`; doctor warns on a dirty primary. Instructions updated in scaffold, onboarding, Claudia, traffic-control, human-scribe, README and CONTRIBUTING.
- Superseded and removed before commit: Augustus's lane registry, path claims, `--sequence-after`, lock file, temporary candidate worktree, `trunk` config key and `worktree refresh` (backup patch kept outside the repo).
- Closeout: user approved the Human decision entry (written in this lane), the local merge into `main` via `worktree approve`, and release. The lane was repointed from the private `codex/trunk-lanes` branch to `main`; the old packet stays in Git common metadata as evidence.


## Current iteration — human-sync migration, 2026-10-05

- Status: implementation, outer sync, focused tests, independent source review and two-agent handoff replay complete. Commit and release explicitly authorized. Source published; v0.2.5 release PR #17 awaits two required GitHub approvals. Auto-merge is disabled.
- Authority: the user selected migration and retirement of superseded storage. Current task-owned storage supersedes older Agents-placement plans. Earlier dated queues below are historical; no worker should execute them without a new contract.
- Evidence and limits: [release closeout](handoffs/2026-10-05-human-sync-release.md). Native session attachment, submission fencing and distributed coordination remain pending. No Human backfill batch is approved.
- Traffic: all source writers released. One controller owns commit, integration and publication; unrelated local history is preserved outside the candidate.

## Confirmed direction — session collaboration, 2026-10-05

- Request: evaluate consistent task isolation, same-lane handoff, scoped overlap control and accepted integration into main for multiple humans and agents.
- Method: [session collaboration](handoffs/2026-10-05-session-collaboration-proposal.md). A durable writable task owns a branch/worktree; sessions attach or hand off through exclusive leases. A candidate queue checks scoped changes and current human authority before main advances.
- Authority: the three 2026-10-05 entries in [Human decisions](../Human/decisions.md) record the confirmed direction, task-owned decision storage and project-only quick-testing policy. This plan references required behavior without duplicating decision history.
- Verification: directed agent rehearsal and fresh independent read-only review passed for this bounded fixture. [Evaluation](handoffs/2026-10-05-session-collaboration-evaluation.md) records actual handoff/refusal/recovery/integration/retry evidence and limits. Runtime lifecycle enforcement and existing pending ownership/authority safeguards remain unimplemented and unverified.
- Publication: user authorized commit and publication after the short scoped checks pass. Only this proposal/evaluation, the local verification rule, narrow planning and confirmed Human entries are included, in a clean branch/worktree from upstream main. No product release or source integration is included.
- Traffic: CLEAR for this documentation closeout; SEQUENCE for human-sync storage reconciliation. The transferred handoff and draft were checked. Preserve its existing uncommitted lane and compatible capture/writer/batch-approval behavior; reconcile the superseded Agents trail/inbox paths before source integration. No competing capture pipeline or human-sync code publication. Detailed migration/implementation remains next work.

## Active iteration — release waits for review, 2026-09-30

- User direction: keep a human review on the release pull request. The workflow must stop and ask for that review, then publish the tag and GitHub Release after the pull request is merged. It must not merge the pull request itself.
- Why: run 36749112593 opened `release/v0.2.3` and then failed because Actions cannot create pull requests (`can_approve_pull_request_reviews` is false). PR #15 was merged by hand. The follow-up run skipped publication with `already-at-release-version`, so v0.2.3 has version metadata on `main` and no tag or GitHub Release.
- Controller: Claudia. Traffic CLEAR for this lane. Primary stays on dirty local `main` at `f8a8905` and is not the edit target. Integration `codex/release-after-review` is clean at `2603e98`. Worker lane: `task/release-after-review`.
- Contract: [Augustus](tasks/augustus.md). One worker. No second queue.
- Scope: release planner and workflow only. A product push still opens `release/vX.Y.Z` and stops. A later main push publishes only when its tip is that release commit, or a merge from `release/vX.Y.Z`, and the tag is still missing. Any other push while v0.2.3 is untagged must not publish it.
- Approval boundary: user approved commit and push to origin/main on 2026-09-30. This push must not tag or publish v0.2.3.

## Active iteration — learning cycle repair, 2026-09-29

- User direction: fix self-learning so corrections produce reflection, safeguards, and verification. Local implementation complete; the user subsequently authorized merge and publication for this repair.
- Controller: Claudia, parent 01a0eded-c131-7720-98a2-c008504f46e4. Traffic CLEAR: primary clean at 1f6bb57; no overlapping active peer in visible inventory; existing other lanes preserved. Managed isolated checkout lesson-learning-cycle owns this iteration. No shared services. Merge to main, origin/main push and stable GitHub Release are now authorized for this repair.
- Scope: portable lesson workflow and lifecycle routing. One Augustus worker then independent review; sequential because both inspect the same behavior. Contract: tasks/learning-cycle.md. Parent owns outer coordination/lesson/decision records; worker owns assigned source and stable sync mirrors.
- Validation: focused offline installation/preservation and sync checks, then independent scenario evaluation. No full suite, build, network verification, or publication.
- Status: complete locally, source frozen, no active implementation worker. Independent source review and recheck found no actionable issues. Four fresh agent executions passed for same-session recurrence, older pending evidence, preference exclusion, and implemented-but-unrun verification. An exploratory failure (completed history in INDEX) was corrected before final replay. Evidence: handoffs/learning-cycle.md, handoffs/learning-cycle-reflection.md, handoffs/learning-cycle-evaluation.md. Lesson/decision state is current. This implements tested process instructions; it does not establish automatic host enforcement or model retraining.

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
- Update Beacon version `0.2.0` is on `main` and was never published. Installed receipts are already `0.2.0`, so publishing `v0.2.0` would look current and would not announce newer method files.
- A product push to origin `main` opens a release pull request and stops for review. After that pull request is merged, the workflow tags and publishes the GitHub Release. It does not merge the pull request. Installed projects still only receive a notice; they do not auto-apply.
- An unnamed user message starts the session as Claudia. The limited no-role read path is superseded by this 2026-09-29 direction. Explicitly naming Augustus, Julius, Athena, or Hephaestus still selects that role. A child contract that names a worker role stays in that role. Users do not need to name Claudia to start, and the harness does not ask them to pick a role.

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

### Default role is Claudia — 2026-09-29

- Status: rechecked and approved for local integration and push to origin `main` on 2026-09-29. Diff matches the contract. Extra review skipped: mechanical method wording.
- User direction: if a message names no agent, the harness defaults to Claudia. Example: "I want to change something" starts as Claudia.
- Conflict applied: older method text says an unnamed message follows a limited no-role read path and must not take a role. The 2026-09-29 direction supersedes that path.
- Scope: instruction and README wording only. No runtime role detector, CLI command, or host injection. Claudia remains planning-only. Named roles and spawned worker contracts still win.
- Contract: [Augustus](tasks/augustus.md); handoff: [default Claudia](handoffs/default-claudia.md).
- Lane: `task/default-claudia` from `codex/default-claudia`, base `7dcb5a3`.
- Traffic: CLEAR. Primary was clean on `main`. Idle `codex/auto-release` and `task/lean-harness` worktrees do not share this write scope. This controller owns the new lane. No shared builds, servers, or outward acts.
- Verification: wording review against the acceptance lines, `node --check bin/hai-harness.mjs` only if that file changes, focused tests only if assertions change, `git diff --check`, and `./hai-meta sync` so `.hai/AGENTS.md` and `.hai/Agents/onboarding.md` match the scaffold sources.
- Approval boundary: local commit/merge and push to origin `main` approved on 2026-09-29. The release workflow may publish because `Agents/`, `scaffold/`, and `README.md` changed.

### Automatic release on origin main — 2026-09-24

- Status: final check passed. A no-tag merge tip now lists product files, so the first push to `main` can publish `0.2.1`. Focused planner tests passed 2/2. User approved local integration and push to origin `main` on 2026-09-24. Decision logged.
- User direction: a push to origin `main` checks and updates the README release instructions, `package.json`, and `release.json`, then publishes a stable GitHub Release. The user does not handle that release.
- Release rule: publish only when installable product paths changed since the last release tag (`Agents/`, `Human/`, `bin/`, `scaffold/`, `package.json`, `release.json`, `README.md`, `LICENSE`, `hai-meta`). Ignore `.hai/`-only pushes. The release commit itself must not start another release.
- Version rule: bump the patch in `package.json` and `release.json` together, set `releaseNotesUrl` to the new tag, and write a short summary from the included commit subjects. The first release is `0.2.1`, not `0.2.0`.
- README rule: replace the manual maintainer release steps with this automatic path. Do not rewrite the README on every later release.
- Boundary: installed projects keep the notice-only beacon. No auto-apply.
- Contract: [Augustus](tasks/augustus.md); handoff: [auto release](handoffs/auto-release.md).
- Lane: `task/auto-release` from a new local integration branch `codex/auto-release` cut from current `main`. Primary is on `main`, so the worker checks out that integration branch before creating the lane.
- Verification: focused tests for the planner. No live publish, push, or tag in this iteration.
- Approval boundary: implementation authorized. Local commit/merge is not approved. The workflow may publish only after it is on origin `main`.

### Lean implementation and review — 2026-09-24

- Status: revised implementation, focused verification, sync and fresh independent Julius review complete. User correction applied: efficiency means straightforward useful improvement, not minimum changes. Claudia remains manager/controller.
- Outcome: shared operational implementation method, lifecycle/child routing, concrete review and fix/recheck closure, and discoverable deferral evidence. Routine review uses worker capability, with higher effort/capability reserved for evidenced risk or uncertainty.
- Scope: complete shared implementation skill, explicit startup/resume/child read routing, concrete code-review checks and fix/recheck closure, discoverable deferral notes through existing handoffs, installer/doctor registration and focused coverage. No new named role, provider-specific hooks, intensity modes, review engine or CLI command.
- Contract: [Augustus](tasks/augustus.md); handoff: [lean harness](handoffs/lean-harness.md).
- Lane: task/lean-harness from codex/lean-harness-integration, base c94cfc9; primary integration checkout remains clean.
- Traffic: CLEAR. Parent task 01a0d4cb-84d0-7ed2-978d-97388f2890db, Claudia controller; no owned children at census, one checkout before lane creation, no overlapping active peer found in visible task inventory. Product and sync writes belong only to this worker; Claudia owns this lane's outer planning/task/decision closeout. No shared builds, servers, or external acts.
- Dependencies: Augustus revision completed before fresh independent Julius review. The scenario walkthrough led to an explicit uncertainty-versus-confirmed-finding clarification, then focused sync/parity verification. No active product writers remain.
- Verification: revised focused installer/update/doctor and self-hosting tests passed (2 tests); Node syntax and diff checks passed; sync completed; 9 method/scaffold mirrors match and 7 protected files remain unchanged. Ruby parsed both skills; standard validator could not run because bundled Python lacks PyYAML (no dependencies installed). Fresh Julius review found no material source issues. Four instruction walkthroughs covered explicit UI requirements, committed/untracked review scope, fix rechecks, and uncertain resource constraints; the last prompted clearer evidence standards. This is not an empirical model benchmark. Final wording correction passed sync/YAML/parity/diff checks; installer tests were not redundantly rerun. Full suite and actual host-injection/compliance testing were not run.
- Approval boundary: implementation authorized; local commit/merge and remote publication remain unapproved for this iteration.

### Previous completed queue

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

- Revised lane is completed and reviewed. Explicit local commit/merge approval into codex/lean-harness-integration remains pending; no main merge, push, or release is included.

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
