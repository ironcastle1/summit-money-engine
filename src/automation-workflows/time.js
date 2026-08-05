export function toDate(value, fallback = null) {
    const date = value instanceof Date ? new Date(value) : new Date(value ?? NaN);
    return Number.isFinite(date.getTime()) ? date : fallback;
}
export function iso(value = Date.now()) {
    return new Date(value).toISOString();
}
export function ageMilliseconds(value, now = Date.now()) {
    const date = toDate(value);
    return date ? Math.max(0, Number(now) - date.getTime()) : Infinity;
}
export function addMinutes(value, minutes) {
    return new Date(toDate(value, new Date()).getTime() + Number(minutes || 0) * 60000);
}
export function startOfMinute(value = Date.now()) {
    const date = toDate(value, new Date());
    date.setSeconds(0, 0);
    return date;
}
export function minutesBetween(a, b) {
    const left = toDate(a);
    const right = toDate(b);
    return left && right ? (right - left) / 60000 : Infinity;
}
