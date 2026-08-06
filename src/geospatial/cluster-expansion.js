import { featureCollectionBounds } from './geojson-bounds.js';
import { fitBounds } from './fit-bounds.js';
export function expansionViewport(cluster, dimensions, options = {}) {
    const members = cluster?.members || [];
    if (!members.length)
        return null;
    const bounds = featureCollectionBounds({ type: 'FeatureCollection', features: members });
    if (!bounds)
        return null;
    return fitBounds(bounds, dimensions, { padding: options.padding ?? 70, maximumZoom: options.maximumZoom ?? 14 });
}
export function clusterLeaves(cluster, offset = 0, limit = 100) { return (cluster?.members || []).slice(Math.max(0, offset), Math.max(0, offset) + Math.max(1, limit)); }
