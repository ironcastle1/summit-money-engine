const HALF_LIVES = Object.freeze({
    earthquake: 12,
    conflict: 24,
    protest: 12,
    storm: 18,
    flood: 36,
    wildfire: 24,
    political: 72,
    economic: 48,
    market: 6,
    shipping: 24,
    infrastructure: 48,
    other: 36
});
export class FreshnessModel {
    score(event, now = Date.now()) {
        const timestamp = Date.parse(event?.updatedAt || event?.timestamp || event?.publishedAt || '');
        if (!Number.isFinite(timestamp))
            return { score: 25, ageHours: null, halfLifeHours: null, state: 'UNKNOWN' };
        const ageHours = Math.max(0, (Number(now) - timestamp) / 3600000);
        const category = String(event.category || 'other').toLowerCase();
        const halfLifeHours = Number(event.freshnessHalfLifeHours || HALF_LIVES[category] || HALF_LIVES.other);
        const score = Math.round(Math.exp(-Math.log(2) * ageHours / halfLifeHours) * 100);
        return {
            score,
            ageHours: Math.round(ageHours * 100) / 100,
            halfLifeHours,
            state: score >= 75 ? 'FRESH' : score >= 40 ? 'CURRENT' : score >= 15 ? 'AGING' : 'STALE'
        };
    }
    rank(events = [], now = Date.now()) {
        return events.map(event => ({ ...event, freshness: this.score(event, now) })).sort((left, right) => right.freshness.score - left.freshness.score);
    }
}
