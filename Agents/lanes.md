# Lanes

How a task lane is created, integrated and cleaned up. Read it before you create a lane, run `worktree approve` or close out a task. The rules in [onboarding.md](onboarding.md) under Lanes, runs and outward acts apply throughout; this file says how.

## Create

- A new root task creates its lane before writing anything, plans and handoffs included. Check the primary checkout is clean (`git status --short`); if it is not, stop and have the user review and commit. Then run `node .hai/Agents/hai-harness.mjs worktree create <task-slug>` from the primary. It makes branch `task/<task-slug>` at `<parent>/_worktrees/<project>/<task-slug>` from the checked-out branch, normally `main`, which is also where the lane integrates. Do not ask the user which branch to use.
- The project CLI needs no PATH entry, npm or network; only `init`, `update` and `migrate` run via `npx github:ClaudiusMa/HAI-Harness`. Never create a private integration branch. `approve` and `cleanup` refuse a hand-made lane and print the recovery; `worktree status --all` lists other lanes.
- Delegated roles, same-task workers and successors reuse the task's lane, one writer at a time. A follow-up that refines or extends the task stays in its open lane with the same worker; only a new, unrelated task gets a new lane.
- A decision about which branch is main, the remote or publication never means editing in the primary.

## Integrate

- Report each request as verified in the lane. Ask for integration approval once, when the user says the task is done, asks to merge, or wants the result on main, not after every request.
- With that approval, the lane's writer (Claudia, or the worker holding the slot) runs `node .hai/Agents/hai-harness.mjs worktree approve --approved "<message>"` from the unchanged approved lane, never the primary. It runs `git diff --check`, stages and commits with hooks, merges main into the lane first, and fast-forwards main to a local `--no-ff` merge commit. It adds no provider attribution and does not push, open a pull request, deploy or publish.
- If main moved, approve merges it into the lane and stops: re-run the quick test there, then approve again. If that merge conflicts, nothing changes: ask the user how to resolve code conflicts, and resolve shared notes (`Agents/` planning, task and handoff files, `Human/` logs) by keeping both sides.
- If the primary is dirty or a merge fails, preserve the lane. Never resolve a dirty or conflicting lane with copy, reset, stash, clean or `--no-verify`.

## Conflict copies

Cloud sync can leave `<name> <N>` duplicates (`index 2`, `notes 2.md`, `refs/heads/task/x 2`). `create`, `approve`, `cleanup` and `worktree sweep` move the provably redundant ones to a reversible quarantine; `doctor` only reports. A kept copy needs the user: a kept ref, `HEAD`, worktree or task-packet copy stops the lane commands, and `approve` refuses a kept copy in the lane unless it is renamed or staged on purpose. `worktree sweep --quarantine <path>` moves one kept copy aside, only for a path the user explicitly approved.

## Preview

Run the project's own preview or dev command from the lane and have the user review that exact lane. HAI-Harness owns no static server, route, framework or port.

## Closeout and cleanup

Cleanup is part of completion and needs no separate approval. A push alone is not completion.

1. Finish and verify the authorized integration, push, deployment and other requested outward work first; each outward act still needs its own approval. While outward work, an ongoing preview or follow-up remains, integrate with `worktree approve --keep-worktree --approved "<message>"` and keep the lane.
2. After verified completion, stop only the preview or dev processes this task started and still owns, by their actual session or PID and verified cwd. Never kill by port or name, or stop shared or peer processes.
3. Only when `approve` kept the lane: from a surviving checkout, run `node .hai/Agents/hai-harness.mjs worktree cleanup <task-branch> --target <primary-checkout>`.
4. If it retains ignored files or orphan folders, remove only exact task-owned generated cache paths whose origin and disposable contents are established, after checking the complete contents for valuable files, symlinks and nested repositories, then retry. No broad recursive deletion and no forced worktree removal.
5. Preserve unfinished work, pending or deferred decision drafts, active peer resources, and anything whose ownership or content is uncertain; report the precise blocker and path instead of offering generic cleanup.
6. The final summary lists stopped processes, removed resources, what was kept and why, and the task packet path when it holds entries or drafts.
