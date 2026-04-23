# Project Context

<!--
## How To Use This File

- Use this file for durable project context only.
- Update it when the product shape, system boundaries, stack, or non-negotiable rules change.
- Do not use this file as a sprint log, task tracker, or session summary.
-->

Shared high-level context for all agents. This file is intentionally architectural and durable. It should not be used as a sprint log, status board, or session history.

## 1. Purpose

- Describe the product shape, system boundaries, major technologies, and non-negotiable rules.
- Give every agent enough shared context to reason about the codebase before reading role docs or task docs.
- Stay high level. Detailed implementation notes belong elsewhere.

## 2. Maintenance Contract

- Do update this file when the product shape changes, a core subsystem changes, a backend/storage choice changes, or a project-wide rule changes.
- Do not update this file for task progress, bug triage, one-off fixes, completed phases, or temporary work-in-progress notes.
- The agent who changes architecture or introduces a new durable constraint is responsible for updating this file in the same task.
- If a subsystem is in transition, document the boundary or ambiguity at a high level instead of narrating the full history.
- Put task baton-pass notes in [handoffs/](handoffs). Put hard-question learnings in [lessons/](lessons). Put stable cross-task patterns in [patterns.md](patterns.md). Put only high-value cross-task failures in [graveyard.md](graveyard.md).

## 3. Product Shape

- Product name:
- One-sentence description:
- Primary user-facing surfaces:
  - Surface:
  - Surface:
  - Surface:

## 4. Platform And Stack

- Platform(s):
- Language(s):
- Framework(s):
- Storage / database:
- External services:
- Deployment shape:

## 5. Architecture

### 5.1 App Shell

- Entry point(s):
- Root shell:
- Navigation or app-frame rules:

### 5.2 Presentation Layer

- UI directories:
- Major areas:
  - Area:
  - Area:
  - Area:
- Interaction rules the team should preserve:

### 5.3 State, Models, And Persistence

- Core domain entities:
  - Entity:
  - Entity:
  - Entity:
- Main orchestration layer(s):
- Persistence layer(s):
- Migration / legacy constraints:

### 5.4 Sync And Online Systems

- Auth / identity:
- Sync / background jobs:
- External APIs / integrations:
- Source-of-truth rules:

## 6. Core Domain Rules

- Rule:
- Rule:
- Rule:
- The app should remain usable in degraded mode when critical online systems are unavailable, if that is a product requirement.
- Query and read paths should stay side-effect free.

## 7. Collaboration Map

- [onboarding.md](onboarding.md) is the mandatory first read for every agent.
- `project_context.md` is shared, high-level context only.
- Role docs (`claudia.md`, `augustus.md`, `julius.md`) define stable collaboration rules. Worker scope is planner-assigned unless your project intentionally adds durable role biases.
- Each chat/session has exactly one active role. Roles do not switch mid-session, and one chat does not run another role live.
- [planning.md](planning.md) is Claudia-owned and is the single iteration source of truth for task allocation, implementation strategy, and worker execution planning.
- Claudia edits planner-owned coordination docs only. Augustus and Julius own implementation code within their assigned write scopes.
- `tasks/` holds current worker assignments for Augustus and Julius.
- `handoffs/` holds current task baton-pass notes for later chats/sessions.
- `lessons/` holds task/problem-specific learnings worth reusing in later chats.
- `Human/` is not part of default agent context.

## 8. Non-Negotiable Rules

- Always read a file before editing it, even mid-session.
- Never merge to `main` unless the user explicitly asks.
- Never push to `origin/main` unless the user explicitly asks.
- Query paths should remain side-effect free.
- Risky migrations and backfills need explicit approval before live execution.
- High-cost validation should stay opt-in.
- When a rollout changes identity, ownership, or access control, preserve user data before polishing the UI around it.
- Add project-specific rules below:
  - Rule:
  - Rule:
