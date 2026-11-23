// A host that replays canned behavior, so the runner, scoring and report can be tested
// without a model. Each call consumes the next step of a script:
//   { reply, overlay, files, target, integrate, usage, subagents, expectNewSession }
// - overlay: a folder (relative to the script's folder) copied onto the work tree
// - files: { "relative/path": "content" } written onto the work tree
// - target: "primary" (default) or "lane:<slug>", which creates a Git worktree at
//   <run>/_worktrees/project/<slug> the way `worktree create` lays lanes out
// - integrate: commit the lane and merge it into the primary checkout
// - expectNewSession: fail the call unless the runner started a new session for it
// Scripts are keyed by variant kind ("none", "harness") or "default".
import fs from "node:fs/promises";
import path from "node:path";
import { copyDir, exists, git, readJson } from "../util.mjs";

const DEFAULT_USAGE = { input: 1000, cacheCreation: 500, cachedInput: 5000, output: 300, modelCalls: 3 };

export function createStubAdapter(options = {}) {
  let steps = null;
  let scriptDir = null;
  let index = 0;
  let sessionCounter = 0;
  const calls = [];
  return {
    name: "stub",
    describe: () => ({ host: "stub" }),
    // Tests pass files here to exercise the user-config fingerprint and report warning.
    userConfigFiles: () => options.userConfigFiles ?? [],
    calls,

    // The runner hands over the scenario and variant before the first call.
    async begin({ scenario, variant }) {
      let script = options.script;
      scriptDir = options.scriptDir ?? null;
      if (!script) {
        const file = options.scriptFile ?? path.join(scenario.dir, "stub", "script.json");
        script = (await exists(file)) ? await readJson(file) : { default: [] };
        scriptDir = path.dirname(file);
      }
      steps = Array.isArray(script) ? script : script[variant.kind] ?? script.default ?? [];
      index = 0;
    },

    async send({ cwd, runDir, message, session }) {
      const step = steps?.[index] ?? { reply: "Done." };
      index += 1;
      if (step.expectNewSession && session) {
        return { text: "", session, ms: 1, error: "stub: expected a new session but the runner resumed one", usage: { ...DEFAULT_USAGE, modelCalls: 0 } };
      }
      const id = session ?? `stub-session-${++sessionCounter}`;
      let tree = cwd;
      if (step.target?.startsWith("lane:")) tree = await ensureLane(runDir, cwd, step.target.slice(5));
      if (step.overlay) await copyDir(path.resolve(scriptDir ?? ".", step.overlay), tree);
      for (const [rel, content] of Object.entries(step.files ?? {})) {
        await fs.mkdir(path.dirname(path.join(tree, rel)), { recursive: true });
        await fs.writeFile(path.join(tree, rel), content);
      }
      if (step.integrate && tree !== cwd) {
        await git(tree, ["add", "-A"]);
        await git(tree, ["commit", "-q", "-m", "stub lane work"]);
        const branch = await git(tree, ["rev-parse", "--abbrev-ref", "HEAD"]);
        await git(cwd, ["merge", "-q", "--no-edit", branch]);
      }
      const usage = { ...DEFAULT_USAGE, ...(step.usage ?? {}) };
      calls.push({ message, session: id, newSession: !session, step: index - 1, usage, subagents: step.subagents ?? 0 });
      return { text: step.reply ?? "Done.", session: id, ms: step.ms ?? 5, error: step.error ?? null, usage };
    },

    async collectUsage() {
      const u = { input: 0, cacheCreation: 0, cachedInput: 0, output: 0, modelCalls: 0, subagents: 0, models: { stub: calls.length } };
      for (const call of calls) {
        for (const key of ["input", "cacheCreation", "cachedInput", "output", "modelCalls"]) u[key] += call.usage[key] ?? 0;
        u.subagents += call.subagents;
      }
      return { ...u, totalTokens: u.input + u.cacheCreation + u.cachedInput + u.output, uncachedInput: u.input + u.cacheCreation, source: "stub", missingSessions: [] };
    }
  };
}

async function ensureLane(runDir, primary, slug) {
  const lane = path.join(runDir, "_worktrees", "project", slug);
  if (!(await exists(lane))) {
    await fs.mkdir(path.dirname(lane), { recursive: true });
    await git(primary, ["worktree", "add", "-q", "-b", `task/${slug}`, lane]);
  }
  return lane;
}
