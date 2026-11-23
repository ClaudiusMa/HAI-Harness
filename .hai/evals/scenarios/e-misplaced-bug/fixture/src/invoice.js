import { toCents } from "./money.js";
import { discountPct } from "./pricing.js";

export function buildInvoice(order) {
  const lines = order.items.map((i) => ({ item: i.item, qty: i.qty, unitCents: toCents(i.unitPrice) }));
  const qty = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.qty * line.unitCents, 0);
  const pct = discountPct(qty);
  const discountCents = Math.round((subtotalCents * pct) / 100);
  return { id: order.id, customer: order.customer, lines, qty, subtotalCents, discountPct: pct, discountCents, totalCents: subtotalCents - discountCents };
}
