import { SchemaRegistry } from './schema-registry.js';
import { DeduplicationIndex } from './deduplication-index.js';
import { SourceHealthMonitor } from './source-health-monitor.js';
import { IngestionCheckpointRepository, DeadLetterRepository, ProvenanceRepository, IngestionRunRepository } from './repositories.js';
import { NormalizationPipeline } from './normalization-pipeline.js';
import { IngestionOrchestrator } from './ingestion-orchestrator.js';
import { IngestionScheduler } from './ingestion-scheduler.js';
import { RetryPolicy } from './retry-policy.js';

export class IngestionPlatform {
  #adapters = new Map();
  constructor(options = {}) {
    this.schemas = options.schemas || new SchemaRegistry();
    this.deduplication = options.deduplication || new DeduplicationIndex(options.deduplicationOptions);
    this.health = options.health || new SourceHealthMonitor();
    this.checkpoints = options.checkpoints || new IngestionCheckpointRepository();
    this.deadLetters = options.deadLetters || new DeadLetterRepository(options.deadLetterOptions);
    this.provenance = options.provenance || new ProvenanceRepository(options.provenanceOptions);
    this.runs = options.runs || new IngestionRunRepository(options.runOptions);
    this.pipeline = options.pipeline || new NormalizationPipeline({
      schemaRegistry: this.schemas,
      deduplication: this.deduplication,
      provenance: this.provenance,
      deadLetters: this.deadLetters
    });
    this.orchestrator = options.orchestrator || new IngestionOrchestrator({
      pipeline: this.pipeline,
      health: this.health,
      checkpoints: this.checkpoints,
      runs: this.runs,
      retryPolicy: options.retryPolicy || new RetryPolicy(options.retryOptions),
      concurrency: options.concurrency || 4,
      logger: options.logger
    });
    this.scheduler = options.scheduler || new IngestionScheduler({ logger: options.logger, tickMs: options.schedulerTickMs });
  }

  register(adapter) {
    const id = adapter.descriptor?.id || adapter.id;
    if (!id) throw new TypeError('Adapter id is required');
    if (this.#adapters.has(id)) throw new Error(`Duplicate ingestion adapter: ${id}`);
    this.#adapters.set(id, adapter);
    this.health.configure(adapter.descriptor || adapter);
    return this;
  }

  adapters() { return [...this.#adapters.values()]; }
  adapterIds() { return [...this.#adapters.keys()]; }

  async ingest(options = {}) {
    if (!options.preserveDeduplication) this.deduplication.clear();
    return this.orchestrator.run(this.adapters(), options);
  }

  schedule(id = 'default', options = {}) {
    this.scheduler.register(id, () => this.ingest(options), { intervalMs: options.intervalMs, immediate: options.immediate, enabled: options.enabled });
    return this;
  }

  status() {
    return Object.freeze({
      adapters: this.adapterIds(),
      sources: this.health.all(),
      latestRun: this.runs.latest(),
      checkpoints: this.checkpoints.list(),
      deadLetters: this.deadLetters.stats(),
      provenance: this.provenance.stats(),
      deduplication: this.deduplication.stats(),
      schemas: this.schemas.list(),
      schedules: this.scheduler.status(),
      generatedAt: new Date().toISOString()
    });
  }

  close() { this.scheduler.stop(); }
}
