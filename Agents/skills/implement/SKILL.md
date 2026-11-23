---
name: implement
description: Implement a product or source change, whether Claudia builds it in her lane or a worker is assigned, by tracing its behavior, choosing a fitting project-native approach, and verifying the requested outcome. Do not use for read-only reviews.
---

# Implementation

Use this for every build, by Claudia or an assigned worker. Scope, requirements, design contracts and approvals come from the request's `planning.md` entry when Claudia builds, or the worker's task contract.

## Before writing

- Start only when the entry or contract records the user's go-ahead in their own words. For anything the user will look at, or a request naming two or more items, also wait until it records the spec table and every `Assumed` line as confirmed.
- Read the user's verbatim words against the table. If a row does not follow from the words, or the words allow a reading the table does not cover, stop and report the mismatch quoting both; do not pick a reading. Build none of the listed rejected attempts again.
- Find the root cause or real gap before editing. If the contract cannot be met within scope, report that instead of widening it.
- Make each routed lesson or Standing Gate part of your approach and acceptance.

## Building

- Reuse the project's own code and patterns where they fit. Add custom code or a new dependency only when the project and its installed or native capabilities cannot meet the requirement, and give the reason, scope and cost in your evidence.
- Keep changes inside the assigned files and behavior. Preserve explicit requirements and design contracts, validation and error handling, security, accessibility and data-loss protections. Never bypass a check or an approval gate to make the change pass; report a conflict between a requirement and current behavior before acting on it.
- For a real compromise left behind, you may add a comment `hai-defer: limit=<actual limit>; revisit=<concrete condition>` and record it in the handoff; no markers for routine choices, no debt ledger.

## Verify and report

- Run the checks that establish the result: the project's own tests and build, which run locally without a check-in. Add tests that catch the requested behavior or an important regression, not ones that restate wording.
- Passing checks show the result works, not that it is what was asked. With a spec table, report one line per row with what you observed; for anything visual the evidence is a screenshot of the item, not a statement that the page renders.
- For a routed lesson or gate, report the evidence for its replay or check and say whether its rule was exercised or only inspected; a replay verifies only the tested case.
- Give one final report: per-row results, the actual commands and results, coverage gaps, and what you could not verify. A worker's controller relies on it instead of re-running your checks.
