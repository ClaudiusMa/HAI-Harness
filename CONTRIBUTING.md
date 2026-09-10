# Contributing to HAI-Harness

Start with the project's current direction and active work before proposing a change.
We maintain the records below so contributors can understand both the product and
how decisions led to the current implementation.

| To understand | Read | Maintained by |
| --- | --- | --- |
| Current direction and boundaries | [Project context](.hai/Agents/project_context.md) and [product brief](.hai/Human/brief.md) | Project owner; agents maintain shared context within their assignment |
| Confirmed decisions | [Decision log](.hai/Human/decisions.md) | Confirmed human decisions, recorded through decision-logger |
| Active work and next steps | [Planning](.hai/Agents/planning.md) and [worker assignments](.hai/Agents/tasks/) | Claudia |
| Unresolved product questions | [Current unresolved research/prototype scope](.hai/Agents/project_context.md#current-discovery-direction--2026-09-09), [brief](.hai/Human/brief.md), and [open-questions workspace](.hai/Human/open_questions.md) | Human workspace owners |
| Completed work and verification | [Handoffs](.hai/Agents/handoffs/) and [archived tasks](.hai/Agents/_archive/tasks/) | Assigned workers and reviewers, coordinated by Claudia |
| Earlier context | [Archive](.hai/Agents/_archive/) and [Git history](https://github.com/ClaudiusMa/HAI-Harness/commits/main/) | Preserved records and commits |

These are maintained summaries, decisions, and work records; they are not a complete
transcript of every conversation. Historical plans are evidence, not current
assignments. Latest confirmed decisions take precedence over older conflicting notes.
The 2026-09-09 transparency entry in the [decision log](.hai/Human/decisions.md)
supersedes older private-only tracking policies; the original entries remain historical evidence.
The open-questions file is a workspace, not proof that all product questions are resolved.
Public visibility does not change agent context rules: agents read Human files only
when explicitly authorized.

## Develop the harness with the harness

The root `Agents/` and `Human/` trees plus [`scaffold/AGENTS.md`](scaffold/AGENTS.md)
are reusable product templates. The checked-in [`.hai/` installation](.hai/README.md)
holds this project's live context. Begin agent work through the repository root
[`AGENTS.md`](AGENTS.md), then follow outer onboarding and the assigned task.

For a clean fresh clone checked out on `main`, create and check out a local
integration branch before the first task lane:

```sh
git switch -c local-integration
node bin/hai-harness.mjs worktree create my-task --integration local-integration
```

Use the worktree path printed by the CLI for implementation. In an existing checkout,
follow the current plan and preserve its integration branch and any ongoing work.

1. Start an isolated native task lane from the clean local integration branch as
   directed by outer onboarding. Keep implementation in the assigned product files.
2. Improve the reusable source first. Do not copy project records back into templates.
3. Run focused checks (`npm test` for CLI or helper changes), then from the repository root:

   ```sh
   ./hai-meta sync
   ./hai-meta doctor
   ```

4. Verify preserved project state and update outer planning, task, and handoff evidence.
   Record confirmed decisions through decision-logger. Review before approved local integration;
   remote publication remains a separate authorized action.

`hai-meta` is a convenience wrapper around this checkout's ordinary CLI:

| Helper | Direct equivalent from the repository root |
| --- | --- |
| `./hai-meta bootstrap` | `node bin/hai-harness.mjs init --target .hai` |
| `./hai-meta sync` | `node bin/hai-harness.mjs update --target .hai` |
| `./hai-meta doctor` | `node bin/hai-harness.mjs doctor --target .hai` |

Bootstrap first creates `.hai/` if absent; for the direct `init` equivalent, run
`mkdir -p .hai` first. It installs missing generic files and cannot reconstruct project history.
Recover missing project records or root redirects from Git. The helper has no
embedded project seeds, extra skill-copy step, or destructive flags. For a preview,
use `node bin/hai-harness.mjs update --target .hai --dry-run`.

The ordinary updater installs `scaffold/AGENTS.md` as `.hai/AGENTS.md` and refreshes
shipped stable methods and skills while preserving
populated planning, context, design, queues, handoff entries, lesson state, archive
entries, Human records, and additional local skills. The root `AGENTS.md` redirect and
`.hai/README.md` are maintained directly in Git. Development context is excluded from the package;
keep machine-local settings, caches, and installation receipts ignored.
