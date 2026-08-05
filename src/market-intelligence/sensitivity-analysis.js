import { round } from './numbers.js';
import { runMarketScenario } from './scenario-engine.js';
export function runSensitivityAnalysis(input = {}, analyses = []) {
  const steps = Math.min(21, Math.max(3, Number(input.steps) || 9));
  const minimum = Number(input.minimumPercent ?? -20);
  const maximum = Number(input.maximumPercent ?? 20);
  const target = input.target || input.symbol || input.assetClass || '';
  const targetType = input.targetType || (input.symbol ? 'SYMBOL' : input.assetClass ? 'ASSET_CLASS' : 'TAG');
  const points = [];
  for (let index = 0; index < steps; index += 1) {
    const changePercent = minimum + (maximum - minimum) * index / Math.max(1, steps - 1);
    const result = runMarketScenario({
      name: `Sensitivity ${round(changePercent, 2)}%`,
      positions: input.positions || [],
      shocks: [{ id: 'sensitivity', target, targetType, changePercent, probability: input.probability ?? 100 }]
    }, analyses);
    points.push(Object.freeze({ changePercent: round(changePercent, 3), portfolioPnl: result.pnl, portfolioPnlPercent: result.pnlPercent }));
  }
  const downside = points.filter(point => point.changePercent < 0).sort((a, b) => a.portfolioPnl - b.portfolioPnl)[0] || null;
  const upside = points.filter(point => point.changePercent > 0).sort((a, b) => b.portfolioPnl - a.portfolioPnl)[0] || null;
  return Object.freeze({ targetType: String(targetType).toUpperCase(), target, points: Object.freeze(points), downside, upside, generatedAt: new Date().toISOString() });
}
