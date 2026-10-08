# Momus packet validation correction

Date: 2026-10-07
Parent/controller: Claudia, 01a114d7-547a-7dd0-91a1-f820fe414af0
Assigned role: Augustus, fresh implementation worker; retain role.
Lane: /Users/claudiusma/Documents/ProductLab/HAI-Harness-worktrees/momus-debugger-design
Branch/base: task/momus-debugger-design / b711df0747ca1186594d8350e379b9f0e5290630
Integration: local main; unapproved. Exclusive lane writer; parent/other children read-only until release.

Read outer AGENTS/onboarding/project_context/augustus and implement skill, then tasks/momus-implementation.md and handoffs/momus-source-review.md. Approved behavior is unchanged. User requested implementation, including malformed packet refusal and state-preserving old-packet compatibility. Source review found one concrete narrow issue.

## Scope and correction

Only bin/hai-harness.mjs and relevant existing focused tests in test/hai-harness.test.mjs, ordinary hai-meta sync, and append a correction receipt to existing handoffs/momus-implementation.md. Do not change any Human, planning, role/method text, packet, index/commit or peer work.

readPacket's validPathHash accepts a present single-element array containing a valid 64-hex hash through RegExp coercion. Require each present mandatory path hash to be a primitive string before regex matching. Preserve the genuinely absent-only Agents/momus.md exception for pre-Momus baselines. Preserve all other schema/identity/HEAD/digest/trail and later trace/acknowledgment checks. Do not expand into unrelated schema refactoring.

Add a meaningful refusal regression using a present Momus hash array with a matching recomputed baseline digest; also cover a former mandatory hash array so uniform string validation is established. Existing valid-string and absent Momus compatibility cases must still pass. Do not modify live packets or undo accepted Human/parent changes.

## Verification and handoff

Run only the affected Momus role tracing/compatibility test family, CLI/test syntax and diff checks. Run ./hai-meta sync (routine update, no force/init) and verify stable mirrors/protected live-state preservation against intake. No full suite, build, network/dependencies or production replay. Record exact changes/check results and post-correction hashes/freeze under task-owned /private/tmp/hai-momus-implementation-01a114d7 without overwriting original freeze evidence. Append evidence to existing handoff, release writer, return paths and results for Julius's narrow independent recheck. No delegated workers or integration.

## Closeout status, 2026-10-07

Primitive-string path-hash validation correction complete; two independent regressions fail before/pass after; original Julius recheck resolved P3. Writer released. Evidence: ../handoffs/momus-source-review.md.
