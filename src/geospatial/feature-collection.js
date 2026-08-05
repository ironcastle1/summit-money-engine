import { normalizeFeature } from './geojson-normalizer.js';
export function featureCollection(features = [], options = {}) {
    return Object.freeze({ type: 'FeatureCollection', features: Object.freeze(features.map(feature => normalizeFeature(feature, options))) });
}
export function mapFeatures(collection, mapper, options = {}) { return featureCollection(collection.features.map(mapper).filter(Boolean), options); }
export function filterFeatures(collection, predicate, options = {}) { return featureCollection(collection.features.filter(predicate), options); }
export function mergeFeatureCollections(collections = [], options = {}) {
    const byId = new Map();
    for (const collection of collections)
        for (const feature of collection?.features || [])
            byId.set(String(feature.id), feature);
    return featureCollection([...byId.values()], options);
}
