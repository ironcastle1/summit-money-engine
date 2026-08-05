const EMOTIONAL_TERMS = ['shocking', 'unbelievable', 'must see', 'they do not want you to know', 'breaking!!!', 'traitor', 'evil', 'panic'];
const ABSOLUTE_TERMS = ['everyone knows', 'undeniable', '100% certain', 'no doubt', 'always', 'never'];
const COORDINATED_PATTERNS = [/copy and paste/gi, /share this everywhere/gi, /before it is deleted/gi];
export class ManipulationRiskModel {
    evaluate(record = {}, context = {}) {
        const text = [record.title, record.summary, record.content].filter(Boolean).join(' ');
        const lower = text.toLowerCase();
        const reasons = [];
        let score = 0;
        const emotional = EMOTIONAL_TERMS.filter(term => lower.includes(term));
        if (emotional.length) {
            score += Math.min(25, emotional.length * 7);
            reasons.push('emotionally loaded wording');
        }
        const absolute = ABSOLUTE_TERMS.filter(term => lower.includes(term));
        if (absolute.length) {
            score += Math.min(18, absolute.length * 6);
            reasons.push('absolute certainty language');
        }
        const exclamations = (text.match(/!/g) || []).length;
        if (exclamations >= 3) {
            score += Math.min(15, exclamations * 2);
            reasons.push('excessive punctuation');
        }
        const coordinated = COORDINATED_PATTERNS.some(pattern => pattern.test(text));
        if (coordinated) {
            score += 20;
            reasons.push('coordination or virality prompt');
        }
        if (!record.url && record.source?.type === 'SOCIAL') {
            score += 12;
            reasons.push('untraceable social claim');
        }
        if (context.nearDuplicateCount >= 10 && context.independentSourceCount < 2) {
            score += 18;
            reasons.push('high duplication without independent confirmation');
        }
        if (context.contradictionScore >= 60) {
            score += 12;
            reasons.push('material contradictions');
        }
        score = Math.round(Math.max(0, Math.min(100, score)));
        return { score, level: score >= 65 ? 'HIGH' : score >= 40 ? 'MODERATE' : 'LOW', reasons };
    }
}
