---
name: implement
description: Implement an assigned product or source change by tracing its behavior, choosing a fitting project-native approach, and verifying the requested outcome. Do not use for read-only reviews.
---

# Implementation

Use this method for an assigned implementation task. Follow the task's exact scope, requirements, design contracts, and approval gates. For read-only review, use [code-review](../code-review/SKILL.md) instead; do not switch roles to perform the task.

## Understand the change

Read the current task, its acceptance criteria, and each requirement, design, or verification reference it names. Trace the affected flow from its entry point through relevant callers, interfaces, data, and failure paths. Identify the behavior the user needs and the root cause of the gap or defect before editing. Keep investigation within the assigned scope unless evidence shows the contract cannot be met without an explicit scope update.

## Choose a fitting approach

Inspect the actual project implementation and reuse its established code and patterns when they fit the stated behavior and design. Prefer a standard-library, native-platform, or already-installed capability only when it meets the explicit requirements and constraints; availability alone is not a reason to use it.

Add custom code or a dependency only when the existing project approach and suitable installed or native capabilities cannot meet the requirements. Give the concrete reason, the affected scope, and the cost of the addition in the task evidence. Avoid speculative features, abstractions, configuration, and generalized flexibility without an assigned need. Do not compress or minimize code at the expense of clarity, completeness, or maintainability. Choose the straightforward approach that fully satisfies the request.

## Preserve the contract

Keep changes within the assigned files and behavior. Preserve explicit requirements and design contracts, existing validation and error handling, security and accessibility expectations, and protections against data loss. Do not bypass existing checks or approval gates to make the change pass. When a requirement conflicts with current behavior or a referenced contract, report the conflict before expanding scope.

## Verify and report

Run checks suited to the changed behavior and the task's verification contract. Add or update meaningful tests when they verify requested behavior or an important failure or regression case; avoid tests that only match wording or mirror implementation details. Follow project instructions for focused checks and approval before high-cost runs. Report the actual commands and results, relevant coverage gaps, and any behavior you could not verify.

If a material compromise remains and a nearby marker will help maintainers find it, add a language-appropriate comment containing `hai-defer: limit=<actual limit>; revisit=<concrete condition>`. Keep it optional and use it only for a real deferred compromise. Record the marker location, limit, and revisit condition in the task handoff. Do not create a separate debt ledger or add markers for routine choices.
