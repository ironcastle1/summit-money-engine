export function iso(value = Date.now()) { return new Date(value).toISOString(); }
export function toDate(value, fallback = null) { const date = new Date(value ?? NaN); return Number.isFinite(date.getTime()) ? date : fallback; }
export function addMinutes(value, minutes) { return new Date(toDate(value, new Date()).getTime() + Number(minutes || 0) * 60000); }
export function durationMs(start, end = Date.now()) { const a = toDate(start), b = toDate(end); return a && b ? Math.max(0, b.getTime() - a.getTime()) : 0; }
export function expired(value, now = Date.now()) { const date = toDate(value); return !date || date.getTime() <= Number(now); }
