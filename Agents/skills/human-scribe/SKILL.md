---
name: human-scribe
description: Capture task-owned why-entries into provisional packet drafts, present one closeout batch, and write only approved Human items in the isolated accepted candidate with its changes before integration.
---

# Human Scribe

Agents maintain `Human/` and the public README; the user owns them by approving. Nothing reaches either without approval in the current batch. Claudia coordinates capture and review, and writes approved items herself in her task lane or assigns the worker or Momus holding the lane's writer slot. A direct Momus controller uses this method for its incident-specific choices; a delegated Momus reports them to its parent Claudia, who owns packet mutations. Neither entry authorizes global planning or direct Human writes by Momus. Provisional choices stay outside Agents and product files in the registered task packet.

## Packet and discovery

Every lane `worktree create` makes starts with its task packet, baselined at the lane's start. Run commands from the lane root with `--target .` (`.` and `.hai` resolve to the same packet). Only a recognized task lane has one; main, detached and hand-made checkouts refuse. Never create a shared fallback or borrow another task's packet.

`human-sync status` prints the packet path in the Git common directory (`packet.json`, `decision-trail.md`, `human-inbox.md`). Identity binds branch, base, integration and harness scope. Symlink redirects refuse. Keep packet contents out of tracked files.

A lane from an older CLI has none; `note` or `human-sync init` creates it (`init` changes nothing on an existing packet). Its baseline is the lane's state at that moment, so earlier edits to traced files are adopted without an entry. With legacy `Agents/decision-trail.md` and `Agents/human-inbox.md`, run `human-sync init --migrate --target .`; it verifies exact copies and keeps a receipt before retiring them. Partial packets refuse; never delete populated legacy state. A lane and its packet use one CLI version: after a harness update, merge `main` into an open lane before recording there. An older CLI copy reporting a newer packet as invalid is a version mismatch, not a reason to restore a checkpoint.

## When to record, and how

Record a why-entry in the same change when:

- `project_context.md`, `design.md`, `designs/` or a role doc (built-in or custom) changes; or
- a decision is made that the user should see again: a product, design or process choice the user made or confirmed (Origin `user`), or one an agent assumed without asking (Origin `agent`).

Recording an ordinary request in `planning.md` needs no entry; the plan entry carries the user's words and go-ahead. Claudia, Athena, Hephaestus and direct Momus controllers record; workers write none and give evidence in handoffs.

```sh
node .hai/Agents/hai-harness.mjs human-sync note --target . --change "Agents/design.md: accent is teal" --why "The user picked it over blue" --origin user --area design
```

`note` appends the next numbered entry, dated today, and acknowledges the traced state in one step. `--change` must name every traced path changed since the last acknowledgment, or nothing is written; if another writer changed one, they note first. Values are single lines. `--applies "approved {draft}"` marks a reflection of an approved item. Traced files merged in from `main` are named in one note ("merged from main").

Origin `user` requires the user's actual statement or confirmation of every decision in the entry; never upgrade an assumption. Quoting the request does not make a plan the user's, and a plan with an unconfirmed `Assumed` line is Origin `agent`. The trail is append-only: correct with a new note.

Drift compares file content: `doctor` warns when a traced file differs from the last acknowledgment, and on pending/deferred drafts. Committing noted content is not drift; a traced file changed, committed and returned to the acknowledged content needs no entry. A traced path an older packet lacks reads as drift until the next note. Never reinitialize the packet or edit unrelated trail items to clear drift. Manual form: append an entry by hand, run `human-sync status`, then `human-sync acknowledge --through T<n> --head <HEAD> --snapshot <digest>`. Neither form approves a Human draft.

One writer slot: pause or hand off the lane writer before changing trail, drafts or cursor; no hidden second writer. Read-only capture may inspect a stable snapshot; its draft and cursor changes are serialized. Record the packet path in the task handoff.

Capture reads the packet trail, packet `human-inbox.md` (drafts and the cursor) and open `Decision needed from user` items in `Agents/planning.md`: the agent layer only, never chat transcripts. Do not read Human except the target file an assigned writer needs for a currently approved item. Preserve quoted user words for reflections.

## 1. Capture (fast tier, low effort)

1. Run `node .hai/Agents/hai-harness.mjs human-sync --target .` (or explicit `capture`). The CLI is offline, read-only and deterministic; it performs no model or network call. It lists entries after the packet cursor whose Origin is `user` or Area is `product`, `design`, or `process`, drops agent-origin `code`, and suppresses `- Applies: approved {draft}` reflections of already-approved items.
2. If nothing remains to capture, nothing needs doing. An unnumbered or out-of-order heading blocks the commands: number it by hand as the next number while unacknowledged, else capture that lane by hand.
3. Otherwise record each listed entry, in order, with `node .hai/Agents/hai-harness.mjs human-sync draft --from T<n> --kind <kind> --text "<draft>" --target .`. It moves `Captured through:` itself; duplicate, resolved and out-of-order drafts refuse.
   - Origin `user` becomes a `decision`. Add a `brief` or `readme` draft only when it changes the current product story or public description.
   - Origin `agent` becomes an `open-question`: "Agents assumed {X}. Confirm or change?"
   - Unrecognized Origin/Area or malformed headings become open questions quoting the entry for review.
   - A `reflection` draft requires the user's quoted words.
4. Draft each open `Decision needed from user` item with `--from planning#<n>` (n counts from 1).

Draft only what the source states. Do not add reasons or guess the user's view.

## 2. Closeout batch

- A lane with no entries and no drafts needs no capture at closeout. Otherwise, before closeout, including blocked handoff, Claudia shows all pending/deferred drafts in one numbered batch. The user approves, edits, drops or defers each item; "approve all" applies to that batch only. No first backfill or unrelated Human change is implied.
- After the user answers, record each draft with `human-sync resolve --from T<n>|planning#<n> --kind <kind> --as approved|dropped|deferred`, adding `--text "<edit>"` when the user edited an approved one. For an approved item the writer writes the Human entry first, then resolves. Keep source IDs and approved text in the handoff until verified integration.
- Dropped drafts leave the inbox but their trace remains. Deferred items keep `Status: deferred`; unaddressed items stay pending. Raise both at the next intake. Hand edits to the inbox remain valid.
- Execution changes are reflected in Agents by their owning role. Its note adds `--applies "approved {draft}"` to avoid capture again.

## 3. Writer (fast tier, medium effort)

Write the current approved batch in a verified isolated candidate together with the accepted changes before integration. That candidate is normally Claudia's own task lane; when a worker holds the lane's writer slot, assign the batch to that worker. The primary/shared checkout is not a direct Human write destination. Recheck the candidate identity and baseline, serialize shared Human log updates across candidates, and deduplicate against the latest accepted entries. Resolve approved drafts only after successful candidate writes; retain approved-source evidence through integration. A rejected or interrupted candidate never promotes provisional choices; preserve its packet and handoff.

- `Human/decisions.md`: preserve version header and fields (`Date`, `Decision`, `Why`, `Tradeoffs`, `Follow-up`). Remove `- None recorded yet.` on the first entry. Skip decisions already recorded. Use `Not stated.` for unsupplied fields. A replacement adds `- Supersedes: {date}: {earlier decision}` while keeping the earlier entry. For an older version header with real entries, stop for an explicit archive/reset decision.
- `Human/open_questions.md`: preserve its fields; `Current leaning` states the agents' current behavior. Skip listed questions. Remove a resolved question only with the approved decision's own entry.
- `Human/brief.md`: change only approved sections so it reads as the current story.
- `Human/reflections.md`: append only the user's dated quoted words; no paraphrase or interpretation.
- `README.md`: the Human writer does not edit it. Approved README drafts go through a task lane, Claudia's own or a worker's, for verification and normal integration approval.

## Handoff and recovery limits

Retain the unfinished lane and packet, including deferred and unreviewed drafts. Completion cleanup retains packet metadata in Git common storage and refuses lane removal while pending/deferred drafts or uncaptured review items remain. Use `worktree approve --keep-worktree` while closeout is unfinished. After branch/worktree removal primary capture cannot discover that retired identity. Record its physical path and identity before cleanup.

For cross-machine handoff, create an explicit recoverable checkpoint:

```sh
node .hai/Agents/hai-harness.mjs human-sync checkpoint --output /private/checkpoints/task.json --target .
```

The destination parent must exist, the file must be new, and its physical location must be outside every registered worktree of this repository (including a `.hai` scope's product parent). Export includes packet metadata, files and observed state. Transfer privately and reconcile canonical branch/base/integration/scope identity on recovery. Git push/fetch does not transfer packets. There is no import command or automatic cross-host recovery. Automatic session attachment, submit freeze, full lifecycle enforcement, host write prevention, generation fencing and distributed leases remain pending; this method does not claim them.

## Writing rules

Write for someone returning weeks later: plain words, the why stated directly, no internal code names, lane slugs, or file paths unless the reader needs them.

Cleanup rules apply to every file, including decisions:

- Keep facts, names, dates, numbers, and the user's meaning exact.
- Cut significance inflation and promotional words ("pivotal", "a testament to", "groundbreaking", "seamless", "robust"). State the fact instead.
- Use plain verbs: "is" and "has" instead of "serves as" and "boasts"; "use" instead of "leverage".
- Delete trailing "-ing" phrases that add false depth ("highlighting its importance").
- Cut filler and hedging ("it's worth noting", "in order to", "could potentially").
- Name who decided. The user decided, not "the team" or "experts".
- No chatbot artifacts, flattery, or upbeat closing lines.
- Use em dashes and boldface sparingly. No emojis.

Full style applies to the brief and README drafts:

- Vary section and sentence shape. Do not end every section with a takeaway line.
- Do not pad lists to three items. Keep an item only if it carries its own meaning.
- Keep one term for one thing; do not cycle synonyms.
- Use a transition only when it carries logic ("because", "but", "so").
- Read it aloud. Rewrite anything that sounds like a press release.

Never add opinions, feelings, first-person voice, humor, or experience the user did not state. Decision entries get the cleanup rules only and never gain a view the user did not express.

## Attribution

The writing rules adapt selected guidance from [humanize-writing](https://github.com/jpeggdev/humanize-writing) (`SKILL.md` and `references/ai-tells.md`) by jpeggdev, used under the [MIT License](https://github.com/jpeggdev/humanize-writing/blob/main/LICENSE), Copyright (c) 2025 jpeggdev. This skill does not use that project's installer.
