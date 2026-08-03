import { deduplicateEvents } from '../domain/events/event-deduper.js';
import { clusterEvents } from '../domain/events/event-clusterer.js';

export class SourceRegistry {
  #sources = new Map();
  #logger;
  #snapshot = null;
  #inflight = null;

  constructor(options = {}) {
    this.#logger = options.logger;
  }

  register(source) {
    if (this.#sources.has(source.id)) throw new Error(`Duplicate source id: ${source.id}`);
    this.#sources.set(source.id, source);
    return this;
  }

  sourceIds() {
    return [...this.#sources.keys()];
  }

  async snapshot(options = {}) {
    const maxAgeMs = options.maxAgeMs ?? 30_000;
    if (!options.force && this.#snapshot && Date.now() - this.#snapshot.generatedAtMs <= maxAgeMs) return this.#snapshot;
    if (this.#inflight) return this.#inflight;
    this.#inflight = this.#loadAll().finally(() => { this.#inflight = null; });
    return this.#inflight;
  }

  async #loadAll() {
    const startedAt = Date.now();
    const entries = [...this.#sources.values()];
    const results = await Promise.all(entries.map(source => Promise.race([
      source.load(),
      new Promise(resolve => setTimeout(() => resolve({ events: [], health: Object.freeze({ ...source.health(), state: 'OFFLINE', errorCode: 'REGISTRY_TIMEOUT', recordCount: 0 }) }), source.id === 'snapshot' ? 500 : 9_000))
    ])));
    const rawEvents = results.flatMap(result => result.events);
    const events = deduplicateEvents(rawEvents);
    const clusters = clusterEvents(events, { distanceKm: 80, timeHours: 24, sameCategory: true });
    const sources = Object.fromEntries(results.map((result, index) => {
      const source = entries[index];
      return [source.id, result.health];
    }));
    const snapshot = Object.freeze({
      events: Object.freeze(events),
      clusters: Object.freeze(clusters),
      sources: Object.freeze(sources),
      rawCount: rawEvents.length,
      eventCount: events.length,
      clusterCount: clusters.length,
      generatedAt: new Date().toISOString(),
      generatedAtMs: Date.now(),
      durationMs: Date.now() - startedAt
    });
    this.#snapshot = snapshot;
    this.#logger?.info('sources.snapshot_ready', {
      rawCount: snapshot.rawCount,
      eventCount: snapshot.eventCount,
      clusterCount: snapshot.clusterCount,
      durationMs: snapshot.durationMs
    });
    return snapshot;
  }

  health() {
    return Object.fromEntries([...this.#sources.entries()].map(([id, source]) => [id, source.health()]));
  }
}
