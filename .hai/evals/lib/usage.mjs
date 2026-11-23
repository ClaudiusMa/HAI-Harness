// Token and call counting from the hosts' own session records. These are ports of
// ../claude_usage.py (Claude Code transcripts) and ../usage.py (Codex rollouts) so the
// numbers stay comparable with the earlier pilots.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const emptyUsage = () => ({ input: 0, cacheCreation: 0, cachedInput: 0, output: 0, modelCalls: 0, subagents: 0, models: {} });

export function finishUsage(u, source) {
  return {
    ...u,
    totalTokens: u.input + u.cacheCreation + u.cachedInput + u.output,
    // Uncached input: input that was not a cache read (fresh input plus cache writes).
    uncachedInput: u.input + u.cacheCreation,
    source
  };
}

async function jsonl(file) {
  const text = await fs.readFile(file, "utf8").catch(() => "");
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { /* partial line */ }
  }
  return rows;
}

// ---- Claude Code ------------------------------------------------------------------------

export function claudeConfigDir(explicit) {
  return explicit ?? process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), ".claude");
}

// Finds <configDir>/projects/<project>/<sessionId>.jsonl and its subagents folder.
export async function findClaudeTranscripts(sessionId, configDir) {
  const projects = path.join(configDir, "projects");
  for (const project of await fs.readdir(projects).catch(() => [])) {
    const main = path.join(projects, project, `${sessionId}.jsonl`);
    if (await fs.access(main).then(() => true, () => false)) {
      const subDir = path.join(projects, project, sessionId, "subagents");
      const subs = (await fs.readdir(subDir).catch(() => [])).filter((f) => f.endsWith(".jsonl")).map((f) => path.join(subDir, f));
      return { main, subagents: subs };
    }
  }
  return null;
}

// Sums assistant usage over the main transcripts and every subagent transcript. Streamed
// assistant entries share a message id; each id counts once (as in claude_usage.py).
export async function claudeUsage(sessionIds, { configDir } = {}) {
  const dir = claudeConfigDir(configDir);
  const u = emptyUsage();
  const seen = new Set();
  const missing = [];
  const subagentFiles = new Set();
  for (const id of new Set(sessionIds)) {
    const found = await findClaudeTranscripts(id, dir);
    if (!found) { missing.push(id); continue; }
    for (const file of [found.main, ...found.subagents]) {
      if (file !== found.main) subagentFiles.add(file);
      for (const r of await jsonl(file)) {
        if (r.type !== "assistant") continue;
        const msg = r.message ?? {};
        if (!msg.id || seen.has(msg.id)) continue;
        seen.add(msg.id);
        const usage = msg.usage ?? {};
        u.input += usage.input_tokens ?? 0;
        u.cacheCreation += usage.cache_creation_input_tokens ?? 0;
        u.cachedInput += usage.cache_read_input_tokens ?? 0;
        u.output += usage.output_tokens ?? 0;
        u.modelCalls += 1;
        if (msg.model) u.models[msg.model] = (u.models[msg.model] ?? 0) + 1;
      }
    }
  }
  u.subagents = subagentFiles.size;
  return { ...finishUsage(u, "claude-transcripts"), missingSessions: missing };
}

// ---- Codex --------------------------------------------------------------------------------

export function codexHome(explicit) {
  return explicit ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
}

// Day folders (yyyy/mm/dd) between two dates, inclusive, in local time and UTC.
function dayFolders(start, end) {
  const days = new Set();
  const fmt = (d, utc) => {
    const y = utc ? d.getUTCFullYear() : d.getFullYear();
    const m = (utc ? d.getUTCMonth() : d.getMonth()) + 1;
    const day = utc ? d.getUTCDate() : d.getDate();
    return `${y}/${String(m).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
  };
  for (let t = start.getTime() - 86400000; t <= end.getTime() + 86400000; t += 86400000) {
    days.add(fmt(new Date(t), false));
    days.add(fmt(new Date(t), true));
  }
  return [...days];
}

// Sums the root threads and every spawned descendant, as usage.py does: the last
// total_token_usage per thread. Model calls are counted as token_count events whose
// last_token_usage changed (the host repeats some events; see controller_buckets.py).
export async function codexUsage(threadIds, { home, start = new Date(), end = new Date() } = {}) {
  const base = path.join(codexHome(home), "sessions");
  const rows = [];
  for (const day of dayFolders(start, end)) {
    const folder = path.join(base, ...day.split("/"));
    for (const name of await fs.readdir(folder).catch(() => [])) {
      if (!name.endsWith(".jsonl")) continue;
      const file = path.join(folder, name);
      const first = (await fs.readFile(file, "utf8").catch(() => "")).split("\n", 1)[0];
      let meta;
      try { meta = JSON.parse(first).payload ?? {}; } catch { continue; }
      const source = meta.source;
      const parent = source && typeof source === "object" ? source.subagent?.thread_spawn?.parent_thread_id ?? null : null;
      rows.push({ file, id: meta.id, parent });
    }
  }
  const ids = new Set(threadIds);
  let grew = true;
  while (grew) {
    grew = false;
    for (const row of rows) if (row.parent && ids.has(row.parent) && !ids.has(row.id)) { ids.add(row.id); grew = true; }
  }
  const u = emptyUsage();
  const found = new Set();
  for (const row of rows) {
    if (!ids.has(row.id) || found.has(row.id)) continue;
    found.add(row.id);
    if (row.parent) u.subagents += 1;
    let last = null;
    let previous = "";
    for (const r of await jsonl(row.file)) {
      const pl = r.payload ?? {};
      if (r.type === "event_msg" && pl.type === "token_count" && pl.info) {
        last = pl.info.total_token_usage ?? last;
        const key = JSON.stringify(pl.info.last_token_usage ?? null);
        if (key !== previous) { u.modelCalls += 1; previous = key; }
      }
      if (r.type === "turn_context" && pl.model) u.models[pl.model] = (u.models[pl.model] ?? 0) + 1;
    }
    if (last) {
      const cached = last.cached_input_tokens ?? 0;
      // Codex reports cached input as a subset of input.
      u.input += (last.input_tokens ?? 0) - cached;
      u.cachedInput += cached;
      u.output += last.output_tokens ?? 0;
    }
  }
  const missing = threadIds.filter((id) => !found.has(id));
  return { ...finishUsage(u, "codex-rollouts"), missingSessions: missing };
}
