import assert from "node:assert/strict";
import test from "node:test";
import { buildInvoice } from "../src/invoice.js";

test("a 12-mug order gets the 5% volume discount", () => {
  const invoice = buildInvoice({ id: "T-1", customer: "Test", items: [{ item: "mug", qty: 12, unitPrice: 18.5 }] });
  assert.equal(invoice.subtotalCents, 22200);
  assert.equal(invoice.discountPct, 5);
  assert.equal(invoice.totalCents, 21090);
});
