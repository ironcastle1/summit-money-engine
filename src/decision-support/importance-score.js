import { clamp, round } from './numbers.js';
const DOMAIN_WEIGHT = Object.freeze({ CONFLICT: 1, HAZARDS: 0.96, MARKETS: 0.88, COUNTRIES: 0.9, LOGISTICS: 0.9, OPPORTUNITIES: 0.82, EXECUTIVE: 0.75 });
export function importanceScore(signal) {
  const domain = DOMAIN_WEIGHT[signal.domain] || 0.7;
  const geographic = Number.isFinite(signal.location?.lat) && Number.isFinite(signal.location?.lon) ? 8 : 0;
  const evidence = Math.min(15, (signal.sources?.length || 0) * 5);
  const score = clamp(signal.severity * domain + geographic + evidence);
  return Object.freeze({ score: round(score, 1), domainWeight: domain, evidenceBonus: evidence });
}
