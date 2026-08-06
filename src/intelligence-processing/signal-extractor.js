import { extractNumbers, normalizeText } from './text-normalizer.js';
const SIGNAL_PATTERNS = Object.freeze({
    CLOSURE: /\b(closed|closure|shut|halted|suspended|blocked)\b/i,
    REOPENING: /\b(reopened|resumed|restored|back online)\b/i,
    ESCALATION: /\b(escalat|surge|intensif|expanded|worsen)\w*/i,
    DEESCALATION: /\b(de-escalat|ceasefire|withdraw|reduced|eased)\w*/i,
    SHORTAGE: /\b(shortage|scarcity|rationing|stockout|supply deficit)\b/i,
    PRICE_MOVE: /\b(price|shares?|futures?|yield|currency)\b.*\b(rose|fell|jumped|dropped|gained|lost)\b/i,
    OUTAGE: /\b(outage|blackout|offline|service disruption)\b/i,
    SANCTION: /\b(sanction|embargo|asset freeze|export ban)\b/i,
    MOBILISATION: /\b(mobilisation|mobilization|troop deployment|called up reservists)\b/i,
    EVACUATION: /\b(evacuat|shelter in place|relocat)\w*/i
});
export class SignalExtractor {
    extract(record = {}) {
        const text = [record.title, record.summary, record.description, record.content].filter(Boolean).join(' ');
        const normalized = normalizeText(text, { removeUrls: true });
        const signals = [];
        for (const [type, pattern] of Object.entries(SIGNAL_PATTERNS)) {
            const match = text.match(pattern);
            if (!match)
                continue;
            signals.push({
                id: `signal_${record.id || 'unknown'}_${type.toLowerCase()}`,
                type,
                recordId: record.id || null,
                sourceId: record.sourceId || null,
                evidenceText: match[0],
                confidence: inferConfidence(type, record, normalized),
                timestamp: record.timestamp || record.publishedAt || new Date().toISOString()
            });
        }
        for (const number of extractNumbers(text)) {
            signals.push({
                id: `signal_${record.id || 'unknown'}_number_${number.index}`,
                type: 'QUANTITATIVE',
                recordId: record.id || null,
                value: number.value,
                unit: number.unit,
                evidenceText: number.raw,
                confidence: 75,
                timestamp: record.timestamp || record.publishedAt || new Date().toISOString()
            });
        }
        return signals;
    }
}
function inferConfidence(type, record, text) {
    let score = Number(record.sourceReliability || record.source?.reliability || 50);
    if (/confirmed|official|announced/.test(text))
        score += 12;
    if (/reportedly|allegedly|rumou?r/.test(text))
        score -= 15;
    if (['CLOSURE', 'OUTAGE', 'EVACUATION'].includes(type) && record.coordinate)
        score += 5;
    return Math.max(5, Math.min(95, score));
}
