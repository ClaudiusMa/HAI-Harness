# Task contract — decision-notes

Written 2026-11-23 by the master session (plain assistant, no HAI role) for one builder subagent.
Lane: `/Users/claudius/Documents/ProductLab/_worktrees/HAI-Harness/decision-notes` (branch `task/decision-notes`, base `1889954`). No other agent is writing in this repository. Work only in this lane. Do not push, merge, or run `worktree approve`.

## The owner's words (verbatim)

2026-11-23. The master session described what an agent does today for every plan edit (create the packet, find its folder inside Git's metadata, hand-write a numbered entry, ask the CLI for the lane's state, copy two hashes back into an acknowledge command) and offered three options:

> 1. One command per entry. Creating a lane also creates the packet. A new `human-sync note` command writes the numbered entry and acknowledges it in one step. Keeps: the agent still writes the why and who it came from; the CLI still refuses unless the entry names every traced file that changed; the trail stays append-only; you still approve everything that reaches `Human/`. Gives up: copying the hashes back.
> 2. Fewer entries. The plan stops being a traced file. An entry is needed only when durable truth changes (project context, design guide, design contracts, role docs) or when the agent records a real decision of yours. Keeps: every durable change still has a why; the plan entry still carries your exact words and go-ahead. Gives up: the install check no longer flags a plan edit that has no entry; a decision written only in the plan reaches your log only if the agent notes it.
> 3. Record once, at merge.

Asked "Which bookkeeping design should I build: options 1 and 2 together, or only option 1?", the owner answered:

> 1 and 2 together

Standing direction (2026-11-22): the harness "was built from the less intelligent model", it should "work well with the lates model inteligentce", and "when model get smarter the harenss dont limit it".

## Background

Replays on clean installs showed the weight: five packet commands for a one-line change, with one failing on the first try. Two things caused it. Recording any request in `planning.md` counted as a traced change, so every request needed an entry. And each entry took a hand edit inside the Git common directory plus a two-command hash handshake. A third cause sits underneath: the drift check hashes the last touching commit and the index as well as file content, so noting a change and then committing it reads as new drift and demands a second entry.

Read first: `bin/hai-harness.mjs` (constants near `packetTemplates`, `tracedPaths`, `laterTracedPaths`; `taskPacket`, `readPacket`, `tracedSnapshot`, `savePacket`, `humanSyncCommand`, `humanSyncWarnings`, `humanSync`, `captureKind`, `createWorktree`, the packet loop in worktree cleanup, the `usage` text), the human-sync tests in `test/hai-harness.test.mjs` (from `makePacketFixture` on), `Agents/skills/human-scribe/SKILL.md`, `Agents/onboarding.md` (Records), `Agents/claudia.md`, `Agents/athena.md` and `Agents/hephaestus.md` (Decision Capture and write scope), `Agents/momus.md`, `Agents/lanes.md`, `README.md` ("Keeping Human/ current"), `.hai/evals/assumptions.json` (rules R050 to R054 and any other that mentions the trail or packets), and `.hai/Agents/handoffs/role-fixes.md`. `README.md` and `CONTRIBUTING.md` explain the source-to-`.hai/` workflow.

## Change 1 — one command per entry

### 1a. `worktree create` creates the packet

After the lane and its branch metadata exist, `worktree create` initializes the task packet for the lane, so its baseline is the lane's starting state.

- Scope: the harness root the command was run against, mapped into the new lane. Resolve the primary's harness root the way `human-sync` does (`harnessRootFor` on the resolved target), take its path relative to the primary's Git root, and apply that relative path inside the new lane. Do not assume the project root is the Git root.
- Reuse the existing init logic; extract it into a function rather than copying it.
- Create the packet only when the mapped harness root in the lane has an `Agents` directory. Otherwise skip it and print one line saying so.
- A packet failure never undoes the lane. If legacy `Agents/decision-trail.md` or `Agents/human-inbox.md` files are present in the lane, create no packet and print the exact `human-sync init --migrate` command. Any other failure: print the reason and the `human-sync init` command; the lane stays.
- Print one line when the packet is created.

### 1b. `human-sync init` on an existing packet

`human-sync init` (without `--migrate`) on a lane whose packet already exists and reads as valid exits 0, changes nothing, and prints that the packet already exists with its path. An invalid or partial packet refuses as today. `--migrate` with an existing packet refuses as today. Reason: older docs and habits call `init` first, and that first command should no longer fail.

### 1c. New action `human-sync note`

```
human-sync note --change <text> --why <text> --origin user|agent --area product|design|process|code [--applies <text>] [--target <dir>]
```

One step that appends the next numbered entry to the packet's `decision-trail.md` and acknowledges the current traced state.

- **Packet.** Runs in a recognized task lane only (the existing `taskPacket` rules). If the lane has no packet (a lane made by an older CLI), create it first with the same init logic and say so in one line; legacy files still refuse and point to `init --migrate`.
- **Validation before any write.** `--change`, `--why`, `--origin`, `--area` are required. Each value is trimmed, must be non-empty and must be a single line (refuse a value containing a line break; do not silently join lines). Origin and area must be one of the listed values. `--applies` is optional, single line. The current trail must still begin with the packet's recorded trail (the same unchanged-prefix guard `acknowledge` has).
- **The naming rule stays.** Compute which traced paths changed since the last acknowledgment. If `--change` does not contain every one of them, refuse, write nothing, and list the missing paths in the error together with what to do: name them in `--change` if this note covers them; if someone else changed them, that writer records their note first.
- **Numbering.** The new id is one more than the highest numbered entry anywhere in the trail (hand-appended entries included). The date is today's local date as `YYYY-MM-DD`.
- **Write.** Append the entry in the template's format (`### T<n>`, `- Date:`, `- Change:`, `- Why:`, `- Origin:`, `- Area:`, and `- Applies:` only when given), keeping the file well-formed for `parseTrailEntries` whether or not the trail currently ends with a newline. Then re-check that the lane state did not change during the command (as `acknowledge` does) and save the packet with the new acknowledged snapshot, `through`, and trail. If the re-check fails, say the entry was appended but not acknowledged and that running `note` again is not needed: `status` then `acknowledge --through T<n>` finishes it. Keep that failure path simple and tested if you can produce it deterministically; otherwise reason about it in the handoff.
- **Output.** One or two lines: the entry id, the traced paths it acknowledged (or "no traced file changed"), and "No Human item was approved." For Origin `user`, or Origin `agent` with Area product, design or process, add what happens to it at closeout, in the words `captureKind` implies (a decision draft for the user's log; an open question for the user). For agent/code say it stays in the trail only.
- A note with no changed traced path is valid: it records a decision that lives nowhere else.
- `status`, `acknowledge`, `capture` and `checkpoint` keep working exactly as now, apart from Changes 2 and 3 below. Hand-appending an entry stays valid.

Update the `usage` text, the option parser, and the `--through/--head/--snapshot require acknowledge` style guards so the new flags are refused on other actions.

### 1d. Messages that point at the old flow

- Doctor's drift warning ("Changed with no new entry: …") names the `human-sync note` command instead of "append … and explicitly acknowledge".
- "Missing task packet" keeps naming `human-sync init`, and may add that `note` creates it.

### 1e. An empty packet is not reported at cleanup

Every lane now has a packet from the start, so cleanup must not announce an empty one. In worktree cleanup, print "Task packet retained: …" only when the packet's trail has at least one entry heading or its inbox has a draft or a cursor other than none. An empty packet is left in place silently. Do not delete packets; that is deliberately out of scope. All existing cleanup refusals stay.

## Change 2 — the plan is no longer traced

- Remove `Agents/planning.md` from `tracedPaths`. Nothing else leaves the set.
- A packet written before this change still has a hash for `Agents/planning.md` in `acknowledged.paths`. It must stay readable (its stored digest still matches its stored paths), a plan edit must not read as drift, and the next `note` or `acknowledge` simply records the new, smaller set.
- The duty changes with it. New rule, to state once in its owning place and point to from the others:
  - A why-entry is recorded in the same change when `project_context.md`, `design.md`, `designs/` or a role doc (built-in or custom) changes, and when a decision is made that the user should see again: a product, design or process choice the user made or confirmed (Origin `user`), or one an agent assumed without asking (Origin `agent`).
  - Recording an ordinary request in `planning.md` needs no entry. The plan entry still carries the user's words and go-ahead.
  - A lane with no entries and no drafts needs no capture at closeout.
  - Workers still write none. The Origin rule (R051) is unchanged.
- This narrows the 2026-09-30 decision ("Agents record why each planning, design, or context change was made"). The master session writes the decision entry; you do not touch `Human/`.

## Change 3 — drift compares content, not commits

Today `tracedSnapshot` hashes, for each traced path, the last commit touching it, its index entry, and the physical files. So "edit, note, then `git add` or commit" reads as drift again, and in a kept lane the next unrelated note is refused until it names a file the agent already explained.

- New snapshots hash physical state only: the `files` list as now (path, kind, mode, content digest, symlink target, missing, directory). Drop the commit and the index from the hash.
- Compatibility: a packet acknowledged under the old basis must not light up every path as drift after upgrading. Record the basis in the packet (for example `acknowledged.basis: "content"`); a packet with no basis is compared using the old computation until its next `note` or `acknowledge`, which records the new one. Keep the old computation only for that comparison.
- `status` reports the snapshot under the basis the next acknowledgment will record, so the two-step form keeps working on both old and new packets.
- What this gives up, to state in the handoff and the skill in one sentence: a traced file that was changed, committed, and then returned to the acknowledged content no longer needs an entry.
- Traced files changed by merging `main` into the lane still read as drift and are named in one note ("merged from main"), as the skill says today.

This change was decided by the master session, not named by the owner. If you find it cannot be done cleanly, stop and report instead of working around it.

## Docs

Rewrite only what the changes touch, lean, in the style of the current core files. State each rule once in its owning place.

- `Agents/skills/human-scribe/SKILL.md` owns the method. Rewrite "Packet adoption and discovery" and "Sources and trace duty" around the new flow: the packet exists from lane creation; `note` is the way to record; when an entry is and is not needed; the naming rule; what Origin means. Keep in a short form: the legacy `init --migrate` path, the identity and scope facts, the one-writer rule, `status` + `acknowledge` as the manual form, checkpoint. Capture and closeout sections change only where they mention init, hand-appended entries, or the committed-state rule. The file is 1,875 words now; it should end clearly shorter.
- `Agents/onboarding.md` Records, "Decision trail": the new duty in no more words than the current line. The worker reading path is at 2,199 of 2,200 words; it must not grow.
- `Agents/claudia.md`: the Record line ("one bookkeeping pass with one trail entry") becomes a plan record with no entry; mention the note only for a real decision. Closeout: no capture for a lane with no entries and no drafts. Lead path must stay at or under 5,800 words (5,652 now).
- `Agents/athena.md`, `Agents/hephaestus.md`: their Decision Capture and write-scope lines use `human-sync note` instead of hand-appending. `Agents/momus.md`: check its line still reads correctly.
- `Agents/lanes.md` closeout: the final summary lists the task packet path only when the packet holds entries or drafts.
- `README.md` "Keeping Human/ current": the new flow; keep it the length it is or shorter.
- `.hai/evals/assumptions.json`: update R050, R052, R054 and any other rule this changes; add rules for anything new (`note`, packet at lane creation, content basis); keep the file's conventions (ids, kind, status, location, note).
- Anything else that states the old flow (search for `human-sync init`, `acknowledge`, `decision-trail`, "trail entry", "why-entry" across `Agents/`, `scaffold/`, `README.md`, `CONTRIBUTING.md`, `.hai/evals/`).

Do not change the go-ahead gate, the spec gate, approvals, lane rules, capture filtering (`captureKind`), the inbox format, or anything about how items reach `Human/`.

## Tests

Extend `test/hai-harness.test.mjs`; keep the existing human-sync tests meaningful rather than deleting them (several use `Agents/planning.md` as the traced file and one asserts the committed-state re-acknowledgment; move them to a still-traced file and to the new semantics).

- `worktree create` leaves a valid packet: `human-sync status` works at once in the new lane, and doctor there has no missing-packet warning. With the harness nested below the Git root, the packet has the nested scope.
- `worktree create` in a lane that carries legacy trail files creates the lane, creates no packet, and prints the migrate command.
- `init` on an existing valid packet exits 0 and changes no byte of the packet.
- `note` appends a well-formed entry and acknowledges: the packet's `through` and trail advance, doctor's drift warning is gone, `capture` lists the entry with the right kind.
- `note` refuses, writing nothing (trail and `packet.json` byte-identical): a changed traced path missing from `--change` (the error lists it); a bad origin or area; an empty or multi-line value; a missing required flag; a trail whose acknowledged prefix was edited; note flags on another action.
- Numbering continues after hand-appended entries and across gaps. A trail with and without a trailing newline both parse after a note.
- `note` in a lane with no packet creates it, then records.
- A plan edit alone is not drift; a note with no traced change succeeds.
- A packet from before this change (with the `Agents/planning.md` hash, old basis) stays readable; a plan edit is not drift; its other paths do not all read as drift; the next note records the new basis and set.
- Content basis: edit a traced file, note it, stage and commit it; no drift. Edit it again; drift.
- Cleanup prints no packet line for an empty packet and still prints it, and still refuses, in the existing cases.
- Help text lists `note`.
- The word-budget test still passes with its current limits.

## Mechanics and done

1. Source files are `Agents/`, `scaffold/`, `bin/`, `test/`, `README.md`. After changing any shipped core file: `node scripts/shipped-hashes.mjs`, then `./hai-meta sync`, so `.hai/Agents/` mirrors match.
2. `npm test` passes (it takes about 80 seconds; it was 50 of 50 before you started). `node --test .hai/evals/test/calibrate.test.mjs` passes (16 of 16). `git diff --check` is clean. `./hai-meta doctor` reports nothing new.
3. Try the real thing once in this lane, by hand: this lane was created by the old CLI, so it has no packet. After your build, run `node bin/hai-harness.mjs human-sync note …` here for the role docs you changed and paste the command and its output into the handoff. Then `node bin/hai-harness.mjs doctor --target .` and note what it says about drift.
4. Commit your work in the lane on `task/decision-notes` with a plain descriptive message ending with the line `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Remove `.hai/.hai-harness.json` only if `./hai-meta sync` created it and it is untracked and ignored (it is the local install receipt).
5. Write `.hai/Agents/handoffs/decision-notes.md`: what changed by file; each design choice you made that this contract did not fix, and why; word counts for the worker and lead paths and for `human-scribe`; test counts; the by-hand run from step 3; anything you could not do, could not test, or think is wrong in this contract. Say plainly what is unverified.

If a requirement here conflicts with the code as it is, or a guard would have to be weakened beyond what is written above, stop and report instead of choosing silently.

## Follow-up 1 — review findings (2026-11-23, master session)

An independent review of `350f723` found no blocker, one should-fix and several minor points. The master session also read the diff. Make these corrections in the same lane, as one new commit on top of `350f723`. Nothing else changes.

1. **Comment markers in a note (should-fix).** The trail is read through `stripComments`, so a `<!--` written by one note and a `-->` in a later one hide every entry between them from capture, from cleanup's uncaptured-items refusal and from note's own numbering (the review reproduced a duplicate id and a hidden user decision). In `noteFields`, refuse any value containing `<!--`, before anything is written, with a one-line message that says to write it in words. Do not refuse `-->` on its own; it is ordinary prose and cannot close anything `note` wrote. Test: a value with `<!--` is refused and nothing is written; a note containing `-->` followed by another note leaves every heading visible to `human-sync` capture and numbering continues.
2. **Trail write is atomic.** `noteCommand` writes the whole trail with a plain `writeFile`. Write a temporary file in the packet directory and rename it over the trail, as `savePacket` does for `packet.json`, keeping the file mode. A leftover temporary file from a crash must not make later commands refuse.
3. **Re-check failure message.** When the lane changed during a note, the message tells the agent to run `status` then `acknowledge --through T<n>`. Add that if a traced file changed that the entry does not name, they record a new note naming it instead.
4. **Lane re-created with the same name and starting commit.** The packet id is branch + base + scope, and packets outlive cleanup, so a re-created lane maps to the earlier lane's packet. `worktree create` then prints "No task packet: Task packet already exists … to create it: human-sync init", which is wrong on both counts. When the packet for the new lane already exists and reads as valid, print one line saying the lane continues the packet of an earlier lane with the same name and starting commit, with its path, and suggest nothing. If it exists and does not read as valid, keep the refusal text without the `init` suggestion. Test the valid case.
5. **Doctor's suggested command.** The drift warning prints `--origin user|agent --area product|design|process|code` unquoted; pasted as-is the shell reads `|` as a pipe. Print the choices inside quotes (for example `--origin "<user|agent>"`), so an unedited paste is refused cleanly by `note`. Adjust the test that matches the warning.
6. **Two doc sentences in `Agents/skills/human-scribe/SKILL.md`**, kept short: (a) when `note` or `init` creates a packet for a lane that had none, its baseline is the lane's state at that moment, so earlier edits to traced files are adopted without an entry; (b) a lane and its packet use one CLI version: after a harness update, merge `main` into an open lane before recording there, and an older CLI copy that reports a packet written by a newer one as invalid is a version mismatch, not a reason to restore a checkpoint. The skill must still end shorter than the 1,875 words it had before this task.

Then the usual: `node scripts/shipped-hashes.mjs`, `./hai-meta sync`, `npm test`, `node --test .hai/evals/test/calibrate.test.mjs`, `git diff --check`, remove the untracked ignored `.hai/.hai-harness.json` if sync created it, commit, and append a "Follow-up 1" section to the handoff with what changed, test counts, word counts and anything unverified. Do not touch the lane's task packet (it holds T1 from your by-hand run; the master session handles its closeout) and do not touch `Human/`.

## Follow-up 2 — closeout without hand edits (2026-11-23, master session)

### The owner's words (verbatim)

After two replays on clean installs the master session reported: "closeout still needs two hand edits inside the Git folder (writing the draft, moving the 'captured through' marker). A permission check blocked the marker edit, so cleanup refused and the lane stayed on disk. This gap exists on main today too. My call on that gap: add two small commands (`human-sync draft` and `human-sync resolve`) in the same lane, so closeout needs no hand edits and the marker can only move past an entry that has a draft for you to see." The owner answered:

> go ahead

### Background

In the replay, an agent recorded one decision with `human-sync note`, ran capture, hand-wrote the draft into the packet's `human-inbox.md`, and was then refused (by its host's permission check, not by the harness) when it tried to hand-edit `Captured through: none` to `T1`. After the owner approved the draft and the merge, cleanup refused with "Task packet has uncaptured review items" and the lane stayed. The packet lives in the Git common directory; an agent editing a review marker there by hand looks like tampering, and nothing checks that the marker only passes entries the user will see.

Read first: `humanSync` (capture), `entriesAfterCursor`, `captureKind`, `readCaptureCursor`, `countInboxDrafts`, `sectionLines`, the inbox template in `packetTemplates`, the packet checks in worktree cleanup, and sections 1 to 3 of `Agents/skills/human-scribe/SKILL.md`.

### 2a. `human-sync draft`

```
human-sync draft --from T<n>|planning --kind decision|open-question|brief|reflection|readme --text <text> [--target <dir>]
```

Appends one pending draft to the packet's `human-inbox.md` under `## Drafts`, in the template's format, and moves the capture cursor itself.

- **Format written.** Heading `### <kind as the template spells it> · from T<n>` (`open-question` is written `open question`; `--from planning` is written `from planning.md`), then `- Status: pending`, `- Target: <file>`, `- Draft: <text>`. Target follows from the kind: decision → `Human/decisions.md`, open question → `Human/open_questions.md`, brief → `Human/brief.md`, reflection → `Human/reflections.md`, readme → `README.md`. Use the template's exact separator character.
- **Validation before any write.** All three flags required; values trimmed, non-empty, single line, no `<!--` (same rules and wording as `note`). `--from T<n>` must be a numbered entry present in the trail. Refuse a draft whose kind and source already have a draft in the inbox. The inbox must have exactly one `## Drafts` section and it must be the last `## ` section (the guard `note` has for the trail).
- **In order.** Refuse `--from T<n>` while an earlier entry after the cursor that capture keeps (`captureKind` is not null) has no draft in the inbox; name that entry in the error. A trail heading that is not `### T<n>` and sits after the cursor blocks the same way: the error quotes the heading and says to number it by hand first (the manual form), then draft it. Entries capture drops are never required.
- **Cursor.** After the draft is appended, set `Captured through:` to the highest numbered entry m such that every entry after the old cursor up to m that capture keeps has a draft in the inbox. Entries capture drops are passed. The cursor never moves backward. `--from planning` writes the draft and leaves the cursor where the same rule puts it.
- **Write.** One atomic write of the inbox (temporary file in the packet directory, rename, same mode), as `note` now does for the trail.
- **Output.** What was drafted, for which file, the cursor after the command, and "Nothing was written to Human/."

### 2b. `human-sync resolve`

```
human-sync resolve --from T<n>|planning --kind <kind> --as approved|dropped|deferred [--text <text>] [--target <dir>]
```

Records what the user said about one draft.

- `approved` and `dropped` remove that draft's block from the inbox (its heading through the line before the next `###`, `## ` or the end). `deferred` keeps the block and sets its `- Status:` to `deferred`.
- No such draft: refuse, write nothing.
- Before the inbox changes, append a record to `packet.json` under `resolved` (an array): source, kind, outcome, the draft text as it stood, the final text when `--text` is given (the user's edit of an approved draft), and the time. Save it the way `savePacket` does. A packet with this extra key must stay readable by this CLI and by the previous one (check `readPacket` in both; if the previous one would refuse it, stop and report).
- `--text` is allowed only with `approved`, single line, no `<!--`.
- It never writes `Human/`. For `approved`, the output names the target file and says the writer still has to write it in the lane; for `dropped` and `deferred` it says what the skill says happens next.
- Atomic inbox write as above.

### 2c. Capture stays read-only

`human-sync` / `capture` writes nothing, as now. Only its closing guidance changes: when entries are listed, the "Next:" line shows the `draft` command and says the cursor moves as drafts are recorded; when nothing is kept, it says nothing needs doing (no instruction to set the cursor by hand). The matching guidance for a malformed heading stays.

### 2d. Unchanged

Cleanup's refusals (pending or deferred drafts, uncaptured kept entries), `captureKind`, the inbox format, everything about how an approved item reaches `Human/`, and the validity of a hand-edited inbox (a draft written by hand can be resolved by command and the reverse). Guards for the new flags: `--from`, `--kind`, `--as`, `--text` are refused on other actions, following the existing pattern.

### Docs

- `Agents/skills/human-scribe/SKILL.md`, sections 1 to 3: capture step 2 (nothing to capture: nothing to do), step 3 (one `draft` command per listed entry, with the kind rules that are there now), step 4 (`--from planning`), and drop step 5 (the cursor moves itself). Closeout batch: after the user answers, one `resolve` per draft; for an approved item the writer writes the `Human/` entry first, then resolves. Say in one sentence that hand edits to the inbox remain valid. The skill is at 1,822 words and must end at or below that.
- `README.md` "Keeping Human/ current": one or two sentences; no longer than it is now.
- The `usage` text.
- `.hai/evals/assumptions.json`: add the rule(s); update R053 and any rule whose wording this changes.
- The word-budget test must pass with unchanged limits.

### Tests

- `draft` writes a well-formed pending draft with the right target for each kind; the cursor moves; capture then lists nothing new; doctor reports one pending draft; cleanup still refuses while it is pending.
- The cursor passes entries capture drops (T1 agent/code, T2 user/product: drafting T2 leaves the cursor at T2).
- Out of order is refused naming the earlier entry, with the inbox byte-identical; so are a duplicate, an unknown `T<n>`, a bad kind, a multi-line or `<!--` text, a missing flag, and the new flags on another action.
- A non-numbered heading after the cursor blocks with the message described.
- `--from planning` writes the draft.
- `resolve`: approved and dropped remove exactly that block and leave other drafts and the cursor; deferred flips the status and keeps the block; each appends a `resolved` record with the text; a missing draft is refused with nothing written; `--text` outside `approved` is refused.
- End to end in one lane: `note` (user, product), `draft`, `resolve --as approved`, then the lane's cleanup succeeds and prints the packet line.
- A draft added by hand is resolved by command; a draft added by command and removed by hand leaves a state every command still reads.
- Capture is still byte-for-byte read-only.

### Mechanics and done

As before: `node scripts/shipped-hashes.mjs`, `./hai-meta sync`, `npm test`, `node --test .hai/evals/test/calibrate.test.mjs`, `git diff --check`, remove the untracked ignored `.hai/.hai-harness.json` if sync created it, one new commit on top of `690c36b` ending with the line `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`, and a "Follow-up 2" section in the handoff (changes by file, choices this section did not fix and why, test counts, word counts, anything unverified). Do not touch the lane's own task packet (the master session closes it out with these commands as the real-use check) and do not touch `Human/`. If a requirement conflicts with the code or would weaken a guard, stop and report.
