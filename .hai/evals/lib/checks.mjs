// Scores a work tree against a scenario's checks. Each automated check runs in a fresh
// Node process with a timeout. `browser` checks need a rendered page: they are listed in
// the result with pass: null and left out of the automated score.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { cleanEnv } from "./check-context.mjs";
import { run } from "./util.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(here, "check-worker.mjs");
const MARKER = "@@CALIBRATION_RESULT@@";

export async function loadChecks(scenario) {
  const mod = await import(pathToFileURL(scenario.checksFile).href);
  return { checks: mod.checks ?? [], hasProbe: typeof mod.probe === "function", metrics: mod.metrics ?? null };
}

async function callWorker(input, timeoutMs) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "hai-check-"));
  const file = path.join(tmp, "input.json");
  await fs.writeFile(file, JSON.stringify(input));
  try {
    const result = await run(process.execPath, [workerPath, file], { cwd: input.dir, timeoutMs, env: cleanEnv() });
    if (result.timedOut) return { ok: false, error: `timed out after ${timeoutMs}ms` };
    const line = result.stdout.split("\n").reverse().find((l) => l.startsWith(MARKER));
    if (!line) return { ok: false, error: `no result (exit ${result.code}): ${result.stderr.trim().slice(0, 300)}` };
    return JSON.parse(line.slice(MARKER.length));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

// Returns { results: [{ id, kind, tag, description, pass, detail }], passed, total, browser }.
export async function runChecks(scenario, { dir, baselineDir, transcript, timeoutMs = 20000 }) {
  const { checks } = await loadChecks(scenario);
  const results = [];
  for (const check of checks) {
    const base = { id: check.id, kind: check.kind ?? "auto", tag: check.tag ?? null, description: check.description };
    if (base.kind === "browser") {
      results.push({ ...base, pass: null, detail: "needs a rendered page; not scored automatically" });
      continue;
    }
    const outcome = await callWorker({ checksFile: scenario.checksFile, mode: "check", id: check.id, dir, baselineDir, transcript }, timeoutMs);
    results.push(outcome.ok ? { ...base, ...outcome.value } : { ...base, pass: false, detail: `check error: ${outcome.error}` });
  }
  const scored = results.filter((r) => r.pass !== null);
  return { results, passed: scored.filter((r) => r.pass).length, total: scored.length, browser: results.length - scored.length };
}

export async function runProbe(scenario, { dir, baselineDir, transcript, timeoutMs = 30000 }) {
  const { hasProbe } = await loadChecks(scenario);
  if (!hasProbe) return null;
  const outcome = await callWorker({ checksFile: scenario.checksFile, mode: "probe", dir, baselineDir, transcript }, timeoutMs);
  return outcome.ok ? outcome.value : { error: outcome.error };
}
