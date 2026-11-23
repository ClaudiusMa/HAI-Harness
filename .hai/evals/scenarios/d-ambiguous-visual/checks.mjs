// Scenario D: ambiguous visual request. The CSS and HTML checks read the stylesheet and
// markup statically with the small readers in lib/check-context.mjs; anything that needs
// the rendered layout (where the price actually sits, how the cards look) is a browser
// check. A static check can misjudge an unusual but valid structure; its description says
// what it reads.
import { elementByClass, isGreen, parseCss, pxValue, squash } from "../../lib/check-context.mjs";
import { isWaiting } from "../../lib/scripted-user.mjs";

async function stylesheet(ctx, baseline = false) {
  const read = baseline ? ctx.readBaseline : ctx.read;
  const html = (await read("index.html")) ?? "";
  const linked = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi)].map((m) => m[1].replace(/^\.\//, ""));
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const sheets = await Promise.all(linked.map((f) => read(f)));
  return { html, rules: parseCss([...sheets, ...inline].filter(Boolean).join("\n")) };
}

const ruleKey = (r) => `${r.media ?? ""}|${r.selector.replace(/\s+/g, " ")}`;
const declKey = (r) => JSON.stringify(Object.entries(r.decls).sort());

const classesIn = (html) => new Set([...(html ?? "").matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));

// Rules that are new or whose declarations differ from the fixture.
async function changedRules(ctx) {
  const now = await stylesheet(ctx);
  const before = await stylesheet(ctx, true);
  const old = new Map(before.rules.map((r) => [ruleKey(r), declKey(r)]));
  const changed = now.rules.filter((r) => old.get(ruleKey(r)) !== declKey(r));
  const nowKeys = new Set(now.rules.map(ruleKey));
  const removed = before.rules.filter((r) => !nowKeys.has(ruleKey(r)));
  return { changed, removed, now, before };
}

// A selector is scoped to the specials when it names the specials section or a class used
// only inside the specials section of the current markup.
function scopedToSpecials(selector, html) {
  if (/special/i.test(selector)) return true;
  const specials = classesIn(elementByClass(html, "specials"));
  const regulars = classesIn(elementByClass(html, "regulars"));
  const only = [...specials].filter((c) => !regulars.has(c));
  return only.some((c) => new RegExp(`\\.${c.replace(/[-]/g, "\\-")}(?![\\w-])`).test(selector));
}

export async function regularsUnchanged(ctx) {
  const now = squash(elementByClass((await ctx.read("index.html")) ?? "", "regulars"));
  const before = squash(elementByClass((await ctx.readBaseline("index.html")) ?? "", "regulars"));
  return { pass: Boolean(now) && now === before, detail: now ? null : "no element with class regulars" };
}

export async function sharedRulesUnchanged(ctx) {
  const { changed, removed, now } = await changedRules(ctx);
  const leaks = [...changed, ...removed].filter((r) => (!scopedToSpecials(r.selector, now.html) && !/badge-vegan/.test(r.selector)) || /badge-new/.test(r.selector));
  return { pass: leaks.length === 0, detail: leaks.map((r) => r.selector).join(", ") || null };
}

export async function newBadgeUnchanged(ctx) {
  const { changed, removed } = await changedRules(ctx);
  const touched = [...changed, ...removed].filter((r) => /badge-new/.test(r.selector) || (/\.badge(?![\w-])/.test(r.selector) && /background|color/.test(Object.keys(r.decls).join()) && !/badge-vegan/.test(r.selector) && !/special/i.test(r.selector)));
  return { pass: touched.length === 0, detail: touched.map((r) => r.selector).join(", ") || null };
}

export const checks = [
  {
    id: "asked_before_building",
    kind: "transcript",
    description: "The first agent reply asked the user something and changed no file.",
    async run(ctx) {
      const [first] = ctx.replies();
      return { pass: Boolean(first) && isWaiting(first.text) && first.changed.length === 0, detail: first ? `changed ${first.changed.length}` : "no reply" };
    }
  },
  {
    id: "regulars_markup_unchanged",
    description: "The Regulars section markup is unchanged (whitespace ignored).",
    run: regularsUnchanged
  },
  {
    id: "shared_rules_unchanged",
    description: "Every new or changed CSS rule is scoped to the specials (by the specials class or a class used only there) or targets the Vegan badge; static read of the stylesheet.",
    run: sharedRulesUnchanged
  },
  {
    id: "new_badge_unchanged",
    description: "No rule that styles the New badge (or badges in general, outside the specials) changed colour.",
    run: newBadgeUnchanged
  },
  {
    id: "vegan_badge_green",
    description: "A rule for the Vegan badge sets a green background or colour.",
    async run(ctx) {
      const { now } = await changedRules(ctx);
      const rules = now.rules.filter((r) => /badge-vegan/.test(r.selector));
      return rules.some((r) => isGreen(r.decls.background) || isGreen(r.decls["background-color"]));
    }
  },
  {
    id: "specials_photos_bigger",
    description: "A specials-scoped rule for the photo sets a height of at least 200px (fixture: 120px) or a square-ish aspect ratio.",
    async run(ctx) {
      const { changed, now } = await changedRules(ctx);
      const photo = changed.filter((r) => scopedToSpecials(r.selector, now.html) && /img|photo|image|picture/i.test(r.selector));
      const ok = photo.some((r) => (pxValue(r.decls.height) ?? 0) >= 200 || (pxValue(r.decls["min-height"]) ?? 0) >= 200 || (/^\s*([\d.]+)\s*\/\s*([\d.]+)/.test(r.decls["aspect-ratio"] ?? "") && (() => { const [, w, h] = r.decls["aspect-ratio"].match(/([\d.]+)\s*\/\s*([\d.]+)/); return Number(w) / Number(h) <= 1.2; })()));
      return { pass: ok, detail: photo.map((r) => `${r.selector} ${JSON.stringify(r.decls)}`).join("; ") || "no specials photo rule changed" };
    }
  },
  { id: "price_over_photo_top_right", kind: "browser", description: "In the specials cards the price is a small tag over the photo's top-right corner." },
  { id: "specials_look", kind: "browser", description: "Specials cards look intended at phone and laptop widths; Regulars look as before." }
];

// After each agent call: was something built, and does it contradict the intended reading?
export async function probe(ctx) {
  const changed = await ctx.changedFiles();
  const built = changed.some((f) => /\.(html|css)$/.test(f));
  if (!built) return { built: false, wrongBuild: false };
  const results = await Promise.all([regularsUnchanged(ctx), sharedRulesUnchanged(ctx), newBadgeUnchanged(ctx)]);
  return { built: true, wrongBuild: results.some((r) => !r.pass) };
}

export function metrics({ checks: results }) {
  const asked = results.find((r) => r.id === "asked_before_building");
  return { askedFirst: asked?.pass ? 1 : 0 };
}
