# Session collaboration proposal

Date: 2026-10-05, America/Los_Angeles
Owner: Claudia, parent `01a10d36-0db7-7630-83f1-fe620f74b384`
Status: core direction confirmed on 2026-10-05; a directed agent rehearsal and fresh independent review passed. Runtime mechanisms remain proposed and unimplemented.
Scope: a portable collaboration model for multiple humans and agents, addressing actual write-destination, ownership and decision-authority failures.

Canonical authority: the two 2026-10-05 entries in [Human/decisions.md](../../Human/decisions.md). This document specifies the proposed method; human decision history belongs in that log. Treat unimplemented mechanism details below as design proposals.

## Recommended contract

Use one named branch and one worktree for each independently writable task. A session is an execution attempt attached to that task. New independent work gets a new lane; continuing or handing off the same task retains its identity and lane. Read-only conversations and reviews need no new writable lane.

Keep `main` as the accepted project history. Task writers never work in its checkout. A single integration owner advances it only to an accepted, verified candidate. A session ending is a pause, handoff, or submission event; only accepted work is eligible to integrate.

This separates five identities: human authority, root controller, durable task, execution session, and physical checkout. None can be inferred from a chat label or role name.

## Lifecycle

| Event | Required behavior |
| --- | --- |
| Start new work | Resolve authority and scope; reserve the scope; create a branch and worktree from a recorded main commit; bind the session to the actual root. |
| Resume | Attach to the existing task; refresh decisions/dependencies; validate root, branch, HEAD, saved working state and current lease. |
| Handoff | Preserve the lane, including unfinished tracked/untracked work; record progress, evidence, next step and decision revision; revoke the old writer and let the successor accept a new lease. |
| Submit | Freeze an exact task commit and its branch/worktree-owned decision packet; validate its complete delta and decision constraints; send it to the integration queue. |
| Integrate | Build and review a candidate containing the changes and accepted Human decision entries against current main; advance main only while its recorded base is still current. |
| Close | Confirm both the accepted result and its Human decision entries landed; release claims; retain the lane until cleanup is safe and recoverable. |

Crashes and expired leases never delete work or silently authorize takeover. A successor must reconcile the actual saved state. On another machine the branch/task identity remains the same, but the physical worktree path changes; uncommitted work needs an explicit recoverable checkpoint before transfer. Do not claim a branch carries uncommitted files.

## Minimum task record and ownership

- Stable task ID, root controller, human sponsor, authorized decision owner(s), and integration approver or pre-authorized integration policy.
- Goal, acceptance criteria, parent/child relationships, and prerequisites.
- Canonical worktree root, branch, base commit, current HEAD, and latest handoff/checkpoint.
- Writable paths, protected paths, shared interfaces/invariants, and mutable runtime resources.
- References to current human decisions, explicit supersession, and unresolved disagreements.
- Execution-session ID, writer lease generation, lifecycle state, submitted commit, and verification evidence.

Use task-specific durable records in each lane. Keep human decision capture and draft history in branch/worktree-owned session metadata outside product code and `Agents/`; its exact storage shape is an implementation choice. Preserve it through local handoffs and explicit portable checkpoints. Exclude that temporary metadata from product commits and integration history. A central planning file is a coordinator-owned summary, not a file every controller overwrites. Include planning, tasks, handoffs, decision records, and lesson records in scope accounting; product-only isolation would recreate the shared-document collision.

Keep live leases in a shared coordinator outside tracked worktrees. On one machine, use the Git common directory to identify the repository and atomic local locking for its registry. A common Git directory is normal; canonical checkout and per-worktree index paths identify mutation surfaces. Claims must be checked and acquired atomically, with generation checks that reject an old session after handoff. Git's worktree maintenance lock is not an agent write lease.

One current mutation owner per worktree is the first-version default. A controller assigns an explicit writer; it does not edit that checkout while the worker holds the lease. Concurrent writing children get separate lanes. Sequential children can inherit the same task lane through a lease transfer. Reviewers inspect a frozen commit and use separate scratch space for mutable verification.

## Traffic control

Registration performs a scope check for every new or expanded task; full negotiation begins only when a collision is found. Recheck at resume, scope growth, dependency/decision change, and integration.

Begin with conservative file-level claims. Different sections of one physical source file are overlapping claims. Different files may still collide through a shared interface, design invariant, migration, generated output, port, service, or deployment target. Scope names alone do not prove independence.

Independent tasks proceed. Overlap returns a named sequencing boundary, narrower agreed scopes, or an explicit ownership transfer accepted by the relevant human owners. Peer controllers retain their authority. An expired claim is evidence to investigate, not permission to take work.

When two tasks depend on one another, integrate the prerequisite first and refresh the dependent task before it resumes. A stale baseline invalidates affected verification rather than being silently treated as current.

## Integration into main

1. The task submits a frozen commit plus its full change manifest relative to its recorded baseline and a separate session decision packet. Reject unexplained or out-of-scope tracked, staged, or untracked changes; stage named approved paths. Account separately for ignored/generated output and external runtime mutations. Do not replace files wholesale from a donor checkout.
2. The integration owner acquires one queue lease and records current main commit M. In an isolated candidate worktree, create a normal merge of the submitted task commit into M and append its confirmed decision entries to `Human/decisions.md` as part of the candidate. Resolve conflicts there without changing main. Serialize these Human log writes through the queue and deduplicate entries by stable decision ID; do not make every active task rewrite the shared log.
3. Check the candidate delta against M, current decisions, protected relationships and affected behavior. Validate authority independently of the producer's task contract before checking implementation. A conflict-free Git merge is insufficient evidence.
4. Approval identifies the exact candidate and decision revision, or follows a recorded policy that authorizes integration after those gates. A changed candidate or relevant decision requires fresh validation.
5. With the integration lease held, verify main is still M and its checkout is clean. Advance it to the tested candidate through a fast-forward operation with hooks preserved. If main moved, rebuild and revalidate against the new tip. Never force an update.
6. Record completion only after both the accepted changes and their Human decision entries are present; verify the main checkout is clean at the operation boundary. Preserve the task lane and decision packet on failure. Publication and deployment retain their separate authorization.

Normal Git merging combines changes relative to ancestry; it does not require copying an old checkout onto main. Retaining a merge commit is the proposed default because it preserves task provenance. Squashing is a separate history preference and does not solve stale authority or scope errors.

## Human decisions and multiple humans

During active work, each branch/worktree owns its decision capture, provisional assumptions and pending choices in session metadata. Product code and the `Agents/` folder are not decision-history stores. Task contracts and checks may reference decision IDs and required behavior without copying the narrative history. Handoff retains the same metadata with the task; closing an unfinished session does not publish its provisional choices as accepted project decisions.

At accepted closeout, the confirmed decisions explaining the accepted changes are written in plain language to `Human/decisions.md`, together with their rationale and provenance. Include those entries in the verified integration candidate so the result and its rationale reach main together. Do not merge first and leave decision logging as a later edit on main. Do not promote agent assumptions, rejected drafts or raw transcripts as human decisions.

Each accepted decision needs an ID, author, authority scope, source reference, affected behavior, revision, and any decision it supersedes. Represent both required and forbidden behavior: removed content stays absent; a rejected variant stays absent. Refresh the branch/worktree metadata when a new human correction arrives, before review, and before integration. Retrieve only the relevant accepted decisions from the canonical Human log into runtime context; do not maintain a duplicate decision ledger in `Agents/`. The coordinator also routes relevant pending human corrections to affected tasks before integration, without copying their history into agent files.

Within a clear authority scope, the latest confirmed direction can supersede older directions. Across humans, timestamps alone cannot establish precedence. Conflicting directions from equally authorized owners remain unresolved until those owners reconcile them or invoke a previously agreed decision policy. Do not let an agent become the arbiter by silently choosing a newer message.

The same lane discipline applies to human editors and agent tools. For multiple machines, Git branches can carry durable records, but a local lease file cannot enforce global exclusivity. Teams need one shared coordinator/atomic claim service and one canonical integration queue. A Git-committed ledger alone is eventually visible, not a distributed mutex. If coordination is unavailable, preserve offline drafts without claiming a globally exclusive scope or permission to integrate.

## Enforcement boundary

Implement deterministic lifecycle and integration checks in the CLI. A host adapter must attach sessions to the correct cwd, resolve destination paths (including symlinks), restrict writable roots where supported, and bind previews to that lane. Check the real Git root, branch, index and lease generation before mediated writes; reject primary-destination exceptions.

CLI commands and Git hooks cannot prevent every arbitrary editor or shell write. Advertise preventive write isolation only for hosts that mediate writes or provide filesystem permissions/sandboxing. For other hosts, scope checks detect drift at submission but do not guarantee prevention. HAI cannot assume an automatic session-start callback exists in every runtime.

## Current product gap and adoption

Current `bin/hai-harness.mjs` has `worktree create/status/approve`. Creation already makes a native task worktree and records its base, but requires a clean, checked-out non-main integration branch. Approval uses `git add -A`, merges into that integration branch, and attempts immediate lane cleanup. There is no explicit task scope manifest, session lease/handoff lifecycle, current-decision gate, or shared multi-machine coordination service in this inspected path.

Adopting this proposal would explicitly supersede the mandatory non-main integration workflow and expand isolation to planner writes. It is not an instruction to migrate the current dirty checkout. Preserve existing worktrees and unresolved decisions first; register or adopt them only after reconciling their actual state. Do not reset, stash, clean, or delete work to achieve a clean-main appearance.

Suggested implementation sequence with the core direction confirmed:

1. Apollo specifies the lifecycle, task-owned session metadata, Human closeout, authority boundaries and host adapter contract. Reconcile the earlier human-sync trail/inbox capture paths with the canonical 2026-10-05 storage decision; preserve its unfinished work and compatible approval/writer behavior.
2. One implementation worker adds local task registration, worktree attachment/resume, atomic claims, write-destination checks, and handoff fencing. Keep old lanes recoverable.
3. Add the scoped submission and candidate integration queue, then independent authority review and represented decision invariants. Isolated candidate testing is part of integration, not post-merge repair.
4. Exercise the actual failure fixtures with a fresh reviewer. Run `./hai-meta sync` and complete the outer task, handoff, planning and confirmed-decision closeout in the same iteration.
5. Add and verify host adapters and multi-machine coordination before claiming automatic session routing or distributed collision prevention.

Acceptance fixtures: wrong absolute destination; symlink escape into the primary; duplicate writer lease; old writer after handoff; scope growth into an existing claim; planner-document collision; out-of-scope/untracked submission; main advancing during verification; newer removal violated by a stale but conflict-free merge; conflicting human authority; cross-machine handoff with uncommitted files; coordinator unavailable; interrupted integration that preserves recoverable lanes; decision metadata leaking into code or Agents; handoff losing pending decisions; accepted changes integrating without their Human entries; duplicate closeout entries on retry.

## Traffic and verification for this proposal

CLEAR for this proposal, its evaluation, the project-local verification rule, and narrowly scoped planning/Human closeout. Publication is prepared in a separate branch and worktree from upstream main `a7ee9ea`; no dirty primary files or unrelated local commits are included.

The transferred human-sync handoff was inspected. Its existing `task/human-sync` lane still uses `Agents/decision-trail.md` and `Agents/human-inbox.md`; its earlier focused checks do not verify the new storage contract. Preserve that lane, its unfinished work, compatible writer/filter/batch-approval behavior and pending reconciliation. No human-sync code is assigned or integrated by this documentation publication.

The inspected primary CLI still has the product gap described above. Git's primary documentation describes worktree-specific indexes and merge behavior: [worktree](https://git-scm.com/docs/git-worktree), [merge](https://git-scm.com/docs/git-merge).

A short directed agent rehearsal exercised same-lane handoff, refusal of an overlapping claim and stale direction, recovery, scoped candidate integration with confirmed Human entries, unfinished-work preservation, and a no-op decision retry. See [evaluation](2026-10-05-session-collaboration-evaluation.md) for evidence and limits. Fresh independent review passed with no material findings in this bounded rehearsal. This does not verify automatic write fencing, cross-machine coordination, or the existing pending deterministic safeguards; those lesson checks remain pending.

Only outer coordination and confirmed decisions change. No distributable source change, build, full suite, inner sync or product release is part of this closeout. User authorization is to commit and publish this tested design and the project-specific test policy after the scoped checks pass.
