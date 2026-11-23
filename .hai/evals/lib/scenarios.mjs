import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "./util.mjs";

export const SCENARIOS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scenarios");

export async function listScenarios(root = SCENARIOS_DIR) {
  const out = [];
  for (const entry of (await fs.readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && !entry.name.startsWith("_")) {
      const file = path.join(root, entry.name, "scenario.json");
      if (await fs.access(file).then(() => true, () => false)) out.push(entry.name);
    }
  }
  return out;
}

// Accepts a folder name ("a-same-chat-build"), its letter ("a") or a path.
export async function loadScenario(name, root = SCENARIOS_DIR) {
  let dir = path.isAbsolute(name) ? name : path.join(root, name);
  if (!(await fs.access(path.join(dir, "scenario.json")).then(() => true, () => false))) {
    const match = (await listScenarios(root)).find((n) => n.split("-")[0] === name.toLowerCase());
    if (!match) throw new Error(`No scenario ${name}. Known: ${(await listScenarios(root)).join(", ")}`);
    dir = path.join(root, match);
  }
  const spec = await readJson(path.join(dir, "scenario.json"));
  return {
    ...spec,
    dir,
    fixtureDir: path.join(dir, spec.fixture ?? "fixture"),
    checksFile: path.join(dir, spec.checks ?? "checks.mjs"),
    limits: { maxAgentCalls: 16, maxRepliesPerTurn: 4, ...(spec.limits ?? {}) }
  };
}
