export function iso(value = Date.now()) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function ageHours(value, now = Date.now()) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? Infinity : Math.max(0, (now - d.getTime()) / 3_600_000);
}
export function freshness(value, now = Date.now()) {
  const hours = ageHours(value, now);
  if (!Number.isFinite(hours)) return 'UNKNOWN';
  if (hours <= 6) return 'FRESH';
  if (hours <= 24) return 'CURRENT';
  if (hours <= 168) return 'AGING';
  return 'STALE';
}
export function withinDays(value, days, now = Date.now()) {
  return ageHours(value, now) <= Math.max(0, Number(days) || 0) * 24;
}
