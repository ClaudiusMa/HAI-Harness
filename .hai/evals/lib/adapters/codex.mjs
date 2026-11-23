// Codex non-interactive mode (`codex exec`). Flags checked against `codex exec --help` and
// `codex exec resume --help` of codex-cli 0.171.0-alpha.13 on 2026-11-22:
// exec: --json, -C/--cd, --add-dir, -s/--sandbox, -m/--model, -c key=value,
//       -o/--output-last-message, --dangerously-bypass-approvals-and-sandbox
// exec resume <SESSION_ID> [PROMPT]: --json, -m, -c, -o, --dangerously-bypass-...
//       (no -C, -s or --add-dir: the working folder is the process cwd and the sandbox is
//       set with -c).
// Effort is `-c model_reasoning_effort="<level>"`. The default sandbox is workspace-write
// with the run folder as an extra writable root; no approval bypass unless asked.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { codexHome, codexUsage } from "../usage.mjs";
import { run } from "../util.mjs";

export function createCodexAdapter(options = {}) {
  const bin = options.bin ?? process.env.CODEX_BIN ?? "codex";
  const timeoutMs = options.callTimeoutMs ?? 30 * 60 * 1000;
  let firstCall = null;
  return {
    name: "codex",
    describe: () => ({ host: "codex", bin, sandbox: options.dangerousBypass ? "bypass" : options.sandbox ?? "workspace-write" }),

    // User-level files Codex loads in every run: instructions and settings.
    userConfigFiles() {
      const home = codexHome(options.home);
      return ["AGENTS.md", "AGENTS.override.md", "config.toml"].map((name) => path.join(home, name));
    },

    buildArgs({ message, session, cwd, runDir, model, effort, lastMessageFile }) {
      const args = ["exec"];
      if (session) args.push("resume");
      args.push("--json", "-o", lastMessageFile);
      if (model) args.push("-m", model);
      if (effort) args.push("-c", `model_reasoning_effort="${effort}"`);
      if (options.dangerousBypass) args.push("--dangerously-bypass-approvals-and-sandbox");
      else {
        const sandbox = options.sandbox ?? "workspace-write";
        if (session) args.push("-c", `sandbox_mode="${sandbox}"`);
        else args.push("-s", sandbox);
        if (runDir) args.push("-c", `sandbox_workspace_write.writable_roots=[${JSON.stringify(runDir)}]`);
      }
      if (!session) {
        args.push("-C", cwd);
        if (runDir) args.push("--add-dir", runDir);
      }
      for (const extra of options.hostArgs ?? []) args.push(extra);
      if (session) args.push(session);
      args.push(message);
      return args;
    },

    async send(request) {
      firstCall ??= new Date();
      const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "hai-codex-"));
      const lastMessageFile = path.join(tmp, "last.txt");
      const args = this.buildArgs({ ...request, lastMessageFile });
      const result = await run(bin, args, { cwd: request.cwd, timeoutMs });
      let thread = request.session ?? null;
      const usage = { input: 0, cacheCreation: 0, cachedInput: 0, output: 0, modelCalls: 0 };
      let text = "";
      for (const line of result.stdout.split("\n")) {
        let event;
        try { event = JSON.parse(line); } catch { continue; }
        if (event.type === "thread.started" && event.thread_id) thread = event.thread_id;
        if (event.type === "turn.completed" && event.usage) {
          const cached = event.usage.cached_input_tokens ?? 0;
          usage.input += (event.usage.input_tokens ?? 0) - cached;
          usage.cachedInput += cached;
          usage.output += event.usage.output_tokens ?? 0;
        }
        if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) text = event.item.text;
      }
      const last = await fs.readFile(lastMessageFile, "utf8").catch(() => null);
      await fs.rm(tmp, { recursive: true, force: true });
      // Observed 2026-11-22 (codex-cli 0.171.0-alpha.13): after `exec resume`, the
      // turn.completed usage equals the thread's cumulative total, not this call's share.
      // Run metrics therefore come from collectUsage (the rollout files), not from these.
      usage.cumulative = Boolean(request.session);
      return {
        text: last ?? text,
        session: thread,
        ms: result.ms,
        error: result.timedOut ? `timed out after ${timeoutMs}ms` : result.code !== 0 ? (result.stderr.trim() || `exit ${result.code}`).slice(0, 500) : null,
        usage
      };
    },

    async collectUsage({ sessions }) {
      return codexUsage(sessions.filter(Boolean), { home: options.home, start: firstCall ?? new Date(), end: new Date() });
    }
  };
}
