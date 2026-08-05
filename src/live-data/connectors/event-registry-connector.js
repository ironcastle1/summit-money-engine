export class EventRegistryConnector {
  constructor(options = {}) {
    this.registry = options.registry;
    this.sourceIds = Array.isArray(options.sourceIds) ? options.sourceIds : null;
    this.filter = typeof options.filter === 'function' ? options.filter : null;
  }

  async fetch(options = {}) {
    if (this.sourceIds?.length === 1 && typeof this.registry.loadSource === 'function') {
      const result = await this.registry.loadSource(this.sourceIds[0]);
      const events = this.filter ? result.events.filter(this.filter) : result.events;
      return {
        records: events,
        observedAt: result.health?.lastSuccessAt || new Date().toISOString(),
        metadata: { sourceIds: this.sourceIds, health: result.health }
      };
    }

    const snapshot = await this.registry.snapshot({
      force: options.force !== false,
      sourceIds: this.sourceIds || undefined
    });
    const records = this.filter ? snapshot.events.filter(this.filter) : snapshot.events;
    return {
      records,
      observedAt: snapshot.generatedAt,
      metadata: {
        sourceIds: this.sourceIds || this.registry.sourceIds(),
        clusters: snapshot.clusterCount,
        rawCount: snapshot.rawCount,
        rejected: snapshot.rejectedCount,
        duplicates: snapshot.duplicateCount
      }
    };
  }
}
