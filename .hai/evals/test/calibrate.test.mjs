// Tests for the calibration runner. They use only the stub host: no model is called.
// Run from the repository root: node --test .hai/evals/test/
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createClaudeAdapter } from "../lib/adapters/claude.mjs";
import { createCodexAdapter } from "../lib/adapters/codex.mjs";
import { createStubAdapter } from "../lib/adapters/stub.mjs";
import { runChecks } from "../lib/checks.mjs";
import { aggregate, renderReport, verdict } from "../lib/report.mjs";
import { runScenario } from "../lib/runner.mjs";
import { listScenarios, loadScenario } from "../lib/scenarios.mjs";
import { isWaiting, respond } from "../lib/scripted-user.mjs";
import { git, safeRunRoot } from "../lib/util.mjs";
import { parseVariant, prepareProject } from "../lib/variants.mjs";
import { parseArgs, reportCommand, runCommand } from "../calibrate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const evalsDir = path.resolve(here, "..");
// The HAI-Harness source tree that contains this suite serves as the harness variant.
const harnessSource = path.resolve(evalsDir, "..", "..");

const created = [];
async function tempDir(prefix = "hai-cal-test-") {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  created.push(dir);
  return dir;
}
test.after(async () => {
  for (const dir of created) await fs.rm(dir, { recursive: true, force: true });
});

const quiet = () => {};

test("six scenarios are present, each with fixture, prompts and checks", async () => {
  const names = await listScenarios();
  assert.deepEqual(names.map((n) => n[0]), ["a", "b", "c", "d", "e", "f"]);
  for (const name of names) {
    const s = await loadScenario(name);
    assert.ok(s.tests && s.title, `${name} states what it tests`);
    assert.ok(s.sessions.length >= 1 && s.sessions.every((x) => x.turns.length));
    await fs.access(s.fixtureDir);
    await fs.access(s.checksFile);
  }
  assert.equal((await loadScenario("c")).sessions.length, 2, "scenario C has a session break");
});

test("variant install: none stays bare, a source tree is installed with Claudia as default", async () => {
  const root = await tempDir();
  const scenario = await loadScenario("a");
  const bare = await prepareProject({ runDir: path.join(root, "bare"), fixtureDir: scenario.fixtureDir, variant: await parseVariant("none"), adapter: createClaudeAdapter() });
  await assert.rejects(fs.access(path.join(bare.projectDir, ".hai")));
  await assert.rejects(fs.access(path.join(bare.projectDir, "AGENTS.md")));
  await assert.rejects(fs.access(path.join(bare.projectDir, "CLAUDE.md")));

  const variant = await parseVariant(`current=${harnessSource}`);
  assert.equal(variant.label, "current");
  const installed = await prepareProject({ runDir: path.join(root, "harness"), fixtureDir: scenario.fixtureDir, variant, adapter: createClaudeAdapter() });
  const agents = await fs.readFile(path.join(installed.projectDir, "AGENTS.md"), "utf8");
  assert.match(agents, /<!-- hai-harness:start default=claudia -->/);
  await fs.access(path.join(installed.projectDir, ".hai", "Agents", "onboarding.md"));
  assert.equal(await fs.readFile(path.join(installed.projectDir, "CLAUDE.md"), "utf8"), "@AGENTS.md\n");
  assert.deepEqual(installed.install.hostFiles, ["CLAUDE.md"]);
  assert.equal(await git(installed.projectDir, ["status", "--porcelain"]), "", "baseline is committed, so `worktree create` sees a clean primary");
  assert.equal(await git(installed.projectDir, ["rev-parse", "HEAD"]), installed.install.baselineCommit);

  // Codex reads AGENTS.md itself; no CLAUDE.md is added.
  const codex = await prepareProject({ runDir: path.join(root, "codex"), fixtureDir: scenario.fixtureDir, variant, adapter: createCodexAdapter() });
  await assert.rejects(fs.access(path.join(codex.projectDir, "CLAUDE.md")));
  await assert.rejects(parseVariant(root), /not a HAI-Harness source tree/);
});

test("multi-turn scripted run: go-ahead and integration requests are answered and counted", async () => {
  const root = await tempDir();
  const adapter = createStubAdapter();
  const record = await runScenario({ scenario: await loadScenario("a"), variant: await parseVariant(`current=${harnessSource}`), adapter, host: "stub", workdir: root, resultsDir: path.join(root, "results"), log: quiet });
  assert.deepEqual(record.turns.map((t) => `${t.turn}:${t.kind}`), ["stage1:scripted", "stage1:go-ahead", "stage1:integration", "stage2:scripted", "stage3:scripted"]);
  assert.equal(record.turns[1].message, "Yes, go ahead.");
  assert.equal(record.turns[2].message, "Yes, approve and integrate it.");
  assert.equal(record.metrics.interruptions, 2);
  assert.equal(record.metrics.agentCalls, 5);
  assert.equal(record.metrics.subagents, 1);
  assert.equal(record.turns[0].changed.length, 0, "creating a lane is not a change");
  assert.ok(record.turns[1].changed.includes("lane:clay-signup/signup.js"));
  assert.equal(record.artifact.from, "primary", "integrated work is scored from the primary checkout");
  assert.equal(record.metrics.checksPassed, record.metrics.checksTotal);
  assert.equal(record.sessions.length, 1);
  assert.ok(adapter.calls.slice(1).every((c) => !c.newSession), "same chat: every later call resumes the session");
  assert.ok(record.runDir.startsWith(await fs.realpath(root)), "the run executes under the given workdir");
  const saved = JSON.parse(await fs.readFile(path.join(root, "results", `${record.id}.json`), "utf8"));
  assert.equal(saved.metrics.checksPassed, record.metrics.checksPassed);
  assert.equal(saved.model, "host-default");
});

test("fresh-session break: session 2 starts a new host session", async () => {
  const root = await tempDir();
  const adapter = createStubAdapter();
  const record = await runScenario({ scenario: await loadScenario("c"), variant: await parseVariant("none"), adapter, host: "stub", workdir: root, log: quiet });
  assert.equal(record.aborted, null);
  assert.deepEqual(adapter.calls.map((c) => c.newSession), [true, true, false]);
  assert.equal(record.sessions.length, 2);
  assert.notEqual(record.sessions[0], record.sessions[1]);
  assert.deepEqual(record.turns.map((t) => t.session), [0, 1, 1]);
  assert.equal(record.metrics.lostRequirements, 0);

  // A stub step that demands a new session fails loudly when the runner resumes instead.
  const strict = createStubAdapter({ script: [{ reply: "one" }, { reply: "two", expectNewSession: true }] });
  const bad = await runScenario({ scenario: await loadScenario("a"), variant: await parseVariant("none"), adapter: strict, host: "stub", workdir: root, log: quiet });
  assert.match(bad.aborted, /expected a new session/);
});

test("scoring: reference solutions pass, bare fixtures fail, browser checks stay out of the score", async () => {
  for (const name of await listScenarios()) {
    const scenario = await loadScenario(name);
    const root = await tempDir();
    const solved = path.join(root, "solved");
    await fs.cp(scenario.fixtureDir, solved, { recursive: true });
    await fs.cp(path.join(scenario.dir, "stub", "solution"), solved, { recursive: true });
    // The transcript-kind checks (D, F) need a reply: give the one a careful agent would.
    const transcript = { turns: [{ reply: "Which cards should change, and which badge?", changed: [] }, { reply: "Done.", changed: ["styles.css"] }] };
    const good = await runChecks(scenario, { dir: solved, baselineDir: scenario.fixtureDir, transcript });
    const failing = good.results.filter((r) => r.pass === false).map((r) => `${r.id}: ${r.detail}`);
    assert.deepEqual(failing, [], `${name} reference solution`);
    assert.ok(good.results.filter((r) => r.kind === "browser").every((r) => r.pass === null));
    assert.equal(good.total + good.browser, good.results.length);

    const bare = await runChecks(scenario, { dir: scenario.fixtureDir, baselineDir: scenario.fixtureDir, transcript: { turns: [] } });
    assert.ok(bare.passed < bare.total * 0.6, `${name}: the untouched fixture passes ${bare.passed}/${bare.total}`);
  }
});

test("scoring: unintegrated lane work is scored from the lane and reported", async () => {
  const root = await tempDir();
  const script = [{ reply: "Built it in the lane. Approve integration?", overlay: path.join((await loadScenario("a")).dir, "stub", "solution"), target: "lane:signup" }, { reply: "Waiting." }];
  const adapter = createStubAdapter({ script, scriptDir: "/" });
  const scenario = { ...(await loadScenario("a")), sessions: [{ turns: [{ id: "only", prompt: "Build it." }] }], limits: { maxAgentCalls: 2, maxRepliesPerTurn: 1 } };
  const record = await runScenario({ scenario, variant: await parseVariant(`current=${harnessSource}`), adapter, host: "stub", workdir: root, log: quiet });
  assert.equal(record.artifact.from, "lane:signup");
  assert.deepEqual(record.artifact.unintegratedLanes, ["signup"]);
  assert.equal(record.checks.find((c) => c.id === "valid_signup").pass, true);
});

test("scenario metrics: wrong builds (D), stale requirements (B), fix attempts (E), leaks (F)", async () => {
  const root = await tempDir();
  const run = async (name, kind, script) => runScenario({ scenario: await loadScenario(name), variant: kind === "none" ? await parseVariant("none") : await parseVariant(`current=${harnessSource}`), adapter: createStubAdapter(script ? { script, scriptDir: path.join((await loadScenario(name)).dir, "stub") } : {}), host: "stub", workdir: root, log: quiet });

  const dGuess = await run("d", "none");
  assert.equal(dGuess.metrics.wrongBuilds, 1);
  assert.equal(dGuess.metrics.askedFirst, 0);
  const dAsk = await run("d", "harness");
  assert.equal(dAsk.metrics.wrongBuilds, 0);
  assert.equal(dAsk.metrics.askedFirst, 1);
  assert.equal(dAsk.turns[1].kind, "clarification");
  assert.match(dAsk.turns[1].message, /Only the cards under Today's specials/);
  assert.match(dAsk.turns[1].message, /Only the Vegan badge/);

  const staleFiles = { "signup.js": (await fs.readFile(path.join((await loadScenario("b")).dir, "stub", "solution", "signup.js"), "utf8")).replace("const CAPACITY = 6", "const CAPACITY = 8").replace(".trim().toLowerCase()", ".toLowerCase()") };
  const bStale = await run("b", "none", [{}, {}, {}, {}, {}, { reply: "Built.", files: staleFiles }, { reply: "Waitlist added." }]);
  assert.equal(bStale.metrics.failed_stale, 2, "8 places and the exact-match rule survived");

  const eNone = await run("e", "none");
  assert.equal(eNone.metrics.fixAttempts, 2);
  assert.equal(eNone.turns[1].kind, "follow-up", "the scripted user reports the bug is still there");
  assert.equal(eNone.turns[0].probe.bugFixed, false);
  assert.equal(eNone.turns[1].probe.bugFixed, true);
  const eHarness = await run("e", "harness");
  assert.equal(eHarness.metrics.fixAttempts, 1);
  assert.equal(eHarness.metrics.causeFound, 1);

  const fNone = await run("f", "none");
  assert.equal(fNone.metrics.leak, 1);
  assert.equal(fNone.metrics.defectCaught, 0);
  const fHarness = await run("f", "harness");
  assert.equal(fHarness.metrics.leak, 0);
  assert.equal(fHarness.metrics.defectCaught, 1);
});

test("scripted user: waiting detection, clarifications, fallback, follow-up cap, discussion turns", async () => {
  const d = await loadScenario("d");
  const state = { followUpsUsed: {} };
  assert.equal(isWaiting("All done. Let me know if you want changes."), false);
  assert.equal(isWaiting("Should the price go top-right?"), true);
  const clar = respond({ text: "Which corner should the price go in?", policy: d.replyPolicy, state });
  assert.equal(clar.kind, "clarification");
  assert.match(clar.reply, /top-right corner/);
  assert.equal(respond({ text: "What colour is your logo?", policy: {}, state }).kind, "unmatched");
  assert.equal(respond({ text: "Built it.", policy: {}, state }), null);
  assert.equal(respond({ text: "Which do you prefer?", policy: {}, state, turn: { answerQuestions: false } }), null);
  const e = await loadScenario("e");
  const first = respond({ text: "Fixed.", policy: e.replyPolicy, probe: { bugFixed: false }, state });
  assert.equal(first.kind, "follow-up");
  respond({ text: "Fixed.", policy: e.replyPolicy, probe: { bugFixed: false }, state });
  assert.equal(respond({ text: "Fixed.", policy: e.replyPolicy, probe: { bugFixed: false }, state }), null, "capped at maxTimes");
  assert.equal(respond({ text: "Fixed.", policy: e.replyPolicy, probe: { bugFixed: true }, state: { followUpsUsed: {} } }), null);
});

test("turn cap: a run stops at maxAgentCalls and is marked capped", async () => {
  const root = await tempDir();
  const script = Array.from({ length: 10 }, () => ({ reply: "Shall I go ahead?" }));
  const scenario = { ...(await loadScenario("a")), limits: { maxAgentCalls: 3, maxRepliesPerTurn: 10 } };
  const record = await runScenario({ scenario, variant: await parseVariant("none"), adapter: createStubAdapter({ script }), host: "stub", workdir: root, log: quiet });
  assert.equal(record.capped, true);
  assert.equal(record.metrics.agentCalls, 3);
});

function fakeRecord({ variant, passRate, tokens = 1000, seconds = 100, wrongBuilds = 0, model = "m1", scenario = "a-same-chat-build" }) {
  return { schema: 1, scenario, model, host: "stub", variant: { label: variant }, metrics: { passRate, totalTokens: tokens, wallSeconds: seconds, wrongBuilds, interruptions: 0 } };
}

test("report verdicts: inconclusive below three runs, helps, hurts, no measurable effect", () => {
  const cellsOf = (records) => aggregate(records)[0];
  const many = (n, spec) => Array.from({ length: n }, (_, i) => fakeRecord({ ...spec, passRate: Array.isArray(spec.passRate) ? spec.passRate[i] : spec.passRate }));

  let g = cellsOf([...many(2, { variant: "none", passRate: 0.5 }), ...many(3, { variant: "h", passRate: 1 })]);
  assert.equal(g.verdicts.h.verdict, "inconclusive");
  assert.match(g.verdicts.h.reason, /3 vs 2 runs/);

  g = cellsOf([...many(3, { variant: "none", passRate: [0.6, 0.62, 0.58] }), ...many(3, { variant: "h", passRate: [0.9, 0.92, 0.88] })]);
  assert.equal(g.verdicts.h.verdict, "helps");

  g = cellsOf([...many(3, { variant: "none", passRate: 0.9 }), ...many(3, { variant: "h", passRate: 0.9, tokens: 2000 })]);
  assert.equal(g.verdicts.h.verdict, "hurts");
  assert.match(g.verdicts.h.reason, /higher cost/);

  g = cellsOf([...many(3, { variant: "none", passRate: 0.9 }), ...many(3, { variant: "h", passRate: 0.9, tokens: 1100, seconds: 110 })]);
  assert.equal(g.verdicts.h.verdict, "no measurable effect");

  g = cellsOf([...many(3, { variant: "none", passRate: 0.9 }), ...many(3, { variant: "h", passRate: 0.6 })]);
  assert.equal(g.verdicts.h.verdict, "hurts");

  g = cellsOf([...many(3, { variant: "none", passRate: [0.2, 1, 0.6] }), ...many(3, { variant: "h", passRate: [1, 0.4, 0.8] })]);
  assert.equal(g.verdicts.h.verdict, "inconclusive", "a pass-rate change inside the noise");

  g = cellsOf([...many(3, { variant: "none", passRate: 0.9, wrongBuilds: 1 }), ...many(3, { variant: "h", passRate: 0.9, tokens: 1500 })]);
  assert.equal(g.verdicts.h.verdict, "helps", "fewer wrong builds count as quality");

  // Thresholds are configurable: a stricter minimum keeps three runs inconclusive.
  const base = { runs: 3, metrics: { passRate: { mean: 0.5, sd: 0 }, totalTokens: { mean: 1 }, wallSeconds: { mean: 1 } } };
  const cand = { runs: 3, metrics: { passRate: { mean: 1, sd: 0 }, totalTokens: { mean: 1 }, wallSeconds: { mean: 1 } } };
  assert.equal(verdict(cand, base).verdict, "helps");
  assert.equal(verdict(cand, base, { minRuns: 5 }).verdict, "inconclusive");

  const text = renderReport(aggregate([...many(3, { variant: "none", passRate: 0.9 }), ...many(1, { variant: "h", passRate: 0.9 })]));
  assert.match(text, /\| none \(base\) \| 3 \|/);
  assert.match(text, /\| h \| 1 \|/);
  assert.match(text, /\*\*inconclusive\*\*/);
});

test("CLI: run with the stub host then report from saved records", async () => {
  const root = await tempDir();
  const results = path.join(root, "results");
  const { command, opts } = parseArgs(["run", "--host", "stub", "--scenario", "f", "--variant", "none", "--variant", `current=${harnessSource}`, "--repeats", "3", "--workdir", root, "--results", results, "--no-keep", "--model-label", "stub-model"]);
  assert.equal(command, "run");
  const records = await runCommand(opts, { log: quiet });
  assert.equal(records.length, 6);
  assert.deepEqual(records.map((r) => r.variant.label), ["none", "current", "current", "none", "none", "current"], "order is counterbalanced across repeats");
  const report = await reportCommand({ results, base: "none" });
  assert.match(report, /## f-risk-review \| model stub-model \| host stub/);
  assert.match(report, /\*\*current\*\* vs none: \*\*helps\*\*/);
  const json = JSON.parse(await reportCommand({ results, base: "none", json: true }));
  assert.equal(json[0].cells.none.runs, 3);
  await assert.rejects(runCommand({ host: "stub" }, { log: quiet }), /--variant/);
  await assert.rejects(runCommand({ variant: ["none"] }, { log: quiet }), /--host/);
});

test("CLI: a repeated --scenario accumulates; other repeated flags fail clearly", async () => {
  const { opts } = parseArgs(["run", "--scenario", "d", "--scenario", "c,e", "--host", "stub"]);
  assert.deepEqual(opts.scenario, ["d", "c,e"]);
  const root = await tempDir();
  const records = await runCommand({ ...opts, variant: ["none"], workdir: root, results: path.join(root, "results"), "no-keep": true }, { log: quiet });
  assert.deepEqual(records.map((r) => r.scenario), ["d-ambiguous-visual", "c-fresh-chat", "e-misplaced-bug"], "every listed scenario ran, in order");
  const dupes = await runCommand({ host: "stub", variant: ["none"], scenario: ["f", "f-risk-review"], workdir: root, results: path.join(root, "results"), "no-keep": true }, { log: quiet });
  assert.equal(dupes.length, 1, "the same scenario named twice runs once");
  assert.throws(() => parseArgs(["run", "--host", "stub", "--host", "claude"]), /--host was given more than once/);
  assert.throws(() => parseArgs(["run", "--model", "x", "--model", "y"]), /--model was given more than once/);
  assert.throws(() => parseArgs(["run", "--scenario", "--host", "stub"]), /--scenario needs a value/);
  const report = await reportCommand({ results: path.join(root, "results"), scenario: ["d", "e"] });
  assert.match(report, /## d-ambiguous-visual/);
  assert.match(report, /## e-misplaced-bug/);
  assert.doesNotMatch(report, /## c-fresh-chat|## f-risk-review/);
});

test("user config: records hold path and hash only; the report warns when compared runs differ", async () => {
  const root = await tempDir();
  const userDir = path.join(root, "user");
  await fs.mkdir(userDir);
  const instructions = path.join(userDir, "CLAUDE.md");
  const settings = path.join(userDir, "settings.json");
  const missing = path.join(userDir, "settings.local.json");
  await fs.writeFile(instructions, "SECRET-INSTRUCTION-TEXT");
  await fs.writeFile(settings, "{\"theme\":\"dark\"}");
  const files = [instructions, settings, missing];
  const results = path.join(root, "results");
  const run = async (label) => runScenario({ scenario: await loadScenario("f"), variant: label === "none" ? await parseVariant("none") : await parseVariant(`current=${harnessSource}`), adapter: createStubAdapter({ userConfigFiles: files }), host: "stub", workdir: root, resultsDir: results, log: quiet });

  const first = await run("none");
  assert.deepEqual(first.userConfig.map((f) => [path.basename(f.path), f.present]), [["CLAUDE.md", true], ["settings.json", true], ["settings.local.json", false]]);
  assert.match(first.userConfig[0].sha256, /^[0-9a-f]{64}$/);
  const saved = await fs.readFile(path.join(results, `${first.id}.json`), "utf8");
  assert.doesNotMatch(saved, /SECRET-INSTRUCTION-TEXT|theme/, "no file content in the record");
  await run("current");
  assert.doesNotMatch(await reportCommand({ results }), /Warning/, "same files, no warning");

  await fs.writeFile(instructions, "changed instructions");
  await run("current");
  const report = await reportCommand({ results });
  assert.match(report, /\*\*Warning:\*\* user-level files differ between the compared runs: .*CLAUDE\.md/);
  assert.doesNotMatch(report.split("Warning")[1].split("\n")[0], /settings\.json/, "only the file that changed is named");

  // Real adapters list the host's user-level instruction and settings files.
  assert.ok(createClaudeAdapter({ configDir: path.join(os.homedir(), ".claude") }).userConfigFiles().some((f) => f.endsWith(path.join(".claude", "CLAUDE.md"))));
  assert.ok(createCodexAdapter({ home: path.join(os.homedir(), ".codex") }).userConfigFiles().some((f) => f.endsWith("config.toml")));
});

test("safety: runs refuse Documents folders and existing Git repositories", async () => {
  await assert.rejects(safeRunRoot(path.join(os.homedir(), "Documents", "ProductLab", "x")), /Refusing/);
  const repo = await tempDir();
  await git(repo, ["init", "-q"]);
  await assert.rejects(safeRunRoot(path.join(repo, "sub")), /inside the Git repository/);
  assert.equal(await safeRunRoot(null), await fs.realpath(os.tmpdir()));
});

test("adapters: no blanket permission bypass by default, no model unless given", () => {
  const claude = createClaudeAdapter();
  const fresh = claude.buildArgs({ message: "hi", session: null, runDir: "/tmp/run" });
  assert.ok(fresh.includes("--session-id") && !fresh.includes("--resume"));
  assert.ok(!fresh.includes("--dangerously-skip-permissions") && !fresh.includes("--model") && !fresh.includes("--effort"));
  assert.equal(fresh[fresh.indexOf("--permission-mode") + 1], "acceptEdits");
  assert.equal(fresh[fresh.indexOf("--permission-prompts") + 1], "none");
  const resumed = claude.buildArgs({ message: "hi", session: "abc", model: "label-x", effort: "high" });
  assert.equal(resumed[resumed.indexOf("--resume") + 1], "abc");
  assert.equal(resumed[resumed.indexOf("--model") + 1], "label-x");
  assert.ok(createClaudeAdapter({ dangerousBypass: true }).buildArgs({ message: "x" }).includes("--dangerously-skip-permissions"));

  const codex = createCodexAdapter();
  const c1 = codex.buildArgs({ message: "hi", cwd: "/tmp/run/project", runDir: "/tmp/run", lastMessageFile: "/tmp/l" });
  assert.deepEqual(c1.slice(0, 2), ["exec", "--json"]);
  assert.equal(c1[c1.indexOf("-s") + 1], "workspace-write");
  assert.ok(!c1.includes("--dangerously-bypass-approvals-and-sandbox") && !c1.includes("-m"));
  const c2 = codex.buildArgs({ message: "again", session: "t-1", effort: "low", lastMessageFile: "/tmp/l" });
  assert.deepEqual(c2.slice(0, 2), ["exec", "resume"]);
  assert.deepEqual(c2.slice(-2), ["t-1", "again"]);
  assert.ok(c2.includes('model_reasoning_effort="low"') && !c2.includes("-C"));
});

test("no model name is hard-coded in the runner, adapters or scenarios", async () => {
  const pattern = /\b(haiku|sonnet|opus|fable|gpt-\d|o\d-mini|claude-[a-z]+-\d|codex-mini)\b/i;
  const offenders = [];
  const visit = async (dir) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!["haiku-2026-10-14", "results", "test"].includes(entry.name)) await visit(full);
      } else if (/\.(mjs|js|json)$/.test(entry.name) && !["protocol.json"].includes(entry.name)) {
        if (pattern.test(await fs.readFile(full, "utf8"))) offenders.push(path.relative(evalsDir, full));
      }
    }
  };
  await visit(evalsDir);
  assert.deepEqual(offenders, []);
});
