import { CircuitBreaker } from '../infra/http/circuit-breaker.js';
import { INTELLIGENCE_SOURCE_STATES, intelligenceSourceHealth } from './source-status.js';

export class BaseIntelligenceSource {
  #health;
  #breaker;

  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.configured = options.configured ?? true;
    this.http = options.http;
    this.cache = options.cache;
    this.refreshMs = options.refreshMs || 300_000;
    this.staleMs = options.staleMs || 3_600_000;
    this.logger = options.logger?.child({ source: this.id });
    this.coverage = options.coverage || 'GLOBAL';
    this.#breaker = new CircuitBreaker({ name: this.id, failureThreshold: options.failureThreshold || 3, cooldownMs: options.cooldownMs || 120_000 });
    this.#health = intelligenceSourceHealth(this.configured ? INTELLIGENCE_SOURCE_STATES.STARTING : INTELLIGENCE_SOURCE_STATES.NOT_CONFIGURED, {
      configured: this.configured, coverage: this.coverage
    });
  }

  async execute(cacheKey, loader, options = {}) {
    if (!this.configured) return { data: null, health: this.health(), unavailable: 'NOT_CONFIGURED' };
    if (options.supported === false) {
      this.#health = intelligenceSourceHealth(INTELLIGENCE_SOURCE_STATES.UNSUPPORTED, { ...this.#health, supported: false, coverage: this.coverage });
      return { data: null, health: this.health(), unavailable: 'UNSUPPORTED' };
    }
    if (!this.#breaker.canExecute()) {
      this.#health = intelligenceSourceHealth(INTELLIGENCE_SOURCE_STATES.OFFLINE, { ...this.#health, errorCode: 'CIRCUIT_OPEN', coverage: this.coverage });
      return { data: null, health: this.health(), unavailable: 'CIRCUIT_OPEN' };
    }
    const started = Date.now();
    const lastAttemptAt = new Date(started).toISOString();
    try {
      const result = await this.cache.getOrLoad(`intelligence:${this.id}:${cacheKey}`, {
        ttlMs: options.refreshMs || this.refreshMs,
        staleMs: options.staleMs || this.staleMs
      }, loader);
      const records = Array.isArray(result.value) ? result.value.length : Number(result.value?.recordCount || result.value?.records?.length || 1);
      this.#breaker.success();
      this.#health = intelligenceSourceHealth(result.cache === 'STALE' ? INTELLIGENCE_SOURCE_STATES.DEGRADED : INTELLIGENCE_SOURCE_STATES.ONLINE, {
        configured: true, supported: true, lastAttemptAt,
        lastSuccessAt: result.cache === 'STALE' ? this.#health.lastSuccessAt : new Date().toISOString(),
        lastFailureAt: result.error ? new Date().toISOString() : this.#health.lastFailureAt,
        lastDurationMs: Date.now() - started, recordCount: records,
        errorCode: result.error ? 'STALE_FALLBACK' : null, stale: result.cache === 'STALE', cache: result.cache, coverage: this.coverage
      });
      return { data: result.value, health: this.health(), unavailable: null };
    } catch (error) {
      this.#breaker.failure(error);
      this.#health = intelligenceSourceHealth(INTELLIGENCE_SOURCE_STATES.OFFLINE, {
        configured: true, supported: true, lastAttemptAt, lastSuccessAt: this.#health.lastSuccessAt,
        lastFailureAt: new Date().toISOString(), lastDurationMs: Date.now() - started,
        errorCode: error.code || error.name || 'SOURCE_ERROR', coverage: this.coverage
      });
      this.logger?.warn('intelligence_source.failed', { cacheKey, error });
      return { data: null, health: this.health(), unavailable: this.#health.errorCode };
    }
  }

  health() { return Object.freeze({ id: this.id, name: this.name, ...this.#health, breaker: this.#breaker.snapshot() }); }
}
