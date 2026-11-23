// Claude Code headless mode (`claude -p`). Flags checked against `claude --help` of
// Claude Code 2.1.328 on 2026-11-22: -p, --output-format json, --session-id, --resume,
// --model, --effort, --permission-mode, --permission-prompts, --add-dir,
// --strict-mcp-config, --max-budget-usd, --dangerously-skip-permissions.
//
// Defaults are deliberately not a blanket bypass: permission mode `acceptEdits` and
// `--permission-prompts none` (anything that would prompt is denied instead of hanging).
// Real runs will usually want `--permission-mode auto`; a full bypass only with
// --dangerous-bypass.
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { claudeConfigDir, claudeUsage } from "../usage.mjs";
import { exists, run } from "../util.mjs";

export function createClaudeAdapter(options = {}) {
  const bin = options.bin ?? process.env.CLAUDE_BIN ?? "claude";
  const timeoutMs = options.callTimeoutMs ?? 30 * 60 * 1000;
  return {
    name: "claude",
    describe: () => ({ host: "claude", bin, permissionMode: options.dangerousBypass ? "bypassPermissions" : options.permissionMode ?? "acceptEdits", strictMcp: options.allowMcp !== true }),

    // User-level files Claude Code loads in every run: instructions and settings.
    userConfigFiles() {
      const dir = claudeConfigDir(options.configDir);
      return ["CLAUDE.md", "settings.json", "settings.local.json"].map((name) => path.join(dir, name));
    },

    // Claude Code reads CLAUDE.md, not AGENTS.md. When the variant installed an AGENTS.md
    // (the HAI-Harness block) and the fixture has no CLAUDE.md, import it the same way this
    // repository does, so the instructions reach the model. `none` has no AGENTS.md.
    async prepareProject(projectDir) {
      const agents = path.join(projectDir, "AGENTS.md");
      const claude = path.join(projectDir, "CLAUDE.md");
      if ((await exists(agents)) && !(await exists(claude))) {
        await fs.writeFile(claude, "@AGENTS.md\n");
        return ["CLAUDE.md"];
      }
      return [];
    },

    buildArgs({ message, session, runDir, model, effort }) {
      const args = ["-p", message, "--output-format", "json"];
      if (session) args.push("--resume", session);
      else args.push("--session-id", options.newSessionId?.() ?? randomUUID());
      if (model) args.push("--model", model);
      if (effort) args.push("--effort", effort);
      if (options.dangerousBypass) args.push("--dangerously-skip-permissions");
      else args.push("--permission-mode", options.permissionMode ?? "acceptEdits", "--permission-prompts", options.permissionPrompts ?? "none");
      if (runDir) args.push("--add-dir", runDir);
      if (options.allowMcp !== true) args.push("--strict-mcp-config");
      if (options.maxBudgetUsd) args.push("--max-budget-usd", String(options.maxBudgetUsd));
      for (const extra of options.hostArgs ?? []) args.push(extra);
      return args;
    },

    async send(request) {
      const args = this.buildArgs(request);
      const sessionArg = args[args.indexOf(request.session ? "--resume" : "--session-id") + 1];
      const env = { ...process.env };
      if (options.subagentModel) env.CLAUDE_CODE_SUBAGENT_MODEL = options.subagentModel;
      const result = await run(bin, args, { cwd: request.cwd, env, timeoutMs });
      let parsed = null;
      try { parsed = JSON.parse(result.stdout.trim().split("\n").pop()); } catch { /* not JSON */ }
      const usage = parsed?.usage ?? {};
      return {
        text: parsed?.result ?? "",
        session: parsed?.session_id ?? sessionArg,
        ms: result.ms,
        error: result.timedOut ? `timed out after ${timeoutMs}ms` : parsed?.is_error || result.code !== 0 ? (parsed?.result || result.stderr.trim() || `exit ${result.code}`).slice(0, 500) : null,
        usage: {
          input: usage.input_tokens ?? 0,
          cacheCreation: usage.cache_creation_input_tokens ?? 0,
          cachedInput: usage.cache_read_input_tokens ?? 0,
          output: usage.output_tokens ?? 0,
          modelCalls: parsed?.num_turns ?? 0
        },
        costUsd: parsed?.total_cost_usd ?? null
      };
    },

    // Transcript totals include subagents, which the per-call result does not break out.
    async collectUsage({ sessions }) {
      return claudeUsage(sessions, { configDir: options.configDir });
    }
  };
}
