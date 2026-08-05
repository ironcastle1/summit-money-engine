import { CLAIM_TYPES } from './constants.js';
import { stableTextKey, normalizeWhitespace } from './text-normalizer.js';
export function createClaim(input = {}) {
    const type = CLAIM_TYPES.includes(String(input.type).toUpperCase()) ? String(input.type).toUpperCase() : 'OCCURRENCE';
    const statement = normalizeWhitespace(input.statement || input.text || '');
    if (!statement)
        throw new TypeError('Claim statement is required');
    return Object.freeze({
        id: String(input.id || `claim_${stableTextKey(`${type}:${statement}:${input.recordId || ''}`).slice(4)}`),
        type, statement, subject: input.subject || null, predicate: input.predicate || null, object: input.object ?? null,
        value: Number.isFinite(Number(input.value)) ? Number(input.value) : null, unit: input.unit || null,
        polarity: input.polarity === -1 ? -1 : 1, status: String(input.status || 'REPORTED').toUpperCase(),
        recordId: input.recordId || null, sourceId: input.sourceId || null, evidenceText: input.evidenceText || statement,
        confidence: Math.max(0, Math.min(100, Number(input.confidence ?? 50))),
        timestamp: input.timestamp || new Date().toISOString(), attributes: { ...(input.attributes || {}) }
    });
}
export function comparableClaims(left, right) {
    if (!left || !right || left.type !== right.type)
        return false;
    if (left.subject && right.subject && left.subject !== right.subject)
        return false;
    if (left.predicate && right.predicate && left.predicate !== right.predicate)
        return false;
    return true;
}
