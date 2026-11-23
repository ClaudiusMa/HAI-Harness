// Scenario E: the symptom shows in the printed batch and the user blames src/render.js;
// the cause is `rules.reverse()` in src/pricing.js, which reverses the shared default
// rule list in place on every call, so every second invoice loses its discount.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { copyDir } from "../../lib/util.mjs";

// Totals of W-101..W-105 with the correct discounts.
const EXPECTED_TOTALS = ["$210.90", "$499.50", "$85.00", "$561.60", "$289.75"];

async function batchTotals(ctx) {
  const result = await ctx.run(process.execPath, ["bin/print-batch.js"]);
  return { totals: [...result.stdout.matchAll(/Total:\s*(-?\$[\d,]+\.\d\d)/g)].map((m) => m[1].replace(/,/g, "")), code: result.code };
}

export const checks = [
  {
    id: "batch_totals_correct",
    description: "`node bin/print-batch.js` prints the right total for all five orders.",
    async run(ctx) {
      const { totals } = await batchTotals(ctx);
      return { pass: JSON.stringify(totals) === JSON.stringify(EXPECTED_TOTALS), detail: totals.join(" ") };
    }
  },
  {
    id: "cause_fixed",
    tag: "cause",
    description: "discountPct gives the same answer on repeated calls and leaves VOLUME_RULES in its original order.",
    async run(ctx) {
      const pricing = await ctx.importModule("src/pricing.js");
      const answers = [30, 30, 30, 12, 26, 4].map((q) => pricing.discountPct(q));
      const order = (pricing.VOLUME_RULES ?? []).map((r) => r.minQty).join(",");
      return { pass: answers.join(",") === "10,10,10,5,10,0" && order === "1,10,25", detail: `answers ${answers.join(",")}, rules ${order}` };
    }
  },
  {
    id: "render_untouched",
    description: "src/render.js (the red herring the user pointed at) is unchanged.",
    async run(ctx) {
      return (await ctx.read("src/render.js")) === (await ctx.readBaseline("src/render.js"));
    }
  },
  {
    id: "money_behavior_unchanged",
    description: "Money formatting and cent conversion give the fixture's results on sample values.",
    async run(ctx) {
      const money = await ctx.importModule("src/money.js");
      const out = [money.formatMoney(21090), money.formatMoney(5), money.formatMoney(-1525), money.formatMoney(0), money.toCents(18.5), money.toCents(24), money.toCents(0.1)];
      return { pass: JSON.stringify(out) === JSON.stringify(["$210.90", "$0.05", "-$15.25", "$0.00", 1850, 2400, 10]), detail: JSON.stringify(out) };
    }
  },
  {
    id: "tests_pass",
    description: "`node --test` passes.",
    async run(ctx) {
      const r = await ctx.run(process.execPath, ["--test"], { timeoutMs: 60000 });
      return { pass: r.code === 0, detail: r.code === 0 ? null : r.stdout.slice(-400) };
    }
  },
  {
    id: "regression_test_catches_bug",
    description: "With the original src/pricing.js put back, the project's tests fail (a test now catches this bug).",
    async run(ctx) {
      const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "hai-e-regress-"));
      try {
        await copyDir(ctx.dir, tmp);
        await fs.rm(path.join(tmp, ".git"), { recursive: true, force: true });
        await fs.copyFile(path.join(ctx.baselineDir, "src/pricing.js"), path.join(tmp, "src/pricing.js"));
        const r = await ctx.run(process.execPath, ["--test"], { cwd: tmp, timeoutMs: 60000 });
        return { pass: r.code !== 0, detail: r.code === 0 ? "tests still pass with the bug restored" : null };
      } finally {
        await fs.rm(tmp, { recursive: true, force: true });
      }
    }
  }
];

export async function probe(ctx) {
  const { totals } = await batchTotals(ctx);
  return { bugFixed: JSON.stringify(totals) === JSON.stringify(EXPECTED_TOTALS) };
}

export function metrics({ record, checks: results }) {
  // A fix attempt is an agent call that changed product code (src/ or bin/), in the
  // primary checkout or a lane.
  const attempts = record.turns.filter((t) => t.changed.some((f) => /(^|\/)(src|bin)\//.test(f))).length;
  return {
    fixAttempts: attempts,
    causeFound: results.find((r) => r.id === "cause_fixed")?.pass ? 1 : 0
  };
}
