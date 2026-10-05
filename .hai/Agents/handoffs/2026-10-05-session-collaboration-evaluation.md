# Session collaboration evaluation

Date: 2026-10-05
Owner: Claudia
Status: worker checks and fresh independent read-only review passed for this bounded rehearsal; documentation publication authorized.
Scope: a short directed rehearsal of the [proposed method](2026-10-05-session-collaboration-proposal.md). No HAI lifecycle or storage implementation changed.

## Fixture and observed results

A disposable native Git repository had a clean main, one task branch/worktree, an unfinished tracked page edit and an untracked TODO. Task identity `FIX-TASK-001` and branch `task/help-copy` stayed fixed. A first worker handed off; a fresh successor encountered a coordinator-seeded overlapping claim on the same physical file and stale instructions pointing to primary and an older human revision. A recovery worker completed the saved task after earlier workers became unavailable.

| Check | Observed evidence |
| --- | --- |
| Same-lane handoff | Task root, branch, HEAD, dirty diff and TODO were preserved in the initial and successor snapshots. |
| Overlap and stale direction | Successor stopped before writing or accepting the pending lease; snapshot hashes and empty index were unchanged. It identified revision 2 and the conflicting primary destination. |
| Explicit recovery | Controller revoked unavailable writer generation 3, recorded pending generation 4 and successor acceptance generation 5; no expiry-based takeover. |
| Scoped task submission | Task commit changed only `page.txt`; original untracked TODO was retained and excluded. |
| Latest confirmed behavior | Accepted page retains `Guide` and `Start small.`, adds `Next step: Try one step today.`, and excludes superseded scheduling and rejected alternate-heading copy. Exact protected paragraph/footer bytes and order match the baseline. |
| Result and rationale together | A normal candidate merge includes the page change and confirmed `FIX-D001`/`FIX-D002` Human entries; `FIX-D000` is preserved. Provisional `FIX-P001` stays in task metadata outside tracked history. |
| Clean integration boundary | Candidate checks preceded a fast-forward of unchanged clean fixture main; final main is clean. Claims were released. |
| Retry without duplicates | One closeout retry adds no IDs or commit; Human file hash and main HEAD are unchanged. |
| Recoverability and storage | Original TODO, provisional packet and all worktrees remain. Every committed tree contains only `page.txt` and `Human/decisions.md`; session metadata is outside code and `Agents/`. |

Fixture baseline: `5429fb1d4274c6f0e35bc859be37e4030df6cb63`.
Task page-only commit: `0f2f95c8c3a782ede8dfce24fc4a4f914757247d`.
Accepted fixture candidate/main: `b2042b86b2ee99920648bd17f23ce63bd7e25275`.
TODO SHA-256: `fe3d7a2510b95d4811162c5d273dd25ca844f29164a4e08e08ea599d69395935`.
Human file before/after retry SHA-256: `b2b91832d2464b825c8762389b0f39e1df4b17c37ce0ba4f589a1422e6dc89f9`.
These are disposable local fixture objects, not commits in this published product repository.

Native Git inspections and small standard-library assertions checked saved state, authority, exact surrounding preservation, manifests, staged paths, commit parents, metadata exclusion, candidate/main cleanliness and retry hashes. Task/candidate diff checks passed. One verifier initially expected default `git log --name-only` to show merge-file diffs; it was corrected to enumerate each commit against its first parent while main remained at baseline. This corrected an assertion, not accepted page behavior.

The tested procedure block SHA-256 is `9509c71a2d19b12e1718a367c62c307112caa66e1fe894a709ed766ca0f8b883` (Recommended contract through Current product gap and adoption). Reporting edits preserve that block.

## Independent review

A fresh read-only Julius worker independently ran Git/Python checks of actual commit trees and first-parent deltas, revision-2 source/controller agreement, same-lane snapshots, the blocked successor artifact, protected page/Human bytes, retained TODO and no-op retry. Result: PASS for this bounded rehearsal, with no material findings. The reviewer reproduced the merge-diff omission and confirmed the assertion correction strengthened inspection without relaxing acceptance. Snapshots corroborate preserved state but cannot establish the absence of transient historical writes. Runtime enforcement remains untested.

## Limits and overlap

This was a directed single-machine rehearsal, with explicit prompts, manual registry locking and a seeded peer claim. Recovery was prescribed and inspected saved controller evidence. It is not a blind benchmark or proof of automatic HAI enforcement. Concurrent lock contention, old-writer write attempts, symlink escape, main movement during verification, conflicting live human owners, cross-machine coordination, arbitrary editor prevention and CLI/host adapters were not exercised. Historical actions are supported by recorded artifacts and snapshots, not all reproduced in recovery.

The latest transferred human-sync handoff was checked. Its existing filter, drafter, writer and batch-approval work should be retained, but its trail/inbox, init/update rules, doctor checks and reader still use the superseded `Agents/` storage boundary. Its prior 4/4 focused tests cover that older implementation. The lane stays untouched and excluded from this publication pending reconciliation; no second capture pipeline was created.

The repository-specific quick-test rule lives only in outer [project context](../project_context.md). The three confirmed 2026-10-05 entries in [Human decisions](../../Human/decisions.md) record task isolation, storage/closeout and this local testing policy. Generic product templates are unchanged. Existing pending ownership and authority safeguards remain pending. No inner change occurred, so `hai-meta sync` is not required for this documentation-only iteration.
