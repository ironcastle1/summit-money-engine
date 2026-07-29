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
    const preferred = Object.keys(asset.sources);
    return preferred.map(id => this.sources.get(id)).filter(source => source?.supports(asset, operation, timeframeId));
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
        return await execute(source);
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
