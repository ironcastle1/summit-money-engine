export function iso(value = Date.now()) {
  return new Date(value).toISOString();
}

export function toDate(value, fallback = null) {
  const date = new Date(value ?? NaN);
  return Number.isFinite(date.getTime()) ? date : fallback;
}

export function addHours(value, hours) {
  return new Date(toDate(value, new Date()).getTime() + Number(hours || 0) * 3600000);
}

export function addDays(value, days) {
  return addHours(value, Number(days || 0) * 24);
}

export function daysBetween(a, b = Date.now()) {
  const start = toDate(a);
  const end = toDate(b);
  if (!start || !end) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 86400000);
}

export function expired(value, now = Date.now()) {
  const date = toDate(value);
  return !date || date.getTime() <= Number(now);
}

export function dueState(value, warningDays = 30, now = Date.now()) {
  const date = toDate(value);
  if (!date) return 'MISSING';
  const remaining = (date.getTime() - Number(now)) / 86400000;
  if (remaining < 0) return 'EXPIRED';
  if (remaining <= warningDays) return 'EXPIRING';
  return 'CURRENT';
}
