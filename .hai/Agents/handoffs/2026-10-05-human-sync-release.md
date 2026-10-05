# Human-sync migration release

Date: 2026-10-05
Controller: Claudia
Status: verified; authorized commit and release in progress.

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
