import { clamp, percentile, round } from '../../../core/numbers.js';
import { futureReturns } from '../series.js';
import { featureDistance } from '../features.js';
import { betaPosteriorMean, effectiveSampleSize, wilsonInterval } from './intervals.js';

function confidenceScore({ sampleSize, effectiveSize, medianDistance, dispersion }) {
  const sample = clamp(Math.log1p(effectiveSize) / Math.log(61), 0, 1);
  const quality = Number.isFinite(medianDistance) ? Math.exp(-medianDistance) : 0;
  const stability = Number.isFinite(dispersion) ? Math.exp(-Math.min(4, dispersion * 18)) : 0;
  return clamp(100 * (0.5 * sample + 0.3 * quality + 0.2 * stability), 0, 100);
}

export function estimateAnalogOutcome(options) {
  const {
    candles,
    features,
    horizonBars,
    neighbourCount = 60,
    minimumSample = 18,
    exclusionBars = Math.max(5, horizonBars)
  } = options;
  if (!candles?.length || !features?.length || candles.length !== features.length) return unavailable('INVALID_SERIES');
  const currentIndex = features.length - 1;
  const current = features[currentIndex];
  const closes = candles.map(candle => candle.close);
  const outcomes = futureReturns(closes, horizonBars);
  const candidates = [];
  for (let index = 100; index < currentIndex - exclusionBars - horizonBars; index += 1) {
    if (!Number.isFinite(outcomes[index])) continue;
    const distance = featureDistance(current, features[index]);
    if (!Number.isFinite(distance)) continue;
    candidates.push({ index, distance, outcome: outcomes[index], timestamp: candles[index].timestamp });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  const selected = candidates.slice(0, neighbourCount);
  if (selected.length < minimumSample) return unavailable('INSUFFICIENT_ANALOGS', selected.length);
  const weights = selected.map(item => 1 / (0.2 + item.distance) ** 2);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedProbability = selected.reduce((total, item, index) => total + (item.outcome > 0 ? weights[index] : 0), 0) / totalWeight;
  const successes = selected.filter(item => item.outcome > 0).length;
  const failures = selected.length - successes;
  const posterior = betaPosteriorMean(successes, failures, 2, 2);
  const riseProbability = 0.65 * weightedProbability + 0.35 * posterior;
  const returns = selected.map(item => item.outcome);
  const medianReturn = percentile(returns, 0.5);
  const p10 = percentile(returns, 0.1);
  const p25 = percentile(returns, 0.25);
  const p75 = percentile(returns, 0.75);
  const p90 = percentile(returns, 0.9);
  const interval = wilsonInterval(successes, selected.length);
  const effectiveSize = effectiveSampleSize(weights);
  const medianDistance = percentile(selected.map(item => item.distance), 0.5);
  const dispersion = Number.isFinite(p90) && Number.isFinite(p10) ? p90 - p10 : null;
  return {
    available: true,
    method: 'HISTORICAL_ANALOGUE_KNN',
    horizonBars,
    riseProbability: round(riseProbability, 6),
    downsideProbability: round(1 - riseProbability, 6),
    probabilityRange90: { lower: round(interval.lower, 6), upper: round(interval.upper, 6) },
    medianReturn: round(medianReturn, 6),
    returnRange50: { lower: round(p25, 6), upper: round(p75, 6) },
    returnRange80: { lower: round(p10, 6), upper: round(p90, 6) },
    sampleSize: selected.length,
    effectiveSampleSize: round(effectiveSize, 1),
    candidateCount: candidates.length,
    medianDistance: round(medianDistance, 4),
    confidence: round(confidenceScore({ sampleSize: selected.length, effectiveSize, medianDistance, dispersion }), 1),
    evidenceStart: new Date(Math.min(...selected.map(item => item.timestamp))).toISOString(),
    evidenceEnd: new Date(Math.max(...selected.map(item => item.timestamp))).toISOString()
  };
}

function unavailable(reason, sampleSize = 0) {
  return {
    available: false,
    reason,
    method: 'HISTORICAL_ANALOGUE_KNN',
    riseProbability: null,
    downsideProbability: null,
    probabilityRange90: { lower: null, upper: null },
    medianReturn: null,
    returnRange50: { lower: null, upper: null },
    returnRange80: { lower: null, upper: null },
    sampleSize,
    effectiveSampleSize: 0,
    candidateCount: sampleSize,
    medianDistance: null,
    confidence: null
  };
}
