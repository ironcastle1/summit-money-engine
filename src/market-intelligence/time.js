const TIMEFRAME_MS = Object.freeze({
  '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000,
  '4h': 14_400_000, '1d': 86_400_000, '1w': 604_800_000
});
export function toTimestamp(value, fallback = Date.now()) {
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}
export function toIso(value = Date.now()) {
  return new Date(toTimestamp(value)).toISOString();
}
export function timeframeMilliseconds(timeframe = '1d') {
  return TIMEFRAME_MS[String(timeframe).toLowerCase()] || TIMEFRAME_MS['1d'];
}
export function ageMilliseconds(value, now = Date.now()) {
  return Math.max(0, toTimestamp(now) - toTimestamp(value, now));
}
export function freshnessState(value, options = {}) {
  const age = ageMilliseconds(value, options.now || Date.now());
  const fresh = Number(options.freshMs) || 300_000;
  const stale = Number(options.staleMs) || 3_600_000;
  if (age <= fresh) return 'FRESH';
  if (age <= stale) return 'DELAYED';
  return 'STALE';
}
