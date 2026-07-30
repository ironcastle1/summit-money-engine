import { clamp, round } from '../../core/numbers.js';
import { timeframe } from './timeframes.js';
import { closeSeries, highSeries, lowSeries, logReturns, volumeSeries } from './series.js';
import { sma, ema } from './indicators/moving-averages.js';
import { macd, rateOfChange, rsi, stochastic } from './indicators/momentum.js';
import { atr, bollingerBands, realisedVolatility } from './indicators/volatility.js';
import { efficiencyRatio, linearRegression, movingAverageAlignment } from './indicators/trend.js';
import { downsideDeviation, rollingDrawdown, valueAtRisk } from './indicators/risk.js';
import { moneyFlow, volumeRatio } from './indicators/volume.js';

function latest(series, index) { return Number.isFinite(series[index]) ? series[index] : null; }
function ratio(numerator, denominator) { return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0 ? numerator / denominator : null; }
function bounded(value, min = -4, max = 4) { return Number.isFinite(value) ? clamp(value, min, max) : null; }

export function buildFeatureSeries(candles, timeframeId) {
  const definition = timeframe(timeframeId);
  const close = closeSeries(candles);
  const high = highSeries(candles);
  const low = lowSeries(candles);
  const volume = volumeSeries(candles);
  const returns = logReturns(close);
  const fast = ema(close, 10);
  const medium = ema(close, 20);
  const slow = ema(close, 50);
  const long = sma(close, 100);
  const rsi14 = rsi(close, 14);
  const roc6 = rateOfChange(close, 6);
  const roc24 = rateOfChange(close, 24);
  const atr14 = atr(candles, 14);
  const volatility20 = realisedVolatility(close, 20, definition.annualisation);
  const bands = bollingerBands(close, 20, 2);
  const regression = linearRegression(close.map(value => Math.log(value)), 30);
  const efficiency = efficiencyRatio(close, 20);
  const alignment = movingAverageAlignment(close, fast, medium, slow);
  const drawdown90 = rollingDrawdown(close, 90);
  const downside30 = downsideDeviation(returns, 30);
  const var5 = valueAtRisk(returns, 100, 0.05);
  const volume20 = volumeRatio(volume, 20);
  const flow14 = moneyFlow(candles, 14);
  const macdData = macd(close, 12, 26, 9);
  const stochasticData = stochastic(high, low, close, 14, 3);

  return candles.map((candle, index) => {
    const price = close[index];
    const atrPct = ratio(atr14[index], price);
    const trendSlope = Number.isFinite(regression.slope[index]) ? regression.slope[index] * 100 : null;
    return Object.freeze({
      index,
      timestamp: candle.timestamp,
      price,
      return1: latest(returns, index),
      roc6: latest(roc6, index),
      roc24: latest(roc24, index),
      rsi14: latest(rsi14, index),
      atrPct,
      volatility20: latest(volatility20, index),
      bollingerPosition: latest(bands.position, index),
      bollingerBandwidth: latest(bands.bandwidth, index),
      trendSlope,
      trendRSquared: latest(regression.rSquared, index),
      efficiency20: latest(efficiency, index),
      alignment: latest(alignment, index),
      priceToEma10: bounded(ratio(price, fast[index]) - 1),
      priceToEma20: bounded(ratio(price, medium[index]) - 1),
      priceToEma50: bounded(ratio(price, slow[index]) - 1),
      priceToSma100: bounded(ratio(price, long[index]) - 1),
      drawdown90: latest(drawdown90, index),
      downside30: latest(downside30, index),
      var5: latest(var5, index),
      volumeRatio20: latest(volume20, index),
      moneyFlow14: latest(flow14, index),
      macdPct: bounded(ratio(macdData.line[index], price)),
      macdHistogramPct: bounded(ratio(macdData.histogram[index], price)),
      stochasticK: latest(stochasticData.k, index),
      stochasticD: latest(stochasticData.d, index)
    });
  });
}

const ANALOG_KEYS = Object.freeze([
  ['rsi14', 0.04], ['roc6', 8], ['roc24', 5], ['atrPct', 25], ['volatility20', 1.5],
  ['bollingerPosition', 1.2], ['trendSlope', 12], ['trendRSquared', 0.7], ['efficiency20', 0.9],
  ['alignment', 0.8], ['priceToEma20', 18], ['priceToEma50', 12], ['drawdown90', 5],
  ['volumeRatio20', 0.5], ['moneyFlow14', 0.025], ['macdHistogramPct', 50]
]);

export function featureDistance(left, right) {
  let weighted = 0;
  let weight = 0;
  for (const [key, scale] of ANALOG_KEYS) {
    const a = left?.[key];
    const b = right?.[key];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const difference = (a - b) * scale;
    const localWeight = Math.abs(difference) > 3 ? 0.5 : 1;
    weighted += localWeight * Math.min(16, difference ** 2);
    weight += localWeight;
  }
  return weight >= 8 ? Math.sqrt(weighted / weight) : null;
}

export function publicFeatureSnapshot(feature) {
  if (!feature) return null;
  const result = {};
  for (const [key, value] of Object.entries(feature)) result[key] = Number.isFinite(value) ? round(value, 6) : value;
  return result;
}
