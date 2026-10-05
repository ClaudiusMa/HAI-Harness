# Human-sync migration release

Date: 2026-10-05
Controller: Claudia
Status: source committed and published; stable release awaits required GitHub reviews.

## Accepted scope and supersession

The user selected migration of human-sync and removal of superseded storage, then authorized commit, release and clean checkouts. Task-owned Git-common metadata replaces provisional Agents trail/inbox storage. Confirmed rationale is recorded in the isolated accepted candidate's Human decisions with the changes. Earlier Agents-storage instructions are superseded; compatible filtering, cursor, batch review, approved writing and attribution remain.

## Delivered behavior

Explicit initialization, verified legacy migration, task identity isolation, read-only capture/status, exact traced-state acknowledgment, doctor drift warnings and private checkpoint export are implemented. Init/update do not install runtime trail/inbox history into Agents. Blank packet templates ship under scaffold. Packets survive approval cleanup; record identity and export before retiring a lane. Git push does not transfer private packets; checkpoint import is not implemented.

## Verification

Eight focused CLI/installer/update tests passed. A reviewer found a legacy parent-directory symlink escape; the worker fixed it, three affected tests passed, and the independent original reproduction now refuses without changing external files. Source syntax, diff checks, package boundary (44 files), method links and stable mirror parity passed. Outer sync preserved 21 protected project records.

Two fresh agents executed a short same-lane handoff replay. Approved fictional D1 reached Human once with its accepted page change; duplicate retry was a no-op. Deferred D0 and unfinished work survived. Read-only capture/status/doctor preserved packet bytes. Independent artifact and Git review passed.

The replay exercised an already-captured draft, not novel filtering; filtering has focused test coverage. Its ordinary migration preceded the final parent-symlink guard; that fix has separate regression and independent reproduction evidence. This is a directed fixture, not a model benchmark or distributed enforcement test.

## Remaining scope

Automatic session attachment, main submission queues, distributed leases, generation fencing, host write prevention and cross-host recovery remain pending. No first Human backfill batch is approved. Unrelated unpublished local role/host-root history is preserved separately and excluded from this release. No private field diagnosis is published.

## Publication and clean checkout

Reviewed task commit: 6bfb2152386cf13b272fdda9b46be3f70343b985. Accepted source merge: d654b7fa468d0efb9628e499b26a6eadfa9672e5, verified on origin/main. All 22 source hashes match the frozen reviewed tree. The old task worktree is removed; its private packet and recovery checkpoint survive. Primary main is clean; unrelated local history is retained on a separate branch.

[Release PR #17](https://github.com/ClaudiusMa/HAI-Harness/pull/17) changes only package.json and release.json to v0.2.5. Five focused checks passed against that versioned candidate. GitHub rejected normal merge because main requires two approving reviews; none were present. Auto-merge is disabled. No administrator bypass was used. The stable tag/release remains pending reviews and PR merge; it has not been published.
