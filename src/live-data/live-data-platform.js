import { PUBLIC_SOURCE_CATALOG, publicSource } from './public-source-catalog.js';
import { coverageScore } from './coverage-score.js';
import { freshnessState } from './freshness-policy.js';
import { LiveSourceRunner } from './source-runner.js';
import { LiveRefreshScheduler } from './refresh-scheduler.js';
import { liveDataDiagnostics } from './diagnostics.js';
import { exportLiveCsv, exportLiveJson, exportLiveSummary } from './exporters.js';

async function runBounded(tasks, concurrency) {
  const queue = [...tasks];
  const results = [];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const task = queue.shift();
      results.push(await task());
    }
  });
  await Promise.all(workers);
  return results;
}

export class LiveDataPlatform {
  constructor(options = {}) {
    this.store = options.store;
    this.logger = options.logger;
    this.connectors = new Map();
    this.runner = new LiveSourceRunner({
      store: this.store,
      logger: this.logger,
      timeoutMs: options.timeoutMs
    });
    this.scheduler = new LiveRefreshScheduler({
      refresh: () => this.refresh({ reason: 'schedule' }),
      intervalMs: options.refreshMs,
      logger: this.logger
    });
    this.enabled = options.enabled !== false;
    this.autoStart = options.autoStart !== false;
    this.concurrency = Math.max(1, Math.min(8, Number(options.concurrency) || 4));
    this.lastRun = null;
    this.inflight = null;
  }

  register(id, connector) {
    if (this.connectors.has(id)) throw new Error(`Duplicate live-data connector: ${id}`);
    if (!publicSource(id)) throw new Error(`Live-data connector is not catalogued: ${id}`);
    this.connectors.set(id, connector);
    return this;
  }

  async initialize() {
    await this.store.load();
    if (this.enabled && this.autoStart) this.scheduler.start();
    return this;
  }

  async refresh(options = {}) {
    if (!this.enabled) return this.snapshot();
    if (this.inflight) return this.inflight;
    this.inflight = this.#refresh(options).finally(() => { this.inflight = null; });
    return this.inflight;
  }

  async #refresh(options) {
    const started = Date.now();
    const selected = options.sourceIds?.length ? new Set(options.sourceIds) : null;
    const stored = await this.store.read();
    const force = options.force === true || options.reason === 'api';
    const tasks = [];

    for (const source of PUBLIC_SOURCE_CATALOG) {
      if (selected && !selected.has(source.id)) continue;
      const connector = this.connectors.get(source.id);
      if (!connector) continue;
      const previous = stored.sources?.[source.id];
      const ageMs = previous?.generatedAt ? Date.now() - Date.parse(previous.generatedAt) : Infinity;
      if (!force && Number.isFinite(ageMs) && ageMs < source.refreshMs) continue;
      tasks.push(() => this.runner.run(source, connector, options));
    }

    const results = await runBounded(tasks, this.concurrency);
    const run = {
      id: `live-${started}`,
      reason: options.reason || 'manual',
      startedAt: new Date(started).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      sourceCount: results.length,
      online: results.filter(row => row.state === 'ONLINE').length,
      degraded: results.filter(row => row.state === 'DEGRADED').length,
      cached: results.filter(row => row.state === 'CACHED').length,
      offline: results.filter(row => row.state === 'OFFLINE').length
    };
    this.lastRun = run;
    await this.store.saveRun(run);
    return this.snapshot();
  }

  async snapshot() {
    const stored = await this.store.read();
    const sources = {};
    for (const source of PUBLIC_SOURCE_CATALOG) {
      const result = stored.sources?.[source.id];
      const freshness = freshnessState(result?.generatedAt, source);
      let state = result?.state || (!this.connectors.has(source.id)
        ? (source.required ? 'NOT_CONFIGURED' : 'DISABLED')
        : 'STARTING');
      if (result && freshness.stale && state === 'ONLINE') state = 'CACHED';
      sources[source.id] = Object.freeze({
        ...source,
        ...result,
        id: source.id,
        name: source.name,
        domain: source.domain,
        access: source.access,
        required: source.required,
        state,
        recordCount: result?.recordCount || 0,
        stale: Boolean(result?.stale || freshness.stale),
        freshness
      });
    }
    const coverage = coverageScore(Object.values(sources));
    return Object.freeze({
      mode: 'PUBLIC_FIRST',
      generatedAt: new Date().toISOString(),
      updatedAt: stored.updatedAt,
      lastRun: this.lastRun || stored.runs?.[0] || null,
      coverage,
      sources
    });
  }

  catalog() {
    return {
      mode: 'PUBLIC_FIRST',
      sources: PUBLIC_SOURCE_CATALOG,
      coreKeyless: PUBLIC_SOURCE_CATALOG.filter(source => source.keyless && source.required).length,
      optional: PUBLIC_SOURCE_CATALOG.filter(source => !source.required).length
    };
  }

  async diagnostics() { return liveDataDiagnostics(await this.snapshot()); }

  async sourceData(id) {
    const source = publicSource(id);
    if (!source) return null;
    const stored = await this.store.source(id);
    return stored ? { source, ...stored } : { source, state: this.connectors.has(id) ? 'STARTING' : 'NOT_CONFIGURED', records: [], recordCount: 0 };
  }

  async export(format = 'json') {
    const snapshot = await this.snapshot();
    if (format === 'csv') return exportLiveCsv(snapshot);
    if (['md', 'markdown', 'summary'].includes(format)) return exportLiveSummary(snapshot);
    return exportLiveJson(snapshot);
  }

  async close() {
    this.scheduler.stop();
    await this.store.close();
  }
}
