import { featureCentroid } from './centroid.js';
import { featureBounds } from './geojson-bounds.js';
import { spatialHash, neighbouringHashes } from './spatial-hash.js';
import { bboxIntersects } from './bbox.js';
import { haversineDistance } from './distance.js';
export class SpatialIndex {
    constructor(options = {}) { this.zoom = options.zoom ?? 7; this.cells = new Map(); this.records = new Map(); }
    clear() { this.cells.clear(); this.records.clear(); }
    insert(feature) {
        const point = featureCentroid(feature);
        if (!point)
            return false;
        const id = String(feature.id);
        const record = Object.freeze({ id, feature, point, bounds: featureBounds(feature) });
        this.remove(id);
        this.records.set(id, record);
        const hash = spatialHash(point, this.zoom);
        const bucket = this.cells.get(hash) || new Set();
        bucket.add(id);
        this.cells.set(hash, bucket);
        return true;
    }
    load(features = []) { features.forEach(feature => this.insert(feature)); return this; }
    remove(id) {
        const key = String(id);
        const existing = this.records.get(key);
        if (!existing)
            return false;
        const bucket = this.cells.get(spatialHash(existing.point, this.zoom));
        bucket?.delete(key);
        if (!bucket?.size)
            this.cells.delete(spatialHash(existing.point, this.zoom));
        return this.records.delete(key);
    }
    withinRadius(point, radiusKm, limit = 500) {
        const candidates = new Set(neighbouringHashes(point, this.zoom, 2).flatMap(hash => [...(this.cells.get(hash) || [])]));
        return [...candidates].map(id => this.records.get(id)).map(record => ({ ...record, distanceKm: haversineDistance(point, record.point) })).filter(record => record.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit);
    }
    withinBounds(bounds, limit = 5000) { return [...this.records.values()].filter(record => record.bounds && bboxIntersects(bounds, record.bounds)).slice(0, limit); }
    get size() { return this.records.size; }
}
