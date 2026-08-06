import { weightedTextSimilarity, jaccardSimilarity } from './token-similarity.js';
import { haversineDistanceKm, validCoordinate } from './geo-utils.js';
export function recordSimilarity(left, right, options = {}) {
    const text = weightedTextSimilarity([left.title, left.summary, left.description].filter(Boolean).join(' '), [right.title, right.summary, right.description].filter(Boolean).join(' '));
    const entityIds = (item) => new Set((item.entities || []).map(entity => entity.id || `${entity.type}:${entity.canonicalName || entity.name}`));
    const entities = jaccardSimilarity(entityIds(left), entityIds(right));
    const time = timeSimilarity(left.timestamp || left.publishedAt, right.timestamp || right.publishedAt, options.maxHours ?? 72);
    const distance = validCoordinate(left.coordinate) && validCoordinate(right.coordinate) ? haversineDistanceKm(left.coordinate, right.coordinate) : null;
    const geo = distance === null ? 0.45 : Math.max(0, Math.exp(-distance / (options.distanceScaleKm ?? 500)));
    const category = left.category && right.category ? (String(left.category).toLowerCase() === String(right.category).toLowerCase() ? 1 : 0) : 0.5;
    const score = text * 0.45 + entities * 0.2 + time * 0.15 + geo * 0.12 + category * 0.08;
    return { score, text, entities, time, geo, category, distanceKm: distance };
}
function timeSimilarity(a, b, maxHours) {
    const left = Date.parse(a || '');
    const right = Date.parse(b || '');
    if (!Number.isFinite(left) || !Number.isFinite(right))
        return 0.4;
    return Math.max(0, 1 - Math.abs(left - right) / (maxHours * 3600000));
}
