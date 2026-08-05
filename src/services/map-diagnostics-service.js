import { minimumWorldZoom } from '../geospatial/world-clamp.js';
export class MapDiagnosticsService {
    constructor(options) { Object.assign(this, options); this.startedAt = Date.now(); this.metrics = { featureQueries: 0, searchQueries: 0, eventQueries: 0, savedViewWrites: 0, failures: 0 }; }
    increment(name, amount = 1) { if (name in this.metrics)
        this.metrics[name] += amount; }
    failure() { this.metrics.failures += 1; }
    snapshot() {
        return Object.freeze({
            ready: true, uptimeMs: Date.now() - this.startedAt, metrics: Object.freeze({ ...this.metrics }), staticFeatures: this.features.summary(),
            search: this.search.summary(), layers: this.layers.snapshot(), styles: this.styles.snapshot(),
            worldConstraints: Object.freeze({ maximumLatitude: 85.0511287798066, longitudeRange: [-180, 180], minimumZoom1280x720: minimumWorldZoom(1280, 720), repeatWorld: false }),
            generatedAt: new Date().toISOString()
        });
    }
}
