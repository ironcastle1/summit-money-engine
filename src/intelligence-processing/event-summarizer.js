import { sentenceSplit, normalizeWhitespace } from './text-normalizer.js';
export class EventSummarizer {
    summarize(event, options = {}) {
        const maximumSentences = options.maximumSentences || 3;
        const evidence = [event.summary, ...(event.records || []).map(record => record.summary || record.title)].filter(Boolean);
        const sentences = [...new Set(evidence.flatMap(sentenceSplit))];
        const keywords = new Set([
            event.category,
            event.locationName,
            ...(event.entities || []).slice(0, 8).map(entity => entity.name),
            ...(event.impact?.domains || []).slice(0, 5).map(item => item.domain)
        ].filter(Boolean).map(value => String(value).toLowerCase()));
        const ranked = sentences.map(sentence => ({
            sentence,
            score: scoreSentence(sentence, keywords, event)
        })).sort((left, right) => right.score - left.score);
        const selected = [];
        for (const item of ranked) {
            if (selected.length >= maximumSentences)
                break;
            if (selected.some(existing => overlap(existing, item.sentence) > 0.72))
                continue;
            selected.push(item.sentence);
        }
        return {
            headline: normalizeWhitespace(event.title || selected[0] || 'Material event'),
            brief: normalizeWhitespace(selected.join(' ')),
            bullets: buildBullets(event),
            wordCount: selected.join(' ').split(/\s+/).filter(Boolean).length,
            evidenceSentenceCount: sentences.length
        };
    }
}
function scoreSentence(sentence, keywords, event) {
    const lower = sentence.toLowerCase();
    let score = Math.min(20, sentence.length / 12);
    for (const keyword of keywords)
        if (lower.includes(keyword))
            score += 8;
    if (/\b\d+(?:\.\d+)?\b/.test(sentence))
        score += 6;
    if (/confirmed|official|according to/i.test(sentence))
        score += 4;
    if (/killed|closed|damaged|disrupted|halted|sanction/i.test(sentence))
        score += 8;
    score += Number(event.materiality?.score || 0) / 20;
    return score;
}
function buildBullets(event) {
    const bullets = [];
    if (event.locationName)
        bullets.push(`Location: ${event.locationName}`);
    if (event.status)
        bullets.push(`Status: ${event.status}`);
    if (event.confidence?.label)
        bullets.push(`Confidence: ${event.confidence.label} (${event.confidence.score})`);
    if (event.materiality?.level)
        bullets.push(`Impact: ${event.materiality.level} (${event.materiality.score})`);
    if (event.sourceIds?.length)
        bullets.push(`Evidence: ${event.sourceIds.length} source${event.sourceIds.length === 1 ? '' : 's'}`);
    return bullets;
}
function overlap(left, right) {
    const a = new Set(left.toLowerCase().split(/\W+/).filter(Boolean));
    const b = new Set(right.toLowerCase().split(/\W+/).filter(Boolean));
    const intersection = [...a].filter(value => b.has(value)).length;
    return intersection / Math.max(1, Math.min(a.size, b.size));
}
