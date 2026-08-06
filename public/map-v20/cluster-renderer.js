import { svg } from './svg-surface.js';
import { ENTITY_COLOURS } from './constants.js';
function cluster(features, viewport, radius = 42) {
    const buckets = new Map();
    for (const feature of features) {
        if (feature.geometry?.type !== 'Point')
            continue;
        const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] });
        const key = `${Math.floor(point.x / radius)}:${Math.floor(point.y / radius)}`;
        const bucket = buckets.get(key) || [];
        bucket.push({ feature, point });
        buckets.set(key, bucket);
    }
    return [...buckets.values()];
}
export class ClusterRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        for (const items of cluster(features, viewport, layer.style?.clusterRadius || 42)) {
            const point = { x: items.reduce((sum, item) => sum + item.point.x, 0) / items.length, y: items.reduce((sum, item) => sum + item.point.y, 0) / items.length };
            if (items.length === 1 || viewport.state.zoom >= (layer.style?.clusterMaxZoom || 9)) {
                for (const item of items) {
                    const key = entities.registerFeature(item.feature, item.feature.properties?.kind || layer.id);
                    group.append(svg('circle', { cx: item.point.x, cy: item.point.y, r: 6, fill: item.feature.properties?.colour || ENTITY_COLOURS.other, stroke: '#fff', 'stroke-width': 1.5, class: 'merlin-v20-marker', 'data-map-entity': key, tabindex: 0, role: 'button' }));
                }
                continue;
            }
            const key = entities.register({ key: `cluster:${layer.id}:${items.map(item => item.feature.__key).join('|')}`, kind: 'CLUSTER', data: { title: `${items.length} map items`, count: items.length, members: items.map(item => item.feature) }, feature: { __layerId: layer.id } });
            const radius = Math.min(24, 11 + Math.log2(items.length) * 3);
            group.append(svg('circle', { cx: point.x, cy: point.y, r: radius, fill: layer.style?.colour || '#496c7c', stroke: '#fff', 'stroke-width': 2, class: 'merlin-v20-cluster', 'data-map-entity': key, tabindex: 0, role: 'button', 'aria-label': `${items.length} clustered map items` }));
            const text = svg('text', { x: point.x, y: point.y + 4, 'text-anchor': 'middle', class: 'merlin-v20-cluster-count', 'data-map-entity': key });
            text.textContent = String(items.length);
            group.append(text);
        }
    }
}
