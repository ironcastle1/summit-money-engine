import { clamp, round } from '../../core/numbers.js';

function liquidityScore(quote) {
  if (!Number.isFinite(quote?.quoteVolume24h) || quote.quoteVolume24h <= 0) return 35;
  return clamp(20 * Math.log10(quote.quoteVolume24h) - 80, 0, 100);
}

export function rankOpportunity(analysis) {
  const signal = analysis.signal?.score;
  const probability = analysis.outcomes?.[0]?.riseProbability;
  const confidence = analysis.outcomes?.[0]?.confidence;
  const risk = analysis.risk?.score;
  if (![signal, probability, confidence, risk].every(Number.isFinite)) {
    return { available: false, score: null, rankReason: 'INSUFFICIENT_EVIDENCE' };
  }
  const directionalEdge = Math.abs(probability - 0.5) * 200;
  const signalEdge = Math.abs(signal - 50) * 2;
  const liquidity = liquidityScore(analysis.quote);
  const score = clamp(0.34 * directionalEdge + 0.24 * signalEdge + 0.22 * confidence + 0.12 * (100 - risk) + 0.08 * liquidity, 0, 100);
  return {
    available: true,
    score: round(score, 1),
    direction: probability >= 0.5 ? 'RISE' : 'FALL',
    edge: round(directionalEdge, 1),
    liquidity: round(liquidity, 1)
  };
}

export function sortOpportunities(analyses) {
  return [...analyses].sort((left, right) => {
    const a = left.opportunity?.score;
    const b = right.opportunity?.score;
    if (Number.isFinite(a) && Number.isFinite(b)) return b - a;
    if (Number.isFinite(a)) return -1;
    if (Number.isFinite(b)) return 1;
    return left.asset.symbol.localeCompare(right.asset.symbol);
  });
}
