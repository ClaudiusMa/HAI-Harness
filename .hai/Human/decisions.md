# Decisions
Version: current

<!--
## How To Use This File

- Record only durable human decisions here.
- Keep one version or phase header at the top if your team groups decisions that way.
- Do not use this file for open questions, routine status updates, or loose brainstorming.
-->

Use this as the human decision log for the current project version or working phase.
Archive or reset this file before changing the version header convention.

## Format

- Date:
- Decision:
- Why:
- Tradeoffs:
- Follow-up:

## Decisions

- Date: 2026-08-14
- Decision: HAI-Harness will check anonymously for updates at most weekly by default, notify users only when a new release is available, and never apply an update automatically.
- Why: The existing pull-only `update` command preserves project state but gives installed users no way to discover that a newer harness exists.
- Tradeoffs: The check makes a bounded public network request and can surface an update only when the project is opened in a HAI-Harness-backed session; users may disable the check, and inactive users still require an external release channel.
- Follow-up: Add versioned install metadata, a cached release check, quiet actionable notification, release metadata, diagnostics, tests, and documentation without weakening update-preservation guarantees.

- Date: 2026-08-02
- Decision: HAI-Harness development uses a strict two-layer model: tracked inner files are distributable product templates, while all real plans, assignments, handoffs, lessons, and human decisions live only in the gitignored outer `.hai/` harness.
- Why: Dogfooding the harness inside its own product tree polluted shipped templates and mandatory prompts with project history.
- Tradeoffs: Development requires maintaining a local outer harness and respecting a hard boundary between product source and operating state.
- Follow-up: Route future development sessions into `.hai/` before planning or execution.

- Date: 2026-08-02
- Decision: Every inner scaffold change must be followed in the same iteration by `./hai-meta sync` and an outer-harness state update recording the decision, plan, verification, and next context.
- Why: The outer harness must adopt product improvements and remain authoritative for the next development session.
- Tradeoffs: Each scaffold change has a small synchronization and documentation step before it is considered complete.
- Follow-up: Make synchronization and outer-state closeout explicit completion gates in the outer context and local override.

- Date: 2026-08-02
- Decision: The upstream product contains only `Agents/tasks/TEMPLATE.md` and a blank planning template; installed product harnesses generate and own their live worker task files.
- Why: Real HAI-Harness development tasks must never ship as part of the reusable product.
- Tradeoffs: The installer must render role-specific project-local task files and preserve them during updates.
- Follow-up: Keep installer tests covering generation and update preservation.

- Date: 2026-08-02
- Decision: Storybook exploration logging is opt-in and occurs only when the user explicitly asks an agent to log visual explorations into Storybook.
- Why: Ordinary visual changes should not automatically expand into Storybook work.
- Tradeoffs: Visual history is not captured unless the user explicitly requests it.
- Follow-up: Preserve the rule in inner scaffold contracts and outer product context.

- Date: 2026-09-09
- Decision: Focus HAI-Harness project exploration on context continuity when returning to work, switching tasks or sessions, and handing work off between humans and AI.
- Why: These are the moments where context problems occur and hurt most, as confirmed by the user.
- Tradeoffs: Narrows the investigation to these transitions; the specific solution remains undecided.
- Follow-up: Clarify the problem, stakes, and design opportunity around these transitions.

- Date: 2026-09-09
- Decision: Develop HAI-Harness from mechanisms for preserving collaboration context toward helping humans and AI continue across transitions with less reconstruction and coordination effort.
- Why: The current harness provides a foundation for context continuity, while low-effort continuation for humans and AI is the next project direction.
- Tradeoffs: Existing context structures and procedural workflows are a starting point, not evidence that the intended user experience already works.
- Follow-up: Evaluate which transition support works for the intended users, including the human returning to work.

- Date: 2026-09-09
- Decision: Allow research and evaluation to simplify or change existing HAI-Harness roles, documents, and handoff mechanisms according to whether they improve continuity.
- Why: The project should solve the context problem rather than validate the existing architecture.
- Tradeoffs: Existing mechanisms may be changed or removed if their coordination cost is not justified.
- Follow-up: Assess transition accuracy and effort when testing the existing harness and future prototypes.

- Date: 2026-09-09
- Decision: Move HAI-Harness from a personally used tool toward a product through discovery research focused on context continuity across returning, switching, and handing off work among humans and AI.
- Why: Research should identify a project direction beyond the creator's own working habits.
- Tradeoffs: The precise research method, participant count, schedule, first prototype scenario, and product solution remain undecided; the proposed six-interview plan is not approved.
- Follow-up: Determine the discovery research plan later.

- Date: 2026-09-09
- Decision: Include both nontechnical or less technical builders, including small business owners actively building with AI, and experienced builders who collaborate with people or operate multiple agents in the discovery audience.
- Why: These groups can expose human-AI, human-human, and AI-AI continuity problems beyond the creator's profile.
- Tradeoffs: Audience coverage spans different technical backgrounds and collaboration practices; exact recruiting criteria remain to be determined.
- Follow-up: Define recruitment and research activities when developing the research plan.

- Date: 2026-09-09
- Decision: Use teammates as the relationship framing for explaining the HAI collaboration layer, without making broad relationship-model exploration a research priority.
- Why: The user has chosen the teammate framing and wants discovery to find the product direction.
- Tradeoffs: Partner, mentorship, and cyberpunk relationship metaphors are not parallel research tracks; specific mechanisms remain open to change.
- Follow-up: Keep discovery centered on context continuity.

- Date: 2026-09-09
- Decision: Keep the canonical HAI-Harness project decision log eligible for Git tracking at `.hai/Human/decisions.md`, while preserving blank distributable templates and ignoring other local operating state.
- Why: The user explicitly requested that project decisions not be gitignored.
- Tradeoffs: Supersedes the decision-log portion of the 2026-08-02 all-private outer-harness policy; decision contents become reviewable for version control, but no commit or publication is authorized by this change.
- Follow-up: Preserve this exception in project ownership guidance.

- Date: 2026-09-09
- Decision: Version-control and publish all substantive HAI-Harness development context in `.hai/`, root agent redirects, and `hai-meta`, alongside the product source.
- Why: The user wants the project's human and agent context to be transparent.
- Tradeoffs: Supersedes the 2026-08-02 private-only policy and the later decisions-only exception; machine-local settings, caches, and install receipts remain ignored, and development context remains excluded from the installable package.
- Follow-up: Keep current instructions and helper-generated instructions consistent with this policy.

- Date: 2026-09-10
- Decision: Develop HAI-Harness using its tracked `.hai/` working installation, refreshed from local product source through the normal installer/update mechanism, with a thin `hai-meta` wrapper and a public contributor entry point to project context and history.
- Why: Self-hosting should exercise the same workflow available to users while making the project's current positions and their history accessible to open-source contributors.
- Tradeoffs: Reusable installed files remain duplicated by design but are maintained through the normal updater; project records and root redirects are authored once in Git instead of being duplicated as helper-generated seeds. Machine-local data stays excluded.
- Follow-up: Simplify the wrapper, verify populated project records survive initialization and updates, and link current direction, decisions, work, and recorded history from contributor guidance.

- Date: 2026-09-10
- Decision: Use root `AGENTS.md` as the single product-neutral agent instruction entry, remove `CLAUDE.md` and `AGENTS.override.md`, and eliminate Claude/Codex-specific defaults from the current HAI-Harness workflow.
- Why: HAI-Harness must work across AI products rather than encoding one provider's file, branch, metadata, or attribution conventions.
- Tradeoffs: Products that do not discover `AGENTS.md` automatically must be pointed to it by their own integration layer; HAI-Harness will not maintain parallel provider-specific instruction files.
- Follow-up: Relocate the installable root template into scaffold source, update installer and worktree behavior, synchronize `.hai`, and add provider-neutrality regression checks.

- Date: 2026-09-24
- Decision: Adopt a straightforward, effective Ponytail-inspired upgrade to the installable harness using existing worker and manager roles, a shared implementation method, and independent conditional review; efficiency does not mean minimizing the change size.
- Why: The user approved taking useful Ponytail mechanisms into HAI, questioned automatic use of the highest capability for routine review, and explicitly corrected the interpretation that efficient means minimal changes.
- Tradeoffs: Keep review assignments flexible and capability proportional to risk; add no permanent reviewer role, provider-specific hook system, or new orchestration layer. Existing safety and integration approval boundaries remain.
- Follow-up: Revised implementation, focused delivery checks, instruction walkthroughs, independent review and sync are complete; obtain explicit local integration approval.

- Date: 2026-09-24
- Decision: A push to origin main automatically checks installable product changes and publishes the next stable GitHub Release, including the shared version in package.json and release.json and the README release instructions.
- Why: The user does not want a separate release step, and installed projects cannot discover newer harness files until a stable GitHub Release exists.
- Tradeoffs: Pushes that only change .hai do not publish. Installed projects still only receive a notice and do not apply the update themselves. The first release is 0.2.1 because existing receipts are already 0.2.0.
- Follow-up: Keep the push-to-main workflow as the release path.

- Date: 2026-09-29
- Decision: Repair HAI-Harness self-learning so confirmed preventable failures produce reflection, a reusable safeguard, and explicit verification or an owned pending check.
- Why: The user identified repeated mistakes and requested a working learning process; the inspected field incident recorded rules without demonstrating their effectiveness.
- Tradeoffs: Adds focused evidence work on qualifying failures while keeping ordinary preferences outside lesson capture; procedural instructions do not guarantee model compliance.
- Follow-up: Local repair, outer sync, independent review, and four behavioral executions are complete; integration, publication and field adoption remain separate actions.

- Date: 2026-09-29
- Decision: Merge the verified learning-cycle repair into main and publish it through the existing origin/main release workflow.
- Why: The user explicitly requested merge and publication after reviewing the local repair and verification summary.
- Tradeoffs: The stable release distributes updated process instructions; field projects still require an explicit update and retain their own learning state.
- Follow-up: Verify remote integration and the published release; record the result.

- Date: 2026-10-05
- Decision: Use one branch and worktree for each independently writable HAI task, retain it across session handoffs, and integrate accepted scoped changes into main through a verified merge queue.
- Why: The user wants multiple humans and agents to collaborate while main stays clean and overlapping scopes receive traffic control.
- Tradeoffs: Requires explicit task ownership, scope coordination and integration checks; this direction supersedes the mandatory non-main integration workflow when implemented.
- Follow-up: Complete the session lifecycle and migration design, preserve existing work, and exercise destination, handoff and integration failure cases before claiming enforcement.

- Date: 2026-10-05
- Decision: Keep human decision context with each task's branch/worktree outside product code and the Agents folder, and log the confirmed decisions behind accepted changes in Human/decisions.md as part of commit-and-merge closeout.
- Why: The user wants decisions preserved without filling product code or agent context with session history.
- Tradeoffs: Supersedes the 2026-09-30 use of an Agents decision trail and inbox for session decisions; unfinished decision context must survive handoff, and the shared Human log needs serialized closeout.
- Follow-up: Reconcile the human-sync capture design with this storage boundary; include the accepted decision entries and changes in the same integration, preserving provisional notes with unfinished work.

- Date: 2026-10-05
- Decision: Always run a quick test of the changed scope when working on this HAI-Harness repository, and keep this requirement in its project context rather than the general HAI-Harness templates.
- Why: The user wants testing to happen without repeatedly asking for it, while keeping tests small and relevant to the work.
- Tradeoffs: Each change needs focused verification; this does not authorize broad or high-cost test runs and does not impose the rule on other projects.
- Follow-up: Maintain the rule in `.hai/Agents/project_context.md` and record the tested scope and evidence at closeout.

- Date: 2026-09-30
- Decision: Agents maintain the Human folder and the public README for the user. Agents record why each planning, design, or context change was made and whether it came from the user. At session closeout, a cheap filter and drafter prepare entries, the user approves them in one batch, and a writer skill called human-scribe applies only the approved ones.
- Why: The user does not write the Human folder in practice. The brief and open questions had gone stale, and existing decision entries read like agent notes.
- Tradeoffs: Nothing reaches Human/ without approval, so unreviewed items wait in a queue. Capture reads the agent layer, not chat, so decisions that are never recorded there are caught only by a doctor drift check. Product, design, and process count as the user's decisions, and guesses agents made without asking become open questions. human-scribe replaces decision-logger and adapts humanize-writing (MIT) rules without depending on it. Reflections record only the user's quoted words.
- Follow-up: After the release-review lane closes, plan and assign the implementation, then an independent review, then the first backfill run. The backfill covers the brief, open questions, plain-language rewrites of past decisions, and the README. Design: Agents/handoffs/human-sync.md.

- Date: 2026-10-05
- Decision: Migrate the existing human-sync pipeline to task-owned decision metadata, remove its superseded Agents storage after recording the conflict, and commit and release the verified result with clean code checkouts.
- Why: The user wants the current collaboration and decision-storage choices to replace conflicting older work without leaving unfinished code.
- Tradeoffs: Keep the existing capture, batch approval and writer behavior; preserve recoverable old work, and do not publish unrelated historical changes or unreviewed Human backfill drafts.
- Follow-up: Complete the scoped migration, test and review it, integrate the accepted change and confirmed rationale, then verify the released version and clean local state.

- Date: 2026-10-05
- Decision: Every agent session works on its own task branch created from a clean `main`, records its decisions there, and merges into `main` through `worktree approve`. Approve first brings the latest `main` into the branch: if that changes anything, the session re-runs its quick test; if it conflicts, the session asks the user, except that shared notes keep both sides. `main` must always be clean; uncommitted edits there go to the user to review and commit first.
- Why: Three sessions on one project each invented private integration branches and hand-merged into `main`. The user rejected a registry-and-lock redesign as over-engineered and asked for the simplest model that still handles these cases.
- Tradeoffs: No registry, locks or path claims; overlapping work is caught at merge time instead. Refines the earlier 2026-10-05 merge-queue decision: scope coordination happens at merge time, not through a registry.
- Follow-up: Release the change; remediation of existing field projects stays with the user.

- Date: 2026-10-06
- Decision: Routine task cleanup is part of verified task completion and does not require separate cleanup approval. Stop task-owned previews and clean merged local task resources after the requested workflow is complete; preserve unfinished work and uncertain ownership.
- Why: Users should not need to request routine cleanup after completing a task.
- Tradeoffs: Not stated.
- Follow-up: Not stated.

- Date: 2026-10-07
- Decision: Add Momus and one debugging skill. Claudia selects Momus for unclear causes, unsuccessful repairs or investigations requiring runtime evidence; obvious, known corrections stay with the worker. Momus investigates and reports, coordinates a scoped worker fix, independently verifies the original symptom and returns to diagnosis if it fails. Reuse the task lane, worker and handoff when possible, and stop for reassessment after three unsuccessful fixes or earlier when evidence or authority cannot support another attempt.
- Why: The user wants Claudia to know when debugging needs Momus and wants an improvement rather than burdensome extra loops.
- Tradeoffs: Not stated.
- Follow-up: Implement and verify the accepted design. Local integration and publication retain separate approval.

- Date: 2026-10-07
- Decision: Installed projects carry the harness CLI as `Agents/hai-harness.mjs`, and every instruction runs it as `node Agents/hai-harness.mjs …`. Every session checks that the primary checkout is clean and creates its lane before writing anything, and stops if the CLI fails instead of using raw Git. A session is Claudia unless the message addresses or assigns it another role, misspellings included. Cloud-sync conflict copies are cleaned as they appear: provably redundant copies move to a reversible quarantine, the rest are reported, and approve refuses to commit them. The always-loaded AGENTS.md stays short (three start steps and a few invariants); detail lives in onboarding.
- Why: In the portfolio project, sessions could not run the bare `hai-harness` command, made lanes by hand that later broke approve and cleanup, skipped Claudia's startup on coding requests, and iCloud duplicates corrupted Git branches. The user keeps iCloud as a backup and wants AGENTS.md optimized rather than grown by each fix.
- Tradeoffs: The startup rules are still instructions the agent must follow; there is no host hook. Repositories stay in iCloud, so copies keep appearing and are cleaned each time; a kept branch copy blocks lane commands until the user approves quarantining that path. Field projects are cleaned by their own sessions. The full process is heavy for one-line edits.
- Follow-up: Consider a lighter path for trivial edits.
