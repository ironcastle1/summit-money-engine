import { clamp, round } from '../../core/numbers.js';

const WEIGHTS = Object.freeze({ '15m': 0.15, '1h': 0.25, '4h': 0.3, '1d': 0.3 });

export function aggregateTimeframes(analyses) {
  const available = analyses.filter(item => item?.available);
  const components = [];
  for (const analysis of available) {
    const weight = WEIGHTS[analysis.timeframe] || 0.2;
    const probability = analysis.outcomes?.[0]?.riseProbability;
    const signal = analysis.signal?.score;
    const confidence = analysis.outcomes?.[0]?.confidence;
    if (![probability, signal, confidence].every(Number.isFinite)) continue;
    components.push({
      timeframe: analysis.timeframe,
      weight,
      probability,
      signal,
      confidence,
      direction: probability >= 0.5 ? 1 : -1
    });
  }
  if (components.length < 2) {
    return { available: false, reason: 'INSUFFICIENT_TIMEFRAMES', coverage: components.length / Object.keys(WEIGHTS).length };
  }
  const effectiveWeights = components.map(item => item.weight * clamp(item.confidence / 100, 0.2, 1));
  const totalWeight = effectiveWeights.reduce((a, b) => a + b, 0);
  const riseProbability = components.reduce((total, item, index) => total + item.probability * effectiveWeights[index], 0) / totalWeight;
  const signalScore = components.reduce((total, item, index) => total + item.signal * effectiveWeights[index], 0) / totalWeight;
  const agreement = Math.abs(components.reduce((total, item, index) => total + item.direction * effectiveWeights[index], 0)) / totalWeight;
  const confidence = components.reduce((total, item, index) => total + item.confidence * effectiveWeights[index], 0) / totalWeight * (0.65 + 0.35 * agreement);
  return {
    available: true,
    riseProbability: round(riseProbability, 6),
    fallProbability: round(1 - riseProbability, 6),
    signalScore: round(signalScore, 1),
    confidence: round(confidence, 1),
    agreement: round(agreement, 3),
    direction: riseProbability >= 0.53 ? 'RISE' : riseProbability <= 0.47 ? 'FALL' : 'MIXED',
    coverage: round(components.length / Object.keys(WEIGHTS).length, 2),
    timeframes: components.map(item => item.timeframe)
  };
}
