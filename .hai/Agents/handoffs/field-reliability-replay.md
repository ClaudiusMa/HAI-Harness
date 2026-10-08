# Field reliability — live startup replay

Owner: Claudia. 2026-10-07.

## Setup

Three disposable fixtures under the session scratchpad (`replay-a|b|c/acme-site`): `git init` on `main`, one product file `src/app.js` (`greeting()` returns `"Welcome"`), `package.json`, then `init` from this lane's `bin/hai-harness.mjs`, update check disabled in the receipt, committed clean. No `hai-harness` on PATH.

Each scenario ran in a fresh agent on the controller's capability profile, told that the host had loaded the root `AGENTS.md` and to read it as project instructions, that it could not spawn sub-agents, and then given one user message. Evidence is the agent's recorded tool calls plus fixture Git state, not its self-report.

| Scenario | User message | First actions (recorded) | Lane | Product code | Result |
|---|---|---|---|---|---|
| A | unnamed: "the greeting on the home page should say "Welcome back"… propose fix and make it, but also point me to the code" | AGENTS.md + `git status` → update check + onboarding → `claudia.md` → project_context/planning/lessons → … → `git status --short` → `node Agents/hai-harness.mjs worktree create` | CLI-created, `hai*` metadata present | unchanged in primary and lane | Claudia; contract, planning entry and handoff in lane; stopped at worker handoff |
| B | "claudida, … fix it and merge" | AGENTS.md + `git status` → update check + onboarding → `claudia.md` → project_context/planning/lessons → `git status --short` → CLI `worktree create` | CLI-created, metadata present | unchanged | Claudia; recorded "fix it and merge" as local-merge approval only; stopped at worker handoff |
| C | "augustus, … make the change" | AGENTS.md + `git status` → update check + onboarding → `augustus.md` + task file → project_context + implement skill → read code → `git status --short` → CLI `worktree create` | CLI-created, metadata present | edited only in the lane | Augustus; verified, stopped before `approve` for user approval; primary clean |

## Observations

- No session searched or edited product code before its role read path. No `git worktree add`, no hand-written metadata, no edits in the primary checkout.
- C noted the conflict between the unassigned `tasks/augustus.md` queue and the user's direct instruction and applied "live direction wins" — consistent with the rules.
- Process weight: A and B spent 30–32 tool calls on a one-line text change (plan, contract, handoff, packet trail and Human drafts). Correct, but heavy for trivial edits.

## Limits

- The prompt told each agent to read `AGENTS.md`; the field host injects it automatically. This primes reading the root file but not onboarding or role files.
- One run per scenario on one model; not a statistical measure. No real iCloud, no Codex host, no worker spawn path.

## Rerun against the lean AGENTS.md (312 words) — 2026-10-08

Same fixtures and prompts, rebuilt from the lane after the main merge and code-quality pass.

- C ("augustus, …"): complete. AGENTS.md → update check + onboarding + `augustus.md` → project_context, task, implement skill, design.md → `git status --short` → CLI `worktree create` → edit only in the lane → verified → stopped before approve. 9 tool calls (11 before). Primary clean. **Defect found:** it told the user to run `approve` "from the main checkout". The old AGENTS.md said approve runs from the task worktree; the lean rewrite dropped that and onboarding never stated it. Fix pending: say "from the task lane" in the AGENTS.md integrate line and onboarding's approve bullet.
- A (unnamed) and B ("claudida, …"): stopped by an API usage limit while writing the contract. Before the cutoff each read AGENTS.md, onboarding and the Claudia chain first, checked the primary was clean, created the lane with the CLI (metadata present), and left `src/` untouched in primary and lane. Contract/handoff output not observed.
