import { clamp, round } from './numbers.js';
export function calculatePredictionDivergence(asset = {}, predictionLinks = []) {
  const relevant = predictionLinks.filter(link => link.assetId === (asset.asset?.id || asset.id));
  if (!relevant.length) return Object.freeze({ score: 0, state: 'NO_SIGNAL', links: Object.freeze([]) });
  const technical = Number(asset.momentum?.score || 50) / 100;
  const weightedProbability = relevant.reduce((sum, link) => sum + link.probability / 100 * Math.max(1, link.relevance), 0) / relevant.reduce((sum, link) => sum + Math.max(1, link.relevance), 0);
  const divergence = weightedProbability - technical;
  const score = clamp(Math.abs(divergence) * 200, 0, 100);
  return Object.freeze({
    score: round(score, 2), divergence: round(divergence * 100, 2), technicalImplied: round(technical * 100, 2),
    predictionImplied: round(weightedProbability * 100, 2), state: score >= 60 ? 'MAJOR_DIVERGENCE' : score >= 30 ? 'DIVERGENCE' : 'ALIGNED',
    direction: divergence > 0 ? 'PREDICTION_MORE_BULLISH' : divergence < 0 ? 'PREDICTION_MORE_BEARISH' : 'ALIGNED',
    links: Object.freeze(relevant.slice(0, 10))
  });
}
