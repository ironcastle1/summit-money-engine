import { normalizeCandles } from '../domain/markets/candle-schema.js';

export class MarketDataService {
  constructor(options) {
    this.catalog = options.catalog;
    this.registry = options.registry;
  }

  async quote(assetId) {
    const asset = this.catalog.get(assetId);
    const result = await this.registry.quote(asset);
    return { asset, quote: result.value, source: { id: result.sourceId, cache: result.cache, stale: result.stale } };
  }

  async candles(assetId, timeframeId, limit = 500) {
    const asset = this.catalog.get(assetId);
    const result = await this.registry.candles(asset, timeframeId, limit);
    return {
      asset,
      timeframe: timeframeId,
      candles: normalizeCandles(result.value).slice(-limit),
      source: { id: result.sourceId, cache: result.cache, stale: result.stale }
    };
  }

  async bundle(assetId, timeframeId, limit = 500) {
    const asset = this.catalog.get(assetId);
    const [quoteResult, candleResult] = await Promise.allSettled([
      this.registry.quote(asset),
      this.registry.candles(asset, timeframeId, limit)
    ]);
    if (candleResult.status === 'rejected') throw candleResult.reason;
    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value.value : null;
    return {
      asset,
      quote,
      candles: normalizeCandles(candleResult.value.value).slice(-limit),
      source: {
        quote: quoteResult.status === 'fulfilled' ? { id: quoteResult.value.sourceId, cache: quoteResult.value.cache, stale: quoteResult.value.stale } : { id: null, error: quoteResult.reason?.code || 'QUOTE_UNAVAILABLE' },
        candles: { id: candleResult.value.sourceId, cache: candleResult.value.cache, stale: candleResult.value.stale }
      }
    };
  }
}
