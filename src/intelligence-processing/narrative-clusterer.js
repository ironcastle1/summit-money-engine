import { weightedTextSimilarity } from './token-similarity.js';
import { stableTextKey, tokenize } from './text-normalizer.js';
export class NarrativeClusterer {
    constructor(options = {}) { this.threshold = options.threshold ?? 0.48; }
    cluster(events = []) {
        const clusters = [];
        for (const event of events) {
            const text = this.#text(event);
            let best = null;
            for (const cluster of clusters) {
                const score = weightedTextSimilarity(text, cluster.representative);
                if (!best || score > best.score)
                    best = { cluster, score };
            }
            if (best && best.score >= this.threshold) {
                best.cluster.events.push(event);
                best.cluster.scores.push(best.score);
                best.cluster.representative = this.#representative(best.cluster.events);
            }
            else
                clusters.push({ id: `narrative_${stableTextKey(text).slice(4)}`, representative: text, events: [event], scores: [] });
        }
        return clusters.map(cluster => ({ ...cluster, title: this.#title(cluster.events), keywords: topKeywords(cluster.events.map(event => this.#text(event)).join(' ')), eventIds: cluster.events.map(event => event.id), averageSimilarity: average(cluster.scores), updatedAt: cluster.events.map(event => event.updatedAt || event.timestamp).sort().at(-1) })).sort((a, b) => b.events.length - a.events.length);
    }
    #text(event) { return [event.title, event.summary, (event.entities || []).map(entity => entity.name).join(' ')].filter(Boolean).join(' '); }
    #representative(events) { return events.map(event => this.#text(event)).sort((a, b) => b.length - a.length)[0] || ''; }
    #title(events) { return events.sort((a, b) => (b.materiality?.score || 0) - (a.materiality?.score || 0))[0]?.title || 'Narrative'; }
}
function topKeywords(text) {
    const counts = new Map();
    for (const token of tokenize(text, { minimumLength: 4 }))
        counts.set(token, (counts.get(token) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([token]) => token);
}
function average(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1; }
