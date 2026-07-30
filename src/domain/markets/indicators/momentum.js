import { ema, wilder } from './moving-averages.js';

export function rateOfChange(values, period) {
  const output = new Array(values.length).fill(null);
  for (let index = period; index < values.length; index += 1) {
    const previous = values[index - period];
    const current = values[index];
    output[index] = previous > 0 && Number.isFinite(current) ? current / previous - 1 : null;
  }
  return output;
}

export function rsi(values, period = 14) {
  const gains = new Array(values.length).fill(null);
  const losses = new Array(values.length).fill(null);
  for (let index = 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    if (!Number.isFinite(change)) continue;
    gains[index] = Math.max(0, change);
    losses[index] = Math.max(0, -change);
  }
  const averageGain = wilder(gains, period);
  const averageLoss = wilder(losses, period);
  return values.map((_, index) => {
    const gain = averageGain[index];
    const loss = averageLoss[index];
    if (!Number.isFinite(gain) || !Number.isFinite(loss)) return null;
    if (loss === 0) return gain === 0 ? 50 : 100;
    return 100 - 100 / (1 + gain / loss);
  });
}

export function macd(values, fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const line = values.map((_, index) => Number.isFinite(fastEma[index]) && Number.isFinite(slowEma[index]) ? fastEma[index] - slowEma[index] : null);
  const signalLine = ema(line, signal);
  const histogram = line.map((value, index) => Number.isFinite(value) && Number.isFinite(signalLine[index]) ? value - signalLine[index] : null);
  return { line, signal: signalLine, histogram };
}

export function stochastic(high, low, close, period = 14, smooth = 3) {
  const raw = new Array(close.length).fill(null);
  for (let index = period - 1; index < close.length; index += 1) {
    const windowHigh = Math.max(...high.slice(index - period + 1, index + 1));
    const windowLow = Math.min(...low.slice(index - period + 1, index + 1));
    const range = windowHigh - windowLow;
    raw[index] = range > 0 ? 100 * (close[index] - windowLow) / range : 50;
  }
  const k = ema(raw, smooth);
  const d = ema(k, smooth);
  return { k, d };
}
