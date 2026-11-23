// Volume discounts for wholesale orders.
export const VOLUME_RULES = [
  { minQty: 1, pct: 0 },
  { minQty: 10, pct: 5 },
  { minQty: 25, pct: 10 }
];

// Percentage discount for an order of `qty` items. Looks at the biggest tier first so the
// best matching discount wins. Sorts a copy: the rule list is shared and must not change.
export function discountPct(qty, rules = VOLUME_RULES) {
  const tiers = [...rules].sort((a, b) => b.minQty - a.minQty);
  const tier = tiers.find((rule) => qty >= rule.minQty);
  return tier ? tier.pct : 0;
}
