export function toDate(value, fallback = null) {
  const date = value instanceof Date ? new Date(value) : new Date(value ?? NaN);
  return Number.isFinite(date.getTime()) ? date : fallback;
}

export function iso(value = Date.now()) {
  return new Date(value).toISOString();
}

export function addHours(value, hours) {
  return new Date(toDate(value, new Date()).getTime() + Number(hours || 0) * 3600000);
}

export function isExpired(value, now = Date.now()) {
  const date = toDate(value);
  return !date || date.getTime() <= Number(now);
}

export function editionPeriod(value = Date.now(), cadence = 'DAILY') {
  const date = toDate(value, new Date());
  const day = date.toISOString().slice(0, 10);
  if (cadence === 'WEEKLY') {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return `${start.toISOString().slice(0, 10)}-week`;
  }
  if (cadence === 'MONTHLY') return day.slice(0, 7);
  return day;
}
