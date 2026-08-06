import { overlayDefinition, publicOverlayDefinition } from './definition.js';
import { orderedOverlayGroups } from './groups.js';
import { overlayNotFound } from './errors.js';
export class OverlayCatalog {
  constructor(definitions = []) { this.layers = new Map(); definitions.forEach(layer => this.register(layer)); }
  register(input) { const layer = Object.isFrozen(input) ? input : overlayDefinition(input); if (this.layers.has(layer.id)) throw new Error(`Duplicate overlay: ${layer.id}`); this.layers.set(layer.id, layer); return this; }
  replace(input) { const layer = Object.isFrozen(input) ? input : overlayDefinition(input); this.layers.set(layer.id, layer); return this; }
  get(id, { required = false } = {}) { const layer = this.layers.get(String(id)) || null; if (!layer && required) throw overlayNotFound(id); return layer; }
  list(options = {}) {
    return [...this.layers.values()].filter(layer => {
      if (options.group && layer.group !== options.group) return false;
      if (options.enabled !== undefined && layer.enabled !== options.enabled) return false;
      if (options.sourceMode && layer.sourceMode !== options.sourceMode) return false;
      if (options.search) { const q = String(options.search).toLowerCase(); if (!`${layer.title} ${layer.description} ${layer.group}`.toLowerCase().includes(q)) return false; }
      return true;
    }).sort((a,b) => a.order-b.order || a.title.localeCompare(b.title));
  }
  groups() { const counts = new Map(); for (const layer of this.layers.values()) counts.set(layer.group, (counts.get(layer.group)||0)+1); return orderedOverlayGroups().map(group => Object.freeze({ ...group, count: counts.get(group.id)||0 })); }
  snapshot() { return Object.freeze({ schemaVersion: 1, groups: Object.freeze(this.groups()), layers: Object.freeze(this.list().map(publicOverlayDefinition)), total: this.layers.size }); }
}
