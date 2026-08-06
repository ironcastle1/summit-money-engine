import { OVERLAY_PRESETS } from './preset-catalog.js';
export class OverlayPresetService {
  constructor(catalog) { this.catalog = catalog; this.presets = new Map(OVERLAY_PRESETS.map(preset=>[preset.id,Object.freeze({...preset,layers:Object.freeze(preset.layers.filter(id=>catalog.get(id)))} )])); }
  list() { return [...this.presets.values()]; }
  get(id) { return this.presets.get(String(id)) || null; }
  apply(id, stateService) {
    const preset = this.get(id); if (!preset) throw new Error(`Unknown overlay preset: ${id}`);
    const selected = new Set(preset.layers);
    return stateService.merge(stateService.defaults(), { presetId:id, layers:this.catalog.list().map(layer=>({id:layer.id,visible:selected.has(layer.id)})) });
  }
}
