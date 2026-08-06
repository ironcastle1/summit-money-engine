import { normalizeOverlayState } from './state-schema.js';
export class OverlayStateService {
  constructor(options) { this.catalog = options.catalog; this.repository = options.repository; }
  defaults() { return normalizeOverlayState({}, this.catalog); }
  async load(subject = 'anonymous') { const stored = await this.repository?.get?.(subject); return normalizeOverlayState(stored || {}, this.catalog); }
  async save(subject, input) { const state = normalizeOverlayState(input, this.catalog); await this.repository?.put?.(subject, state); return state; }
  merge(base, patch) {
    const byId = new Map((base?.layers || []).map(layer => [layer.id, layer]));
    for (const layer of patch?.layers || []) byId.set(layer.id, { ...(byId.get(layer.id)||{}), ...layer, filters: { ...(byId.get(layer.id)?.filters||{}), ...(layer.filters||{}) } });
    return normalizeOverlayState({ ...base, ...patch, layers: [...byId.values()] }, this.catalog);
  }
}
