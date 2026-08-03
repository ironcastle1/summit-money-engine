import { mean, median, percentile, standardDeviation } from '../../core/numbers.js';

export function closeSeries(candles) { return candles.map(candle => candle.close); }
export function highSeries(candles) { return candles.map(candle => candle.high); }
export function lowSeries(candles) { return candles.map(candle => candle.low); }
export function volumeSeries(candles) { return candles.map(candle => candle.volume); }

export function simpleReturns(values) {
  const output = [null];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    output.push(Number.isFinite(previous) && previous !== 0 && Number.isFinite(current) ? current / previous - 1 : null);
  }
  return output;
}

export function logReturns(values) {
  const output = [null];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    output.push(previous > 0 && current > 0 ? Math.log(current / previous) : null);
  }
  return output;
}

export function futureReturns(values, horizon) {
  const output = new Array(values.length).fill(null);
  for (let index = 0; index + horizon < values.length; index += 1) {
    const current = values[index];
    const future = values[index + horizon];
    output[index] = current > 0 && Number.isFinite(future) ? future / current - 1 : null;
  }
  return output;
}

export function describe(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return { count: 0, mean: null, median: null, standardDeviation: null, p10: null, p25: null, p75: null, p90: null, min: null, max: null };
  return {
    count: finite.length,
    mean: mean(finite),
    median: median(finite),
    standardDeviation: standardDeviation(finite),
    p10: percentile(finite, 0.1),
    p25: percentile(finite, 0.25),
    p75: percentile(finite, 0.75),
    p90: percentile(finite, 0.9),
    min: Math.min(...finite),
    max: Math.max(...finite)
  };
}

export function cumulativeReturn(values) {
  if (!Array.isArray(values) || values.length < 2 || values[0] <= 0) return null;
  return values.at(-1) / values[0] - 1;
}
