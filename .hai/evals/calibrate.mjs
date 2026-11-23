#!/usr/bin/env node
// HAI-Harness calibration suite (maintainer-side; never shipped to users).
// See README.md in this folder.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAdapter, HOSTS } from "./lib/adapters/index.mjs";
import { aggregate, DEFAULT_THRESHOLDS, loadRecords, renderReport } from "./lib/report.mjs";
import { runScenario } from "./lib/runner.mjs";
import { listScenarios, loadScenario } from "./lib/scenarios.mjs";
import { parseVariant } from "./lib/variants.mjs";
import { readJson } from "./lib/util.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_RESULTS = path.join(here, "results");

const USAGE = `HAI-Harness calibration suite

  node calibrate.mjs list
  node calibrate.mjs run --host <${HOSTS.join("|")}> --variant <spec> [--variant <spec>]...
                         [--scenario <a,c,d|all>] [--repeats <n>] [--model <name>] [--model-label <label>]
                         [--effort <level>] [--workdir <dir>] [--results <dir>] [--no-keep]
                         [--permission-mode <mode>] [--dangerous-bypass] [--host-bin <path>]
                         [--host-arg <arg>]... [--allow-mcp] [--max-budget-usd <n>]
                         [--subagent-model <name>] [--call-timeout-min <n>] [--stub-script <file>]
  node calibrate.mjs report [--results <dir>] [--base <variant>] [--model <label>] [--host <host>]
                            [--scenario <id>] [--thresholds <file.json>] [--json]

Variant specs: "none" (bare fixture), a HAI-Harness source tree path, or label=path.
No model is assumed: without --model the host's own default runs and is labelled "host-default".
Runs execute under the OS temporary folder (or --workdir), never inside a real repository.
Results default to ${path.relative(process.cwd(), DEFAULT_RESULTS) || DEFAULT_RESULTS}.`;

// Flags that may be given more than once; their values accumulate. Any other flag given
// twice is an error rather than a silent last-one-wins. --scenario accumulates with its
// comma form: --scenario d --scenario c is the same as --scenario d,c.
const REPEATABLE = new Set(["variant", "host-arg", "scenario"]);
const BOOLEAN = new Set(["no-keep", "dangerous-bypass", "allow-mcp", "json", "help"]);

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { _: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith("--")) { opts._.push(arg); continue; }
    const key = arg.slice(2);
    if (BOOLEAN.has(key)) { opts[key] = true; continue; }
    const value = rest[i + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`--${key} needs a value`);
    i += 1;
    if (REPEATABLE.has(key)) (opts[key] ??= []).push(value);
    else if (key in opts) throw new Error(`--${key} was given more than once (${opts[key]}, ${value}); give it once.`);
    else opts[key] = value;
  }
  return { command, opts };
}

// --scenario values as a flat list: accepts a string, an array of strings, and commas.
export function scenarioNames(value) {
  return [value ?? []].flat().flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter(Boolean);
}

export async function runCommand(opts, { log = console.error } = {}) {
  if (!opts.host || !HOSTS.includes(opts.host)) throw new Error(`run needs --host ${HOSTS.join("|")}`);
  if (!opts.variant?.length) throw new Error("run needs at least one --variant (none, a source path, or label=path)");
  const variants = [];
  for (const spec of opts.variant) variants.push(await parseVariant(spec));
  const labels = variants.map((v) => v.label);
  if (new Set(labels).size !== labels.length) throw new Error(`Variant labels must differ: ${labels.join(", ")}. Use label=path.`);
  const requested = scenarioNames(opts.scenario);
  const names = requested.length === 0 || requested.includes("all") ? await listScenarios() : requested;
  const scenarios = [];
  for (const name of names) {
    const scenario = await loadScenario(name);
    if (!scenarios.some((s) => s.id === scenario.id)) scenarios.push(scenario);
  }
  const repeats = Number(opts.repeats ?? 1);
  const resultsDir = path.resolve(opts.results ?? DEFAULT_RESULTS);
  const adapterOptions = {
    bin: opts["host-bin"],
    permissionMode: opts["permission-mode"],
    dangerousBypass: Boolean(opts["dangerous-bypass"]),
    hostArgs: opts["host-arg"] ?? [],
    allowMcp: Boolean(opts["allow-mcp"]),
    maxBudgetUsd: opts["max-budget-usd"],
    subagentModel: opts["subagent-model"],
    callTimeoutMs: opts["call-timeout-min"] ? Number(opts["call-timeout-min"]) * 60000 : undefined,
    scriptFile: opts["stub-script"] ? path.resolve(opts["stub-script"]) : undefined
  };
  const records = [];
  for (const scenario of scenarios) {
    for (let r = 0; r < repeats; r += 1) {
      // Counterbalance order across repeats: rotate the variant list.
      const order = variants.map((_, i) => variants[(i + r) % variants.length]);
      for (const variant of order) {
        log(`run ${scenario.id} / ${variant.label} / repeat ${r + 1} of ${repeats}`);
        const adapter = createAdapter(opts.host, adapterOptions);
        const record = await runScenario({ scenario, variant, adapter, host: opts.host, model: opts.model ?? null, modelLabel: opts["model-label"] ?? null, effort: opts.effort ?? null, workdir: opts.workdir ?? null, resultsDir, keep: !opts["no-keep"], log });
        const mtr = record.metrics;
        log(`  -> ${mtr.checksPassed}/${mtr.checksTotal} checks, ${mtr.interruptions} interruptions, ${mtr.wrongBuilds} wrong builds, ${mtr.totalTokens} tokens, ${mtr.wallSeconds}s${record.aborted ? `, ABORTED: ${record.aborted}` : ""}${record.capped ? ", capped" : ""}`);
        log(`     record ${path.join(resultsDir, `${record.id}.json`)}; run folder ${record.runDir}${opts["no-keep"] ? " (removed)" : ""}`);
        records.push(record);
      }
    }
  }
  return records;
}

export async function reportCommand(opts) {
  const records = await loadRecords(path.resolve(opts.results ?? DEFAULT_RESULTS));
  const thresholds = opts.thresholds ? { ...DEFAULT_THRESHOLDS, ...(await readJson(path.resolve(opts.thresholds))) } : DEFAULT_THRESHOLDS;
  const groups = aggregate(records, { base: opts.base ?? "none", thresholds, filter: { model: opts.model, host: opts.host, scenario: scenarioNames(opts.scenario) } });
  return opts.json ? `${JSON.stringify(groups, null, 2)}\n` : renderReport(groups);
}

async function main() {
  const { command, opts } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || opts.help) { console.log(USAGE); return; }
  if (command === "list") {
    for (const name of await listScenarios()) {
      const s = await loadScenario(name);
      console.log(`${s.id}: ${s.title}\n  tests: ${s.tests}\n`);
    }
    return;
  }
  if (command === "run") { await runCommand(opts); return; }
  if (command === "report") { process.stdout.write(await reportCommand(opts)); return; }
  throw new Error(`Unknown command ${command}\n\n${USAGE}`);
}

if (process.argv[1] && (await fs.realpath(process.argv[1]).catch(() => process.argv[1])) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
