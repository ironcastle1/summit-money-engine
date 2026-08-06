import { comparableClaims } from './claim-schema.js';
import { weightedTextSimilarity } from './token-similarity.js';
export function compareClaims(left, right, options = {}) {
    if (!comparableClaims(left, right))
        return { comparable: false, contradiction: false, score: 0, reasons: [] };
    const reasons = [];
    let score = 0;
    if (left.polarity !== right.polarity) {
        score = Math.max(score, 0.95);
        reasons.push('opposite-polarity');
    }
    if (left.type === 'STATUS' && left.object && right.object && String(left.object) !== String(right.object)) {
        const compatible = statusCompatible(String(left.object), String(right.object));
        if (!compatible) {
            score = Math.max(score, 0.75);
            reasons.push('incompatible-status');
        }
    }
    if (left.value !== null && right.value !== null && unitsComparable(left.unit, right.unit)) {
        const delta = Math.abs(left.value - right.value);
        const scale = Math.max(Math.abs(left.value), Math.abs(right.value), 1);
        const ratio = delta / scale;
        const tolerance = options.numericTolerance ?? 0.25;
        if (ratio > tolerance) {
            score = Math.max(score, Math.min(1, 0.4 + ratio));
            reasons.push('numeric-divergence');
        }
    }
    if (left.object && right.object && typeof left.object === 'string' && typeof right.object === 'string') {
        const similarity = weightedTextSimilarity(left.object, right.object);
        if (similarity < 0.25 && left.predicate === right.predicate) {
            score = Math.max(score, 0.55);
            reasons.push('object-divergence');
        }
    }
    return { comparable: true, contradiction: score >= 0.5, score, reasons };
}
export class ContradictionDetector {
    compare(left, right, options) { return compareClaims(left, right, options); }
    analyse(claims = []) {
        const conflicts = [];
        let comparablePairs = 0;
        for (let i = 0; i < claims.length; i += 1)
            for (let j = i + 1; j < claims.length; j += 1) {
                const result = compareClaims(claims[i], claims[j]);
                if (result.comparable)
                    comparablePairs += 1;
                if (result.contradiction)
                    conflicts.push({ leftId: claims[i].id, rightId: claims[j].id, ...result });
            }
        const severity = conflicts.length ? conflicts.reduce((sum, item) => sum + item.score, 0) / conflicts.length : 0;
        return { claims: claims.length, comparablePairs, conflicts, severity, disputed: severity >= 0.55 };
    }
}
function unitsComparable(a, b) { return !a || !b || String(a).toLowerCase() === String(b).toLowerCase(); }
function statusCompatible(a, b) { const pair = new Set([a.toUpperCase(), b.toUpperCase()]); return pair.has('REPORTED') || pair.has('ONGOING') && pair.has('ESCALATING') || pair.has('ONGOING') && pair.has('STABLE'); }
