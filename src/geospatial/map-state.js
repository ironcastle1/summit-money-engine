import { viewport } from './viewport.js';
export function mapState(input = {}) {
    return Object.freeze({
        viewport: viewport(input.viewport || input),
        style: String(input.style || 'streets'),
        visibleLayers: Object.freeze({ ...(input.visibleLayers || {}) }),
        selectedEntityId: input.selectedEntityId ? String(input.selectedEntityId) : null,
        hoveredEntityId: input.hoveredEntityId ? String(input.hoveredEntityId) : null,
        searchOpen: Boolean(input.searchOpen),
        timeWindow: Object.freeze({ from: input.timeWindow?.from || null, to: input.timeWindow?.to || null }),
        updatedAt: new Date().toISOString()
    });
}
export function patchMapState(current, patch) {
    return mapState({ ...current, ...patch, viewport: patch.viewport ? { ...current.viewport, ...patch.viewport } : current.viewport, visibleLayers: { ...current.visibleLayers, ...(patch.visibleLayers || {}) } });
}
