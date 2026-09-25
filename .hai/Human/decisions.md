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
