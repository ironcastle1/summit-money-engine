import { fromEvent } from '../domain/opportunities/event-opportunity.js';
import { filterOpportunities } from '../domain/opportunities/filter.js';
import { fuseOpportunities } from '../domain/opportunities/fusion.js';
import { fromMarketAnalysis } from '../domain/opportunities/market-opportunity.js';
import { fromPredictionMarket } from '../domain/opportunities/prediction-opportunity.js';

const DEFAULT_ASSETS = Object.freeze(['btc-usd', 'eth-usd', 'sol-usd', 'bnb-usd', 'xrp-usd', 'ada-usd', 'doge-usd']);

export class OpportunityService {
  constructor(options) {
    this.events = options.events;
    this.markets = options.markets;
    this.predictions = options.predictions;
  }

  async list(options = {}) {
    const startedAt = Date.now();
    const marketAssets = Array.isArray(options.assetIds) && options.assetIds.length ? options.assetIds : DEFAULT_ASSETS;
    const [marketResult, eventResult, predictionResult] = await Promise.allSettled([
      this.markets.screen({ assetIds: marketAssets, timeframeId: options.timeframeId || '1h', maximumAssets: Math.min(20, marketAssets.length), limit: Math.min(20, marketAssets.length), concurrency: 3 }),
      this.events.globalSnapshot({ since: Date.now() - (options.eventLookbackDays || 7) * 86_400_000, limit: options.eventLimit || 400, maxAgeMs: 20_000 }),
      this.predictions.list({ limit: options.predictionLimit || 40, search: options.search || '' })
    ]);

    const market = marketResult.status === 'fulfilled'
      ? marketResult.value.results.map(fromMarketAnalysis).filter(Boolean)
      : [];
    const events = eventResult.status === 'fulfilled'
      ? eventResult.value.events.map(event => fromEvent(event, { generatedAt: eventResult.value.generatedAt })).filter(Boolean)
      : [];
    const predictions = predictionResult.status === 'fulfilled'
      ? predictionResult.value.markets.map(market => fromPredictionMarket(market, { generatedAt: predictionResult.value.generatedAt })).filter(Boolean)
      : [];

    const fused = fuseOpportunities({
      market,
      events,
      predictions,
      filters: {
        minimumScore: options.minimumScore,
        minimumConfidence: options.minimumConfidence,
        maximumRisk: options.maximumRisk,
        kinds: options.kinds,
        directions: options.directions,
        search: options.search,
        limit: options.limit || 50
      }
    });

    return {
      ...fused,
      upstream: {
        markets: marketResult.status === 'fulfilled' ? { state: 'ONLINE', count: market.length } : { state: 'ERROR', reason: marketResult.reason?.code || marketResult.reason?.message || 'FAILED' },
        events: eventResult.status === 'fulfilled' ? { state: 'ONLINE', count: events.length } : { state: 'ERROR', reason: eventResult.reason?.code || eventResult.reason?.message || 'FAILED' },
        predictions: predictionResult.status === 'fulfilled' ? { state: 'ONLINE', count: predictions.length } : { state: 'ERROR', reason: predictionResult.reason?.code || predictionResult.reason?.message || 'FAILED' }
      },
      durationMs: Date.now() - startedAt
    };
  }

  filter(opportunities, filters) { return filterOpportunities(opportunities, filters); }
}
