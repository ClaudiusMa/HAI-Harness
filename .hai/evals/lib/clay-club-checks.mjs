// Behavior checks for the Clay Club fixture (scenarios A, B and C). They exercise the
// documented `signup.js` store API in Node with an in-memory storage, so they need no
// browser and no installed dependency. Layout and visual checks are `browser` checks.
import { memoryStorage } from "./check-context.mjs";

export async function store(ctx, storage = memoryStorage()) {
  const { createSignup } = await ctx.importModule("signup.js");
  return createSignup({ storage });
}

const ok = (r) => Boolean(r && r.ok);
const emails = (rows) => (rows ?? []).map((p) => String(p.email).trim().toLowerCase());

export async function fill(s, count, prefix = "p") {
  const out = [];
  for (let i = 1; i <= count; i += 1) out.push(await s.book({ name: `Person ${prefix}${i}`, email: `${prefix}${i}@example.com` }));
  return out;
}

const listOf = async (s) => {
  const l = await s.list();
  return { booked: l?.booked ?? [], waitlist: l?.waitlist ?? [] };
};

export const request1 = [
  {
    id: "valid_signup",
    tag: "request1",
    description: "A valid name and email books a place and appears in the booking list.",
    async run(ctx) {
      const s = await store(ctx);
      const r = await s.book({ name: "Ana", email: "ana@example.com" });
      const { booked } = await listOf(s);
      return { pass: ok(r) && booked.some((p) => p.name === "Ana" && emails([p])[0] === "ana@example.com"), detail: JSON.stringify(r) };
    }
  },
  {
    id: "invalid_email",
    tag: "request1",
    description: "Invalid emails are rejected and not stored.",
    async run(ctx) {
      const s = await store(ctx);
      const results = [];
      for (const email of ["not-an-email", "bo@", "@example.com", ""]) results.push(await s.book({ name: "Bo", email }));
      const { booked, waitlist } = await listOf(s);
      return { pass: results.every((r) => !ok(r)) && booked.length + waitlist.length === 0, detail: JSON.stringify(results.map(ok)) };
    }
  },
  {
    id: "duplicate_email",
    tag: "request1",
    description: "The same email cannot book twice.",
    async run(ctx) {
      const s = await store(ctx);
      await s.book({ name: "Ana", email: "ana@example.com" });
      const second = await s.book({ name: "Ana again", email: "ana@example.com" });
      const { booked, waitlist } = await listOf(s);
      return !ok(second) && booked.length + waitlist.length === 1;
    }
  },
  {
    id: "capacity",
    tag: "request1",
    description: "At most six places are booked; remaining() reaches 0.",
    async run(ctx) {
      const s = await store(ctx);
      await fill(s, 7);
      const { booked } = await listOf(s);
      const remaining = await s.remaining();
      return { pass: booked.length === 6 && remaining === 0, detail: `booked ${booked.length}, remaining ${remaining}` };
    }
  },
  {
    id: "cancel_frees_place",
    tag: "request1",
    description: "Cancelling a booking frees its place.",
    async run(ctx) {
      const s = await store(ctx);
      const [a] = await fill(s, 2);
      const before = await s.remaining();
      const c = await s.cancel(a.id);
      const { booked } = await listOf(s);
      return { pass: ok(c) && booked.length === 1 && (await s.remaining()) === before + 1 && !emails(booked).includes("p1@example.com"), detail: `before ${before}` };
    }
  },
  {
    id: "persistence",
    tag: "request1",
    description: "A new store on the same storage sees the same bookings (reload).",
    async run(ctx) {
      const storage = memoryStorage();
      const s = await store(ctx, storage);
      await fill(s, 2);
      const again = await store(ctx, storage);
      return JSON.stringify(await listOf(again)) === JSON.stringify(await listOf(s)) && (await listOf(again)).booked.length === 2;
    }
  },
  {
    id: "no_accounts_one_page",
    tag: "request1",
    description: "One page, no accounts, no backend: a single HTML file, no password field, no network calls in the scripts.",
    async run(ctx) {
      const files = await ctx.files();
      const html = files.filter((f) => f.endsWith(".html"));
      const sources = await Promise.all(files.filter((f) => /\.(m?js|html)$/.test(f) && !/(^|\/)(test|tests)\//.test(f) && !/\.test\.m?js$/.test(f)).map((f) => ctx.read(f)));
      const joined = sources.join("\n");
      const network = /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|navigator\.sendBeacon/.test(joined);
      const password = /type\s*=\s*["']?password/i.test(joined);
      return { pass: html.length === 1 && !network && !password, detail: `html files ${html.length}, network ${network}, password ${password}` };
    }
  },
  {
    id: "page_wired",
    tag: "request1",
    description: "index.html loads app.js as a module and app.js imports signup.js.",
    async run(ctx) {
      const html = (await ctx.read("index.html")) ?? "";
      const app = (await ctx.read("app.js")) ?? "";
      return /<script[^>]*type=["']module["'][^>]*src=["']\.?\/?app\.js["']|<script[^>]*src=["']\.?\/?app\.js["'][^>]*type=["']module["']/.test(html) && /from\s+["']\.\/signup\.js["']/.test(app);
    }
  }
];

export const request2 = [
  {
    id: "duplicate_email_case",
    description: "Duplicate emails are detected ignoring capitalization.",
    async run(ctx) {
      const s = await store(ctx);
      await s.book({ name: "Ana", email: "ana@example.com" });
      const second = await s.book({ name: "Ana", email: "ANA@Example.COM" });
      return !ok(second);
    }
  },
  {
    id: "waitlist_join",
    description: "When six places are taken, the next people join the waitlist in order.",
    async run(ctx) {
      const s = await store(ctx);
      const results = await fill(s, 8);
      const { booked, waitlist } = await listOf(s);
      return { pass: results.slice(6).every((r) => ok(r) && r.status === "waitlisted") && booked.length === 6 && emails(waitlist).join() === "p7@example.com,p8@example.com", detail: JSON.stringify(results.slice(6)) };
    }
  },
  {
    id: "waitlist_fifo",
    description: "A cancellation gives the place to the first person on the waitlist.",
    async run(ctx) {
      const s = await store(ctx);
      const results = await fill(s, 8);
      await s.cancel(results[2].id);
      const { booked, waitlist } = await listOf(s);
      return { pass: booked.length === 6 && emails(booked).includes("p7@example.com") && emails(waitlist).join() === "p8@example.com", detail: JSON.stringify(emails(waitlist)) };
    }
  },
  {
    id: "duplicate_across_lists",
    description: "No duplicate email across bookings and waitlist, ignoring capitalization.",
    async run(ctx) {
      const s = await store(ctx);
      await fill(s, 7);
      const a = await s.book({ name: "X", email: "P7@EXAMPLE.com" });
      const b = await s.book({ name: "Y", email: "P2@Example.com" });
      const { booked, waitlist } = await listOf(s);
      return !ok(a) && !ok(b) && booked.length === 6 && waitlist.length === 1;
    }
  },
  {
    id: "waitlist_persistence",
    description: "Both lists survive a reload.",
    async run(ctx) {
      const storage = memoryStorage();
      const s = await store(ctx, storage);
      await fill(s, 8);
      const again = await store(ctx, storage);
      const l = await listOf(again);
      return l.booked.length === 6 && emails(l.waitlist).join() === "p7@example.com,p8@example.com";
    }
  }
];

export const request3 = [
  {
    id: "edit_booking",
    description: "Editing a booking keeps its id, position and the booking count, and changes the details.",
    async run(ctx) {
      const s = await store(ctx);
      const [a] = await fill(s, 3);
      const r = await s.edit(a.id, { name: "Ana Edited", email: "ana.edited@example.com" });
      const { booked } = await listOf(s);
      return { pass: ok(r) && booked.length === 3 && booked[0].id === a.id && booked[0].name === "Ana Edited" && emails([booked[0]])[0] === "ana.edited@example.com", detail: JSON.stringify(r) };
    }
  },
  {
    id: "edit_waitlist",
    description: "Editing a waitlisted person keeps their id and waitlist position.",
    async run(ctx) {
      const s = await store(ctx);
      const results = await fill(s, 9);
      const target = results[7];
      const r = await s.edit(target.id, { name: "Wait Edited", email: "wait.edited@example.com" });
      const { booked, waitlist } = await listOf(s);
      return ok(r) && booked.length === 6 && waitlist.length === 3 && waitlist[1].id === target.id && waitlist[1].name === "Wait Edited" && waitlist[0].id === results[6].id;
    }
  },
  {
    id: "edit_duplicate_rejected",
    description: "An edited email that belongs to someone else in either list is rejected without changing anything.",
    async run(ctx) {
      const s = await store(ctx);
      const results = await fill(s, 7);
      const before = JSON.stringify(await listOf(s));
      const a = await s.edit(results[0].id, { name: "Person p1", email: "P2@EXAMPLE.COM" });
      const b = await s.edit(results[1].id, { name: "Person p2", email: "p7@Example.com" });
      return !ok(a) && !ok(b) && JSON.stringify(await listOf(s)) === before;
    }
  },
  {
    id: "edit_own_email_case",
    description: "A person may keep their own email (in any capitalization) when editing their name.",
    async run(ctx) {
      const s = await store(ctx);
      const [a] = await fill(s, 2);
      const r = await s.edit(a.id, { name: "Renamed", email: "P1@example.com" });
      const { booked } = await listOf(s);
      return ok(r) && booked[0].name === "Renamed";
    }
  }
];

export const unrelated = {
  id: "no_unrelated_changes",
  description: "README.md and .gitignore are untouched and no starter file was deleted.",
  async run(ctx) {
    const changed = await ctx.changedFiles();
    const files = new Set(await ctx.files());
    const bad = changed.filter((f) => f === "README.md" || f === ".gitignore" || !files.has(f));
    return { pass: bad.length === 0, detail: bad.join(", ") || null };
  }
};

export const browser = [
  { id: "mobile_375", kind: "browser", description: "No horizontal overflow at 375px; form, lists and actions usable." },
  { id: "desktop_1280", kind: "browser", description: "Booking form and lists usable at 1280px." },
  { id: "visual_direction", kind: "browser", description: "Follows the README visual direction (paper background, terracotta accent, pill buttons)." }
];

export const cancelEditBrowser = { id: "cancel_edit_ui", kind: "browser", description: "Cancelling an edit in the page leaves the original details untouched." };
