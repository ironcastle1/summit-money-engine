import { CircuitBreaker } from '../infra/http/circuit-breaker.js';
import { SOURCE_STATES, sourceHealth } from './source-status.js';

export class BaseSource {
  #health;
  #breaker;

  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.weight = options.weight || 1;
    this.refreshMs = options.refreshMs;
    this.staleMs = options.staleMs;
    this.configured = options.configured ?? true;
    this.logger = options.logger?.child({ source: this.id });
    this.http = options.http;
    this.cache = options.cache;
    this.#breaker = new CircuitBreaker({
      name: this.id,
      failureThreshold: options.failureThreshold || 3,
      cooldownMs: options.cooldownMs || 90_000
    });
    this.#health = sourceHealth(this.configured ? SOURCE_STATES.STARTING : SOURCE_STATES.NOT_CONFIGURED, {
      configured: this.configured,
      weight: this.weight
    });
  }

  async load() {
    if (!this.configured) return { events: [], health: this.health() };
    if (!this.#breaker.canExecute()) {
      this.#health = sourceHealth(SOURCE_STATES.OFFLINE, {
        ...this.#health,
        errorCode: 'CIRCUIT_OPEN',
        weight: this.weight
      });
      return { events: [], health: this.health() };
    }

    const startedAt = Date.now();
    const lastAttemptAt = new Date(startedAt).toISOString();
    try {
      const result = await this.cache.getOrLoad(`source:${this.id}`, {
        ttlMs: this.refreshMs,
        staleMs: this.staleMs
      }, () => this.fetchEvents());
      const duration = Date.now() - startedAt;
      const stale = result.cache === 'STALE';
      this.#breaker.success();
      this.#health = sourceHealth(stale ? SOURCE_STATES.DEGRADED : SOURCE_STATES.ONLINE, {
        configured: true,
        lastAttemptAt,
        lastSuccessAt: stale ? this.#health.lastSuccessAt : new Date().toISOString(),
        lastFailureAt: result.error ? new Date().toISOString() : this.#health.lastFailureAt,
        lastDurationMs: duration,
        recordCount: result.value.length,
        errorCode: result.error ? 'STALE_FALLBACK' : null,
        stale,
        cache: result.cache,
        weight: this.weight
      });
      return { events: result.value, health: this.health() };
    } catch (error) {
      const duration = Date.now() - startedAt;
      this.#breaker.failure(error);
      this.#health = sourceHealth(SOURCE_STATES.OFFLINE, {
        configured: true,
        lastAttemptAt,
        lastSuccessAt: this.#health.lastSuccessAt,
        lastFailureAt: new Date().toISOString(),
        lastDurationMs: duration,
        recordCount: 0,
        errorCode: error.code || error.name || 'SOURCE_ERROR',
        stale: false,
        weight: this.weight
      });
      this.logger?.warn('source.load_failed', { durationMs: duration, error });
      return { events: [], health: this.health() };
    }
  }

  health() {
    return Object.freeze({
      id: this.id,
      name: this.name,
      ...this.#health,
      breaker: this.#breaker.snapshot()
    });
  }

  async fetchEvents() {
    throw new Error('fetchEvents must be implemented');
  }
}
