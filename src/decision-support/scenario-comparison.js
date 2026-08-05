import { round } from './numbers.js';
export function compareScenarios(scenarios = []) {
  const normalized = scenarios.map(item => Object.freeze({ id: String(item.id || item.scenario || 'scenario'), label: String(item.label || item.id || 'Scenario'), risk: Number(item.after ?? item.risk ?? 0), cost: Number(item.cost ?? item.economicImpact ?? 0), time: Number(item.time ?? item.horizonDays ?? 0), confidence: Number(item.confidence ?? 50) }));
  const ranked = normalized.map(item => Object.freeze({ ...item, composite: round(item.risk * 0.45 + Math.min(100, item.cost) * 0.25 + Math.min(100, item.time) * 0.1 + (100 - item.confidence) * 0.2, 1) })).sort((a, b) => b.composite - a.composite);
  return Object.freeze({ scenarios: Object.freeze(ranked), highestRisk: ranked[0] || null, lowestRisk: ranked.at(-1) || null, spread: ranked.length > 1 ? round(ranked[0].composite - ranked.at(-1).composite, 1) : 0 });
}
