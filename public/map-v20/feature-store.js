export class FeatureStore {
    constructor() { this.layers = new Map(); this.version = 0; }
    set(layerId, features = []) { const normalized = features.map((feature, index) => ({ ...feature, __layerId: layerId, __key: String(feature.id ?? feature.properties?.id ?? `${layerId}:${index}`) })); this.layers.set(layerId, normalized); this.version += 1; return normalized; }
    append(layerId, features = []) { return this.set(layerId, [...this.get(layerId), ...features]); }
    get(layerId) { return this.layers.get(layerId) || []; }
    all() { return [...this.layers.values()].flat(); }
    find(key) { for (const features of this.layers.values()) {
        const feature = features.find(item => item.__key === String(key));
        if (feature)
            return feature;
    } return null; }
    remove(layerId) { const removed = this.layers.delete(layerId); if (removed)
        this.version += 1; return removed; }
    clear() { this.layers.clear(); this.version += 1; }
}
