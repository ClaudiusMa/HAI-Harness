// Volume discounts for wholesale orders.
export const VOLUME_RULES = [
  { minQty: 1, pct: 0 },
  { minQty: 10, pct: 5 },
  { minQty: 25, pct: 10 }
];

// Percentage discount for an order of `qty` items. The rules are listed smallest tier
// first; look at the biggest tier first so the best matching discount wins.
export function discountPct(qty, rules = VOLUME_RULES) {
  const tiers = rules.reverse();
  const tier = tiers.find((rule) => qty >= rule.minQty);
  return tier ? tier.pct : 0;
}
