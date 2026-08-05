import { svg } from './svg-surface.js';
function pathFor(coordinates, viewport) { return coordinates.map((coordinate, index) => { const point = viewport.project({ lon: coordinate[0], lat: coordinate[1] }); return `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`; }).join(' '); }
export class RouteRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        for (const feature of features) {
            const lines = feature.geometry?.type === 'LineString' ? [feature.geometry.coordinates] : feature.geometry?.type === 'MultiLineString' ? feature.geometry.coordinates : [];
            for (const coordinates of lines) {
                const key = entities.registerFeature(feature, feature.properties?.kind || 'ROUTE');
                group.append(svg('path', { d: pathFor(coordinates, viewport), fill: 'none', stroke: feature.properties?.colour || layer.style?.colour || '#328eb8', 'stroke-width': layer.style?.width || 2.5, 'stroke-dasharray': layer.style?.dash || '9 6', opacity: layer.style?.opacity || 0.82, class: 'merlin-v20-route', 'data-map-entity': key, tabindex: 0, role: 'button' }));
            }
        }
    }
}
