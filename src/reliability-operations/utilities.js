export function finite(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
export function clamp(value, minimum = 0, maximum = 100) { return Math.max(minimum, Math.min(maximum, finite(value))); }
export function clean(value, maximum = 1000) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maximum); }
export function asArray(value) { return Array.isArray(value) ? value : value == null || value === '' ? [] : [value]; }
export function unique(values, maximum = 10000) { return [...new Set(asArray(values).map(value => typeof value === 'string' ? clean(value, 500) : value))].slice(0, maximum); }
export function average(values, fallback = 0) { const rows = asArray(values).map(Number).filter(Number.isFinite); return rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : fallback; }
export function percentile(values, percentileValue = 95) {
    const rows = asArray(values).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!rows.length)
        return null;
    const index = Math.min(rows.length - 1, Math.max(0, Math.ceil(percentileValue / 100 * rows.length) - 1));
    return rows[index];
}
export function ratio(part, total, fallback = 0) { const denominator = finite(total); return denominator > 0 ? finite(part) / denominator : fallback; }
export function groupBy(items, selector) {
    const map = new Map();
    for (const item of items || []) {
        const key = selector(item);
        if (!map.has(key))
            map.set(key, []);
        map.get(key).push(item);
    }
    return map;
}
export function severityRank(value) { return ({ SEV1: 4, SEV2: 3, SEV3: 2, SEV4: 1, CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 })[String(value || '').toUpperCase()] || 0; }
export function frozen(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value))
        return value;
    Object.freeze(value);
    for (const child of Object.values(value))
        frozen(child);
    return value;
}
