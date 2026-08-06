export class SourceReputationRegistry {
    constructor(seed = []) {
        this.sources = new Map();
        for (const source of seed)
            this.register(source);
    }
    register(source) {
        if (!source?.id)
            throw new TypeError('Source id is required');
        const current = this.sources.get(source.id) || defaultSource(source.id);
        const next = {
            ...current,
            ...source,
            id: String(source.id),
            reliability: clamp(source.reliability ?? current.reliability),
            corrections: Number(source.corrections ?? current.corrections),
            confirmedClaims: Number(source.confirmedClaims ?? current.confirmedClaims),
            falseClaims: Number(source.falseClaims ?? current.falseClaims),
            updatedAt: new Date().toISOString()
        };
        this.sources.set(next.id, next);
        return next;
    }
    get(id) {
        return this.sources.get(String(id)) || defaultSource(String(id));
    }
    recordOutcome(id, outcome, weight = 1) {
        const source = this.get(id);
        const amount = Math.max(0.1, Number(weight) || 1);
        if (outcome === 'CONFIRMED')
            source.confirmedClaims += amount;
        if (outcome === 'FALSE')
            source.falseClaims += amount;
        if (outcome === 'CORRECTED')
            source.corrections += amount;
        const total = source.confirmedClaims + source.falseClaims + source.corrections;
        const empirical = total
            ? (source.confirmedClaims + source.corrections * 0.35) / total * 100
            : source.reliability;
        source.reliability = clamp(source.reliability * 0.8 + empirical * 0.2);
        source.updatedAt = new Date().toISOString();
        this.sources.set(source.id, source);
        return source;
    }
    list() {
        return [...this.sources.values()].sort((left, right) => right.reliability - left.reliability);
    }
    snapshot() {
        const values = this.list();
        return {
            sources: values.length,
            averageReliability: values.length ? values.reduce((sum, item) => sum + item.reliability, 0) / values.length : 0,
            highest: values[0] || null,
            lowest: values.at(-1) || null
        };
    }
}
function defaultSource(id) {
    return { id, reliability: 50, confirmedClaims: 0, falseClaims: 0, corrections: 0, updatedAt: null };
}
function clamp(value) {
    return Math.max(0, Math.min(100, Number(value) || 0));
}
