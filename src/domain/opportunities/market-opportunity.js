import { clamp, round } from '../../core/numbers.js';
import { evidenceScore } from './evidence-grade.js';
import { normalizeOpportunity } from './opportunity-schema.js';

function primaryOutcome(analysis) {
  return analysis?.outcomes?.find(item => item?.available) || null;
}

export function fromMarketAnalysis(analysis, options = {}) {
  if (!analysis?.available || !analysis.asset || !analysis.opportunity?.available) return null;
  const outcome = primaryOutcome(analysis);
  if (!outcome || !Number.isFinite(outcome.riseProbability)) return null;
  const interval = outcome.probabilityRange90;
  const intervalWidth = Number.isFinite(interval?.upper) && Number.isFinite(interval?.lower) ? interval.upper - interval.lower : null;
  const ageMinutes = Math.max(0, (Date.now() - Date.parse(analysis.generatedAt || new Date())) / 60_000);
  const evidence = evidenceScore({
    sourceCount: 1,
    sampleSize: outcome.sampleSize,
    sampleTarget: 60,
    ageMinutes,
    maximumUsefulMinutes: 90,
    coverage: analysis.signal?.coverage,
    intervalWidth
  });
  const probability = outcome.riseProbability;
  const direction = probability >= 0.5 ? 'RISE' : 'FALL';
  const median = Number.isFinite(outcome.medianReturn) ? outcome.medianReturn : null;
  const score = clamp(
    0.62 * analysis.opportunity.score +
    0.16 * (evidence.score || 0) +
    0.12 * (100 - (analysis.risk?.score || 50)) +
    0.1 * clamp(Math.abs(median || 0) * 1000, 0, 100),
    0,
    100
  );
  return normalizeOpportunity({
    kind: 'MARKET',
    title: `${analysis.asset.symbol} ${direction}`,
    subtitle: `${analysis.asset.name} / ${analysis.timeframe.toUpperCase()}`,
    direction,
    score: round(score, 1),
    confidence: outcome.confidence,
    risk: analysis.risk?.score,
    probability,
    expectedMove: median,
    liquidity: analysis.opportunity.liquidity,
    evidenceGrade: evidence.grade,
    evidenceScore: evidence.score,
    sampleSize: outcome.sampleSize,
    sourceCount: 1,
    horizon: outcome.label || analysis.timeframe.toUpperCase(),
    assetId: analysis.asset.id,
    symbol: analysis.asset.symbol,
    observedAt: analysis.lastCandleAt,
    generatedAt: analysis.generatedAt,
    sources: [analysis.source?.source || analysis.source?.id || 'MARKET'],
    tags: [analysis.asset.id, analysis.asset.symbol, analysis.asset.assetClass, analysis.regime?.label, direction],
    metadata: {
      timeframe: analysis.timeframe,
      currentPrice: analysis.quote?.price,
      signalScore: analysis.signal?.score,
      regime: analysis.regime,
      interval90: interval,
      returnRange80: outcome.returnRange80
    }
  });
}
