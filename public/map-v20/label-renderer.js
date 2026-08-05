import { svg } from './svg-surface.js';
import { labelLines } from './label-language.js';
import { estimateLabelBox, layoutLabels } from './label-layout.js';
export class LabelRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        const candidates = features.filter(feature => feature.geometry?.type === 'Point').map(feature => { const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }); const lines = labelLines(feature.properties); return { feature, point, lines, box: estimateLabelBox(point, lines, layer.style || {}) }; });
        for (const candidate of layoutLabels(candidates, { width: viewport.state.size.width, height: viewport.state.size.height, maximum: layer.style?.maximum || 180 })) {
            const key = entities.registerFeature(candidate.feature, candidate.feature.properties?.kind || 'PLACE');
            const text = svg('text', { x: candidate.point.x, y: candidate.point.y + 16, 'text-anchor': 'middle', class: 'merlin-v20-label', 'data-map-entity': key, tabindex: 0, role: 'button' });
            candidate.lines.forEach((line, index) => { const span = svg('tspan', { x: candidate.point.x, dy: index ? 12 : 0, class: index ? 'merlin-v20-label-local' : 'merlin-v20-label-english' }); span.textContent = line; text.append(span); });
            group.append(text);
        }
    }
}
