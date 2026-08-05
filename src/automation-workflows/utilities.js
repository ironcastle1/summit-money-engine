export function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}
export function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, finite(value)));
}
export function clean(value, maximum = 500) {
    return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}
export function asArray(value) {
    if (Array.isArray(value))
        return value;
    if (value === undefined || value === null || value === '')
        return [];
    return [value];
}
export function unique(values, maximum = 500) {
    return [...new Set(asArray(values).map(value => typeof value === 'string' ? clean(value, 240) : value))].slice(0, maximum);
}
export function deepGet(input, path, fallback = undefined) {
    const segments = Array.isArray(path) ? path : String(path || '').split('.').filter(Boolean);
    let current = input;
    for (const segment of segments) {
        if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(Object(current), segment))
            return fallback;
        current = current[segment];
    }
    return current;
}
export function stableStringify(value) {
    if (Array.isArray(value))
        return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object')
        return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
}
export function frozen(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value))
        return value;
    Object.freeze(value);
    for (const item of Object.values(value))
        frozen(item);
    return value;
}
export function compareText(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'en', { sensitivity: 'base' });
}
