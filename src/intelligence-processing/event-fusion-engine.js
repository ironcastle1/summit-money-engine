import { centroid } from './geo-utils.js';
import { stableTextKey } from './text-normalizer.js';
export class EventFusionEngine {
    fuse(cluster, options = {}) {
        const records = cluster?.records || [];
        if (!records.length)
            throw new TypeError('Cannot fuse an empty cluster');
        const ranked = [...records].sort((a, b) => quality(b) - quality(a));
        const primary = ranked[0];
        const entities = dedupeEntities(records.flatMap(record => record.entities || []));
        const claims = dedupeById(records.flatMap(record => record.claims || []));
        const sources = dedupeById(records.map(record => record.source || { id: record.sourceId }).filter(item => item?.id));
        const coordinates = records.map(record => record.coordinate).filter(Boolean);
        const timestamps = records.map(record => Date.parse(record.timestamp || record.publishedAt || '')).filter(Number.isFinite);
        const id = String(options.id || `event_${stableTextKey(cluster.id || records.map(r => r.id).join(':')).slice(4)}`);
        return Object.freeze({
            id, clusterId: cluster.id, title: primary.title || primary.summary || 'Untitled event', summary: selectSummary(ranked),
            category: majority(records.map(item => String(item.category || 'other').toLowerCase())), status: majority(records.map(item => String(item.status || 'REPORTED').toUpperCase())),
            coordinate: centroid(coordinates), locationName: primary.locationName || entities.find(entity => ['CITY', 'COUNTRY', 'PLACE'].includes(entity.type))?.name || null,
            timestamp: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : new Date().toISOString(),
            updatedAt: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString(),
            entities, claims, sources, sourceIds: sources.map(source => source.id), recordIds: records.map(record => record.id), records: records.map(publicRecord),
            attributes: mergeAttributes(records), magnitude: maxNumber(records.map(record => record.magnitude)), severity: maxNumber(records.map(record => record.severity)),
            evidenceCount: records.length, language: primary.language || 'en', provenance: { clusterId: cluster.id, recordIds: records.map(record => record.id), sourceIds: sources.map(source => source.id) }
        });
    }
}
function quality(record) { return Number(record.confidence || 0) + Number(record.sourceReliability || 0) + Math.min(20, String(record.summary || record.description || '').length / 50); }
function selectSummary(records) { return records.map(record => record.summary || record.description || '').filter(Boolean).sort((a, b) => b.length - a.length)[0] || records[0].title || ''; }
function majority(values) {
    const counts = new Map();
    for (const value of values)
        counts.set(value, (counts.get(value) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
function maxNumber(values) { const numbers = values.map(Number).filter(Number.isFinite); return numbers.length ? Math.max(...numbers) : null; }
function dedupeById(items) {
    const map = new Map();
    for (const item of items)
        if (item?.id && !map.has(item.id))
            map.set(item.id, item);
    return [...map.values()];
}
function dedupeEntities(items) {
    const map = new Map();
    for (const item of items) {
        if (!item)
            continue;
        const key = item.id || `${item.type}:${item.canonicalName || item.name}`;
        if (!map.has(key))
            map.set(key, item);
    }
    return [...map.values()];
}
function publicRecord(record) { return { id: record.id, sourceId: record.sourceId, title: record.title, timestamp: record.timestamp || record.publishedAt, url: record.url || null }; }
function mergeAttributes(records) { return Object.assign({}, ...records.map(record => record.attributes || {})); }
