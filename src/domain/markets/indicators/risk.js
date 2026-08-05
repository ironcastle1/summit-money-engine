import { rollingMax } from '../rolling.js';

export function drawdown(values) {
  let peak = -Infinity;
  return values.map(value => {
    if (!Number.isFinite(value)) return null;
    peak = Math.max(peak, value);
    return peak > 0 ? value / peak - 1 : null;
  });
}

export function rollingDrawdown(values, period = 90) {
  const peaks = rollingMax(values, period);
  return values.map((value, index) => Number.isFinite(value) && Number.isFinite(peaks[index]) && peaks[index] > 0 ? value / peaks[index] - 1 : null);
}

export function downsideDeviation(returns, period = 30) {
  const output = new Array(returns.length).fill(null);
  for (let index = period - 1; index < returns.length; index += 1) {
    const negative = returns.slice(index - period + 1, index + 1).filter(value => Number.isFinite(value) && value < 0);
    if (!negative.length) { output[index] = 0; continue; }
    output[index] = Math.sqrt(negative.reduce((total, value) => total + value ** 2, 0) / negative.length);
  }
  return output;
}

export function valueAtRisk(returns, period = 100, probability = 0.05) {
  const output = new Array(returns.length).fill(null);
  for (let index = period - 1; index < returns.length; index += 1) {
    const window = returns.slice(index - period + 1, index + 1).filter(Number.isFinite).sort((a, b) => a - b);
    if (window.length < Math.ceil(period * 0.8)) continue;
    const position = Math.max(0, Math.min(window.length - 1, Math.floor(probability * (window.length - 1))));
    output[index] = window[position];
  }
  return output;
}
