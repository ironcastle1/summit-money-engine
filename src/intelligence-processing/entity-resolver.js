import { AliasIndex } from './alias-index.js';
import { createEntity, mergeEntities } from './entity-schema.js';
import { weightedTextSimilarity } from './token-similarity.js';
import { haversineDistanceKm } from './geo-utils.js';
import { DEFAULT_THRESHOLDS } from './constants.js';
export class EntityResolver {
    constructor(options = {}) { this.threshold = options.threshold ?? DEFAULT_THRESHOLDS.entityMerge; this.entities = new Map(); this.aliases = new AliasIndex(); }
    add(input) {
        const entity = createEntity(input);
        const resolved = this.resolve(entity);
        if (resolved.match && !resolved.conflict) {
            const merged = mergeEntities(resolved.match, entity);
            this.entities.set(merged.id, merged);
            this.aliases.add(merged);
            if (entity.id !== merged.id)
                this.entities.delete(entity.id);
            return { entity: merged, merged: true, score: resolved.score };
        }
        this.entities.set(entity.id, entity);
        this.aliases.add(entity);
        return { entity, merged: false, score: resolved.score || 0 };
    }
    addMany(inputs = []) { return inputs.map(input => this.add(input)); }
    resolve(input) {
        const candidate = createEntity(input);
        const ids = new Set();
        for (const alias of [candidate.name, candidate.canonicalName, ...candidate.aliases])
            for (const id of this.aliases.candidates(alias))
                ids.add(id);
        let best = null;
        for (const id of ids) {
            const existing = this.entities.get(id);
            if (!existing || existing.type !== candidate.type)
                continue;
            const comparison = this.compare(existing, candidate);
            if (!best || comparison.score > best.score)
                best = { match: existing, ...comparison };
        }
        return best && best.score >= this.threshold && !best.conflict ? best : { match: null, score: best?.score || 0, conflict: best?.conflict || false, reasons: best?.reasons || [] };
    }
    compare(left, right) {
        const reasons = [];
        let conflict = false;
        for (const [key, value] of Object.entries(left.identifiers || {}))
            if (right.identifiers?.[key] && right.identifiers[key] !== value) {
                conflict = true;
                reasons.push(`identifier:${key}`);
            }
        const names = [right.name, ...right.aliases];
        const nameScore = Math.max(...[left.name, ...left.aliases].flatMap(a => names.map(b => weightedTextSimilarity(a, b))), 0);
        const identifierKeys = Object.keys(left.identifiers || {}).filter(key => right.identifiers?.[key] === left.identifiers[key]);
        const identifierScore = identifierKeys.length ? 1 : 0;
        const countryScore = left.countryCode && right.countryCode ? (left.countryCode === right.countryCode ? 1 : 0) : 0.5;
        const distance = left.coordinate && right.coordinate ? haversineDistanceKm(left.coordinate, right.coordinate) : null;
        const geoScore = distance === null ? 0.5 : Math.max(0, 1 - distance / 500);
        const score = nameScore * 0.58 + identifierScore * 0.25 + countryScore * 0.08 + geoScore * 0.09;
        return { score: conflict ? Math.min(score, 0.45) : score, conflict, reasons, factors: { nameScore, identifierScore, countryScore, geoScore, distanceKm: distance } };
    }
    get(id) { return this.entities.get(id) || null; }
    list() { return [...this.entities.values()]; }
    snapshot() { return { entities: this.entities.size, ...this.aliases.snapshot() }; }
}
