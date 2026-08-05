export function iso(value = Date.now()) { return new Date(value).toISOString(); }
export function toDate(value, fallback = null) { const date = new Date(value ?? NaN); return Number.isFinite(date.getTime()) ? date : fallback; }
export function addHours(value, hours) { return new Date(toDate(value, new Date()).getTime() + Number(hours || 0) * 3600000); }
export function addDays(value, days) { return addHours(value, Number(days || 0) * 24); }
export function hoursBetween(a, b) { return Math.max(0, (toDate(b, new Date()).getTime() - toDate(a, new Date()).getTime()) / 3600000); }
export function daysBetween(a, b) { return hoursBetween(a, b) / 24; }
export function expired(value, now = Date.now()) { const date = toDate(value); return !date || date.getTime() <= Number(now); }
export function periodKey(value = Date.now(), cadence = 'MONTH') {
    const date = toDate(value, new Date());
    const day = date.toISOString().slice(0, 10);
    if (cadence === 'DAY')
        return day;
    if (cadence === 'YEAR')
        return day.slice(0, 4);
    return day.slice(0, 7);
}
