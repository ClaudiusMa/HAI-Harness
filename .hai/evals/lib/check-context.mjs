// What a scenario check receives. Checks run in a separate Node process per check (see
// check-worker.mjs), so module state the agent's code keeps cannot leak between checks.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { diffSnapshots, listFiles, run, snapshot } from "./util.mjs";

// The environment checks run commands in. A `node --test` started under another test
// runner inherits NODE_TEST_CONTEXT and then reports to the parent instead of exiting
// with its own status, so that variable is removed.
export function cleanEnv() {
  const env = { ...process.env, TZ: "UTC" };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

export function makeContext({ dir, baselineDir, transcript = { turns: [] } }) {
  const read = async (rel, root = dir) => fs.readFile(path.join(root, rel), "utf8").catch(() => null);
  return {
    dir,
    baselineDir,
    transcript,
    read,
    readBaseline: (rel) => read(rel, baselineDir),
    exists: (rel) => fs.access(path.join(dir, rel)).then(() => true, () => false),
    files: () => listFiles(dir),
    async changedFiles() {
      return diffSnapshots(await snapshot(baselineDir), await snapshot(dir));
    },
    async importModule(rel) {
      return import(`${pathToFileURL(path.join(dir, rel)).href}?t=${Date.now()}`);
    },
    run: (command, args, options = {}) => run(command, args, { cwd: dir, timeoutMs: 20000, env: cleanEnv(), ...options }),
    // Agent replies, in order, each with the files it changed: [{ text, changed, session, kind }].
    replies: () => transcript.turns.map((t) => ({ text: t.reply ?? "", changed: t.changed ?? [], session: t.session, kind: t.kind })),
    finalReply: () => [...transcript.turns].reverse().find((t) => t.reply)?.reply ?? ""
  };
}

// In-memory stand-in for window.localStorage.
export function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
    dump: () => Object.fromEntries(data)
  };
}

// A minimal CSS rule reader for fixture-sized stylesheets: strips comments, flattens
// @media blocks (their rules are returned with the media text), and returns
// [{ selector, decls: {prop: value}, media }]. It is not a full parser; checks that rely
// on it say so in their description.
export function parseCss(text) {
  const rules = [];
  const source = (text ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
  const walk = (body, media) => {
    let i = 0;
    while (i < body.length) {
      const open = body.indexOf("{", i);
      if (open < 0) break;
      const head = body.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < body.length && depth > 0) {
        if (body[j] === "{") depth += 1;
        else if (body[j] === "}") depth -= 1;
        j += 1;
      }
      const inner = body.slice(open + 1, j - 1);
      if (head.startsWith("@media") || head.startsWith("@supports") || head.startsWith("@layer") || head.startsWith("@container")) walk(inner, head);
      else if (!head.startsWith("@")) {
        const decls = {};
        for (const part of inner.split(";")) {
          const colon = part.indexOf(":");
          if (colon > 0) decls[part.slice(0, colon).trim().toLowerCase()] = part.slice(colon + 1).trim().replace(/\s*!important$/, "");
        }
        for (const selector of head.split(",").map((s) => s.trim()).filter(Boolean)) rules.push({ selector, decls, media: media ?? null });
      }
      i = j;
    }
  };
  walk(source, null);
  return rules;
}

const NAMED = { green: "#008000", lime: "#00ff00", forestgreen: "#228b22", seagreen: "#2e8b57", mediumseagreen: "#3cb371", limegreen: "#32cd32", darkgreen: "#006400", olivedrab: "#6b8e23", yellowgreen: "#9acd32", springgreen: "#00ff7f", lightgreen: "#90ee90", palegreen: "#98fb98", darkseagreen: "#8fbc8f", teal: "#008080", olive: "#808000", gray: "#808080", grey: "#808080", white: "#ffffff", black: "#000000", yellow: "#ffff00", gold: "#ffd700", orange: "#ffa500", red: "#ff0000" };

// Returns { h, s, l } (h in degrees, s and l in 0..1) for hex, rgb(), hsl() or a few named
// colors found in a CSS value; null when none is recognised.
export function parseColor(value) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  let r; let g; let b;
  const hex = v.match(/#([0-9a-f]{3,8})\b/);
  const rgb = v.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  const hsl = v.match(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/);
  if (hsl) return { h: Number(hsl[1]) % 360, s: Number(hsl[2]) / 100, l: Number(hsl[3]) / 100 };
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
    [r, g, b] = [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16));
  } else if (rgb) {
    [r, g, b] = rgb.slice(1, 4).map(Number);
  } else {
    const word = Object.keys(NAMED).find((name) => new RegExp(`\\b${name}\\b`).test(v));
    if (!word) return null;
    return parseColor(NAMED[word]);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

export function isGreen(value) {
  const c = parseColor(value);
  return Boolean(c && c.h >= 75 && c.h <= 170 && c.s >= 0.2 && c.l > 0.08 && c.l < 0.92);
}

// Pixel length of a CSS value such as "240px", "15rem" (16px root) or "min(240px, 50vw)";
// the largest px/rem figure wins. Null when there is none.
export function pxValue(value) {
  if (!value) return null;
  const found = [...String(value).matchAll(/([\d.]+)\s*(px|rem|em)\b/g)].map((m) => Number(m[1]) * (m[2] === "px" ? 1 : 16));
  return found.length ? Math.max(...found) : null;
}

// The HTML of the first element whose opening tag carries the given class, matched by
// tag balance. Good enough for fixture-shaped markup; not a general HTML parser.
export function elementByClass(html, className) {
  const open = new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "i");
  const match = open.exec(html ?? "");
  if (!match) return null;
  const tag = match[1];
  const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  tagRe.lastIndex = match.index;
  let depth = 0;
  let m;
  while ((m = tagRe.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(match.index, m.index + m[0].length);
  }
  return null;
}

export const squash = (text) => (text ?? "").replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
