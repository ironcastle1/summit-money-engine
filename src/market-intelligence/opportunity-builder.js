import { round } from './numbers.js';
import { calculateOpportunityScore } from './opportunity-score.js';
function horizon(analysis) {
  const volatility = Number(analysis.volatility?.score || 50);
  const eventStrength = Math.max(0, ...(analysis.catalysts || []).filter(item => item.type === 'EVENT').map(item => item.strength));
  if (volatility >= 75 || eventStrength >= 80) return 'INTRADAY';
  if (volatility >= 55 || eventStrength >= 60) return 'DAYS';
  if (Number(analysis.trend?.strength || 0) >= 55) return 'WEEKS';
  return 'MONTHS';
}
export function buildOpportunity(analysis = {}) {
  const result = calculateOpportunityScore(analysis);
  const direction = Number(analysis.trend?.score || 50) >= 55 && Number(analysis.momentum?.score || 50) >= 50 ? 'BULLISH' : Number(analysis.trend?.score || 50) <= 45 && Number(analysis.momentum?.score || 50) <= 50 ? 'BEARISH' : 'NEUTRAL';
  const price = Number(analysis.quote?.price || analysis.series?.at?.(-1)?.close || 0);
  const atr = Number(analysis.volatility?.atr || 0);
  const entryLow = direction === 'BULLISH' ? price - atr * 0.35 : price - atr * 0.1;
  const entryHigh = direction === 'BULLISH' ? price + atr * 0.1 : price + atr * 0.35;
  const invalidation = direction === 'BULLISH' ? price - atr * 1.5 : direction === 'BEARISH' ? price + atr * 1.5 : null;
  return Object.freeze({
    id: `opp:${analysis.asset?.id || analysis.id}`, assetId: analysis.asset?.id || analysis.id, symbol: analysis.asset?.symbol || analysis.symbol,
    name: analysis.asset?.name || analysis.name, score: result.score, tier: result.tier, direction, horizon: horizon(analysis),
    entry: price ? Object.freeze({ low: round(entryLow, 8), high: round(entryHigh, 8), reference: round(price, 8) }) : null,
    invalidation: invalidation === null ? null : round(invalidation, 8), riskScore: analysis.risk?.score || 0,
    evidenceGrade: analysis.evidence?.grade || 'UNRATED', topCatalysts: Object.freeze((analysis.catalysts || []).slice(0, 5)),
    scoreComponents: result.components, generatedAt: new Date().toISOString(), disclaimer: 'Analytical signal only; not investment advice.'
  });
}
