export const OPPORTUNITY_KINDS = Object.freeze(['MARKET', 'EVENT', 'PREDICTION', 'COMPOSITE']);
export const OPPORTUNITY_DIRECTIONS = Object.freeze(['RISE', 'FALL', 'YES', 'NO', 'WATCH']);
export const EVIDENCE_GRADES = Object.freeze(['A', 'B', 'C', 'D', 'N/A']);
export const HORIZON_BUCKETS = Object.freeze(['1H', '6H', '24H', '3D', '7D', '30D']);

export const DEFAULT_OPPORTUNITY_FILTERS = Object.freeze({
  minimumScore: 45,
  minimumConfidence: 35,
  maximumRisk: 85,
  minimumLiquidity: 0,
  kinds: OPPORTUNITY_KINDS,
  directions: OPPORTUNITY_DIRECTIONS,
  limit: 50
});

export const EVENT_MARKET_LINKS = Object.freeze({
  earthquake: ['gold-usd', 'oil-brent', 'btc-usd'],
  volcano: ['oil-brent', 'gold-usd'],
  wildfire: ['natural-gas', 'wheat-usd'],
  storm: ['oil-brent', 'natural-gas', 'wheat-usd'],
  flood: ['wheat-usd', 'corn-usd', 'oil-brent'],
  drought: ['wheat-usd', 'corn-usd', 'soy-usd'],
  conflict: ['gold-usd', 'oil-brent', 'btc-usd'],
  terror: ['gold-usd', 'oil-brent'],
  protest: ['gold-usd', 'oil-brent'],
  energy: ['oil-brent', 'natural-gas'],
  transport: ['oil-brent', 'shipping-index'],
  economic: ['gold-usd', 'btc-usd', 'usd-index'],
  health: ['gold-usd', 'pharma-index'],
  infrastructure: ['copper-usd', 'steel-index'],
  other: ['gold-usd']
});

export function isOpportunityKind(value) {
  return OPPORTUNITY_KINDS.includes(String(value || '').toUpperCase());
}

export function normalizeDirection(value) {
  const direction = String(value || '').toUpperCase();
  return OPPORTUNITY_DIRECTIONS.includes(direction) ? direction : 'WATCH';
}
