import { RISK_BANDS } from './constants.js';
import { clamp, round } from './numbers.js';
export function riskBand(score) { const normalized = clamp(score, 0, 100); return RISK_BANDS.find(item => normalized >= item.minimum)?.id || 'LOW'; }
export function normalizeRisk(score, confidence = null, components = {}) {
  const normalized = round(clamp(score, 0, 100), 1);
  return Object.freeze({ score: normalized, band: riskBand(normalized), confidence: Number.isFinite(Number(confidence)) ? round(clamp(confidence, 0, 100), 1) : null, components: Object.freeze({ ...components }) });
}
export function combineRiskComponents(components, weights = {}) {
  const entries = Object.entries(components).filter(([, value]) => Number.isFinite(Number(value)));
  if (!entries.length) return normalizeRisk(0, null, components);
  const weighted = entries.map(([key, value]) => ({ key, value: Number(value), weight: Math.max(0, Number(weights[key] ?? 1)) }));
  const denominator = weighted.reduce((sum, item) => sum + item.weight, 0) || weighted.length;
  const score = weighted.reduce((sum, item) => sum + item.value * (item.weight || 1), 0) / denominator;
  const confidence = Math.min(96, 32 + entries.length * 9);
  return normalizeRisk(score, confidence, components);
}
