export function iso(value = Date.now()) { return new Date(value).toISOString(); }
export function toDate(value, fallback = null) { const date = new Date(value ?? NaN); return Number.isFinite(date.getTime()) ? date : fallback; }
export function addMinutes(value, minutes) { return new Date(toDate(value, new Date()).getTime() + Number(minutes || 0) * 60000); }
export function addHours(value, hours) { return addMinutes(value, Number(hours || 0) * 60); }
export function addDays(value, days) { return addHours(value, Number(days || 0) * 24); }
export function durationMs(start, end = Date.now()) { const a = toDate(start); const b = toDate(end); return a && b ? Math.max(0, b.getTime() - a.getTime()) : 0; }
export function expired(value, now = Date.now()) { const date = toDate(value); return !date || date.getTime() <= Number(now); }
export function withinWindow(value, minutes, now = Date.now()) { const date = toDate(value); return Boolean(date && Math.abs(Number(now) - date.getTime()) <= Number(minutes || 0) * 60000); }
