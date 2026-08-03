import { ValidationError } from '../../core/errors.js';

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ValidationError(`Invalid candle ${name}`, { name, value });
  return number;
}

export function normalizeCandle(input) {
  if (!input || typeof input !== 'object') throw new ValidationError('Candle must be an object');
  const timestamp = finite(input.timestamp ?? input.time ?? input.openTime, 'timestamp');
  const open = finite(input.open, 'open');
  const high = finite(input.high, 'high');
  const low = finite(input.low, 'low');
  const close = finite(input.close, 'close');
  const volume = Number.isFinite(Number(input.volume)) ? Number(input.volume) : 0;
  if (timestamp <= 0 || open <= 0 || high <= 0 || low <= 0 || close <= 0) {
    throw new ValidationError('Candle values must be positive', { timestamp, open, high, low, close });
  }
  if (high < Math.max(open, close, low) || low > Math.min(open, close, high)) {
    throw new ValidationError('Candle high/low bounds are inconsistent', { timestamp, open, high, low, close });
  }
  return Object.freeze({ timestamp, open, high, low, close, volume: Math.max(0, volume) });
}

export function normalizeCandles(values, options = {}) {
  const byTimestamp = new Map();
  for (const value of Array.isArray(values) ? values : []) {
    try {
      const candle = normalizeCandle(value);
      byTimestamp.set(candle.timestamp, candle);
    } catch (error) {
      if (options.strict) throw error;
    }
  }
  return [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function candleCompleteness(candles, timeframeMs) {
  if (!Array.isArray(candles) || candles.length < 2 || !Number.isFinite(timeframeMs)) return null;
  const first = candles[0].timestamp;
  const last = candles.at(-1).timestamp;
  const expected = Math.floor((last - first) / timeframeMs) + 1;
  if (expected <= 0) return null;
  return Math.min(1, candles.length / expected);
}
