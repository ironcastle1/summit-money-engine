import { mean, standardDeviation, sum } from '../../core/numbers.js';

export function rolling(values, period, reducer, minimum = period) {
  const output = new Array(values.length).fill(null);
  for (let index = 0; index < values.length; index += 1) {
    const start = Math.max(0, index - period + 1);
    const window = values.slice(start, index + 1).filter(Number.isFinite);
    if (window.length >= minimum) output[index] = reducer(window, index);
  }
  return output;
}

export function rollingMean(values, period, minimum = period) {
  return rolling(values, period, mean, minimum);
}

export function rollingSum(values, period, minimum = period) {
  return rolling(values, period, sum, minimum);
}

export function rollingStandardDeviation(values, period, minimum = period) {
  return rolling(values, period, standardDeviation, minimum);
}

export function rollingMin(values, period, minimum = period) {
  return rolling(values, period, window => Math.min(...window), minimum);
}

export function rollingMax(values, period, minimum = period) {
  return rolling(values, period, window => Math.max(...window), minimum);
}

export function rollingPercentileRank(values, period) {
  const output = new Array(values.length).fill(null);
  for (let index = period - 1; index < values.length; index += 1) {
    const window = values.slice(index - period + 1, index + 1).filter(Number.isFinite);
    const current = values[index];
    if (!window.length || !Number.isFinite(current)) continue;
    const below = window.filter(value => value < current).length;
    const equal = window.filter(value => value === current).length;
    output[index] = (below + 0.5 * equal) / window.length;
  }
  return output;
}
