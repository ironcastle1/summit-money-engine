const RELATIVE_PATTERNS = Object.freeze([
    { pattern: /\b(\d+)\s+minutes?\s+ago\b/i, milliseconds: 60000 },
    { pattern: /\b(\d+)\s+hours?\s+ago\b/i, milliseconds: 3600000 },
    { pattern: /\b(\d+)\s+days?\s+ago\b/i, milliseconds: 86400000 },
    { pattern: /\b(\d+)\s+weeks?\s+ago\b/i, milliseconds: 604800000 }
]);
export function normalizeTimestamp(value, options = {}) {
    const now = Number(options.now || Date.now());
    if (value instanceof Date && Number.isFinite(value.getTime()))
        return value.toISOString();
    if (typeof value === 'number' && Number.isFinite(value)) {
        const milliseconds = value < 10000000000 ? value * 1000 : value;
        return new Date(milliseconds).toISOString();
    }
    const text = String(value || '').trim();
    if (!text)
        return options.fallback || null;
    for (const item of RELATIVE_PATTERNS) {
        const match = text.match(item.pattern);
        if (match)
            return new Date(now - Number(match[1]) * item.milliseconds).toISOString();
    }
    if (/\byesterday\b/i.test(text))
        return new Date(now - 86400000).toISOString();
    if (/\btoday\b/i.test(text))
        return new Date(now).toISOString();
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : options.fallback || null;
}
export function timeWindow(records = []) {
    const timestamps = records.map(record => Date.parse(record.timestamp || record.publishedAt || '')).filter(Number.isFinite);
    if (!timestamps.length)
        return { earliest: null, latest: null, spanMs: 0, spanHours: 0 };
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    return {
        earliest: new Date(earliest).toISOString(),
        latest: new Date(latest).toISOString(),
        spanMs: latest - earliest,
        spanHours: (latest - earliest) / 3600000
    };
}
export function temporalOverlap(left, right) {
    const a = normalizeWindow(left);
    const b = normalizeWindow(right);
    if (!a || !b)
        return 0;
    const intersection = Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
    const union = Math.max(a.end, b.end) - Math.min(a.start, b.start);
    return union ? intersection / union : a.start === b.start ? 1 : 0;
}
export function bucketTimestamp(value, intervalMs = 3600000) {
    const timestamp = Date.parse(normalizeTimestamp(value) || '');
    if (!Number.isFinite(timestamp))
        return null;
    return new Date(Math.floor(timestamp / intervalMs) * intervalMs).toISOString();
}
function normalizeWindow(value) {
    if (!value)
        return null;
    const start = Date.parse(value.start || value.earliest || value.timestamp || '');
    const end = Date.parse(value.end || value.latest || value.timestamp || '');
    return Number.isFinite(start) && Number.isFinite(end) ? { start: Math.min(start, end), end: Math.max(start, end) } : null;
}
