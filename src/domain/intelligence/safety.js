import { clamp, round } from '../../core/numbers.js';
import { SAFETY_BANDS } from './constants.js';

function component(value, weight, confidence = 100) {
  return Number.isFinite(value) ? { value, weight, confidence } : null;
}

export function compositeSafetyRisk(input) {
  const components = [
    component(input.conflictScore, 0.34, input.eventConfidence),
    component(input.disasterScore, 0.2, input.eventConfidence),
    component(input.crimeScore, 0.24, input.crimeConfidence),
    component(input.newsRiskScore, 0.12, input.newsConfidence),
    component(input.electionProximityScore, 0.1, input.electionConfidence)
  ].filter(Boolean);
  if (!components.length) return Object.freeze({ score: null, band: null, confidence: 0, coveragePct: 0, components: [] });
  const weight = components.reduce((sum, item) => sum + item.weight, 0);
  const score = round(clamp(components.reduce((sum, item) => sum + item.value * item.weight, 0) / weight, 0, 100), 1);
  const coveragePct = round(weight * 100, 1);
  const confidence = round(clamp(components.reduce((sum, item) => sum + item.confidence * item.weight, 0) / weight * (0.5 + coveragePct / 200), 0, 100), 1);
  const band = SAFETY_BANDS.find(item => score <= item.maximum) || SAFETY_BANDS.at(-1);
  return Object.freeze({ score, band, confidence, coveragePct, components });
}
