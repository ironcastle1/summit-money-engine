import { CircuitBreaker } from '../infra/http/circuit-breaker.js';
import { MARKET_SOURCE_STATES, marketSourceHealth } from './market-source-status.js';

export class BaseMarketSource {
  #health;
  #breaker;

  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.http = options.http;
    this.cache = options.cache;
    this.logger = options.logger?.child({ marketSource: this.id });
    this.configured = options.configured ?? true;
    this.quoteTtlMs = options.quoteTtlMs || 20_000;
    this.candleTtlMs = options.candleTtlMs || 60_000;
    this.staleMs = options.staleMs || 600_000;
    this.supportedAssetClasses = Object.freeze(options.supportedAssetClasses || []);
    this.#breaker = new CircuitBreaker({ name: `market:${this.id}`, failureThreshold: 3, cooldownMs: 60_000 });
    this.#health = marketSourceHealth(this.configured ? MARKET_SOURCE_STATES.STARTING : MARKET_SOURCE_STATES.NOT_CONFIGURED, {
      configured: this.configured,
      supportedAssetClasses: this.supportedAssetClasses
    });
  }

  supports(asset, operation, timeframeId) {
    return this.configured && this.supportedAssetClasses.includes(asset.assetClass) && Boolean(asset.sources[this.id]);
  }

  async quote(asset) {
    return this.#execute('quote', asset, null, () => this.fetchQuote(asset), this.quoteTtlMs);
  }

  async candles(asset, timeframeId, limit) {
    return this.#execute('candles', asset, timeframeId, () => this.fetchCandles(asset, timeframeId, limit), this.candleTtlMs, limit);
  }

  async #execute(operation, asset, timeframeId, loader, ttlMs, limit = '') {
    if (!this.configured) throw Object.assign(new Error(`${this.name} is not configured`), { code: 'SOURCE_NOT_CONFIGURED' });
    if (!this.#breaker.canExecute()) throw Object.assign(new Error(`${this.name} circuit is open`), { code: 'CIRCUIT_OPEN' });
    const started = Date.now();
    const lastAttemptAt = new Date().toISOString();
    try {
      const cacheKey = `market:${this.id}:${operation}:${asset.id}:${timeframeId || ''}:${limit}`;
      const result = await this.cache.getOrLoad(cacheKey, { ttlMs, staleMs: this.staleMs }, loader);
      this.#breaker.success();
      const stale = result.cache === 'STALE';
      this.#health = marketSourceHealth(stale ? MARKET_SOURCE_STATES.DEGRADED : MARKET_SOURCE_STATES.ONLINE, {
        ...this.#health,
        configured: true,
        lastAttemptAt,
        lastSuccessAt: stale ? this.#health.lastSuccessAt : new Date().toISOString(),
        lastDurationMs: Date.now() - started,
        requestCount: this.#health.requestCount + 1,
        errorCount: this.#health.errorCount + (result.error ? 1 : 0),
        errorCode: result.error ? 'STALE_FALLBACK' : null,
        stale,
        supportedAssetClasses: this.supportedAssetClasses
      });
      return { value: result.value, sourceId: this.id, cache: result.cache, stale };
    } catch (error) {
      this.#breaker.failure(error);
      this.#health = marketSourceHealth(MARKET_SOURCE_STATES.OFFLINE, {
        ...this.#health,
        configured: true,
        lastAttemptAt,
        lastFailureAt: new Date().toISOString(),
        lastDurationMs: Date.now() - started,
        requestCount: this.#health.requestCount + 1,
        errorCount: this.#health.errorCount + 1,
        errorCode: error.code || error.name || 'MARKET_SOURCE_ERROR',
        supportedAssetClasses: this.supportedAssetClasses
      });
      throw error;
    }
  }

  health() {
    return Object.freeze({ id: this.id, name: this.name, ...this.#health, breaker: this.#breaker.snapshot() });
  }

  async fetchQuote() { throw new Error('fetchQuote must be implemented'); }
  async fetchCandles() { throw new Error('fetchCandles must be implemented'); }
}
