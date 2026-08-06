import { normalizeWhitespace, redactSensitiveText, stableTextKey } from './text-normalizer.js';
import { normalizeCoordinate } from './geo-utils.js';
export function normalizeRecord(input = {}, options = {}) {
    const title = normalizeWhitespace(input.title || input.name || input.headline || 'Untitled report');
    const summary = normalizeWhitespace(input.summary || input.description || input.content || '');
    const sourceId = String(input.sourceId || input.source?.id || options.sourceId || 'unknown').toLowerCase();
    const timestamp = validDate(input.timestamp || input.publishedAt || input.date) || new Date().toISOString();
    const id = String(input.id || `record_${stableTextKey(`${sourceId}:${title}:${timestamp}`).slice(4)}`);
    return Object.freeze({
        id, sourceId, source: { id: sourceId, ...(input.source || {}) }, title: options.redact === false ? title : redactSensitiveText(title), summary: options.redact === false ? summary : redactSensitiveText(summary),
        description: normalizeWhitespace(input.description || ''), content: options.includeContent ? normalizeWhitespace(input.content || '') : undefined,
        timestamp, publishedAt: validDate(input.publishedAt) || timestamp, updatedAt: validDate(input.updatedAt) || timestamp,
        category: String(input.category || input.type || 'other').toLowerCase(), status: String(input.status || 'REPORTED').toUpperCase(),
        coordinate: normalizeCoordinate(input.coordinate || input.geometry?.coordinates && { lon: input.geometry.coordinates[0], lat: input.geometry.coordinates[1] } || input),
        locationName: input.locationName || input.place || null, url: safeUrl(input.url), language: String(input.language || 'en').toLowerCase(),
        magnitude: numberOrNull(input.magnitude), severity: numberOrNull(input.severity), deaths: numberOrNull(input.deaths), injured: numberOrNull(input.injured), displaced: numberOrNull(input.displaced),
        confidence: numberOrNull(input.confidence), sourceReliability: numberOrNull(input.sourceReliability || input.source?.reliability), entities: [...(input.entities || [])], claims: [...(input.claims || [])], tags: [...(input.tags || [])], attributes: { ...(input.attributes || {}) }, raw: options.keepRaw ? input : undefined
    });
}
function validDate(value) { const time = Date.parse(value || ''); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function safeUrl(value) {
    if (!value)
        return null;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    }
    catch {
        return null;
    }
}
function numberOrNull(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
