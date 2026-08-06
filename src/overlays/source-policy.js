export class OverlaySourcePolicy {
  constructor(options = {}) { this.connectors = new Set(options.connectors || []); this.tiles = new Set(options.tiles || []); }
  inspect(layer) {
    if (!layer.enabled) return Object.freeze({ available: false, mode: 'disabled', reason: 'LAYER_DISABLED' });
    if (['static','live','derived'].includes(layer.sourceMode)) return Object.freeze({ available: true, mode: layer.sourceMode, reason: null });
    if (layer.sourceMode === 'connector') { const available = this.connectors.has(layer.source); return Object.freeze({ available, mode: 'connector', reason: available ? null : 'CONNECTOR_REQUIRED' }); }
    if (layer.sourceMode === 'tile') { const available = this.tiles.has(layer.source) || this.tiles.has('*'); return Object.freeze({ available, mode: 'tile', reason: available ? null : 'TILE_SOURCE_REQUIRED' }); }
    return Object.freeze({ available: false, mode: layer.sourceMode, reason: 'SOURCE_UNAVAILABLE' });
  }
  snapshot(catalog) { return Object.freeze(catalog.list().map(layer => Object.freeze({ id: layer.id, ...this.inspect(layer) }))); }
}
