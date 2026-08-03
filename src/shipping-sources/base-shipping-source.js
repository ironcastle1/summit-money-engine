import { CircuitBreaker } from '../infra/http/circuit-breaker.js';
import { SHIPPING_SOURCE_STATES } from '../domain/shipping/constants.js';
import { shippingSourceHealth } from './source-status.js';

export class BaseShippingSource {
  #health;
  #breaker;

  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.http = options.http;
    this.cache = options.cache;
    this.logger = options.logger?.child({ shippingSource: this.id });
    this.configured = options.configured !== false;
    this.capabilities = Object.freeze([...(options.capabilities || [])]);
    this.refreshMs = options.refreshMs || 300_000;
    this.staleMs = options.staleMs || 3_600_000;
    this.#breaker = new CircuitBreaker({ name: `shipping:${this.id}`, failureThreshold: 3, cooldownMs: 90_000 });
    this.#health = shippingSourceHealth(this.configured ? SHIPPING_SOURCE_STATES.STARTING : SHIPPING_SOURCE_STATES.NOT_CONFIGURED, { configured: this.configured, capabilities: this.capabilities });
  }

  supports(capability) { return this.configured && this.capabilities.includes(capability); }

  async execute(capability, key, loader, options = {}) {
    if (!this.supports(capability)) throw Object.assign(new Error(`${this.name} does not support ${capability}`), { code: this.configured ? 'UNSUPPORTED_OPERATION' : 'SOURCE_NOT_CONFIGURED' });
    if (!this.#breaker.canExecute()) throw Object.assign(new Error(`${this.name} circuit is open`), { code: 'CIRCUIT_OPEN' });
    const startedAt = Date.now();
    const lastAttemptAt = new Date(startedAt).toISOString();
    try {
      const result = await this.cache.getOrLoad(`shipping:${this.id}:${capability}:${key}`, { ttlMs: options.ttlMs || this.refreshMs, staleMs: options.staleMs || this.staleMs }, loader);
      this.#breaker.success();
      const records = Array.isArray(result.value) ? result.value : result.value?.records || [];
      const stale = result.cache === 'STALE';
      this.#health = shippingSourceHealth(stale ? SHIPPING_SOURCE_STATES.DEGRADED : SHIPPING_SOURCE_STATES.ONLINE, {
        ...this.#health, configured: true, stale, lastAttemptAt, lastSuccessAt: stale ? this.#health.lastSuccessAt : new Date().toISOString(),
        lastDurationMs: Date.now() - startedAt, recordCount: records.length, requestCount: this.#health.requestCount + 1,
        errorCount: this.#health.errorCount + (result.error ? 1 : 0), errorCode: result.error ? 'STALE_FALLBACK' : null,
        capabilities: this.capabilities, cache: result.cache
      });
      return { value: result.value, source: this.id, cache: result.cache, stale };
    } catch (error) {
      this.#breaker.failure(error);
      this.#health = shippingSourceHealth(SHIPPING_SOURCE_STATES.OFFLINE, {
        ...this.#health, configured: true, lastAttemptAt, lastFailureAt: new Date().toISOString(), lastDurationMs: Date.now() - startedAt,
        recordCount: 0, requestCount: this.#health.requestCount + 1, errorCount: this.#health.errorCount + 1,
        errorCode: error.code || error.name || 'SHIPPING_SOURCE_ERROR', capabilities: this.capabilities
      });
      this.logger?.warn('shipping_source.failed', { capability, error, durationMs: Date.now() - startedAt });
      throw error;
    }
  }

  health() { return Object.freeze({ id: this.id, name: this.name, ...this.#health, breaker: this.#breaker.snapshot() }); }
}
