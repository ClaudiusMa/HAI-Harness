import assert from "node:assert/strict";
import test from "node:test";
import { discountPct, VOLUME_RULES } from "../src/pricing.js";

test("repeated calls give the same discount and leave the rules alone", () => {
  assert.deepEqual([30, 30, 12, 26].map((q) => discountPct(q)), [10, 10, 5, 10]);
  assert.deepEqual(VOLUME_RULES.map((r) => r.minQty), [1, 10, 25]);
});
