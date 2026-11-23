// Runs one scenario under one variant on one host and returns (and saves) the run record.
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { runChecks, runProbe, loadChecks } from "./checks.mjs";
import { respond } from "./scripted-user.mjs";
import { fingerprintFiles } from "./user-config.mjs";
import { prepareProject, resolveArtifact, workTrees } from "./variants.mjs";
import { safeRunRoot, slugify, snapshot, timestampSlug, writeJson } from "./util.mjs";

export const RECORD_SCHEMA = 1;

async function snapshotTrees(runDir) {
  const all = {};
  for (const tree of await workTrees(runDir)) {
    const prefix = tree.kind === "primary" ? "" : `lane:${tree.name}/`;
    for (const [rel, hash] of Object.entries(await snapshot(tree.dir))) all[prefix + rel] = hash;
  }
  return all;
}

// Files the agent changed during one call, across the primary checkout and its lanes. A
// lane that appears starts from the baseline (creating it is not a change), and a lane
// that disappears (cleaned up after integration) is not a change either.
function changedBetween(before, after, baseline) {
  const laneOf = (key) => (key.startsWith("lane:") ? key.slice(0, key.indexOf("/") + 1) : "");
  const lanesBefore = new Set(Object.keys(before).map(laneOf));
  const lanesAfter = new Set(Object.keys(after).map(laneOf));
  const changed = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const lane = laneOf(key);
    if (lane && !lanesAfter.has(lane)) continue;
    const previous = lane && !lanesBefore.has(lane) ? baseline[key.slice(lane.length)] : before[key];
    if (previous !== after[key]) changed.push(key);
  }
  return changed.sort();
}

export async function runScenario({ scenario, variant, adapter, host, model = null, modelLabel = null, effort = null, workdir = null, resultsDir = null, keep = true, log = () => {} }) {
  const root = await safeRunRoot(workdir);
  const runId = `${timestampSlug()}-${slugify(scenario.id)}-${slugify(variant.label)}-${randomBytes(3).toString("hex")}`;
  const runDir = path.join(root, "hai-calibration", runId);
  await fs.mkdir(runDir, { recursive: true });
  const startedAt = new Date();
  const { projectDir, baselineDir, install } = await prepareProject({ runDir, fixtureDir: scenario.fixtureDir, variant, adapter });
  if (adapter.begin) await adapter.begin({ scenario, variant, runDir });
  const { hasProbe } = await loadChecks(scenario);

  const record = {
    schema: RECORD_SCHEMA,
    id: runId,
    scenario: scenario.id,
    variant: install,
    host: host ?? adapter.name,
    hostConfig: adapter.describe?.() ?? {},
    // User-level instruction and settings files the host loads: path and hash, no content.
    userConfig: await fingerprintFiles(adapter.userConfigFiles?.() ?? []),
    model: modelLabel ?? model ?? "host-default",
    modelArg: model,
    effort,
    startedAt: startedAt.toISOString(),
    runDir,
    turns: [],
    sessions: [],
    capped: false,
    aborted: null
  };

  const state = { followUpsUsed: {} };
  let calls = 0;
  let interruptions = 0;
  let wrongBuilds = 0;
  let before = await snapshotTrees(runDir);
  const baselineSnapshot = { ...before };

  outer: for (const [sessionIndex, session] of scenario.sessions.entries()) {
    let handle = null; // a fresh host session at every session boundary
    for (const turn of session.turns) {
      let message = turn.prompt;
      let kind = "scripted";
      let replies = 0;
      let rules = [];
      for (;;) {
        if (calls >= scenario.limits.maxAgentCalls) { record.capped = true; break outer; }
        log(`  [${scenario.id} ${variant.label}] session ${sessionIndex + 1} ${turn.id} ${kind}`);
        const response = await adapter.send({ cwd: projectDir, runDir, message, session: handle, sessionIndex, model, effort });
        calls += 1;
        if (!handle && response.session) record.sessions.push(response.session);
        handle = response.session ?? handle;
        const after = await snapshotTrees(runDir);
        const changed = changedBetween(before, after, baselineSnapshot);
        before = after;
        const entry = { session: sessionIndex, sessionId: handle, turn: turn.id, kind, rules, message, reply: response.text, ms: response.ms, usage: response.usage ?? null, error: response.error ?? null, changed };
        if (hasProbe) {
          const artifact = await resolveArtifact(runDir, install.baselineCommit);
          entry.probe = await runProbe(scenario, { dir: artifact.dir, baselineDir, transcript: { turns: [...record.turns, entry] } });
          if (entry.probe?.wrongBuild && changed.length) wrongBuilds += 1;
        }
        record.turns.push(entry);
        if (response.error) { record.aborted = response.error; break outer; }
        const decision = respond({ text: response.text, policy: scenario.replyPolicy, probe: entry.probe ?? null, state, turn });
        if (!decision) break;
        if (replies >= scenario.limits.maxRepliesPerTurn) { record.capped = true; break; }
        replies += 1;
        interruptions += 1;
        message = decision.reply;
        kind = decision.kind;
        rules = decision.rules;
      }
    }
  }

  const artifact = await resolveArtifact(runDir, install.baselineCommit);
  const transcript = { turns: record.turns };
  const scored = await runChecks(scenario, { dir: artifact.dir, baselineDir, transcript });
  const usage = await adapter.collectUsage({ sessions: record.sessions, runDir, startedAt });
  const finishedAt = new Date();
  record.finishedAt = finishedAt.toISOString();
  record.artifact = { from: artifact.from, unintegratedLanes: artifact.unintegratedLanes };
  record.checks = scored.results;
  record.usage = usage;
  const failedByTag = {};
  for (const r of scored.results) {
    if (r.tag && r.pass !== null) failedByTag[r.tag] = (failedByTag[r.tag] ?? 0) + (r.pass ? 0 : 1);
  }
  record.metrics = {
    checksPassed: scored.passed,
    checksTotal: scored.total,
    passRate: scored.total ? scored.passed / scored.total : 0,
    browserChecks: scored.browser,
    wrongBuilds,
    interruptions,
    totalTokens: usage.totalTokens,
    uncachedInput: usage.uncachedInput,
    modelCalls: usage.modelCalls,
    subagents: usage.subagents,
    wallSeconds: Math.round(record.turns.reduce((a, t) => a + (t.ms ?? 0), 0) / 100) / 10,
    agentCalls: calls,
    ...Object.fromEntries(Object.entries(failedByTag).map(([tag, n]) => [`failed_${tag}`, n]))
  };
  const { metrics } = await loadChecks(scenario);
  if (metrics) Object.assign(record.metrics, await metrics({ record, checks: scored.results }));

  if (resultsDir) await writeJson(path.join(resultsDir, `${runId}.json`), record);
  if (!keep) await fs.rm(runDir, { recursive: true, force: true });
  return record;
}
