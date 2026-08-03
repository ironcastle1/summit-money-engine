import { round } from '../../core/numbers.js';
import { normalizeCandles, candleCompleteness } from './candle-schema.js';
import { buildFeatureSeries, publicFeatureSnapshot } from './features.js';
import { estimateAnalogOutcome } from './probability/analog-estimator.js';
import { classifyRegime } from './regime.js';
import { riskScore, scoreSignal } from './signal-score.js';
import { rankOpportunity } from './opportunity-ranker.js';
import { horizonLabel, timeframe } from './timeframes.js';

export function analyseMarketSeries(options) {
  const { asset, quote, candles: rawCandles, timeframeId, horizons = [1, 6, 24], generatedAt = new Date().toISOString() } = options;
  const definition = timeframe(timeframeId);
  const candles = normalizeCandles(rawCandles);
  const minimum = Math.max(140, Math.max(...horizons) + 120);
  if (candles.length < minimum) {
    return {
      asset,
      quote,
      timeframe: timeframeId,
      available: false,
      reason: 'INSUFFICIENT_HISTORY',
      candleCount: candles.length,
      requiredCandleCount: minimum,
      generatedAt
    };
  }
  const features = buildFeatureSeries(candles, timeframeId);
  const current = features.at(-1);
  const outcomes = horizons.map(horizonBars => ({
    label: horizonLabel(horizonBars, timeframeId),
    ...estimateAnalogOutcome({ candles, features, horizonBars })
  }));
  const primary = outcomes.find(item => item.available) || outcomes[0];
  const regime = classifyRegime(current);
  const signal = scoreSignal(current, primary);
  const risk = riskScore(current, primary);
  const analysis = {
    asset,
    quote,
    timeframe: timeframeId,
    available: true,
    candleCount: candles.length,
    completeness: round(candleCompleteness(candles, definition.milliseconds), 4),
    firstCandleAt: new Date(candles[0].timestamp).toISOString(),
    lastCandleAt: new Date(candles.at(-1).timestamp).toISOString(),
    generatedAt,
    feature: publicFeatureSnapshot(current),
    regime,
    outcomes,
    signal,
    risk,
    candles
  };
  analysis.opportunity = rankOpportunity(analysis);
  return analysis;
}
