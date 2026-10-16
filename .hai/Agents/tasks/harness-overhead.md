# Harness overhead

Owner: the user's direct session (the user asked for no role routing). Updated 2026-10-13.
Status: implemented and verified in the lane. Waiting for the user's review and local integration approval. No push or release is authorized. Evidence: `../handoffs/harness-overhead.md`.

## Requirements

The paired Sol-medium pilot (2026-10-12) had the harness at 2.99× tokens and 1.68× time, with the same 13/13 result. The user kept the Claudia/worker split for context isolation and approved these fixes:

1. Delegation mechanics: one engineer per task lane, reused for follow-ups through new contracts; one blocking wait, no polling; workers send no progress updates and report once.
2. Risk-based review: a separate reviewer only for security/authentication/data leaving the device, interfaces consumed by other modules, dependencies, migrations, installer/CLI/worktree, or on user request. Claudia accepts worker evidence and does not re-run worker checks.
3. Same-session continuity: a new message does not re-run the read order. One bookkeeping pass per request; completion evidence goes in the handoff.
4. Trim duplicated always-read text: the claudia.md cleanup and task-packet paragraphs duplicated onboarding verbatim.
5. (2026-10-14) Integrate once per task: follow-ups keep the open lane and named worker; merge approval is asked when the user is done.
6. (2026-10-14) Compact, don't reset: workers and Claudia continue through host compaction; a new worker takes over only when the host cannot resume the old one.
7. Pilot as a regression check, plus discussion-heavy and fresh-chat scenarios: protocol in `../handoffs/harness-overhead-eval.md`.

The contract is the only bridge between the two contexts. It carries decided requirements and rejected options, never the conversation.

## Write scope

Product: `scaffold/AGENTS.md`, `Agents/onboarding.md`, `Agents/claudia.md`, `Agents/augustus.md`, `Agents/julius.md`, `Agents/skills/implement/SKILL.md`, `Agents/tasks/TEMPLATE.md`. Outer mirrors only through `./hai-meta sync`. Outer records: planning, this contract, handoffs, packet trail.

## Verification

`node --test test/hai-harness.test.mjs`, `git diff --check`, `./hai-meta sync` with source/outer parity. Re-run the paired pilot when the Codex supervisor is available.
