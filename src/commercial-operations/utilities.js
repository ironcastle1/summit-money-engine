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
export function unique(values, maximum = 5000) {
    return [...new Set(asArray(values).map(value => typeof value === 'string' ? clean(value, 320) : value))].slice(0, maximum);
}
export function average(values, fallback = 0) {
    const usable = asArray(values).map(Number).filter(Number.isFinite);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : fallback;
}
export function sum(values) {
    return asArray(values).map(Number).filter(Number.isFinite).reduce((total, value) => total + value, 0);
}
export function groupBy(items, selector) {
    const groups = new Map();
    for (const item of items || []) {
        const key = selector(item);
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(item);
    }
    return groups;
}
export function frozen(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value))
        return value;
    Object.freeze(value);
    for (const child of Object.values(value))
        frozen(child);
    return value;
}
export function compareText(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'en', { sensitivity: 'base' });
}
export function percentage(part, total) {
    const denominator = finite(total);
    return denominator > 0 ? clamp(finite(part) / denominator * 100, 0, 10000) : 0;
}
