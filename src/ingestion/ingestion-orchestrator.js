import { stableId } from '../core/ids.js';
import { INGESTION_STATES } from './constants.js';
import { assertSourceAdapter, createSourceDescriptor } from './source-descriptor.js';
import { RetryPolicy } from './retry-policy.js';
import { mapConcurrent, withTimeout } from './concurrency-pool.js';
import { SourceTimeoutError, errorSummary } from './errors.js';

function extractRecords(result) {
  if (Array.isArray(result)) return { records: result, checkpoint: null, metadata: {} };
  return {
    records: result?.records || result?.events || result?.items || [],
    checkpoint: result?.checkpoint || result?.cursor || null,
    metadata: result?.metadata || {},
    health: result?.health || null
  };
}

export class IngestionOrchestrator {
  constructor(options = {}) {
    this.pipeline = options.pipeline;
    this.health = options.health;
    this.checkpoints = options.checkpoints;
    this.runs = options.runs;
    this.logger = options.logger;
    this.concurrency = Math.max(1, Number(options.concurrency || 4));
    this.retryPolicy = options.retryPolicy || new RetryPolicy();
  }

  async run(adapters, options = {}) {
    const runId = stableId('ingestion-run', Date.now(), Math.random());
    const startedAt = Date.now();
    const descriptors = adapters.map(adapter => assertSourceAdapter(adapter));
    descriptors.forEach(descriptor => this.health?.configure(descriptor));
    const selected = adapters.filter((adapter, index) => descriptors[index].configured && (!options.sourceIds || options.sourceIds.includes(descriptors[index].id)));

    const settled = await mapConcurrent(selected, adapter => this.#runSource(adapter, { runId, force: options.force, signal: options.signal }), {
      concurrency: options.concurrency || this.concurrency,
      signal: options.signal,
      onProgress: options.onProgress
    });

    const sourceResults = settled.map((item, index) => item.status === 'fulfilled' ? item.value : {
      sourceId: selected[index]?.descriptor?.id || selected[index]?.id || 'unknown', state: 'FAILED', error: errorSummary(item.reason), records: []
    });
    const records = sourceResults.flatMap(result => result.records || []);
    const accepted = sourceResults.reduce((sum, result) => sum + (result.accepted || 0), 0);
    const rejected = sourceResults.reduce((sum, result) => sum + (result.rejected || 0), 0);
    const duplicates = sourceResults.reduce((sum, result) => sum + (result.duplicates || 0), 0);
    const failed = sourceResults.filter(result => result.state === 'FAILED').length;
    const completedAt = Date.now();
    const run = Object.freeze({
      id: runId,
      state: failed === sourceResults.length && sourceResults.length ? INGESTION_STATES.FAILED : failed ? INGESTION_STATES.DEGRADED : INGESTION_STATES.COMPLETE,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationMs: completedAt - startedAt,
      sourcesRequested: selected.length,
      sourcesSucceeded: sourceResults.length - failed,
      sourcesFailed: failed,
      accepted, rejected, duplicates,
      recordCount: records.length,
      records: Object.freeze(records),
      sources: Object.freeze(sourceResults)
    });
    this.runs?.add({ ...run, records: undefined });
    this.logger?.info?.('ingestion.run_completed', { runId, state: run.state, accepted, rejected, duplicates, failed, durationMs: run.durationMs });
    return run;
  }

  async #runSource(adapter, context) {
    const descriptor = createSourceDescriptor(adapter.descriptor || adapter);
    const startedAt = Date.now();
    this.health?.started(descriptor.id, startedAt);
    try {
      const checkpoint = this.checkpoints?.get(descriptor.id, 'default')?.checkpoint || null;
      const load = () => this.retryPolicy.execute(() => withTimeout(
        () => (adapter.load ? adapter.load({ checkpoint, ...context }) : adapter.fetch({ checkpoint, ...context })),
        descriptor.timeoutMs,
        () => new SourceTimeoutError(descriptor.id, descriptor.timeoutMs)
      ), {
        onRetry: (error, attempt, delayMs) => this.logger?.warn?.('ingestion.source_retry', { sourceId: descriptor.id, attempt, delayMs, error: errorSummary(error) })
      });
      const payload = extractRecords(await load());
      const rawRecords = payload.records.slice(0, descriptor.maximumRecords);
      const processed = [];
      let accepted = 0, rejected = 0, duplicates = 0;
      for (const rawRecord of rawRecords) {
        const result = this.pipeline ? await this.pipeline.process(rawRecord, {
          descriptor,
          recordType: adapter.recordType || descriptor.group || 'event',
          schemaVersion: adapter.schemaVersion || 1,
          normalize: adapter.normalize?.bind(adapter),
          externalId: adapter.externalId?.bind(adapter),
          observedAt: adapter.observedAt?.bind(adapter),
          sourceUrl: adapter.sourceUrl?.bind(adapter),
          confidence: adapter.confidence?.bind(adapter),
          sourceMetadata: payload.metadata,
          retrievedAt: new Date().toISOString()
        }) : { state: 'ACCEPTED', envelope: rawRecord };
        if (result.state === 'ACCEPTED') { accepted += 1; processed.push(result.envelope); }
        else if (result.state === 'DUPLICATE') duplicates += 1;
        else rejected += 1;
      }
      if (payload.checkpoint !== null) this.checkpoints?.set(descriptor.id, 'default', payload.checkpoint);
      const durationMs = Date.now() - startedAt;
      const result = Object.freeze({
        sourceId: descriptor.id,
        state: rejected ? 'DEGRADED' : 'COMPLETE',
        accepted, rejected, duplicates,
        rawCount: rawRecords.length,
        truncated: payload.records.length > rawRecords.length,
        checkpoint: payload.checkpoint,
        metadata: payload.metadata,
        upstreamHealth: payload.health,
        durationMs,
        records: Object.freeze(processed)
      });
      this.health?.completed(descriptor.id, result, durationMs);
      return result;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      this.health?.failed(descriptor.id, error, durationMs);
      this.logger?.warn?.('ingestion.source_failed', { sourceId: descriptor.id, durationMs, error: errorSummary(error) });
      return Object.freeze({ sourceId: descriptor.id, state: 'FAILED', accepted: 0, rejected: 0, duplicates: 0, rawCount: 0, durationMs, records: Object.freeze([]), error: errorSummary(error) });
    }
  }
}
