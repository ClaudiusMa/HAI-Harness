# Task completion cleanup

Owner: Augustus child of current Claudia. Updated 2026-10-06.
Status: completed, independently reviewed/rechecked, Human decision written and local commit/merge approved on 2026-10-06. See task handoff for evidence and limits.

## Requirements

User approved improving automatic routine cleanup after verified task completion. A push alone is not completion. Finish the authorized merge/push/deployment workflow first; never infer publication authorization. Stop only preview/dev processes started and still owned by this task, using their actual session/PID and cwd; do not kill by port/name or stop shared/peer processes. Preserve work if the user requests an ongoing preview or follow-up.

CLI currently attempts worktree/branch removal at the end of approve and catches all failures into one vague message. Improve that existing behavior and allow a safe retry after outward work is done. A small keep-worktree option on approve and a worktree cleanup command are acceptable; no registry or background process system. The agent owns timing/process shutdown, the CLI owns deterministic Git/filesystem checks. Preserve existing local integration semantics and hook behavior.

Cleanup must establish recognized task identity/physical lane path, recorded integration target, exact task tip merged there, clean tracked/staged and meaningful untracked state, pending/deferred task packet drafts, and no locked/other worktree ownership. Do not force-remove or silently discard ignored valuable files, symlink targets, nested repositories, or arbitrary leftover folders. Known disposable preview cache may be removed only with a narrow explicit structural allowlist and complete inspection; default preserve/report when unsure. Git-only removal is preferable where possible. Handle partial cleanup (Git unregistered directory but folder remains, branch deletion failure) accurately; no vague worktree-retained claim when only branch/folder remains. Safe retries should tolerate already-completed pieces without deleting newer/unmerged work. Keep task packet metadata recoverable and report retained reasons/paths. Avoid scope creep; explain any necessary design adjustment before implementing it.

## Write scope

Product: `bin/hai-harness.mjs`, `test/hai-harness.test.mjs`, `Agents/onboarding.md`, `Agents/claudia.md`, `scaffold/AGENTS.md`, and narrowly `Agents/skills/human-scribe/SKILL.md` if completion guidance requires alignment. README may be read for context but is not approved for edits in this batch. Outer mirrors of changed stable files through `./hai-meta sync` only. Evidence: `.hai/Agents/handoffs/task-cleanup.md`. Do not edit outer planning/tasks/packet/Human or unrelated source. Preserve inner templates as generic product methods.

## Method and sequence

Read `.hai/AGENTS.md`, outer onboarding/project_context, `.hai/Agents/augustus.md`, this contract and handoff, then `.hai/Agents/skills/implement/SKILL.md`. Work only in `/Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/task-cleanup`, branch task/task-cleanup. Fresh worker remains Augustus; do not create another lane or act as controller.

1. Inspect affected callers/CLI options and choose the smallest complete lifecycle approach.
2. Implement focused cleanup and completion guidance.
3. Run focused Node behavior tests with meaningful filesystem/Git preservation cases; no full suite/build/network/dependencies.
4. Execute an instruction replay with observed artifacts showing agent closeout/retention behavior. This is scoped evidence, not a general model benchmark.
5. Run `./hai-meta sync` in this lane; check mirror parity and preservation of project state.
6. Report files, results, limitations and exact safe retry usage in the handoff. Release writer slot for independent read-only review.

Dependencies: one serial queue; reviewer waits for frozen source. Approval boundary: user approved the concrete decision entry and local commit/merge on 2026-10-06 ("approve"). Use the native approved integration command; push, PR, release and deployment remain unapproved.
