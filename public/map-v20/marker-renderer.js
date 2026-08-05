import { svg } from './svg-surface.js';
import { ENTITY_COLOURS } from './constants.js';
function colour(feature, layer) { return feature.properties?.colour || layer.style?.colour || ENTITY_COLOURS[String(feature.properties?.kind || '').toLowerCase()] || ENTITY_COLOURS.other; }
function radius(feature, layer) { const severity = Number(feature.properties?.severity || feature.properties?.importance || 0); return Math.max(4, Math.min(12, Number(layer.style?.radius || 5) + severity / 30)); }
export class MarkerRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        for (const feature of features) {
            if (feature.geometry?.type !== 'Point')
                continue;
            const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] });
            if (point.x < -20 || point.x > viewport.state.size.width + 20 || point.y < -20 || point.y > viewport.state.size.height + 20)
                continue;
            const key = entities.registerFeature(feature, feature.properties?.kind || layer.id);
            const circle = svg('circle', { cx: point.x, cy: point.y, r: radius(feature, layer), fill: colour(feature, layer), stroke: '#f7fbfc', 'stroke-width': 1.5, class: 'merlin-v20-marker', 'data-map-entity': key, tabindex: layer.interactive ? 0 : -1, role: 'button', 'aria-label': feature.properties?.title || feature.properties?.nameEnglish || feature.properties?.name || 'Map feature' });
            group.append(circle);
        }
    }
}
