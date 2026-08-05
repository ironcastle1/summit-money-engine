import { weightedTextSimilarity } from './token-similarity.js';
import { haversineDistanceKm, validCoordinate } from './geo-utils.js';
export class RelevanceRanker {
    score(event, context = {}) {
        const text = [event.title, event.summary, event.locationName].filter(Boolean).join(' ');
        const query = context.query ? weightedTextSimilarity(text, context.query) : 0.5;
        const distance = validCoordinate(context.coordinate) && validCoordinate(event.coordinate) ? haversineDistanceKm(context.coordinate, event.coordinate) : null;
        const proximity = distance === null ? 0.45 : Math.exp(-distance / Math.max(50, Number(context.radiusKm) || 1000));
        const confidence = Number(event.confidence?.score ?? event.confidence ?? 50) / 100;
        const materiality = Number(event.materiality?.score ?? event.materialityScore ?? 50) / 100;
        const recency = recencyScore(event.updatedAt || event.timestamp, context.now);
        const watchlist = watchlistScore(event, context.watchlist || []);
        const score = Math.round(Math.max(0, Math.min(1, query * 0.24 + proximity * 0.18 + confidence * 0.18 + materiality * 0.24 + recency * 0.11 + watchlist * 0.05)) * 100);
        return { score, factors: { query, proximity, confidence, materiality, recency, watchlist }, distanceKm: distance };
    }
    rank(events, context = {}) { return (events || []).map(event => ({ ...event, relevance: this.score(event, context) })).sort((a, b) => b.relevance.score - a.relevance.score); }
}
function recencyScore(timestamp, now = Date.now()) {
    const time = Date.parse(timestamp || '');
    if (!Number.isFinite(time))
        return 0.35;
    return Math.exp(-Math.max(0, (Number(now) || Date.now()) - time) / 172800000);
}
function watchlistScore(event, watchlist) { const text = JSON.stringify(event).toLowerCase(); return watchlist.some(item => text.includes(String(item).toLowerCase())) ? 1 : 0; }
