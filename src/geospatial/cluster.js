import { projectWorld } from './mercator.js';
import { stableFeatureId } from './feature-id.js';
export function clusterFeatures(features = [], options = {}) {
    const zoom = Number(options.zoom ?? 4);
    const radiusPixels = Number(options.radiusPixels ?? 45);
    const buckets = new Map();
    for (const feature of features) {
        if (feature.geometry?.type !== 'Point')
            continue;
        const point = projectWorld({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }, zoom);
        const key = `${Math.floor(point.x / radiusPixels)}:${Math.floor(point.y / radiusPixels)}`;
        const bucket = buckets.get(key) || [];
        bucket.push(feature);
        buckets.set(key, bucket);
    }
    return [...buckets.values()].map(items => {
        if (items.length === 1)
            return { type: 'single', feature: items[0], count: 1 };
        const lon = items.reduce((sum, item) => sum + Number(item.geometry.coordinates[0]), 0) / items.length;
        const lat = items.reduce((sum, item) => sum + Number(item.geometry.coordinates[1]), 0) / items.length;
        const cluster = { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { cluster: true, pointCount: items.length, memberIds: items.map(item => String(item.id)) } };
        cluster.id = stableFeatureId(cluster, `cluster-z${Math.floor(zoom)}`);
        return { type: 'cluster', feature: Object.freeze(cluster), count: items.length, members: items };
    });
}
