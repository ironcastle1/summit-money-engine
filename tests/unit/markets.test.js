import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAsset, publicAsset } from '../../src/domain/markets/asset-schema.js';
import { normalizeCandle, normalizeCandles, candleCompleteness } from '../../src/domain/markets/candle-schema.js';
import { timeframe, barsForDuration, horizonLabel } from '../../src/domain/markets/timeframes.js';
import { resampleCandles } from '../../src/domain/markets/candle-resampler.js';
import { closeSeries, futureReturns, simpleReturns } from '../../src/domain/markets/series.js';
import { rollingMean, rollingPercentileRank } from '../../src/domain/markets/rolling.js';
import { ema, sma, wilder } from '../../src/domain/markets/indicators/moving-averages.js';
import { rateOfChange, rsi, macd } from '../../src/domain/markets/indicators/momentum.js';
import { atr, bollingerBands, realisedVolatility } from '../../src/domain/markets/indicators/volatility.js';
import { efficiencyRatio, linearRegression } from '../../src/domain/markets/indicators/trend.js';
import { drawdown, rollingDrawdown } from '../../src/domain/markets/indicators/risk.js';
import { volumeRatio, onBalanceVolume } from '../../src/domain/markets/indicators/volume.js';
import { buildFeatureSeries, featureDistance } from '../../src/domain/markets/features.js';
import { estimateAnalogOutcome } from '../../src/domain/markets/probability/analog-estimator.js';
import { wilsonInterval, betaPosteriorMean, effectiveSampleSize } from '../../src/domain/markets/probability/intervals.js';
import { analyseMarketSeries } from '../../src/domain/markets/market-analysis.js';
import { aggregateTimeframes } from '../../src/domain/markets/multi-timeframe.js';
import { scoreSignal, riskScore } from '../../src/domain/markets/signal-score.js';
import { rankOpportunity, sortOpportunities } from '../../src/domain/markets/opportunity-ranker.js';

function syntheticCandles(count = 800, start = 1_700_000_000_000, step = 3_600_000) {
  const candles = [];
  let price = 100;
  for (let index = 0; index < count; index += 1) {
    const cycle = Math.sin(index / 17) * 0.006 + Math.cos(index / 43) * 0.003;
    const shock = index % 113 === 0 ? -0.018 : index % 97 === 0 ? 0.015 : 0;
    const drift = 0.00035;
    const open = price;
    price *= 1 + drift + cycle + shock;
    const close = price;
    const spread = 0.004 + Math.abs(Math.sin(index / 11)) * 0.005;
    candles.push({
      timestamp: start + index * step,
      open,
      high: Math.max(open, close) * (1 + spread),
      low: Math.min(open, close) * (1 - spread),
      close,
      volume: 1_000_000 * (1 + Math.abs(Math.sin(index / 9)))
    });
  }
  return candles;
}

const asset = normalizeAsset({
  id: 'test-usd', symbol: 'TST', name: 'Test Asset', assetClass: 'crypto',
  baseCurrency: 'TST', quoteCurrency: 'USD', sources: { binance: { symbol: 'TSTUSDT' } }
});

test('asset schema normalizes public market metadata', () => {
  assert.equal(asset.id, 'test-usd');
  assert.equal(asset.symbol, 'TST');
  assert.deepEqual(publicAsset(asset).sourceIds, ['binance']);
  assert.throws(() => normalizeAsset({ id: 'bad', symbol: 'BAD', name: 'Bad', assetClass: 'unknown', sources: { x: { symbol: 'BAD' } } }));
});

test('candle schema validates bounds and sorts duplicates', () => {
  const candle = normalizeCandle({ timestamp: 2, open: 10, high: 12, low: 9, close: 11, volume: 3 });
  assert.equal(candle.close, 11);
  const sorted = normalizeCandles([{ timestamp: 2, open: 10, high: 12, low: 9, close: 11 }, { timestamp: 1, open: 9, high: 10, low: 8, close: 10 }]);
  assert.deepEqual(sorted.map(item => item.timestamp), [1, 2]);
  assert.throws(() => normalizeCandle({ timestamp: 1, open: 10, high: 9, low: 8, close: 10 }));
});

test('timeframes expose durations and horizon labels', () => {
  assert.equal(timeframe('1h').milliseconds, 3_600_000);
  assert.equal(barsForDuration('15m', 3_600_000), 4);
  assert.equal(horizonLabel(6, '1h'), '6h');
  assert.throws(() => timeframe('2h'));
});

test('candle resampling preserves OHLCV semantics', () => {
  const values = syntheticCandles(12, 1_700_000_000_000, 300_000);
  const output = resampleCandles(values, 3_600_000);
  assert.equal(output.length, 2);
  assert.equal(output[0].open, values[0].open);
  const firstBucketValues = values.filter(value => Math.floor(value.timestamp / 3_600_000) * 3_600_000 === output[0].timestamp);
  assert.equal(output[0].close, firstBucketValues.at(-1).close);
  assert.ok(output[0].volume > values[0].volume);
});

test('series returns align future outcomes to current bars', () => {
  const returns = simpleReturns([100, 110, 99]);
  assert.equal(returns[0], null);
  assert.ok(Math.abs(returns[1] - 0.1) < 1e-12);
  assert.ok(Math.abs(returns[2] + 0.1) < 1e-12);
  const future = futureReturns([100, 110, 121], 1);
  assert.ok(Math.abs(future[0] - 0.1) < 1e-12);
  assert.ok(Math.abs(future[1] - 0.1) < 1e-12);
  assert.equal(future[2], null);
  assert.deepEqual(closeSeries(syntheticCandles(3)).length, 3);
});

test('rolling statistics respect minimum periods', () => {
  assert.deepEqual(rollingMean([1, 2, 3, 4], 3), [null, null, 2, 3]);
  const ranks = rollingPercentileRank([1, 2, 3, 4, 5], 3);
  assert.equal(ranks[4], 5 / 6);
});

test('moving averages converge on constant inputs', () => {
  const values = new Array(30).fill(10);
  assert.equal(sma(values, 5).at(-1), 10);
  assert.equal(ema(values, 5).at(-1), 10);
  assert.equal(wilder(values, 5).at(-1), 10);
});

test('momentum indicators identify rising series', () => {
  const values = Array.from({ length: 80 }, (_, index) => 100 + index);
  assert.ok(rateOfChange(values, 10).at(-1) > 0);
  assert.equal(rsi(values, 14).at(-1), 100);
  assert.ok(macd(values).histogram.at(-1) >= -1e-9);
});

test('volatility indicators return bounded current values', () => {
  const candles = syntheticCandles(180);
  const closes = closeSeries(candles);
  assert.ok(atr(candles, 14).at(-1) > 0);
  const bands = bollingerBands(closes, 20);
  assert.ok(Number.isFinite(bands.position.at(-1)));
  assert.ok(realisedVolatility(closes, 20, 8760).at(-1) > 0);
});

test('trend indicators measure efficient linear movement', () => {
  const values = Array.from({ length: 80 }, (_, index) => 100 + index * 2);
  const regression = linearRegression(values, 30);
  assert.ok(Math.abs(regression.slope.at(-1) - 2) < 1e-9);
  assert.ok(regression.rSquared.at(-1) > 0.999);
  assert.equal(efficiencyRatio(values, 20).at(-1), 1);
});

test('risk indicators report drawdown from peaks', () => {
  assert.deepEqual(drawdown([100, 120, 90, 130]), [0, 0, -0.25, 0]);
  assert.equal(rollingDrawdown([100, 120, 90], 3).at(-1), -0.25);
});

test('volume indicators react to price direction and activity', () => {
  const ratios = volumeRatio([...new Array(20).fill(100), 200], 20);
  assert.ok(ratios.at(-1) > 1);
  assert.deepEqual(onBalanceVolume([10, 11, 10], [100, 200, 300]), [0, 200, -100]);
});

test('feature series produces comparable current state', () => {
  const candles = syntheticCandles(300);
  const features = buildFeatureSeries(candles, '1h');
  assert.equal(features.length, candles.length);
  assert.ok(Number.isFinite(features.at(-1).rsi14));
  assert.equal(featureDistance(features.at(-1), features.at(-1)), 0);
});

test('probability intervals shrink estimates and measure effective samples', () => {
  const interval = wilsonInterval(60, 100);
  assert.ok(interval.lower < 0.6 && interval.upper > 0.6);
  assert.equal(betaPosteriorMean(0, 0), 0.5);
  assert.equal(effectiveSampleSize([1, 1, 1, 1]), 4);
});

test('analogue estimator returns evidence-backed probabilities', () => {
  const candles = syntheticCandles(800);
  const features = buildFeatureSeries(candles, '1h');
  const result = estimateAnalogOutcome({ candles, features, horizonBars: 6, neighbourCount: 50, minimumSample: 20 });
  assert.equal(result.available, true);
  assert.ok(result.riseProbability >= 0 && result.riseProbability <= 1);
  assert.equal(result.sampleSize, 50);
  assert.ok(Number.isFinite(result.returnRange80.lower));
});

test('analogue estimator fails closed with short history', () => {
  const candles = syntheticCandles(120);
  const features = buildFeatureSeries(candles, '1h');
  const result = estimateAnalogOutcome({ candles, features, horizonBars: 24 });
  assert.equal(result.available, false);
  assert.equal(result.riseProbability, null);
});

test('market analysis publishes probabilities, risk, and evidence', () => {
  const analysis = analyseMarketSeries({
    asset: publicAsset(asset),
    quote: { price: 150, quoteVolume24h: 10_000_000 },
    candles: syntheticCandles(800),
    timeframeId: '1h'
  });
  assert.equal(analysis.available, true);
  assert.ok(analysis.outcomes.every(outcome => outcome.available));
  assert.ok(Number.isFinite(analysis.signal.score));
  assert.ok(Number.isFinite(analysis.risk.score));
  assert.ok(Number.isFinite(analysis.opportunity.score));
});

test('market analysis returns N/A state for insufficient history', () => {
  const analysis = analyseMarketSeries({ asset: publicAsset(asset), quote: null, candles: syntheticCandles(100), timeframeId: '1h' });
  assert.equal(analysis.available, false);
  assert.equal(analysis.reason, 'INSUFFICIENT_HISTORY');
});

test('signal and risk scores require evidence coverage', () => {
  assert.equal(scoreSignal({}, {}).available, false);
  assert.equal(riskScore({}, {}).available, false);
  const feature = buildFeatureSeries(syntheticCandles(300), '1h').at(-1);
  const probability = { riseProbability: 0.62, returnRange80: { lower: -0.04, upper: 0.08 } };
  assert.equal(scoreSignal(feature, probability).available, true);
  assert.equal(riskScore(feature, probability).available, true);
});

test('opportunity ranker sorts available evidence before unavailable assets', () => {
  const base = { signal: { score: 70 }, outcomes: [{ riseProbability: 0.65, confidence: 75 }], risk: { score: 35 }, quote: { quoteVolume24h: 20_000_000 } };
  const high = { asset: { symbol: 'AAA' }, ...base };
  high.opportunity = rankOpportunity(high);
  const low = { asset: { symbol: 'BBB' }, available: false, opportunity: { available: false, score: null } };
  assert.equal(sortOpportunities([low, high])[0], high);
});

test('multi-timeframe consensus weights evidence and agreement', () => {
  const analyses = ['15m', '1h', '4h', '1d'].map((timeframeId, index) => ({
    timeframe: timeframeId,
    available: true,
    outcomes: [{ riseProbability: 0.58 + index * 0.02, confidence: 70 + index }],
    signal: { score: 60 + index }
  }));
  const consensus = aggregateTimeframes(analyses);
  assert.equal(consensus.available, true);
  assert.equal(consensus.direction, 'RISE');
  assert.equal(consensus.coverage, 1);
});

test('candle completeness identifies missing intervals', () => {
  const candles = syntheticCandles(10);
  candles.splice(5, 1);
  assert.ok(candleCompleteness(candles, 3_600_000) < 1);
});
