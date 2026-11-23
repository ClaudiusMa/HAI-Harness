import { formatMoney } from "./money.js";

export function renderInvoice(invoice) {
  const out = [`Invoice ${invoice.id} for ${invoice.customer}`];
  for (const line of invoice.lines) {
    out.push(`  ${line.qty} x ${line.item} @ ${formatMoney(line.unitCents)} = ${formatMoney(line.qty * line.unitCents)}`);
  }
  out.push(`  Subtotal: ${formatMoney(invoice.subtotalCents)}`);
  // Rounding: the discount is already rounded to whole cents in invoice.js.
  if (invoice.discountPct > 0) out.push(`  Volume discount (${invoice.discountPct}%): -${formatMoney(invoice.discountCents)}`);
  out.push(`  Total: ${formatMoney(Math.round(invoice.totalCents))}`);
  return out.join("\n");
}
