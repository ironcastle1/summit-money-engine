import { round } from './numbers.js';
import { normalizePosition } from './validation.js';
import { normalizeScenarioShock, shockMatchesAsset } from './scenario-shocks.js';
export function runMarketScenario(input = {}, analyses = []) {
  const shocks = (input.shocks || []).map(normalizeScenarioShock);
  const positions = (input.positions || []).map(normalizePosition);
  const byId = new Map();
  for (const analysis of analyses) {
    byId.set(String(analysis.asset?.id || analysis.id).toLowerCase(), analysis);
    byId.set(String(analysis.asset?.symbol || analysis.symbol).toLowerCase(), analysis);
  }
  const impacts = positions.map(position => {
    const analysis = byId.get(position.assetId.toLowerCase()) || byId.get(position.symbol.toLowerCase());
    const asset = analysis?.asset || { id: position.assetId, symbol: position.symbol, tags: position.tags };
    const price = Number(analysis?.quote?.price || 0);
    const value = position.marketValue || position.quantity * price;
    const applicable = shocks.filter(shock => shockMatchesAsset(shock, asset));
    const expectedChange = applicable.reduce((sum, shock) => sum + shock.changePercent * shock.probability / 100, 0);
    const stressedValue = value * (1 + expectedChange / 100);
    const liquidityMultiplier = applicable.reduce((product, shock) => product * shock.liquidityMultiplier, 1);
    const volatilityMultiplier = applicable.reduce((product, shock) => product * shock.volatilityMultiplier, 1);
    return Object.freeze({
      symbol: position.symbol,
      assetId: position.assetId,
      baseValue: round(value, 2),
      stressedValue: round(stressedValue, 2),
      pnl: round(stressedValue - value, 2),
      pnlPercent: round(expectedChange, 3),
      liquidityMultiplier: round(liquidityMultiplier, 3),
      volatilityMultiplier: round(volatilityMultiplier, 3),
      shocks: Object.freeze(applicable.map(shock => shock.id))
    });
  });
  const baseValue = impacts.reduce((sum, row) => sum + row.baseValue, 0);
  const stressedValue = impacts.reduce((sum, row) => sum + row.stressedValue, 0);
  return Object.freeze({
    name: String(input.name || 'Market scenario').slice(0, 120),
    shocks: Object.freeze(shocks),
    baseValue: round(baseValue, 2),
    stressedValue: round(stressedValue, 2),
    pnl: round(stressedValue - baseValue, 2),
    pnlPercent: round(baseValue ? (stressedValue / baseValue - 1) * 100 : 0, 3),
    impacts: Object.freeze(impacts.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))),
    assumptions: 'Linear first-order shock model; outputs are estimates rather than forecasts.',
    generatedAt: new Date().toISOString()
  });
}
