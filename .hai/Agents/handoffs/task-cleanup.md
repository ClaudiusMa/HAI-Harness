# Task cleanup improvement

Date: 2026-10-06
From: Claudia
To: Augustus, then independent reviewer
Status: implementation, sync, focused checks, independent review/recheck and approved decision write complete; local commit/merge authorized

User request: after the recommendation to make task cleanup automatic, "let's do the improvement". The attached screenshot is evidence of the friction, not authorization to stop or delete resources in the pictured portfolio task.

Traffic CLEAR; current controller owns `task/task-cleanup` only. Primary baseline `3a7bdbb` on clean main. Local commit/merge approved on 2026-10-06; push/release/publication remain unapproved. Follow [contract](../tasks/task-cleanup.md). Record implementation, focused checks, instruction replay, preservation evidence and limits here.

Packet identity: branch `task/task-cleanup`, base `3a7bdbbdf5d618fe80a064df136613458dc1b4bd`, integration `main`, scope `.hai`. Physical packet: `/Users/claudiusma/Documents/ProductLab/HAI-Harness/.git/hai-harness/tasks/850cde22f1408210088c9a2412f107376547d3b1d0e96e876ed074970ed5d4c2`. Keep packet metadata recoverable after completed lane cleanup; local integration and Human closeout are now approved.

## Worker implementation evidence

Augustus implemented the scoped CLI/instruction change in the assigned sibling lane only. No commit, integration, push, release, deployment or external task-resource cleanup occurred.

- `approve --keep-worktree` preserves the integrated lane for pending outward work, ongoing preview or follow-up, and prints the exact later retry command.
- `worktree cleanup <task-branch> --target <surviving-checkout>` checks recognized metadata, canonical physical lane ownership, exact tip ancestry in the recorded integration branch, native worktree lock/other-checkout ownership, staged/tracked/untracked work, ignored files, and this branch's task packets across scopes. It preserves pending/deferred/malformed drafts and uncaptured review entries. Peer packet metadata is read only to discover identity; peer inboxes/trails are not inspected. Packet directories remain recoverable and their physical paths are printed.
- Cleanup uses native non-force Git removal and branch deletion from the recorded integration checkout. It reports registration, leftover folder, and branch retention separately. Branch-only retries recheck ancestry; absent branch/folder is idempotent. Orphans and ignored files are retained with exact reasons instead of recursively deleted.
- Generic completion instructions now make owned-preview shutdown, inspected disposable-cache removal, and safe cleanup retry part of routine completion without another cleanup prompt. A push alone is not completion and authorizes no new outward act. Process ownership/timing stays with the agent, not a registry or background service.

Product files changed: `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `Agents/onboarding.md`, `Agents/claudia.md`, `scaffold/AGENTS.md`, and the narrow completion paragraph in `Agents/skills/human-scribe/SKILL.md`. `./hai-meta sync` refreshed the four corresponding outer method mirrors. Parent-owned planning/tasks/packet/Human were not edited by the worker.

### Focused offline verification

Initial scoped command: `node --test --test-name-pattern='worktree lifecycle|main lanes|approve survives|^cleanup|physical common metadata' test/hai-harness.test.mjs` — **9 passed, 0 failed**, 22.5 seconds. After tightening malformed-draft and peer packet handling: `node --test --test-name-pattern='^cleanup|approve survives|physical common metadata' test/hai-harness.test.mjs` — **7 passed, 0 failed**, 15.8 seconds.

Coverage: default lifecycle and legacy naming; competing lane refresh/conflict behavior; failing post-checkout hook and secondary integration checkout; deferred approve cleanup and CLI help; staged/untracked work; exact newer unmerged branch tip; ignored valuable artifact retained on approve and retry; locked worktree; canonical path moved to another worktree; lane symlink and nested repository preserved; registered-worktree-already-removed branch retry; unregistered folder retained; absent branch with orphan retained; current-task pending/deferred/malformed drafts and uncaptured entries; peer pending packet preserved without blocking the completed task; `.hai` packet metadata retained through cleanup.

`node --check bin/hai-harness.mjs` and `git diff --check` passed. `./hai-meta sync` succeeded with no new files; **54 outer-state files matched pre-sync SHA-256 hashes**, and the four changed method mirrors match their product sources byte-for-byte. Snapshot: `/tmp/hai-task-cleanup-preservation.json`.

### Observable completion instruction replay

The focused test `cleanup instruction replay stops owned preview, retries generated cache, and retains uncertain artifacts` executes the new closeout rule against offline Git/process fixtures. It starts owned and peer Node previews, records actual owned PID/cwd, observes cleanup retain an ignored generated cache, terminates only the owned child by its handle, inspects and removes the exact cache file created by the fixture, preserves an uncertain artifact with a specific CLI reason, resolves that fixture-owned artifact, and retries cleanup successfully. It verifies the peer process survives both retries. Fixture test teardown stops its peer afterward.

Latest replay artifact: `/var/folders/p0/4f_4_zwn4yn0ths23xpbk9tr0000gn/T/hai-cleanup-replay-79622.json`. Observed owned PID 80240 exited with SIGTERM; peer PID 80241 survived; the retained ignored file was `owned-cache.txt`, retained uncertain file was `uncertain.txt`, and final retry removed Git registration and merged local branch. This is an enacted scoped instruction replay, not a model-adherence benchmark or real application/deployment test.

### Limits and reviewer focus

The CLI intentionally does not remove ignored cache contents or arbitrary unregistered folders. The agent must establish provenance and completely inspect exact disposable paths before removing them and retrying; uncertain or valuable contents stay preserved. Canonical native task paths are required; relocated/unknown lanes receive a retention reason. There is no process registry, distributed lease, or concurrency fence; current checks plus Git native protection and traffic-control ownership are relied on. Packet namespace discovery conservatively retains when metadata cannot be identified safely, rather than guessing at ownership. No full suite, build, dependency, network or deployment checks ran.

A first focused run caught branch deletion using the primary checkout instead of the secondary recorded integration checkout; the worker corrected it and the hook/secondary fixture passed. A newer-tip fixture initially used ff-only after creating intentional divergence; its fixture merge was corrected. These failed attempts are not completion evidence.

Safe retry after this task is actually approved/integrated and closeout is finished: `node bin/hai-harness.mjs worktree cleanup task/task-cleanup --target /Users/claudiusma/Documents/ProductLab/HAI-Harness`. Run only after local integration and the committed-state packet acknowledgment. Writer slot released to Claudia; Human closeout is now complete.

## Independent review fixes — 2026-10-06

Julius confirmed two P2 defects in the initially frozen implementation. Augustus corrected both in the same assigned lane and source is frozen again for recheck:

1. Packet discovery now selects the current task incarnation by **branch plus recorded base** before checking its integration/scope/hash and closeout contents. Same-slug historical packet files remain preserved but no longer block cleanup for a later incarnation. Invalid same-branch base metadata still fails closed.
2. Current packet cleanup requires exactly one `## Drafts` inbox section and exactly one `## Entries` trail section before checking for empty drafts or uncaptured entries. Missing and duplicate required sections retain the lane/branch and packet with a precise reason.

Regression command: `node --test --test-name-pattern='cleanup selects current packet|cleanup fails closed|cleanup retains current-task|physical common metadata' test/hai-harness.test.mjs` — **4 passed, 0 failed**, 11.7 seconds. The new fixtures perform first-incarnation cleanup, recreate the same slug at a new base, preserve current pending decisions, clean the second incarnation after resolution, and verify all historical packet files are byte-preserved. Malformed-section fixtures verify approve preserves pending work under `## Draft`, explicit cleanup retains missing/duplicate Drafts and Entries sections with unresolved content, and normal cleanup resumes after repair.

`./hai-meta sync` reran successfully; **all 59 outer files matched pre-sync SHA-256 hashes**, including current planning, task contracts and reviewer task. Snapshot: `/tmp/hai-cleanup-review-preservation.json`. `node --check bin/hai-harness.mjs` and `git diff --check` passed. No stable instruction changes were required for these two code fixes, so the previous observable instruction replay remains the applicable scoped closeout evidence. No commit/integration/outward act occurred. Writer slot released for independent reviewer recheck.

## Independent review and controller closeout

Fresh Julius inspected the intended diff, untracked contract/evidence, cleanup callers, identity and Git protections, packet discovery/capture, focused tests, completion semantics and outer mirror parity. Independent first pass ran 7 focused fixtures, syntax/diff checks and four mirror comparisons successfully; isolated reproductions found two P2 issues. The producing Augustus corrected reused-slug historical-packet blocking and malformed-inbox cleanup bypass, added regressions, synced methods and re-froze source. Julius independently re-ran the 4 affected fixtures (4 passed, 0 failed), syntax and whitespace checks and reported both findings resolved with no new actionable findings. Review was read-only throughout.

Limits remain scoped: no full suite, actual deployment/outward workflow, Windows/submodule or concurrent-mutation replay. The process replay is an enacted isolated fixture, not a general model-adherence benchmark. Git native protections, explicit ownership checks and traffic-control remain the concurrency boundary; no registry, process scanner or distributed lease was added.

Claudia confirmed primary `main` remains clean at `3a7bdbb`; this is the only task lane and no active source writer remains. Automatic cleanup is deliberately not run for this unfinished lane: its source is uncommitted/unmerged, and the following decision batch is pending. Implementation authorization is fulfilled; local commit/merge, push and publication were not inferred.

Human closeout draft (from T1): Routine task cleanup is part of verified task completion and does not require separate cleanup approval. Stop task-owned previews and clean merged local task resources after the requested workflow is complete; preserve unfinished work and uncertain ownership. Target: outer `Human/decisions.md`. No Human write occurred. The task packet and lane stay retained until the user approves or defers/drops the batch and separately authorizes local integration.

## Approved local closeout — 2026-10-06

User replied "approve" to the exact decision batch and local commit/merge question. This authorizes the displayed decision and local integration only. Augustus, assigned human-scribe writer, appended the decision once to outer `.hai/Human/decisions.md` with the approved fields, preserving the exact prior log bytes and Version: current header. After successful verification he removed only the approved from-T1 draft; the capture cursor, other inbox bytes, trail and packet.json were unchanged. Whitespace checks passed. This closes the earlier pending batch and integration authorization statements as historical pre-approval evidence.

Traffic remains CLEAR: primary clean at the same `3a7bdbb`, this is the only task lane, reviewed product source unchanged, no overlapping active HAI-Harness peer or source writer. No task-owned preview remains; tests owned their isolated processes and completed teardown. Integration uses `worktree approve --keep-worktree --approved "Complete automatic task cleanup"` so the controller can acknowledge the committed packet state. Then `worktree cleanup task/task-cleanup` runs from the surviving primary checkout without another cleanup prompt. The native command receipt and Git merge history provide the exact completion hashes; no remote act is authorized. Physical task packet remains in Git common metadata after lane removal.
