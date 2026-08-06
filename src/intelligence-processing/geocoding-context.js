import { defaultPlaceIndex } from './place-index.js';
import { centroid, haversineDistanceKm, validCoordinate } from './geo-utils.js';
export class GeocodingContextResolver {
    constructor(options = {}) {
        this.places = options.places || defaultPlaceIndex();
        this.maximumCandidates = options.maximumCandidates || 8;
    }
    resolve(record, entities = []) {
        const candidates = [];
        if (validCoordinate(record?.coordinate)) {
            candidates.push({ coordinate: record.coordinate, label: record.locationName || null, source: 'record', score: 0.95 });
        }
        for (const entity of entities) {
            if (validCoordinate(entity.coordinate)) {
                candidates.push({ coordinate: entity.coordinate, label: entity.name, source: `entity:${entity.id}`, score: 0.8 + Number(entity.confidence || 0) / 1000 });
            }
        }
        for (const query of [record?.locationName, record?.place, record?.country].filter(Boolean)) {
            for (const match of this.places.resolve(query).slice(0, this.maximumCandidates)) {
                candidates.push({ coordinate: { lat: match.place.lat, lon: match.place.lon }, label: match.place.name, localName: match.place.localName, source: 'place-index', score: match.score });
            }
        }
        if (!candidates.length)
            return { coordinate: null, label: null, confidence: 0, candidates: [] };
        const groups = clusterCandidates(candidates);
        const best = groups.sort((left, right) => right.score - left.score)[0];
        return {
            coordinate: centroid(best.items.map(item => item.coordinate)),
            label: best.items.find(item => item.label)?.label || null,
            localName: best.items.find(item => item.localName)?.localName || null,
            confidence: Math.min(100, Math.round(best.score * 100)),
            candidates: candidates.sort((left, right) => right.score - left.score).slice(0, this.maximumCandidates),
            disagreementKm: maximumPairDistance(best.items)
        };
    }
}
function clusterCandidates(candidates) {
    const groups = [];
    for (const candidate of candidates) {
        let group = groups.find(item => haversineDistanceKm(item.center, candidate.coordinate) <= 150);
        if (!group) {
            group = { center: candidate.coordinate, items: [], score: 0 };
            groups.push(group);
        }
        group.items.push(candidate);
        group.center = centroid(group.items.map(item => item.coordinate));
        group.score += candidate.score;
    }
    return groups;
}
function maximumPairDistance(items) {
    let maximum = 0;
    for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
            maximum = Math.max(maximum, haversineDistanceKm(items[left].coordinate, items[right].coordinate));
        }
    }
    return maximum;
}
