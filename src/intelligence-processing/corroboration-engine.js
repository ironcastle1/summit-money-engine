import { ContradictionDetector } from './contradiction-detector.js';
import { effectiveIndependentCount, independentGroups } from './source-independence.js';
import { confidenceLabel } from './constants.js';
export class CorroborationEngine {
    constructor(options = {}) { this.contradictions = options.contradictions || new ContradictionDetector(); }
    assess(claims = [], sourceLookup = () => ({})) {
        const sources = claims.map(claim => sourceLookup(claim.sourceId) || { id: claim.sourceId }).filter(source => source?.id);
        const independent = effectiveIndependentCount(sources);
        const groups = independentGroups(sources);
        const contradiction = this.contradictions.analyse(claims);
        const avgClaim = average(claims.map(claim => claim.confidence)) / 100;
        const diversity = Math.min(1, independent / 3);
        const volume = Math.min(1, Math.log2(claims.length + 1) / 3);
        const disputePenalty = contradiction.severity * 0.55;
        const raw = Math.max(0, Math.min(1, avgClaim * 0.44 + diversity * 0.36 + volume * 0.2 - disputePenalty));
        const score = Math.round(raw * 100);
        return { score, label: confidenceLabel(score), independentSourceCount: Number(independent.toFixed(2)), sourceGroupCount: groups.length, claimCount: claims.length, contradiction, corroborated: groups.length >= 2 && score >= 55, disputed: contradiction.disputed };
    }
    groupBySubject(claims = []) {
        const groups = new Map();
        for (const claim of claims) {
            const key = [claim.subject || '', claim.predicate || claim.type].join('|');
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(claim);
        }
        return groups;
    }
}
function average(values) { const filtered = values.filter(Number.isFinite); return filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0; }
