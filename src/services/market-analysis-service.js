import { publicAsset } from '../domain/markets/asset-schema.js';
import { analyseMarketSeries } from '../domain/markets/market-analysis.js';
import { aggregateTimeframes } from '../domain/markets/multi-timeframe.js';

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await mapper(items[index]); }
      catch (error) { results[index] = { timeframe: items[index], available: false, reason: error.code || error.name || 'ANALYSIS_FAILED' }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export class MarketAnalysisService {
  constructor(options) { this.data = options.data; }

  async analyse(options) {
    const bundle = await this.data.bundle(options.assetId, options.timeframeId, options.limit || 750);
    const analysis = analyseMarketSeries({
      asset: publicAsset(bundle.asset), quote: bundle.quote, candles: bundle.candles,
      timeframeId: options.timeframeId, horizons: options.horizons || [1, 6, 24]
    });
    return { ...analysis, source: bundle.source };
  }

  async analyseMultiple(options) {
    const timeframes = options.timeframes || ['15m', '1h', '4h', '1d'];
    const analyses = await mapConcurrent(timeframes, 2, timeframeId => this.analyse({
      assetId: options.assetId, timeframeId, limit: options.limit || 750, horizons: [1, 6, 24]
    }));
    return {
      assetId: options.assetId,
      analyses: Object.fromEntries(analyses.map(item => [item.timeframe, item])),
      consensus: aggregateTimeframes(analyses),
      generatedAt: new Date().toISOString()
    };
  }
}
