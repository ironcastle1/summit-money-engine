import { sortOpportunities } from '../domain/markets/opportunity-ranker.js';

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await mapper(items[index], index); }
      catch (error) { results[index] = { asset: items[index], available: false, reason: error.code || error.name || 'ANALYSIS_FAILED', error: error.message }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export class MarketScreenerService {
  constructor(options) {
    this.catalog = options.catalog;
    this.analysis = options.analysis;
  }

  async screen(options = {}) {
    const assets = this.catalog.internalList({ ids: options.assetIds }).slice(0, options.maximumAssets || 24);
    const startedAt = Date.now();
    const analyses = await mapConcurrent(assets, options.concurrency || 4, asset => this.analysis.analyse({
      assetId: asset.id,
      timeframeId: options.timeframeId || '1h',
      limit: options.candleLimit || 750,
      horizons: options.horizons || [1, 6, 24]
    }));
    const ranked = sortOpportunities(analyses);
    return {
      timeframe: options.timeframeId || '1h',
      requestedCount: assets.length,
      availableCount: ranked.filter(item => item.available).length,
      results: ranked.slice(0, options.limit || 24),
      sourceHealth: this.analysis.data.registry.health(),
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt
    };
  }
}
