import { overlayNotFound } from './errors.js';
export class OverlayQueryPlanner {
  constructor(options) { this.catalog = options.catalog; this.sourcePolicy = options.sourcePolicy; }
  plan(request = {}) {
    const requested = request.layerIds?.length ? request.layerIds : this.catalog.list().filter(layer=>layer.visible).map(layer=>layer.id);
    const tasks = [];
    const unavailable = [];
    for (const id of [...new Set(requested.map(String))]) {
      const layer = this.catalog.get(id); if (!layer) throw overlayNotFound(id);
      const availability = this.sourcePolicy.inspect(layer);
      if (!availability.available) { unavailable.push({ id, ...availability }); continue; }
      tasks.push(Object.freeze({ id, layer, bounds: request.bounds || null, filters: { ...layer.filters, ...(request.filters?.[id] || request.filters || {}) }, limit: request.limit }));
    }
    return Object.freeze({ tasks: Object.freeze(tasks), unavailable: Object.freeze(unavailable), requested: Object.freeze(requested) });
  }
}
