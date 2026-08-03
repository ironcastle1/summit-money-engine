import { CircuitBreaker } from '../infra/http/circuit-breaker.js';
import { NEWS_SOURCE_STATES, newsSourceHealth } from './news-source-status.js';

export class BaseNewsSource {
  #breaker;
  #health;

  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.kind = options.kind || 'NEWS';
    this.weight = options.weight || 1;
    this.configured = options.configured !== false;
    this.refreshMs = options.refreshMs || 120_000;
    this.staleMs = options.staleMs || 900_000;
    this.http = options.http;
    this.cache = options.cache;
    this.logger = options.logger?.child({ newsSource: this.id });
    this.#breaker = new CircuitBreaker({ name: `news:${this.id}`, failureThreshold: options.failureThreshold || 3, cooldownMs: options.cooldownMs || 90_000 });
    this.#health = newsSourceHealth(this.configured ? NEWS_SOURCE_STATES.STARTING : NEWS_SOURCE_STATES.NOT_CONFIGURED, { configured: this.configured, weight: this.weight });
  }

  cacheKey(options) {
    const query = String(options.query || '').trim().toLowerCase().slice(0, 180);
    const limit = Math.max(1, Math.min(250, Number(options.limit || 50)));
    const hours = Math.max(1, Math.min(168, Number(options.hours || 24)));
    return `news:${this.id}:${query}:${limit}:${hours}`;
  }

  async search(options = {}) {
    if (!this.configured) return { articles: [], health: this.health() };
    if (!this.#breaker.canExecute()) {
      this.#health = newsSourceHealth(NEWS_SOURCE_STATES.OFFLINE, { ...this.#health, errorCode: 'CIRCUIT_OPEN', weight: this.weight });
      return { articles: [], health: this.health() };
    }
    const startedAt = Date.now();
    const lastAttemptAt = new Date(startedAt).toISOString();
    try {
      const result = await this.cache.getOrLoad(this.cacheKey(options), { ttlMs: this.refreshMs, staleMs: this.staleMs }, () => this.fetchArticles(options));
      const stale = result.cache === 'STALE';
      this.#breaker.success();
      this.#health = newsSourceHealth(stale ? NEWS_SOURCE_STATES.DEGRADED : NEWS_SOURCE_STATES.ONLINE, {
        configured: true,
        stale,
        lastAttemptAt,
        lastSuccessAt: stale ? this.#health.lastSuccessAt : new Date().toISOString(),
        lastFailureAt: result.error ? new Date().toISOString() : this.#health.lastFailureAt,
        lastDurationMs: Date.now() - startedAt,
        recordCount: result.value.length,
        errorCode: result.error ? 'STALE_FALLBACK' : null,
        cache: result.cache,
        weight: this.weight,
        queryCount: this.#health.queryCount + 1
      });
      return { articles: result.value, health: this.health() };
    } catch (error) {
      this.#breaker.failure(error);
      this.#health = newsSourceHealth(NEWS_SOURCE_STATES.OFFLINE, {
        configured: true,
        lastAttemptAt,
        lastSuccessAt: this.#health.lastSuccessAt,
        lastFailureAt: new Date().toISOString(),
        lastDurationMs: Date.now() - startedAt,
        recordCount: 0,
        errorCode: error.code || error.name || 'NEWS_SOURCE_ERROR',
        weight: this.weight,
        queryCount: this.#health.queryCount + 1
      });
      this.logger?.warn('news_source.search_failed', { error, durationMs: Date.now() - startedAt });
      return { articles: [], health: this.health() };
    }
  }

  health() { return Object.freeze({ id: this.id, name: this.name, kind: this.kind, ...this.#health, breaker: this.#breaker.snapshot() }); }
  async fetchArticles() { throw new Error('fetchArticles must be implemented'); }
}
