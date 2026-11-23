import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney, toCents } from "../src/money.js";

test("formats cents", () => {
  assert.equal(formatMoney(21090), "$210.90");
  assert.equal(formatMoney(5), "$0.05");
  assert.equal(formatMoney(-1525), "-$15.25");
});

test("converts to cents", () => {
  assert.equal(toCents(18.5), 1850);
  assert.equal(toCents(24), 2400);
});
