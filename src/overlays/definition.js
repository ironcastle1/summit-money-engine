import { OVERLAY_RENDERERS, OVERLAY_SOURCE_MODES } from './constants.js';
import { invalidOverlayState } from './errors.js';
const ID = /^[a-z][a-z0-9-]{1,63}$/;
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export function overlayDefinition(input) {
  if (!input || !ID.test(String(input.id || ''))) throw invalidOverlayState('Overlay ID is invalid', { id: input?.id });
  if (!OVERLAY_RENDERERS.includes(String(input.renderer))) throw invalidOverlayState('Overlay renderer is invalid', { renderer: input.renderer });
  if (!OVERLAY_SOURCE_MODES.includes(String(input.sourceMode))) throw invalidOverlayState('Overlay source mode is invalid', { sourceMode: input.sourceMode });
  const minimumZoom = finite(input.minimumZoom, 0);
  const maximumZoom = finite(input.maximumZoom, 20);
  if (minimumZoom < 0 || maximumZoom > 24 || minimumZoom > maximumZoom) throw invalidOverlayState('Overlay zoom range is invalid', { minimumZoom, maximumZoom });
  return Object.freeze({
    id: String(input.id), title: String(input.title || input.id), description: String(input.description || ''),
    group: String(input.group || 'reference'), renderer: String(input.renderer), source: String(input.source || input.id), sourceMode: String(input.sourceMode),
    visible: input.visible === true, enabled: input.enabled !== false, interactive: input.interactive !== false, searchable: input.searchable !== false,
    minimumZoom, maximumZoom, order: finite(input.order, 0), opacity: Math.max(0, Math.min(1, finite(input.opacity, 1))),
    entitlement: String(input.entitlement || 'basic'), refreshSeconds: Math.max(0, Math.trunc(finite(input.refreshSeconds, 300))),
    style: Object.freeze({ ...(input.style || {}) }), filters: Object.freeze({ ...(input.filters || {}) }),
    legend: Object.freeze([...(input.legend || [])]), metadata: Object.freeze({ ...(input.metadata || {}) })
  });
}
export function publicOverlayDefinition(definition) {
  const { filters, ...publicDefinition } = definition;
  return Object.freeze({ ...publicDefinition, filterSchema: Object.freeze(Object.keys(filters || {})) });
}
