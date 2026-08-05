import { IMPACT_DOMAINS } from './constants.js';
import { IMPACT_KEYWORDS, IMPACT_WEIGHTS } from './impact-taxonomy.js';
import { normalizeText } from './text-normalizer.js';
export class ImpactClassifier {
    classify(event) {
        const text = normalizeText([event?.title, event?.summary, event?.description, event?.category, ...(event?.tags || [])].filter(Boolean).join(' '));
        const domains = [];
        for (const domain of IMPACT_DOMAINS) {
            const hits = (IMPACT_KEYWORDS[domain] || []).filter(keyword => text.includes(keyword));
            if (hits.length) {
                const score = Math.min(100, 18 + hits.length * 14 + contextBoost(domain, event));
                domains.push({ domain, score: Math.round(score), keywords: hits.slice(0, 8), weight: IMPACT_WEIGHTS[domain] || 1 });
            }
        }
        domains.sort((a, b) => b.score * b.weight - a.score * a.weight);
        return { primary: domains[0]?.domain || 'INFORMATION', domains, coverage: domains.length / IMPACT_DOMAINS.length, generatedAt: new Date().toISOString() };
    }
}
function contextBoost(domain, event) {
    let score = 0;
    const severity = Number(event?.severity || 0);
    if (severity > 0)
        score += Math.min(20, severity / 5);
    if (Number(event?.deaths) > 0 && ['HUMAN', 'HUMANITARIAN'].includes(domain))
        score += 20;
    if (event?.magnitude && domain === 'ENVIRONMENTAL')
        score += Math.max(0, (Number(event.magnitude) - 4) * 8);
    if (event?.strategicAsset && ['ENERGY', 'SHIPPING', 'INFRASTRUCTURE'].includes(domain))
        score += 18;
    return score;
}
