export class IntelligenceSourceRegistry {
  constructor(options = {}) { this.sources = new Map(); this.logger = options.logger; }
  register(source) { if (this.sources.has(source.id)) throw new Error(`Duplicate intelligence source: ${source.id}`); this.sources.set(source.id, source); return this; }
  get(id) { return this.sources.get(id) || null; }
  health() { return Object.fromEntries([...this.sources].map(([id, source]) => [id, source.health()])); }
  list() { return [...this.sources.values()]; }
}
