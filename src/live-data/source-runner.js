import { sourceResult } from './source-result.js';

function withTimeout(promise, timeoutMs, sourceName) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${sourceName} timed out`), {
      code: 'LIVE_SOURCE_TIMEOUT'
    })), timeoutMs);
    timer.unref?.();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class LiveSourceRunner {
  constructor(options = {}) {
    this.store = options.store;
    this.logger = options.logger;
    this.timeoutMs = Math.max(1_000, Number(options.timeoutMs) || 15_000);
  }

  async run(source, connector, options = {}) {
    const started = Date.now();
    try {
      const value = await withTimeout(
        Promise.resolve().then(() => connector.fetch(options)),
        Number(options.timeoutMs) || this.timeoutMs,
        source.name
      );
      const records = Array.isArray(value)
        ? value
        : Array.isArray(value?.records)
          ? value.records
          : [value].filter(Boolean);
      if (!records.length && source.required) {
        throw Object.assign(new Error(`${source.name} returned no records`), { code: 'LIVE_SOURCE_NO_DATA' });
      }
      const result = sourceResult({
        sourceId: source.id,
        state: records.length ? 'ONLINE' : 'DEGRADED',
        records,
        generatedAt: new Date().toISOString(),
        observedAt: value?.observedAt,
        durationMs: Date.now() - started,
        metadata: value?.metadata || {}
      });
      await this.store.saveSource(source.id, result);
      return result;
    } catch (error) {
      const cached = await this.store.source(source.id);
      if (cached?.records?.length) {
        const result = sourceResult({
          ...cached,
          state: 'CACHED',
          cache: 'DISK',
          stale: true,
          errorCode: error.code || error.name,
          errorMessage: error.message,
          durationMs: Date.now() - started
        });
        await this.store.saveSource(source.id, result);
        this.logger?.warn?.('live_data.cached_fallback', { sourceId: source.id, error });
        return result;
      }
      const result = sourceResult({
        sourceId: source.id,
        state: 'OFFLINE',
        records: [],
        errorCode: error.code || error.name || 'LIVE_SOURCE_ERROR',
        errorMessage: error.message,
        durationMs: Date.now() - started
      });
      await this.store.saveSource(source.id, result);
      this.logger?.warn?.('live_data.source_failed', { sourceId: source.id, error });
      return result;
    }
  }
}
