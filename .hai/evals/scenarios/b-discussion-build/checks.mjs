// Scenario B: build after a discussion with reversals. Checks tagged `stale` fail when a
// rejected or superseded option survives (8 places, the notes field, the exact-match
// duplicate rule); the runner reports their failures as failed_stale.
import { memoryStorage } from "../../lib/check-context.mjs";
import { browser, fill, request1, request2, store, unrelated } from "../../lib/clay-club-checks.mjs";

const pick = (list, ids) => list.filter((c) => ids.includes(c.id));

const stale = [
  {
    id: "capacity_six",
    tag: "stale",
    description: "Capacity is 6 (the superseded 8 must not survive): eight signups book exactly six.",
    async run(ctx) {
      const s = await store(ctx);
      await fill(s, 8);
      const l = await s.list();
      const remaining = await s.remaining();
      return { pass: (l?.booked ?? []).length === 6 && remaining === 0, detail: `booked ${(l?.booked ?? []).length}, remaining ${remaining}` };
    }
  },
  {
    id: "no_notes_field",
    tag: "stale",
    description: "The dropped notes field is absent: no notes input in the page and no note stored.",
    async run(ctx) {
      const html = (await ctx.read("index.html")) ?? "";
      const app = (await ctx.read("app.js")) ?? "";
      const field = /<textarea|name=["']?notes?\b|id=["']?notes?\b|placeholder=["'][^"']*\bnotes?\b/i.test(html + app);
      const storage = memoryStorage();
      const s = await store(ctx, storage);
      await s.book({ name: "Ana", email: "ana@example.com", note: "glaze allergy", notes: "glaze allergy" });
      const stored = JSON.stringify(storage.dump()).includes("glaze allergy");
      return { pass: !field && !stored, detail: `field ${field}, stored ${stored}` };
    }
  },
  {
    id: "duplicate_rule_latest",
    tag: "stale",
    description: "Duplicates ignore capitalization and surrounding spaces (the exact-match rule was superseded).",
    async run(ctx) {
      const s = await store(ctx);
      await s.book({ name: "Ana", email: "ana@example.com" });
      const a = await s.book({ name: "Ana", email: " Ana@Example.com " });
      const b = await s.book({ name: "Ana", email: "ANA@EXAMPLE.COM" });
      return !(a && a.ok) && !(b && b.ok);
    }
  }
];

const waitlist = [
  ...pick(request2, ["waitlist_join", "waitlist_fifo", "waitlist_persistence"]),
  {
    id: "duplicate_across_lists_trimmed",
    description: "The agreed duplicate rule (case and surrounding spaces) applies across bookings and waitlist.",
    async run(ctx) {
      const s = await store(ctx);
      await fill(s, 7);
      const a = await s.book({ name: "X", email: " P7@EXAMPLE.com " });
      const b = await s.book({ name: "Y", email: "p2@Example.com  " });
      const l = await s.list();
      return !(a && a.ok) && !(b && b.ok) && (l?.waitlist ?? []).length === 1;
    }
  }
];

export const checks = [
  ...pick(request1, ["valid_signup", "invalid_email", "cancel_frees_place", "persistence", "no_accounts_one_page", "page_wired"]),
  ...stale,
  ...waitlist,
  unrelated,
  { id: "single_card_layout", kind: "browser", tag: "stale", description: "One card, form above the list, at phone and laptop widths (the two-column layout was rejected)." },
  ...browser
];
