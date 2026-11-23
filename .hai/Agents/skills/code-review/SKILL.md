---
name: code-review
description: Review an assigned code change for correctness, completeness, regressions, and relevant security concerns. Use for a risk-area change when you did not implement it; skip trivial prose and mechanical edits.
---

# Code Review

This assignment is read-only: keep your role, edit nothing, run no mutating command, create no worktree, and do not approve or integrate the change.

Review the producer's exact lane against the request's recorded requirements (the worker's contract, or the `planning.md` entry when Claudia built it) with its referenced requirements, design and acceptance. Inspect the base-to-task diff, including added or untracked files in scope, and the callers needed to understand the behavior; not a whole-repository audit unless the assignment asks for one. Check:

- every assigned requirement, and preserved validation, error handling, security, accessibility and data-loss protections;
- regressions or incomplete behavior in callers, failure paths and neighboring behavior;
- whether the checks cover the changed behavior, including an important failure or regression case, and what remains unverified;
- concrete, avoidable complexity: a duplicated project pattern, an unnecessary dependency, unused extensibility or configuration, or out-of-scope changes;
- each task-routed lesson or Standing Gate, and whether the producer's evidence exercised its rule or only inspected it (a replay verifies only the case it ran);
- any `hai-defer:` marker in the changed scope: a real limit and a concrete revisit condition.

Report only actionable findings the source or contract supports, each with severity, file and line, trigger and consequence, and a behavior-preserving correction direction. When severity depends on an unverified environment or assumption, say so and name the check that would settle it. No findings is a valid result. State what you inspected, which checks you ran or observed, and what you could not verify.

Send findings to Claudia, who fixes her own build or assigns the producing worker. If the producer changes code in response, recheck only the changed areas and their callers against the same contract.
