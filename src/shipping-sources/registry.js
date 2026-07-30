export class ShippingSourceRegistry {
  constructor(options = {}) { this.sources = new Map(); this.logger = options.logger; }
  register(source) { if (this.sources.has(source.id)) throw new Error(`Duplicate shipping source: ${source.id}`); this.sources.set(source.id, source); return this; }
  get(id) { return this.sources.get(id) || null; }
  capable(capability) { return [...this.sources.values()].filter(source => source.supports(capability)); }
  health() { return Object.fromEntries([...this.sources.values()].map(source => [source.id, source.health()])); }

  async first(capability, method, ...args) {
    const failures = [];
    for (const source of this.capable(capability)) {
      try { return await source[method](...args); }
      catch (error) { failures.push({ source: source.id, code: error.code || error.name }); this.logger?.warn('shipping_registry.source_failed', { source: source.id, capability, error }); }
    }
    throw Object.assign(new Error(`No shipping source returned ${capability}`), { code: failures.length ? 'ALL_SHIPPING_SOURCES_FAILED' : 'NO_SHIPPING_SOURCE', details: failures });
  }
}
