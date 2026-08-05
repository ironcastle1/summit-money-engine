import { clamp, round } from './numbers.js';
export function actionabilityScore(signal) {
  let score = 10;
  const reasons = [];
  if (signal.action) { score += 35; reasons.push('NAMED_ACTION'); }
  if (signal.location?.label || Number.isFinite(signal.location?.lat)) { score += 15; reasons.push('LOCATED'); }
  if (signal.domain === 'OPPORTUNITIES') { score += 20; reasons.push('OPPORTUNITY'); }
  if (signal.domain === 'MARKETS' || signal.domain === 'LOGISTICS') { score += 12; reasons.push('QUANTIFIABLE'); }
  if ((signal.tags || []).length) { score += Math.min(10, signal.tags.length * 2); reasons.push('TAGGED'); }
  const value = round(clamp(score), 1);
  return Object.freeze({ score: value, band: value >= 75 ? 'DIRECT' : value >= 50 ? 'ACTIONABLE' : value >= 30 ? 'RESEARCH' : 'MONITOR', reasons: Object.freeze(reasons) });
}
