import { invalidOverlayState } from './errors.js';
const clamp = (value,min,max) => Math.max(min,Math.min(max,Number(value)));
export function normalizeLayerState(input = {}) {
  if (!input.id) throw invalidOverlayState('Layer state requires an ID');
  return Object.freeze({ id: String(input.id), visible: input.visible === true, opacity: clamp(input.opacity ?? 1,0,1), order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0, filters: Object.freeze({ ...(input.filters || {}) }) });
}
export function normalizeOverlayState(input = {}, catalog) {
  const states = new Map();
  for (const layer of catalog.list()) states.set(layer.id, normalizeLayerState({ id: layer.id, visible: layer.visible, opacity: layer.opacity, order: layer.order, filters: layer.filters }));
  for (const value of input.layers || []) { if (!catalog.get(value.id)) continue; states.set(value.id, normalizeLayerState(value)); }
  return Object.freeze({ version: 1, presetId: input.presetId ? String(input.presetId) : null, updatedAt: new Date().toISOString(), layers: Object.freeze([...states.values()].sort((a,b)=>a.order-b.order)) });
}
