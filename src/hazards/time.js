export function timestamp(value) {
  const n = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(n) ? n : null;
}
export function iso(value = Date.now()) {
  const n = timestamp(value);
  return n === null ? null : new Date(n).toISOString();
}
export function ageHours(value, now = Date.now()) {
  const n = timestamp(value);
  return n === null ? Infinity : Math.max(0, (timestamp(now) - n) / 3_600_000);
}
export function withinHours(value, hours, now = Date.now()) {
  return ageHours(value, now) <= Number(hours);
}
export function addHours(value, hours) {
  const n = timestamp(value);
  return n === null ? null : new Date(n + Number(hours) * 3_600_000).toISOString();
}
export function bucketHour(value) {
  const n = timestamp(value);
  return n === null ? null : new Date(Math.floor(n / 3_600_000) * 3_600_000).toISOString();
}
