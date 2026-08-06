import { clamp, round } from './numbers.js';
import { normalizePosition } from './validation.js';
export function calculatePortfolioExposure(positions = [], analyses = []) {
  const normalized = positions.map(normalizePosition);
  const byId = new Map();
  for (const analysis of analyses) {
    byId.set(String(analysis.asset?.id || analysis.id).toLowerCase(), analysis);
    byId.set(String(analysis.asset?.symbol || analysis.symbol).toLowerCase(), analysis);
  }
  const resolved = normalized.map(position => {
    const analysis = byId.get(position.assetId.toLowerCase()) || byId.get(position.symbol.toLowerCase());
    const price = Number(analysis?.quote?.price || 0);
    const marketValue = position.marketValue || position.quantity * price;
    return Object.freeze({ position, analysis, price, marketValue });
  });
  const grossValue = resolved.reduce((sum, item) => sum + Math.abs(item.marketValue), 0);
  const netValue = resolved.reduce((sum, item) => sum + item.marketValue, 0);
  const rows = resolved.map(item => {
    const weight = grossValue ? Math.abs(item.marketValue) / grossValue : 0;
    const riskScore = Number(item.analysis?.risk?.score || 50);
    const opportunityScore = Number(item.analysis?.opportunity?.score || 0);
    return Object.freeze({
      symbol: item.position.symbol,
      assetId: item.position.assetId,
      quantity: item.position.quantity,
      price: round(item.price, 8),
      marketValue: round(item.marketValue, 2),
      weightPercent: round(weight * 100, 3),
      riskScore: round(riskScore, 2),
      opportunityScore: round(opportunityScore, 2),
      riskContribution: round(weight * riskScore, 3),
      available: Boolean(item.analysis)
    });
  });
  const concentration = rows.reduce((sum, item) => sum + (item.weightPercent / 100) ** 2, 0);
  const portfolioRisk = rows.reduce((sum, item) => sum + item.riskContribution, 0);
  return Object.freeze({
    grossValue: round(grossValue, 2),
    netValue: round(netValue, 2),
    concentrationIndex: round(concentration, 4),
    concentrationState: concentration >= 0.5 ? 'CONCENTRATED' : concentration >= 0.25 ? 'MODERATE' : 'DIVERSIFIED',
    riskScore: round(clamp(portfolioRisk, 0, 100), 2),
    unresolved: rows.filter(item => !item.available).length,
    positions: Object.freeze(rows.sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue))),
    generatedAt: new Date().toISOString()
  });
}
