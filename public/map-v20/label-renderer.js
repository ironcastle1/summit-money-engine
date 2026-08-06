import { svg } from './svg-surface.js';
import { bilingualText } from './label-language.js';
import { estimateLabelBox, layoutLabels } from './label-layout.js';

function linesFor(feature, zoom) {
  const labels = bilingualText(feature.properties);
  const type = String(feature.properties?.labelType || '').toLowerCase();
  const population = Number(feature.properties?.populationBaseline || 0);
  if (type === 'country' && zoom < 2.6 && population < 25_000_000) return [];
  if (type === 'country' && zoom < 3.3 && population < 4_000_000) return [];
  if (type === 'city' && zoom < 4.2) return [];
  if (type === 'capital' && zoom < 3.2) return [];
  if (labels.secondary && zoom >= 4) return [labels.primary, `(${labels.secondary})`];
  return labels.primary ? [labels.primary] : [];
}

export class LabelRenderer {
  render({ layer, features, viewport, group, entities }) {
    group.replaceChildren();
    entities.removeLayer(layer.id);
    const candidates = features
      .filter(feature => feature.geometry?.type === 'Point')
      .map(feature => {
        const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] });
        const lines = linesFor(feature, viewport.state.zoom);
        return { feature, point, lines, box: estimateLabelBox(point, lines, layer.style || {}) };
      })
      .filter(candidate => candidate.lines.length);

    for (const candidate of layoutLabels(candidates, {
      width: viewport.state.size.width,
      height: viewport.state.size.height,
      maximum: viewport.state.zoom < 3 ? 34 : viewport.state.zoom < 5 ? 90 : 180,
      padding: viewport.state.zoom < 4 ? 5 : 3
    })) {
      const key = entities.registerFeature(candidate.feature, candidate.feature.properties?.kind || 'PLACE');
      const text = svg('text', {
        x: candidate.point.x,
        y: candidate.point.y + 14,
        'text-anchor': 'middle',
        class: 'merlin-v20-label',
        'data-map-entity': key,
        tabindex: 0,
        role: 'button'
      });
      candidate.lines.forEach((line, index) => {
        const span = svg('tspan', {
          x: candidate.point.x,
          dy: index ? 11 : 0,
          class: index ? 'merlin-v20-label-local' : 'merlin-v20-label-english'
        });
        span.textContent = line;
        text.append(span);
      });
      group.append(text);
    }
  }
}
