import { clamp, round } from '../../core/numbers.js';
import { CRIME_WEIGHTS } from './constants.js';

export function analyseCrime(payload, options = {}) {
  if (!payload || !Array.isArray(payload.records)) return Object.freeze({ available: false, score: null, count: null, period: null, categories: [], confidence: 0 });
  const counts = payload.categories || {};
  const weightedCount = Object.entries(counts).reduce((sum, [category, count]) => sum + Number(count || 0) * (CRIME_WEIGHTS[category] || 0.4), 0);
  const areaScale = Math.max(0.5, Math.min(3, Number(options.areaScale || 1)));
  const score = round(clamp(100 * (1 - Math.exp(-weightedCount / (35 * areaScale))), 0, 100), 1);
  const categories = Object.entries(counts).map(([id, count]) => ({ id, count, sharePct: payload.recordCount ? round(count / payload.recordCount * 100, 1) : 0, weight: CRIME_WEIGHTS[id] || 0.4 })).sort((a, b) => b.count - a.count);
  const confidence = round(clamp(25 + Math.log10(Math.max(1, payload.recordCount)) * 25, 0, 85), 1);
  return Object.freeze({ available: true, score, count: payload.recordCount, period: payload.period, categories, confidence, records: payload.records.slice(0, 250) });
}
