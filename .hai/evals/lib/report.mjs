// Aggregates saved run records into one table per scenario (variant x metric) and gives a
// verdict for each variant against a named base: helps, no measurable effect, hurts or
// inconclusive. Below `minRuns` runs in either cell the verdict is always inconclusive.
import fs from "node:fs/promises";
import path from "node:path";
import { mean, readJson, stdev } from "./util.mjs";

export const DEFAULT_THRESHOLDS = {
  minRuns: 3,
  // Pass-rate difference (0..1) that counts as a quality change...
  qualityMargin: 0.05,
  // ...and only when it is also this many standard errors away from zero.
  qualityZ: 2,
  // Mean per-run difference in error events (wrong builds, stale requirements, lost
  // requirements) that counts as a quality change on its own.
  errorMargin: 0.5,
  errorMetrics: ["wrongBuilds", "failed_stale", "failed_request1"],
  // At equal quality, a variant that costs this much more (ratio) hurts; one that costs
  // this much less (1/ratio) helps.
  tokenRatio: 1.25,
  timeRatio: 1.25
};

const STANDARD = ["passRate", "checksPassed", "checksTotal", "wrongBuilds", "interruptions", "totalTokens", "uncachedInput", "modelCalls", "subagents", "wallSeconds"];

export async function loadRecords(resultsDir) {
  const records = [];
  const visit = async (dir) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.name.endsWith(".json")) {
        const r = await readJson(full).catch(() => null);
        if (r && r.schema && r.metrics && r.scenario) records.push(r);
      }
    }
  };
  await visit(resultsDir);
  return records;
}

function cell(runs) {
  const metrics = {};
  const keys = new Set(runs.flatMap((r) => Object.keys(r.metrics)));
  for (const key of keys) {
    const values = runs.map((r) => r.metrics[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
    if (values.length) metrics[key] = { mean: mean(values), sd: stdev(values), n: values.length };
  }
  return { runs: runs.length, metrics, capped: runs.filter((r) => r.capped).length, aborted: runs.filter((r) => r.aborted).length };
}

const m = (c, key) => c.metrics[key]?.mean ?? 0;

export function verdict(candidate, base, thresholds = DEFAULT_THRESHOLDS) {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const runs = `${candidate.runs} vs ${base.runs} runs`;
  if (candidate.runs < t.minRuns || base.runs < t.minRuns) {
    return { verdict: "inconclusive", reason: `${runs}; at least ${t.minRuns} per cell needed` };
  }
  const dq = m(candidate, "passRate") - m(base, "passRate");
  const sdC = candidate.metrics.passRate?.sd ?? 0;
  const sdB = base.metrics.passRate?.sd ?? 0;
  const se = Math.sqrt(sdC ** 2 / candidate.runs + sdB ** 2 / base.runs);
  const qualitySignificant = Math.abs(dq) >= t.qualityMargin && Math.abs(dq) >= t.qualityZ * se;
  const de = t.errorMetrics.reduce((acc, key) => acc + (m(candidate, key) - m(base, key)), 0);
  const better = (qualitySignificant && dq > 0) || de <= -t.errorMargin;
  const worse = (qualitySignificant && dq < 0) || de >= t.errorMargin;
  const tokens = m(base, "totalTokens") ? m(candidate, "totalTokens") / m(base, "totalTokens") : null;
  const time = m(base, "wallSeconds") ? m(candidate, "wallSeconds") / m(base, "wallSeconds") : null;
  const facts = `pass rate ${signed(dq * 100, 1)} pts (se ${(se * 100).toFixed(1)}), error events ${signed(de, 2)}/run, tokens ${ratio(tokens)}, time ${ratio(time)}; ${runs}`;
  if (better && worse) return { verdict: "inconclusive", reason: `mixed quality signals: ${facts}` };
  if (better) return { verdict: "helps", reason: facts };
  if (worse) return { verdict: "hurts", reason: facts };
  if (Math.abs(dq) >= t.qualityMargin) return { verdict: "inconclusive", reason: `pass-rate change within noise: ${facts}` };
  if ((tokens !== null && tokens > t.tokenRatio) || (time !== null && time > t.timeRatio)) return { verdict: "hurts", reason: `same quality at higher cost: ${facts}` };
  if (tokens !== null && tokens < 1 / t.tokenRatio && (time === null || time <= t.timeRatio)) return { verdict: "helps", reason: `same quality at lower cost: ${facts}` };
  return { verdict: "no measurable effect", reason: facts };
}

const signed = (v, digits) => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`;
const ratio = (v) => (v === null ? "n/a" : `${v.toFixed(2)}x`);

// The records compared in one table should have run with the same user-level instruction
// and settings files. Returns null when they did, else a sentence naming the files whose
// presence or hash differs. Records saved before fingerprints existed count as unknown.
export function userConfigDifference(records) {
  const known = records.filter((r) => Array.isArray(r.userConfig));
  const unknown = records.length - known.length;
  const paths = new Set(known.flatMap((r) => r.userConfig.map((f) => f.path)));
  const differing = [...paths].filter((p) => {
    const states = new Set(known.map((r) => {
      const f = r.userConfig.find((x) => x.path === p);
      return !f ? "not recorded" : f.present ? f.sha256 : "absent";
    }));
    return states.size > 1;
  }).sort();
  const parts = [];
  if (differing.length) parts.push(`user-level files differ between the compared runs: ${differing.join(", ")}`);
  if (unknown && known.length) parts.push(`${unknown} of ${records.length} runs have no user-config fingerprint`);
  return parts.length ? parts.join("; ") : null;
}

// Returns [{ model, host, scenario, cells: { variant: cell }, verdicts: { variant: {...} }, userConfigWarning }].
export function aggregate(records, { base = "none", thresholds = {}, filter = {} } = {}) {
  const groups = new Map();
  for (const r of records) {
    if (filter.model && r.model !== filter.model) continue;
    if (filter.host && r.host !== filter.host) continue;
    const wanted = [filter.scenario ?? []].flat().filter((s) => s && s !== "all");
    if (wanted.length && !wanted.some((s) => r.scenario === s || r.scenario.startsWith(`${s}-`))) continue;
    const key = `${r.model}\u0000${r.host}\u0000${r.scenario}`;
    if (!groups.has(key)) groups.set(key, { model: r.model, host: r.host, scenario: r.scenario, byVariant: new Map() });
    const g = groups.get(key);
    const label = r.variant.label;
    if (!g.byVariant.has(label)) g.byVariant.set(label, []);
    g.byVariant.get(label).push(r);
  }
  const out = [];
  for (const g of [...groups.values()].sort((a, b) => `${a.model}${a.host}${a.scenario}`.localeCompare(`${b.model}${b.host}${b.scenario}`))) {
    const cells = Object.fromEntries([...g.byVariant.entries()].map(([label, runs]) => [label, cell(runs)]));
    const verdicts = {};
    for (const label of Object.keys(cells)) {
      if (label === base) continue;
      verdicts[label] = cells[base] ? verdict(cells[label], cells[base], thresholds) : { verdict: "inconclusive", reason: `no runs for base ${base}` };
    }
    out.push({ model: g.model, host: g.host, scenario: g.scenario, base, cells, verdicts, userConfigWarning: userConfigDifference([...g.byVariant.values()].flat()) });
  }
  return out;
}

function fmt(key, stat) {
  if (!stat) return "-";
  const v = stat.mean;
  if (key === "passRate") return `${(v * 100).toFixed(0)}%${stat.n > 1 ? ` ±${(stat.sd * 100).toFixed(0)}` : ""}`;
  if (key === "totalTokens" || key === "uncachedInput") return v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v.toFixed(0);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function renderReport(groups) {
  if (!groups.length) return "No saved runs match.\n";
  const lines = [];
  for (const g of groups) {
    lines.push(`## ${g.scenario} | model ${g.model} | host ${g.host}`, "");
    if (g.userConfigWarning) lines.push(`> **Warning:** ${g.userConfigWarning}. Differences may come from the operator's setup, not the variant.`, "");
    const variants = Object.keys(g.cells).sort((a, b) => (a === g.base ? -1 : b === g.base ? 1 : a.localeCompare(b)));
    const extra = [...new Set(variants.flatMap((v) => Object.keys(g.cells[v].metrics)))].filter((k) => !STANDARD.includes(k) && k !== "agentCalls" && k !== "browserChecks").sort();
    const keys = [...STANDARD.filter((k) => k !== "checksTotal" && k !== "checksPassed"), ...extra];
    lines.push(`| variant | runs | ${keys.join(" | ")} |`, `|---|---:|${keys.map(() => "---:").join("|")}|`);
    for (const v of variants) {
      const c = g.cells[v];
      const flags = [c.capped ? `${c.capped} capped` : "", c.aborted ? `${c.aborted} aborted` : ""].filter(Boolean).join(", ");
      lines.push(`| ${v}${v === g.base ? " (base)" : ""}${flags ? ` [${flags}]` : ""} | ${c.runs} | ${keys.map((k) => fmt(k, c.metrics[k])).join(" | ")} |`);
    }
    lines.push("");
    for (const [v, result] of Object.entries(g.verdicts)) lines.push(`- **${v}** vs ${g.base}: **${result.verdict}** (${result.reason})`);
    if (!Object.keys(g.verdicts).length) lines.push(`- no variant to compare with ${g.base}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
