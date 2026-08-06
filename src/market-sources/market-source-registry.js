import { NotFoundError, UpstreamError } from '../core/errors.js';

export class MarketSourceRegistry {
  constructor(options = {}) {
    this.logger = options.logger;
    this.sources = new Map();
  }

  register(source) {
    if (!source?.id) throw new TypeError('Market source requires an id');
    if (this.sources.has(source.id)) throw new Error(`Market source already registered: ${source.id}`);
    this.sources.set(source.id, source);
    return this;
  }

  candidates(asset, operation, timeframeId) {
    const preferredIds = Object.keys(asset.sources);
    const sourceOrder = { 'coinbase-exchange': 0, coingecko: 1, binance: 2, 'alpha-vantage': 3 };
    const preferred = preferredIds.map(id => this.sources.get(id)).filter(source => source?.supports(asset, operation, timeframeId)).sort((a, b) => (sourceOrder[a.id] ?? 50) - (sourceOrder[b.id] ?? 50));
    const fallback = [...this.sources.values()].filter(source => !preferredIds.includes(source.id) && source?.supports(asset, operation, timeframeId));
    // A bundled, timestamped quote snapshot is checked first so the product
    // responds immediately even when public exchanges throttle Render. The
    // browser then upgrades supported crypto assets with direct live history.
    const local = fallback.filter(source => source.id === 'snapshot-market');
    const remaining = fallback.filter(source => source.id !== 'snapshot-market');
    return operation === 'quote' ? [...local, ...preferred, ...remaining] : [...preferred, ...remaining, ...local];
  }

  async quote(asset) {
    return this.#fallback(asset, 'quote', null, source => source.quote(asset));
  }

  async candles(asset, timeframeId, limit) {
    return this.#fallback(asset, 'candles', timeframeId, source => source.candles(asset, timeframeId, limit));
  }

  async #fallback(asset, operation, timeframeId, execute) {
    const candidates = this.candidates(asset, operation, timeframeId);
    if (!candidates.length) throw new NotFoundError('No configured source supports this asset and timeframe', { assetId: asset.id, operation, timeframeId });
    const failures = [];
    for (const source of candidates) {
      try {
        return await Promise.race([
          execute(source),
          new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(`${source.name} timed out`), { code: 'SOURCE_TIMEOUT' })), source.id === 'snapshot-market' ? 1_000 : 8_000))
        ]);
      } catch (error) {
        failures.push({ sourceId: source.id, code: error.code || error.name, message: error.message });
        this.logger?.warn('market.source_fallback', { assetId: asset.id, operation, timeframeId, sourceId: source.id, error });
      }
    }
    throw new UpstreamError('All configured market sources failed', { upstream: candidates.map(source => source.id).join(','), details: { assetId: asset.id, operation, timeframeId, failures } });
  }

  health() {
    return Object.fromEntries([...this.sources.values()].map(source => [source.id, source.health()]));
  }
}
