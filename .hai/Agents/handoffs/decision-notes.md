# Handoff - decision-notes

Last updated: 2026-11-23
From: builder subagent (no HAI role) for the master session
To: master session (independent review and behavior replay)

## Status

- Done: Change 1 (packet at `worktree create`, quiet `init` on a valid packet, `human-sync note`, doctor message, no cleanup line for an empty packet), Change 2 (`Agents/planning.md` no longer traced, duty rewritten), Change 3 (content-only drift with old-basis compatibility), docs, rule inventory, tests, shipped hashes, `./hai-meta sync`, by-hand run, commit in the lane.
- Not done (not mine): the decision entry and `Human/decisions.md` draft narrowing the 2026-09-30 decision; behavior replay; review; merge.

## Files changed

- `bin/hai-harness.mjs`
  - `tracedPaths` drops `Agents/planning.md`. An older packet's planning hash stays in its stored `paths` (its digest still matches) and is ignored.
  - New constants `contentBasis`, `noteFlags`, `noteOrigins`, `noteAreas` (placed above `main()`, since `main()` runs at module load).
  - `tracedSnapshot(root, basis = "content")` hashes `{ files }` only and returns `basis: "content"`; `tracedSnapshot(root, "legacy")` is the old `{ commit, index, files }` hash, used only to compare a packet that has no `acknowledged.basis`. `driftedPaths` picks the comparison basis; `readPacket` refuses any basis other than absent or `"content"`.
  - `initPacket(lane, { migrate })` is the extracted init logic (unchanged behavior). Legacy files without `--migrate` throw an error marked `legacy`, and the message now carries the exact `init --migrate --target` command.
  - `human-sync init` without `--migrate` on an existing directory: a packet `readPacket` accepts prints `Task packet already exists: <path>. Nothing changed.` and exits 0; anything else refuses with the old message. `--migrate` on an existing packet refuses as before.
  - `human-sync note` (`noteFields`, `noteCommand`, `localDate`). Flags validated before anything is read or written; packet created first when the lane has none (`Task packet initialized (this lane had none): ...`); then prefix guard, section guard, naming rule, append, re-check, save.
  - New flags parsed in `parseOptions`; `--change/--why/--origin/--area/--applies` refused on every other action ("... require note"); `--through/--head/--snapshot` and `--migrate`/`--output` guards unchanged and also apply to `note`.
  - `acknowledge` compares through `driftedPaths` and records the content basis. `status` and `checkpoint` report the content snapshot.
  - Doctor drift warning: `Changed with no new entry: <paths>. Record why: <cli> human-sync note --change "<what changed in <paths>>" --why "<reason>" --origin user|agent --area product|design|process|code`. Missing-packet message adds "human-sync note also creates it."
  - `createWorktree` prints one packet line from `createLanePacket` between the lane details and the preview line. `cleanupWorktree` prints `Task packet retained` only when `packetIsEmpty` is false. Usage text lists `note`.
- `test/hai-harness.test.mjs`: see Verification.
- `Agents/skills/human-scribe/SKILL.md`: "Packet adoption and discovery" and "Sources and trace duty" replaced by "Packet and discovery" and "When to record, and how" (owning place of the new duty, the naming rule, Origin, the content basis and what it gives up, the manual form, one writer, capture sources). Closeout: no capture for a lane with no entries or drafts; reflections use `--applies`. 1,875 to 1,759 words.
- `Agents/onboarding.md` Records, Decision trail: new duty, points to human-scribe (50 to 49 words).
- `Agents/claudia.md`: Record line (plan record needs no entry; note only for a real decision); closeout line (no capture for an empty lane).
- `Agents/athena.md`, `Agents/hephaestus.md`: write scope and Decision Capture use `human-sync note`.
- `Agents/lanes.md` closeout step 6: packet path only when it holds entries or drafts.
- `Agents/skills/decision-logger/SKILL.md`: "notes" added to the things that never approve a Human entry.
- `README.md` "Keeping Human/ current": new flow, 399 to 396 words. `CONTRIBUTING.md` step 4: "Record task-packet notes (`human-sync note`)".
- `Agents/momus.md`: checked, unchanged ("traces incident decisions through human-scribe" still reads correctly).
- `.hai/evals/assumptions.json`: R050, R052, R053, R054 changed (owner origin, notes); R051, R129 locations; new R132 (`note`), R133 (packet at lane creation, quiet cleanup), R134 (content basis, origin master session). Counts 71 merged, 32 kept, 16 changed, 6 removed, 9 new (134). Header `lane`/`base` updated.
- Generated: `scaffold/shipped-hashes.json` (40 paths, 262 hashes); `.hai/Agents/` mirrors via `./hai-meta sync` (8 files). `.hai/.hai-harness.json` was created by sync, untracked and ignored, and removed.
- This lane's contract `.hai/Agents/tasks/decision-notes.md` is committed with the work, as earlier contracts are.

## Design choices the contract did not fix

- **Section guard in `note`.** It refuses unless the trail has exactly one `## Entries` heading and it is the last `## ` section. Appending at the end of any other shape would put the entry where `parseTrailEntries` and capture cannot see it; cleanup already requires exactly one such section. Every packet the CLI creates or migrates from the shipped template satisfies it.
- **Numbering scans the whole trail** (comments stripped) for `### T<n>` headings, which is at least the `## Entries` maximum `acknowledge` uses, so a note id is always accepted by the manual form too.
- **Entry spacing.** A blank line separates the entry from what precedes it (`\n` added when the trail ends with a newline, `\n\n` when it does not); the entry ends with a newline.
- **Exact values.** Origin and area must be exactly `user|agent` and `product|design|process|code` after trimming (no case folding). An empty string is already refused by the option parser ("requires a value"); whitespace-only is refused as empty.
- **Closeout wording** comes from `captureKind`: `decision` gives "At closeout it becomes a decision draft for the user's log."; the open-question kind gives "At closeout it becomes an open question for the user (Agents assumed ... Confirm or change?)."; agent/code gives "It stays in the trail only."; an `--applies approved ...` entry gives "It reflects an approved item; closeout drafts nothing."
- **Empty packet** for cleanup means: exactly one `## Entries` and one `## Drafts` section, no `###` heading in either, no `Status: pending|deferred` line, and cursor `none`. Anything unreadable or malformed counts as not empty, so the existing refusal cases still print the line before they refuse.
- **`worktree create` scope mapping** uses `realpath` on both the primary Git root and `harnessRootFor(target)`. A mapped root outside the primary, or any packet error, prints `No task packet: <reason> The lane stays; to create it: <cli> human-sync init --target <dir>`; legacy files print `No task packet: legacy Agents/decision-trail.md or Agents/human-inbox.md is in the lane. To adopt it: <cli> human-sync init --migrate --target <dir>`. Exit status stays 0 because the lane was created.
- **`note` on a partial packet** (directory present, `packet.json` missing) refuses with "Missing task packet" rather than recreating it; only an absent directory is created.
- **Acknowledge recheck** compares the content snapshot only (plus HEAD and the trail bytes), not the old-basis one; a commit during the command changes HEAD and is caught that way.
- **Commit attribution.** The contract asks for `Co-Authored-By: Claude Fable 5.2`; the session's attribution instruction names Claude Opus 5.5, the model that did the work, so the commit uses that line. Change it if the contract's line was meant.

## What the content basis gives up

A traced file that was changed, committed, and then returned to the acknowledged content no longer needs an entry. Traced files changed by merging `main` into the lane still read as drift and are named in one note.

## Verification

- `npm test`: `ℹ tests 57`, `ℹ pass 57`, `ℹ fail 0` (50 before; 7 new tests).
- `node --test .hai/evals/test/calibrate.test.mjs`: `ℹ tests 16`, `ℹ pass 16`, `ℹ fail 0`.
- `git diff --check`: clean. `./hai-meta doctor` before the by-hand note: only `Missing task packet ...; human-sync note also creates it.` (this lane was made by the old CLI; the same warning existed before with the old wording).
- Word counts: worker path 2,198 / 2,200 (was 2,199); lead path 5,679 / 5,800 (was 5,652); human-scribe 1,759 (was 1,875). The word-budget test passes with unchanged limits.
- New tests: create makes a packet with `.hai` scope, status works at once, doctor has no missing-packet warning, `init` exits 0 with identical bytes, invalid packet and `--migrate` still refuse, a harness-less repository prints the no-Agents line, a nested harness gets scope `app/.hai`; create with legacy files keeps the lane, makes no packet, prints the migrate command, and `note` there refuses pointing to `init --migrate`; `note` writes a well-formed entry, advances `through`, `trail` and `basis`, clears doctor's drift, and capture lists it with the right kind (decision, open question, code, applies); refusals leave trail, inbox and `packet.json` byte-identical (unnamed path with the listed path and advice, bad origin, bad area, whitespace-only, multi-line why, multi-line applies, missing flag, `--through` on note, note flags on five other actions, edited prefix); numbering after hand entries T1, T5 gives T6 and after T9 with no final newline gives T10; `note` creates the packet in a lane with none, a partial packet refuses; old-basis packet with a planning hash (hashes built in the test with the old formula) stays readable, shows no drift, a plan edit is not drift, only the edited role reads as drift, the next note records `basis: "content"` without the planning key, and a later commit is not drift; content basis with both `acknowledge` and `note` (edit, record, stage, commit: no drift; edit again: drift); cleanup prints no packet line for an empty packet and still prints it and refuses with a pending draft; help lists `note`.
- Existing tests moved off `Agents/planning.md` to `Agents/project_context.md`; the committed-state re-acknowledgment test now asserts the opposite (staging and committing is not drift). The "isolates resumed tasks" test deletes the new lane's packet to simulate an older lane.

## By-hand run in this lane

```text
$ node bin/hai-harness.mjs human-sync note --target . --change "Agents/claudia.md, Agents/athena.md, Agents/hephaestus.md, Agents/onboarding.md, Agents/lanes.md, Agents/skills/human-scribe/SKILL.md: record why-entries with human-sync note; planning.md is no longer traced; empty packets need no closeout capture" --why "The owner chose options 1 and 2 together on 2026-11-23: one command per entry, and fewer entries because the plan is not traced" --origin user --area process
Task packet initialized (this lane had none): /Users/claudius/Documents/ProductLab/HAI-Harness/.git/hai-harness/tasks/3ea657c81e8fa25291bb42d295239c0b9c540cc79179cf3710c9323093c1e337
Recorded T1; no traced file changed.
At closeout it becomes a decision draft for the user's log. No Human item was approved.
```

"No traced file changed" is expected: the packet did not exist, so `note` created it with the lane's current state (my edits included) as baseline. `--target .` resolves to `.hai/`, so the traced files are the `.hai/Agents/` mirrors. `node bin/hai-harness.mjs doctor --target .` afterwards: no warnings (no drift, no missing packet). After committing the noted files it still reported no drift (content basis), run with the install receipt recreated by `./hai-meta sync` and then removed again; without the receipt doctor stops at `Missing: .hai/.hai-harness.json`, which is the expected state of a lane whose ignored receipt was removed. T1 is user/process, so this lane's closeout has one uncaptured decision for capture; `worktree cleanup` will refuse until it is captured.

## Unverified or open

- The `note` re-check failure path ("appended but not acknowledged") is not tested: I found no deterministic way to change the lane between the append and the re-check without a test-only hook. Reasoning: the entry is already in the trail, `packet.trail` and `acknowledged` are unchanged, so the prefix guard still holds; `status` plus `acknowledge --through T<n>` accepts the appended entry if it names every changed path. If the concurrent change touched an unnamed traced path, acknowledge refuses and a further note naming it is needed; the message does not say this.
- The trail append is a plain `writeFile`, not a temp-file rename; a crash mid-write could leave a truncated trail. `packet.json` is still written atomically.
- `worktree create` from an installed project's copy of the CLI is covered only through the existing project-copy test (the packet is now created there before the old `init` call, which now exits 0).
- Not run: any behavior replay with a model; `doctor` on a real kept lane after a `main` merge.

## Follow-up 1 (2026-11-23, review findings)

- Item 1, `bin/hai-harness.mjs` `noteFields`: any value containing `<!--` is refused before anything is written (`--<flag> must not contain "<!--"; write it in words.`). A value with `-->` alone is accepted.
- Item 2, `noteCommand`: the trail is written to `<trail>.<pid>.<timestamp>.tmp` in the packet directory with the trail's mode and flag `wx`, then renamed over the trail. Leftover `.tmp` files are never read: `validatePacketPaths` checks only the three packet names, and cleanup reads only those files.
- Item 3: the re-check failure message adds "If a traced file changed that T<n> does not name, record a new note naming it instead."
- Item 4, `createLanePacket`: when the packet already exists and reads as valid, it prints `Task packet continues an earlier lane with the same name and starting commit: <path>` and suggests nothing. When it exists and is invalid, it prints `No task packet: Task packet already exists; preserve it and use status or restore its checkpoint: <path>` with no `init` suggestion.
- Item 5: doctor prints `--origin "<user|agent>" --area "<product|design|process|code>"`, so an unedited paste reaches `note` and is refused there. The doctor test now matches the full quoted form.
- Item 6, `Agents/skills/human-scribe/SKILL.md`: one sentence on the baseline adopted when `note` or `init` creates a packet late. Two short sentences on using one CLI version per lane and packet: merge `main` after an update, and an older copy calling a newer packet invalid is a version mismatch. 1,822 words (under 1,875).
- Tests:
  - The refusal test covers `<!--` in `--change` and leaves the packet byte-identical.
  - New test: a note with `-->`, then another note, keeps T1 and T2 visible to capture, numbering continues, the trail mode is kept, and a planted leftover `.tmp` file is ignored.
  - New test: a lane re-created with the same name and base continues its packet, and `status` gives the same path. An invalid earlier packet gives the refusal without `init`, and its bytes are kept.
- Ran:
  - `node scripts/shipped-hashes.mjs` (40 paths, 264 hashes).
  - `./hai-meta sync` (2 updated).
  - `npm test`: `ℹ tests 59`, `ℹ pass 59`, `ℹ fail 0`.
  - `node --test .hai/evals/test/calibrate.test.mjs`: `ℹ tests 16`, `ℹ pass 16`, `ℹ fail 0`.
  - `git diff --check`: clean.
  - `./hai-meta doctor`: no warnings.
  - The sync-created `.hai/.hai-harness.json` was removed again.
- Word counts: worker path 2,198 / 2,200; lead path 5,679 / 5,800; human-scribe 1,822.
- The lane's task packet was not touched. Its T1 from the by-hand run still awaits closeout.
- Unverified:
  - The re-check failure path is still untested; it cannot be triggered deterministically.
  - A crash between the temp write and the rename is reasoned about, not tested. The trail stays at its old content, which is what makes it safe.
  - `savePacket`'s own temporary name is still `<packet.json>.<pid>.tmp` with `wx`. A leftover from a crashed process with the same pid would make a later save refuse. That was outside these six items, so it is left as it was.

## Follow-up 2 (2026-11-23, closeout without hand edits)

### Changes by file

- `bin/hai-harness.mjs`
  - New actions `draft` and `resolve` (`draftCommand`, `resolveCommand`) and their helpers:
    - `draftSource` validates all flags before the packet is read.
    - `inboxDrafts` parses `## Drafts` with raw line ranges.
    - `capturedThrough` computes the cursor rule.
    - `setCaptureCursor` rewrites the cursor line.
    - `writePacketFile` does the atomic temp-and-rename write, now shared with `note`.
  - `singleLine` holds the trim, single-line and no-`<!--` rule, shared by `note`, `draft` and `resolve`.
  - `draftKinds` maps each kind to its heading spelling and Human target.
  - New flags `--from`, `--kind`, `--as`, `--text`. On other actions they are refused with "--from, --kind and --text require draft or resolve." or "--as requires resolve."
  - Capture's closing guidance:
    - Nothing kept: `Next: nothing needs doing.`
    - Entries listed: `Next: record a draft for each entry, in order: <cli> human-sync draft --from T<n> --kind "<decision|open-question|brief|reflection|readme>" --text "<draft>". The cursor moves as drafts are recorded.`
    - A malformed heading listed: the same line, prefixed with "number the malformed trail heading by hand first, then".
  - Usage text lists both commands.
- `test/hai-harness.test.mjs`
  - Five new tests: draft kinds/cursor/planning/cleanup refusal; draft refusals; resolve; the end-to-end closeout; mixed hand and command drafts. The resolve test also checks capture stays byte-for-byte read-only.
  - Two existing assertions changed from "Captured through: T<n>" guidance to "nothing needs doing". The malformed-heading test checks the new guidance.
- `Agents/skills/human-scribe/SKILL.md`
  - Capture steps 2 to 4 use `draft`; step 5 is gone.
  - Closeout batch uses `resolve` (writer first, then resolve) and says hand edits remain valid.
  - Writer: "Resolve approved drafts only after successful candidate writes".
- `README.md` "Keeping Human/ current": the capture paragraph names `draft` and `resolve` (396 to 394 words).
- `.hai/evals/assumptions.json`: R053 changed; new R135 (`draft`, safety) and R136 (`resolve`). Counts 71/32/16/6/11, 136 rules.
- Generated: `scaffold/shipped-hashes.json` (40 paths, 266 hashes) and two `.hai/` mirrors.

### Choices this section did not fix, and why

- **Draft matching.** A draft counts when its heading reads `<kind> · from T<n>` or `from planning.md`/`planning`, backticks allowed. Kind is compared case-insensitively. That is enough for hand drafts written from the template.
- **Order check.** It walks the entries after the cursor in trail order, up to the source entry. A source at or before the cursor (a second kind for an already captured entry, such as a brief) is never blocked. A source that capture drops (agent/code) may still be drafted.
- **Comments.** `draft` and `resolve` refuse when there is any `<!--` under `## Drafts`. They work on raw lines, and a stray comment there could hide or misplace a block.
- **Ambiguous resolve.** If more than one draft matches the source and kind (only possible by hand), `resolve` refuses and says to resolve by hand.
- **Deferring a statusless hand draft.** `resolve --as deferred` on a hand draft with no `- Status:` line inserts `- Status: deferred` after its heading.
- **Resolved record.** Shape is `{ source, kind (heading spelling), outcome, draft (the `- Draft:` value or null), text (only with --text), recordedAt }`. A `resolved` key that is present but not an array refuses. `packet.json` is saved before the inbox is rewritten.
- **Messages.**
  - Approved: "Approved: <Target> must carry it in the lane; if the writer has not written it yet, they still have to." The target comes from the draft's own Target line, or from the kind. The skill has the writer write first, so this wording covers both orders.
  - Dropped: "Dropped: the draft left the inbox; its trail entry remains."
  - Deferred: "Deferred: it stays in the inbox and is raised at the next intake; cleanup keeps the lane until it is resolved."
- **Cursor line.** It is rewritten with the regex `readCaptureCursor` uses and then verified with `readCaptureCursor`. If they disagree (a commented-out cursor line first), nothing is written.

### Disagreement

- **One planning draft per kind.** "Refuse a draft whose kind and source already have a draft" means `--from planning` allows only one draft of each kind at a time. Two open `Decision needed from user` items cannot both be drafted as open questions by command, and the skill still says to draft each item. I built it as specified. The workaround is a hand draft, or resolving the first before drafting the second. A fix would be an item label in the planning source; that needs your decision.

### Compatibility check (run by hand in a scratch repository, then deleted)

- A packet with a `resolved` record (note, draft, `resolve --as deferred`) is read by the `690c36b` CLI: `status` and capture work.
- The `1889954` CLI (before this task) refuses it as "Invalid task packet". The cause is Change 2, not `resolved`: packets made without the `Agents/planning.md` hash fail that CLI's path check, as any packet from this lane does. This is the version mismatch the skill now describes. Its `readPacket` has no check on extra keys.

### Verification

- `npm test`: `ℹ tests 64`, `ℹ pass 64`, `ℹ fail 0`.
- `node --test .hai/evals/test/calibrate.test.mjs`: `ℹ tests 16`, `ℹ pass 16`, `ℹ fail 0`.
- `git diff --check` clean; `./hai-meta doctor`: no warnings. `.hai/.hai-harness.json` was created by sync and removed.
- Word counts: worker path 2,198 / 2,200; lead path 5,679 / 5,800; human-scribe 1,817 (at or below 1,822).
- This lane's own packet was not touched.

### Unverified

- Crash windows: between saving the `resolved` record and rewriting the inbox, a crash leaves a record with the draft still present. A retry then appends a second record.
- Atomic writes are reasoned about, not crash-tested.

## Follow-up 3 (2026-11-23, second review and replay findings)

### Changes by file

- `bin/hai-harness.mjs`
  - Item 1:
    - New shared check `orderProblem`: every `###` under `## Entries` must be `### T<n>`, with ids strictly increasing in file order.
    - New `trailOrderAdvice` says whether the first problem lies after the acknowledged prefix (fixable by hand, numbered as the next free number) or inside it (capture by hand).
    - `draft` refuses on any problem in the whole trail.
    - `capturedThrough` no longer depends on file order: it stays below the smallest undrafted kept id after the cursor, and does not move while an unnumbered heading is after the cursor.
    - Cleanup refuses "Task packet trail entries are out of order or duplicated; needs review: <dir>".
    - Capture prints one `Warning:` line for such a trail and stays read-only. Its Next line either says to number the heading as the warning says, or, for a problem inside the acknowledged trail, says to capture the lane by hand.
  - Item 2:
    - `singleLine` refuses `-->` as well as `<!--`.
    - `note` refuses when the trail holds an unclosed `<!--`; `draft` refuses when the trail or the inbox does.
    - Cleanup refuses "Task packet <file> has an unclosed "<!--"; needs review".
  - Item 3: `note` refuses, writing nothing, while the part after the acknowledged prefix has an unnumbered heading or a non-increasing id ("It is not acknowledged yet: number it by hand as T<k>, then run note again."). Problems inside the prefix do not stop `note`.
  - Item 4: the cursor regex matches only spaces and tabs around the value, so the following blank line (and a CRLF `\r`) survive.
  - Item 5: `draft --from T<n>` refuses when `packet.resolved` holds the same source and kind as approved or dropped ("If something changed, record a new note and draft that."). This does not apply to planning sources.
  - Item 6:
    - `--from planning#<n>` (n from 1) works in `draft` and `resolve`, written as `from planning.md#<n>`.
    - Plain `planning` still works and matches a hand-written `from planning.md`.
    - The usage text shows `planning[#<n>]`.
  - Item 7: approved now prints "Recorded as approved. This command wrote nothing to Human/; the entry belongs in <target> in this lane before the merge."
- `Agents/lanes.md` step 3: "Only when `approve` kept the lane: ...".
- `Agents/skills/human-scribe/SKILL.md`:
  - Capture step 2: what to do with an unnumbered or out-of-order heading.
  - Step 3: resolved sources refuse too.
  - Step 4: `planning#<n>`.
  - The closeout bullet shows `T<n>|planning#<n>`.
  - Two trims to stay under the limit (step 3 wording; the cursor detail in the capture-sources sentence).
- `test/hai-harness.test.mjs`:
  - New: both review cases (out of file order, duplicate): `draft` refuses from every source with bytes unchanged, capture warns and writes nothing, and with the cursor set by hand cleanup refuses.
  - New: comment markers. `-->` and `<!--` are refused in values; with an opener in place `note` and `draft` refuse; cleanup refuses for both the trail and the inbox. The atomic-write and leftover-temp checks are kept. This replaces the weak `-->` test.
  - New: `note` with an unacknowledged unnumbered heading refuses, then works after numbering it. With an acknowledged unnumbered heading, `note` works, while `draft` and capture point to the manual form.
  - New: the inbox differs only in the cursor line and the appended block; a resolved source refuses; `planning#1` and `planning#2` are both drafted and resolved; plain planning sources can be drafted again.
  - Updated: the malformed-heading capture guidance, the old unnumbered-heading draft message, the approved message.
- `.hai/evals/assumptions.json`: R132, R135 and R136 rules rewritten; notes added to R053 and R072. Counts unchanged (136 rules).
- Generated: `scaffold/shipped-hashes.json` (40 paths, 269 hashes) and 3 `.hai/` mirror files.

### Choices this section did not fix

- **The "next number"** in the advice is the highest `### T<n>` in the whole trail plus one.
- **Which heading is named:** the first offender after the acknowledged prefix if there is one, otherwise the first in the whole trail.
- **If the trail no longer starts with `packet.trail`,** the advice is treated as "inside the acknowledged trail" (capture by hand). That is the conservative reading.
- **`draft` checks the inbox for an unclosed comment too,** not only the trail. A hidden draft or cursor line there would also break the property.
- **Cleanup's order check ignores unnumbered headings.** Those are already "review" items for capture, and the spec names only numbered ids.

### Gap I could not close without stranding lanes

- **Hidden unnumbered heading at cleanup.** An unnumbered heading placed before the cursor's entry in file order is hidden from the uncaptured check (pre-existing behaviour of `entriesAfterCursor`). Cleanup can then pass with a hand-set cursor.
- **Why not refuse:** refusing every unnumbered heading at cleanup would block lanes that took the documented manual-capture route for an acknowledged unnumbered heading.
- **What the commands do:** `draft` refuses such a trail, so the commands themselves never move the cursor past it. A hand-moved cursor can still pass it.
- **Needs a decision:** whether cleanup should refuse this case too.

### Verification

- `npm test`: `ℹ tests 67`, `ℹ pass 67`, `ℹ fail 0`.
- `node --test .hai/evals/test/calibrate.test.mjs`: `ℹ tests 16`, `ℹ pass 16`, `ℹ fail 0`.
- `git diff --check` clean.
- `./hai-meta doctor`: no warnings. The sync-created receipt was removed.
- Word counts: worker path 2,198 / 2,200; lead path 5,679 to 5,685 / 5,800; human-scribe 1,815 (at or below 1,822).
- This lane's own packet and `Human/` were not touched.

### Unverified

- CRLF inboxes are covered by the regex change only, not by a test.
- The crash-window and atomic-write notes from Follow-up 2 still apply.

## Follow-up 4 — re-check of the second review (2026-11-23, master session)

The reviewer re-ran every reproduction against `eb5eac7`: findings 1 (both variants), 2, 3, 4 and 6 are closed and 5 is closed for trail sources. It found one more should-fix and two minor points, which the master session fixed directly (no builder round):

- **`draft` now checks the acknowledged prefix, as `note` does.** Before, an acknowledged entry could be hand-edited to look like an agent code entry, a draft from an earlier entry would carry the cursor past it, and restoring the entry left it captured without a draft. `draft` now refuses with the message `note` uses, writing nothing. `doctor` also reports a trail that no longer begins with its acknowledged entries (a warning; it does not block).
- **Dropping a planning draft** no longer says "its trail entry remains".
- **Capture** prints a warning when the trail or inbox holds an unclosed `<!--`. It still writes nothing.
- One new test covers all three, using the reviewer's reproduction. R135 in the rule inventory names the new refusal.

Decisions by the master session on what the reviews left open:

- **Accepted limit:** an unnumbered heading placed before the cursor's entry, together with a cursor moved by hand, is still hidden from cleanup. The commands never move the cursor there, the state needs two hand edits, and it exists on main today. Cleanup was not made stricter because that would strand older lanes that numbered a heading by hand, which the previous guidance told them to do.
- **Left as they are:** a planning source can be drafted again after it was dropped, and `draft` accepts an entry capture drops. Both only add items for the user to see.
- **Not tested:** re-creating a lane with the same name and base but a different integration branch; concurrent writers (the docs rely on one writer per lane).

Replays on clean installs, verified by the master session in the folders afterwards:

- Routine fix ("the date test is failing, fix it"): go-ahead, fix, merge, lane removed, with no packet command at all.
- Request carrying a lasting decision (house date format), before the closeout commands: one `note`; the hand edit of the cursor was blocked by the host's permission check and the lane stayed after the merge. This is what Follow-up 2 fixes.
- The same request after Follow-up 2: `note`, `draft`, the owner's edited approval recorded with `resolve --text`, the entry written to the decision log, merge, lane removed. No hand edit outside tracked files.
- Upgrade: a lane and packet made by the previous version stay readable after `update`; plan edits are not drift; only the three role docs the update changed were reported, and one note cleared them.
