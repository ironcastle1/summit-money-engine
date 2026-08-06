import { deduplicateEvents } from '../domain/events/event-deduper.js';
import { clusterEvents } from '../domain/events/event-clusterer.js';
import { IngestionPlatform } from '../ingestion/ingestion-platform.js';
import { LegacyEventSourceAdapter } from '../ingestion/legacy-source-adapter.js';

export class SourceRegistry {
  #sources = new Map();
  #logger;
  #snapshot = null;
  #inflight = null;
  #ingestion;

  constructor(options = {}) {
    this.#logger = options.logger;
    this.#ingestion = options.ingestion || new IngestionPlatform({
      logger: options.logger?.child?.({ component: 'event-ingestion' }) || options.logger,
      concurrency: options.concurrency || 4,
      retryOptions: { maximumAttempts: 2, baseDelayMs: 150, maximumDelayMs: 1_500, jitterRatio: 0.15 },
      deduplicationOptions: { bucketMs: 6 * 60 * 60_000, similarityThreshold: 0.9 }
    });
  }

  register(source) {
    if (this.#sources.has(source.id)) throw new Error(`Duplicate source id: ${source.id}`);
    this.#sources.set(source.id, source);
    this.#ingestion.register(new LegacyEventSourceAdapter(source, {
      timeoutMs: source.id === 'snapshot' ? 1_000 : 9_000,
      maximumRecords: 20_000
    }));
    return this;
  }

  sourceIds() { return [...this.#sources.keys()]; }

  source(id) { return this.#sources.get(String(id)) || null; }

  async loadSource(id) {
    const source = this.source(id);
    if (!source) throw Object.assign(new Error(`Unknown event source: ${id}`), { code: 'EVENT_SOURCE_NOT_FOUND' });
    return source.load();
  }

  ingestionPlatform() { return this.#ingestion; }

  async snapshot(options = {}) {
    const maxAgeMs = options.maxAgeMs ?? 30_000;
    if (!options.force && this.#snapshot && Date.now() - this.#snapshot.generatedAtMs <= maxAgeMs) return this.#snapshot;
    if (this.#inflight) return this.#inflight;
    this.#inflight = this.#loadAll(options).finally(() => { this.#inflight = null; });
    return this.#inflight;
  }

  async #loadAll(options = {}) {
    const startedAt = Date.now();
    const run = await this.#ingestion.ingest({ force: options.force, sourceIds: options.sourceIds });
    const rawEvents = run.records.map(envelope => envelope.record || envelope).filter(Boolean);
    const events = deduplicateEvents(rawEvents);
    const clusters = clusterEvents(events, { distanceKm: 80, timeHours: 24, sameCategory: true });
    const sources = this.health();
    const snapshot = Object.freeze({
      events: Object.freeze(events),
      clusters: Object.freeze(clusters),
      sources: Object.freeze(sources),
      rawCount: rawEvents.length,
      eventCount: events.length,
      clusterCount: clusters.length,
      generatedAt: new Date().toISOString(),
      generatedAtMs: Date.now(),
      durationMs: Date.now() - startedAt,
      ingestionRunId: run.id,
      ingestionState: run.state,
      rejectedCount: run.rejected,
      duplicateCount: run.duplicates
    });
    this.#snapshot = snapshot;
    this.#logger?.info?.('sources.snapshot_ready', {
      rawCount: snapshot.rawCount,
      eventCount: snapshot.eventCount,
      clusterCount: snapshot.clusterCount,
      rejectedCount: snapshot.rejectedCount,
      duplicateCount: snapshot.duplicateCount,
      ingestionState: snapshot.ingestionState,
      durationMs: snapshot.durationMs
    });
    return snapshot;
  }

  health() {
    const ingestionHealth = this.#ingestion.health.all();
    return Object.fromEntries([...this.#sources.entries()].map(([id, source]) => {
      const upstream = source.health();
      const pipeline = ingestionHealth[id];
      return [id, Object.freeze({
        ...upstream,
        pipelineState: pipeline?.state || 'IDLE',
        pipelineSuccessRate: pipeline?.successRate ?? null,
        pipelineLatency: pipeline?.latency || null,
        recordsAccepted: pipeline?.recordsAccepted || 0,
        recordsRejected: pipeline?.recordsRejected || 0,
        recordsDuplicate: pipeline?.recordsDuplicate || 0
      })];
    }));
  }
}
