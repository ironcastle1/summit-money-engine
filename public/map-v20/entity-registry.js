export class EntityRegistry {
    constructor() { this.records = new Map(); }
    register(entity) { const key = String(entity.key || entity.id); this.records.set(key, Object.freeze({ ...entity, key })); return key; }
    registerFeature(feature, kind, data) { return this.register({ key: feature.__key || feature.id, kind, feature, data: data || feature.properties || feature }); }
    get(key) { return this.records.get(String(key)) || null; }
    removeLayer(layerId) { for (const [key, value] of this.records)
        if (value.feature?.__layerId === layerId)
            this.records.delete(key); }
    clear() { this.records.clear(); }
    get size() { return this.records.size; }
}
