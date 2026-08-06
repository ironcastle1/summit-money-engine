import { createSourceDescriptor } from './source-descriptor.js';

export class LegacyEventSourceAdapter {
  constructor(source, options = {}) {
    this.source = source;
    this.recordType = options.recordType || 'event';
    const health = source.health?.() || {};
    this.descriptor = createSourceDescriptor({
      id: source.id,
      name: source.name || source.id,
      group: options.group || 'event',
      mode: source.id === 'snapshot' ? 'SNAPSHOT' : 'LIVE',
      configured: source.configured ?? health.configured ?? true,
      weight: source.weight || health.weight || 1,
      refreshMs: source.refreshMs || options.refreshMs,
      staleMs: source.staleMs || options.staleMs,
      timeoutMs: options.timeoutMs || 10_000,
      maximumRecords: options.maximumRecords || 20_000,
      capabilities: ['events', 'health', 'provenance'],
      attribution: source.name || source.id,
      metadata: { legacyAdapter: true }
    });
  }

  async load() {
    const result = await this.source.load();
    return { records: result.events || [], health: result.health, metadata: { upstreamState: result.health?.state || null } };
  }

  normalize(event) { return event; }
  externalId(event) { return event.sourceId || event.id; }
  observedAt(event) { return event.time || event.updatedAt; }
  sourceUrl(event) { return event.url; }
  confidence(event) { return Math.max(0.1, Math.min(1, Number(event.attributes?.confidence ?? this.descriptor.weight / 2))); }
}
