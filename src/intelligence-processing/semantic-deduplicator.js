import { weightedTextSimilarity } from './token-similarity.js';
import { tokenize } from './text-normalizer.js';
import { haversineDistanceKm, validCoordinate } from './geo-utils.js';
export class SemanticDeduplicator {
    constructor(options = {}) {
        this.exactThreshold = options.exactThreshold || 0.93;
        this.nearThreshold = options.nearThreshold || 0.78;
        this.maximumDistanceKm = options.maximumDistanceKm || 500;
        this.maximumTimeHours = options.maximumTimeHours || 72;
    }
    compare(left, right) {
        const title = weightedTextSimilarity(left?.title || '', right?.title || '');
        const body = weightedTextSimilarity(left?.summary || left?.description || '', right?.summary || right?.description || '');
        const distanceKm = validCoordinate(left?.coordinate) && validCoordinate(right?.coordinate)
            ? haversineDistanceKm(left.coordinate, right.coordinate)
            : null;
        const hours = timestampDifferenceHours(left, right);
        const geography = distanceKm === null ? 0.5 : Math.max(0, 1 - distanceKm / this.maximumDistanceKm);
        const time = hours === null ? 0.5 : Math.max(0, 1 - hours / this.maximumTimeHours);
        const sourcePenalty = left?.sourceId && left.sourceId === right?.sourceId ? 0.04 : 0;
        const sharedTerms = salientOverlap(left, right);
        const termBonus = Math.min(0.12, sharedTerms.length * 0.04);
        const score = Math.max(0, Math.min(1, title * 0.48 + body * 0.28 + geography * 0.13 + time * 0.11 + termBonus - sourcePenalty));
        return {
            score,
            exact: score >= this.exactThreshold,
            near: score >= this.nearThreshold,
            factors: { title, body, geography, time, sharedTerms, termBonus, sourcePenalty, distanceKm, hours }
        };
    }
    deduplicate(records = []) {
        const accepted = [];
        const duplicates = [];
        for (const record of records) {
            let best = null;
            for (const candidate of accepted) {
                const comparison = this.compare(candidate, record);
                if (!best || comparison.score > best.comparison.score)
                    best = { candidate, comparison };
            }
            if (best?.comparison.near) {
                duplicates.push({ record, canonicalId: best.candidate.id, ...best.comparison });
            }
            else {
                accepted.push(record);
            }
        }
        return { records: accepted, duplicates, duplicateRate: records.length ? duplicates.length / records.length : 0 };
    }
}
function timestampDifferenceHours(left, right) {
    const a = Date.parse(left?.timestamp || left?.publishedAt || '');
    const b = Date.parse(right?.timestamp || right?.publishedAt || '');
    return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / 3600000 : null;
}
function salientOverlap(left, right) {
    const ignored = new Set(['after', 'before', 'traffic', 'report', 'reports', 'officials']);
    const a = new Set(tokenize([left?.title, left?.summary].filter(Boolean).join(' '), { minimumLength: 5 }).filter(token => !ignored.has(token)));
    const b = new Set(tokenize([right?.title, right?.summary].filter(Boolean).join(' '), { minimumLength: 5 }).filter(token => !ignored.has(token)));
    return [...a].filter(token => b.has(token));
}
