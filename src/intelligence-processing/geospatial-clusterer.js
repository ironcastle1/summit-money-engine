import { centroid, haversineDistanceKm, validCoordinate } from './geo-utils.js';
export class GeospatialClusterer {
    constructor(options = {}) {
        this.radiusKm = options.radiusKm || 150;
        this.minimumPoints = options.minimumPoints || 1;
    }
    cluster(items = []) {
        const valid = items.filter(item => validCoordinate(item.coordinate || item));
        const unvisited = new Set(valid);
        const clusters = [];
        while (unvisited.size) {
            const seed = unvisited.values().next().value;
            unvisited.delete(seed);
            const members = [seed];
            const queue = [seed];
            while (queue.length) {
                const current = queue.shift();
                for (const candidate of [...unvisited]) {
                    if (haversineDistanceKm(current.coordinate || current, candidate.coordinate || candidate) <= this.radiusKm) {
                        unvisited.delete(candidate);
                        members.push(candidate);
                        queue.push(candidate);
                    }
                }
            }
            if (members.length >= this.minimumPoints)
                clusters.push(this.#summarize(members));
        }
        return clusters.sort((left, right) => right.members.length - left.members.length);
    }
    #summarize(members) {
        const center = centroid(members.map(item => item.coordinate || item));
        const distances = members.map(item => haversineDistanceKm(center, item.coordinate || item));
        const categories = new Map();
        for (const item of members) {
            const category = item.category || 'other';
            categories.set(category, (categories.get(category) || 0) + 1);
        }
        return {
            id: `geo_${center.lat.toFixed(2)}_${center.lon.toFixed(2)}`,
            center,
            members,
            memberIds: members.map(item => item.id).filter(Boolean),
            radiusKm: Math.max(...distances, 0),
            categories: Object.fromEntries([...categories.entries()].sort((left, right) => right[1] - left[1]))
        };
    }
}
