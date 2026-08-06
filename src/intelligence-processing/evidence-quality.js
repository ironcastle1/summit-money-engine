const PRIMARY_SOURCE_HINTS = ['official', 'government', 'ministry', 'agency', 'court', 'filing', 'statement', 'press release', 'satellite', 'sensor'];
const LOW_QUALITY_HINTS = ['anonymous account', 'unverified', 'rumour', 'rumor', 'reportedly', 'allegedly', 'might have', 'could be'];
export class EvidenceQualityEvaluator {
    evaluate(record = {}) {
        const text = [record.title, record.summary, record.description].filter(Boolean).join(' ').toLowerCase();
        const reasons = [];
        let score = 45;
        const reliability = Number(record.sourceReliability || record.source?.reliability);
        if (Number.isFinite(reliability)) {
            score += (reliability - 50) * 0.35;
            reasons.push(`source reliability ${reliability}`);
        }
        if (record.url) {
            score += 5;
            reasons.push('traceable source URL');
        }
        if (record.timestamp || record.publishedAt)
            score += 5;
        if (record.coordinate) {
            score += 8;
            reasons.push('specific coordinates');
        }
        if (record.media?.length || record.attachments?.length) {
            score += 8;
            reasons.push('supporting media');
        }
        const primaryHits = PRIMARY_SOURCE_HINTS.filter(hint => text.includes(hint));
        if (primaryHits.length) {
            score += Math.min(15, primaryHits.length * 5);
            reasons.push('primary-source indicators');
        }
        const lowHits = LOW_QUALITY_HINTS.filter(hint => text.includes(hint));
        if (lowHits.length) {
            score -= Math.min(20, lowHits.length * 6);
            reasons.push('uncertainty language');
        }
        if (record.source?.type === 'SOCIAL') {
            score -= record.source?.verified ? 4 : 15;
            reasons.push(record.source?.verified ? 'verified social source' : 'unverified social source');
        }
        if (text.length < 80)
            score -= 8;
        score = Math.round(Math.max(0, Math.min(100, score)));
        return {
            score,
            grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'E',
            primarySourceLikely: primaryHits.length > 0,
            reasons
        };
    }
}
