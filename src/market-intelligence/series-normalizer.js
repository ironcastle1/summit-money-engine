import { finite, round } from './numbers.js';
import { toTimestamp, toIso } from './time.js';
function normalizePoint(point) {
  const timestamp = toTimestamp(point.timestamp ?? point.time ?? point.date ?? point[0], NaN);
  const open = finite(point.open ?? point.o ?? point[1], NaN);
  const high = finite(point.high ?? point.h ?? point[2], NaN);
  const low = finite(point.low ?? point.l ?? point[3], NaN);
  const close = finite(point.close ?? point.c ?? point.price ?? point[4], NaN);
  const volume = Math.max(0, finite(point.volume ?? point.v ?? point[5], 0));
  if (![timestamp, open, high, low, close].every(Number.isFinite) || close <= 0) return null;
  return Object.freeze({ timestamp, time: toIso(timestamp), open: round(open, 8), high: round(Math.max(high, open, close), 8), low: round(Math.min(low, open, close), 8), close: round(close, 8), volume });
}
export function normalizeSeries(values = [], options = {}) {
  const deduplicated = new Map();
  for (const raw of Array.isArray(values) ? values : []) {
    const point = normalizePoint(raw);
    if (point) deduplicated.set(point.timestamp, point);
  }
  const sorted = [...deduplicated.values()].sort((a, b) => a.timestamp - b.timestamp);
  const limit = Math.max(1, Number(options.limit) || sorted.length || 1);
  return Object.freeze(sorted.slice(-limit));
}
export function closingPrices(series = []) { return series.map(point => point.close).filter(Number.isFinite); }
export function volumes(series = []) { return series.map(point => point.volume).filter(Number.isFinite); }
