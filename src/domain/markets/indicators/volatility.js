import { standardDeviation } from '../../../core/numbers.js';
import { logReturns } from '../series.js';
import { rollingMean, rollingStandardDeviation } from '../rolling.js';
import { wilder } from './moving-averages.js';

export function trueRange(candles) {
  return candles.map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    const previousClose = candles[index - 1].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
}

export function atr(candles, period = 14) {
  return wilder(trueRange(candles), period);
}

export function realisedVolatility(values, period, annualisation) {
  const returns = logReturns(values);
  const output = new Array(values.length).fill(null);
  for (let index = period; index < values.length; index += 1) {
    const window = returns.slice(index - period + 1, index + 1).filter(Number.isFinite);
    if (window.length === period) output[index] = standardDeviation(window) * Math.sqrt(annualisation);
  }
  return output;
}

export function bollingerBands(values, period = 20, deviations = 2) {
  const middle = rollingMean(values, period);
  const deviation = rollingStandardDeviation(values, period);
  const upper = values.map((_, index) => Number.isFinite(middle[index]) && Number.isFinite(deviation[index]) ? middle[index] + deviations * deviation[index] : null);
  const lower = values.map((_, index) => Number.isFinite(middle[index]) && Number.isFinite(deviation[index]) ? middle[index] - deviations * deviation[index] : null);
  const bandwidth = values.map((_, index) => Number.isFinite(upper[index]) && Number.isFinite(lower[index]) && middle[index] !== 0 ? (upper[index] - lower[index]) / middle[index] : null);
  const position = values.map((value, index) => Number.isFinite(upper[index]) && Number.isFinite(lower[index]) && upper[index] !== lower[index] ? (value - lower[index]) / (upper[index] - lower[index]) : null);
  return { middle, upper, lower, bandwidth, position };
}
