import { createClaim } from './claim-schema.js';
import { extractNumbers, sentenceSplit, normalizeText } from './text-normalizer.js';
const FORECAST = /\b(will|expected to|forecast to|likely to|could|may|is projected to)\b/i;
const DENIAL = /\b(denied|denies|not true|false claim|refuted|rejected reports?|no evidence)\b/i;
const CAUSAL = /\b(because|caused by|due to|resulted in|triggered by|following)\b/i;
const STATUS = /\b(confirmed|ongoing|resolved|closed|opened|suspended|halted|disrupted|destroyed|damaged|captured|retaken|evacuated)\b/i;
const ATTRIBUTION = /\b(blamed|accused|claimed responsibility|attributed to|carried out by|according to)\b/i;
const IMPACT = /\b(killed|dead|injured|displaced|evacuated|outage|shortage|delay|closed|blocked|disrupted|loss|damage)\b/i;
export class ClaimExtractor {
    extract(record) {
        const text = [record?.title, record?.summary, record?.description, record?.content].filter(Boolean).join('. ');
        const claims = [];
        for (const sentence of sentenceSplit(text)) {
            const common = { statement: sentence, recordId: record?.id, sourceId: record?.sourceId || record?.source?.id, timestamp: record?.timestamp || record?.publishedAt, confidence: baseConfidence(record) };
            const lower = normalizeText(sentence);
            if (DENIAL.test(sentence))
                claims.push(createClaim({ ...common, type: 'DENIAL', polarity: -1, predicate: 'occurred' }));
            else
                claims.push(createClaim({ ...common, type: 'OCCURRENCE', predicate: 'occurred' }));
            if (FORECAST.test(sentence))
                claims.push(createClaim({ ...common, type: 'FORECAST', predicate: 'future_occurrence', confidence: common.confidence * 0.8 }));
            if (CAUSAL.test(sentence))
                claims.push(createClaim({ ...common, type: 'CAUSAL', predicate: 'caused_by' }));
            const status = sentence.match(STATUS)?.[1];
            if (status)
                claims.push(createClaim({ ...common, type: 'STATUS', predicate: 'status', object: status.toUpperCase(), status: status.toUpperCase() }));
            if (ATTRIBUTION.test(sentence))
                claims.push(createClaim({ ...common, type: 'ATTRIBUTION', predicate: 'attributed_to' }));
            if (IMPACT.test(sentence))
                claims.push(createClaim({ ...common, type: 'IMPACT', predicate: 'impact' }));
            for (const number of extractNumbers(sentence))
                claims.push(createClaim({ ...common, type: 'QUANTITY', predicate: inferQuantityPredicate(lower, number.unit), value: number.value, unit: number.unit, evidenceText: number.raw, confidence: Math.min(90, common.confidence + 8) }));
        }
        if (record?.coordinate)
            claims.push(createClaim({ type: 'LOCATION', statement: `Located at ${record.coordinate.lat}, ${record.coordinate.lon}`, recordId: record.id, sourceId: record.sourceId, predicate: 'location', object: record.coordinate, confidence: 75, timestamp: record.timestamp }));
        return deduplicate(claims);
    }
}
function baseConfidence(record) { const value = record?.sourceReliability ?? record?.confidence ?? 55; return Math.max(15, Math.min(90, Number(value) || 55)); }
function inferQuantityPredicate(text, unit) {
    if (/death|killed|dead/.test(text))
        return 'deaths';
    if (/injur/.test(text))
        return 'injured';
    if (/displaced|evacuat/.test(text))
        return 'displaced';
    if (unit === '%')
        return 'percentage';
    if (/magnitude|earthquake/.test(text))
        return 'magnitude';
    return 'quantity';
}
function deduplicate(claims) {
    const map = new Map();
    for (const claim of claims) {
        const key = [claim.type, claim.predicate, claim.value, claim.unit, claim.statement].join('|');
        if (!map.has(key))
            map.set(key, claim);
    }
    return [...map.values()];
}
