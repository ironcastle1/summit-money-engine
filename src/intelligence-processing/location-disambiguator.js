import { defaultPlaceIndex } from './place-index.js';
import { haversineDistanceKm, validCoordinate } from './geo-utils.js';
export class LocationDisambiguator {
    constructor(options = {}) {
        this.places = options.places || defaultPlaceIndex();
    }
    disambiguate(name, context = {}) {
        const candidates = this.places.resolve(name, context).map(item => ({
            place: item.place,
            baseScore: item.score,
            contextScore: this.#contextScore(item.place, context)
        })).map(item => ({ ...item, score: Math.min(1, item.baseScore * 0.65 + item.contextScore * 0.35) }))
            .sort((left, right) => right.score - left.score);
        const best = candidates[0] || null;
        const second = candidates[1] || null;
        const margin = best ? best.score - (second?.score || 0) : 0;
        return {
            query: name,
            resolved: Boolean(best && (best.score >= 0.55 || margin >= 0.2)),
            ambiguous: Boolean(best && second && margin < 0.15),
            confidence: best ? Math.round(best.score * 100) : 0,
            margin: Math.round(margin * 100) / 100,
            place: best?.place || null,
            candidates: candidates.slice(0, context.limit || 10)
        };
    }
    #contextScore(place, context) {
        let score = 0.45;
        if (context.countryCode)
            score += place.countryCode === String(context.countryCode).toUpperCase() || place.iso2 === String(context.countryCode).toUpperCase() ? 0.3 : -0.2;
        if (context.type)
            score += place.type === context.type ? 0.15 : -0.05;
        if (validCoordinate(context.coordinate)) {
            const distance = haversineDistanceKm(context.coordinate, place);
            score += Math.max(-0.2, 0.25 - distance / 20000);
        }
        if (context.nearbyEntityNames?.some(name => this.#nearby(place, name)))
            score += 0.12;
        return Math.max(0, Math.min(1, score));
    }
    #nearby(place, name) {
        const other = this.places.resolve(name)[0]?.place;
        return other ? haversineDistanceKm(place, other) <= 750 : false;
    }
}
