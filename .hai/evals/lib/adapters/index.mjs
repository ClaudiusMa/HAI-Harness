import { createClaudeAdapter } from "./claude.mjs";
import { createCodexAdapter } from "./codex.mjs";
import { createStubAdapter } from "./stub.mjs";

export const HOSTS = ["claude", "codex", "stub"];

export function createAdapter(host, options = {}) {
  if (host === "claude") return createClaudeAdapter(options);
  if (host === "codex") return createCodexAdapter(options);
  if (host === "stub") return createStubAdapter(options);
  throw new Error(`Unknown host ${host}; use one of ${HOSTS.join(", ")}.`);
}
