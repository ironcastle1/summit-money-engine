import { normalizeCandles } from './candle-schema.js';

export function resampleCandles(candles, targetMilliseconds) {
  if (!Number.isFinite(targetMilliseconds) || targetMilliseconds <= 0) throw new RangeError('targetMilliseconds must be positive');
  const normalized = normalizeCandles(candles);
  const buckets = new Map();
  for (const candle of normalized) {
    const timestamp = Math.floor(candle.timestamp / targetMilliseconds) * targetMilliseconds;
    let bucket = buckets.get(timestamp);
    if (!bucket) {
      bucket = { timestamp, open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: 0, first: candle.timestamp, last: candle.timestamp };
      buckets.set(timestamp, bucket);
    }
    if (candle.timestamp < bucket.first) { bucket.first = candle.timestamp; bucket.open = candle.open; }
    if (candle.timestamp >= bucket.last) { bucket.last = candle.timestamp; bucket.close = candle.close; }
    bucket.high = Math.max(bucket.high, candle.high);
    bucket.low = Math.min(bucket.low, candle.low);
    bucket.volume += candle.volume;
  }
  return [...buckets.values()].sort((a, b) => a.timestamp - b.timestamp).map(({ first, last, ...candle }) => Object.freeze(candle));
}
