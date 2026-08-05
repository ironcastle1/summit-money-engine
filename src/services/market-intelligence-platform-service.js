import {
  buildMarketSnapshot,
  calculatePortfolioExposure,
  evaluateMarketAlerts,
  MarketIntelligenceExportService,
  MarketScreenRepository,
  MarketWatchlist,
  runMarketScenario,
  runScreen,
  runSensitivityAnalysis
} from '../market-intelligence/index.js';
import { analyzeAsset } from '../market-intelligence/asset-analyzer.js';
import { marketIntelligenceCatalog } from '../market-intelligence/catalog.js';
import { marketIntelligenceDiagnostics } from '../market-intelligence/diagnostics.js';
import { linkEventToAssets } from '../market-intelligence/event-market-linker.js';
import { linkPredictionMarkets } from '../market-intelligence/prediction-linker.js';
import { normalizeSnapshotRequest } from '../market-intelligence/validation.js';

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await mapper(items[index], index);
      } catch (error) {
        results[index] = Object.freeze({
          available: false,
          asset: items[index],
          error: String(error?.code || error?.name || 'MARKET_DATA_UNAVAILABLE'),
          message: String(error?.message || 'Market data unavailable')
        });
      }
    }
  }
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), Math.max(1, items.length)) }, worker);
  await Promise.all(workers);
  return results;
}

function withDeadline(promise, milliseconds, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise(resolve => {
      timer = setTimeout(() => resolve(fallback), milliseconds);
      timer.unref?.();
    })
  ]).finally(() => clearTimeout(timer));
}

function sourceGroupFromAnalyses(analyses, registry) {
  const market = [];
  for (const analysis of analyses) {
    const quote = analysis?.source?.quote;
    const candles = analysis?.source?.candles;
    if (quote) market.push({ ...quote, id: quote.id || `quote:${analysis.asset?.id}` });
    if (candles) market.push({ ...candles, id: candles.id || `candles:${analysis.asset?.id}` });
  }
  const registryHealth = registry?.health?.();
  if (Array.isArray(registryHealth)) market.push(...registryHealth);
  else if (registryHealth && typeof registryHealth === 'object') market.push(...Object.values(registryHealth));
  return { market };
}

export class MarketIntelligencePlatformService {
  constructor(options = {}) {
    this.marketCatalog = options.marketCatalog;
    this.marketData = options.marketData;
    this.marketRegistry = options.marketRegistry;
    this.eventService = options.eventService;
    this.predictionMarkets = options.predictionMarkets;
    this.newsIntelligence = options.newsIntelligence;
    this.screens = options.screens || new MarketScreenRepository({ maximum: 100 });
    this.watchlist = options.watchlist || new MarketWatchlist({ maximum: 250 });
    this.exporter = options.exporter || new MarketIntelligenceExportService();
    this.snapshotCache = new Map();
    this.cacheTtlMs = Math.max(5_000, Number(options.cacheTtlMs) || 30_000);
  }

  catalog() {
    const assets = this.marketCatalog?.list?.() || [];
    return Object.freeze({ ...marketIntelligenceCatalog(), assets: Object.freeze(assets) });
  }

  diagnostics() {
    return Object.freeze({
      ...marketIntelligenceDiagnostics(this),
      marketSources: this.marketRegistry?.health?.() || [],
      cachedSnapshots: this.snapshotCache.size
    });
  }

  async loadEvents(request) {
    if (!request.includeEvents || !this.eventService) return Object.freeze([]);
    const fallback = Object.freeze({ events: [] });
    const result = await withDeadline(
      this.eventService.globalSnapshot({ limit: 750, maxAgeMs: 30_000 }),
      2_500,
      fallback
    ).catch(() => fallback);
    return Object.freeze((result.events || []).slice(0, 750));
  }

  async loadPredictionMarkets(request) {
    if (!request.includePredictions || !this.predictionMarkets) return Object.freeze([]);
    const fallback = Object.freeze({ markets: [] });
    const result = await withDeadline(
      this.predictionMarkets.list({ limit: 60 }),
      2_500,
      fallback
    ).catch(() => fallback);
    return Object.freeze((result.markets || []).slice(0, 60));
  }

  async loadLiveAsset(asset, request) {
    const bundle = await this.marketData.bundle(asset.id, request.timeframe, request.historyLimit);
    return Object.freeze({
      asset: bundle.asset,
      quote: bundle.quote,
      candles: bundle.candles,
      source: bundle.source,
      available: true
    });
  }

  async liveInputs(request) {
    const assets = this.marketCatalog
      .internalList({ ids: request.assetIds })
      .slice(0, request.maximumAssets);
    return mapConcurrent(assets, 6, asset => this.loadLiveAsset(asset, request));
  }

  cacheKey(request) {
    return JSON.stringify({
      ids: request.assetIds,
      timeframe: request.timeframe,
      historyLimit: request.historyLimit,
      maximumAssets: request.maximumAssets,
      includeEvents: request.includeEvents,
      includePredictions: request.includePredictions
    });
  }

  cached(request) {
    const key = this.cacheKey(request);
    const record = this.snapshotCache.get(key);
    if (!record || Date.now() - record.createdAt > this.cacheTtlMs) return null;
    return record.value;
  }

  remember(request, value) {
    const key = this.cacheKey(request);
    this.snapshotCache.set(key, { createdAt: Date.now(), value });
    if (this.snapshotCache.size > 24) {
      const oldest = [...this.snapshotCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
      if (oldest) this.snapshotCache.delete(oldest[0]);
    }
    return value;
  }

  async snapshot(input = {}) {
    const request = normalizeSnapshotRequest(input);
    if (!Array.isArray(input.assets) && input.force !== true) {
      const cached = this.cached(request);
      if (cached) return Object.freeze({ ...cached, cache: 'HIT' });
    }
    const rawAssets = Array.isArray(input.assets)
      ? input.assets
      : request.includeLive
        ? await this.liveInputs(request)
        : [];
    const available = rawAssets.filter(item => item && item.available !== false && (item.asset || item.id));
    const assetDefinitions = available.map(item => item.asset || item);
    const [events, predictionMarkets] = await Promise.all([
      Array.isArray(input.events) ? input.events : this.loadEvents(request),
      Array.isArray(input.predictionMarkets) ? input.predictionMarkets : this.loadPredictionMarkets(request)
    ]);
    const eventLinks = events.flatMap(event => linkEventToAssets(event, assetDefinitions));
    const predictionLinks = linkPredictionMarkets(predictionMarkets, assetDefinitions);
    const analysed = available.map(item => {
      const asset = item.asset || item;
      const relevantEventLinks = eventLinks.filter(link => link.assetId === asset.id);
      const relevantPredictionLinks = predictionLinks.filter(link => link.assetId === asset.id);
      const eventRisk = relevantEventLinks.reduce((maximum, link) => Math.max(maximum, link.relevance), 0);
      return analyzeAsset({
        asset,
        quote: item.quote,
        candles: item.candles || item.series,
        source: item.source,
        sourceCount: item.source ? 1 : 0,
        independentSources: item.independentSources,
        corroborationScore: item.corroborationScore,
        contradictions: item.contradictions,
        eventLinks: relevantEventLinks,
        predictionLinks: relevantPredictionLinks,
        eventRisk,
        periodsPerYear: item.periodsPerYear
      });
    });
    const snapshot = buildMarketSnapshot({
      assets: analysed,
      eventLinks,
      predictionLinks,
      sourceGroups: sourceGroupFromAnalyses(analysed, this.marketRegistry),
      inflationPressure: input.inflationPressure,
      growthPressure: input.growthPressure,
      heatmapMetric: input.heatmapMetric,
      opportunityLimit: input.opportunityLimit
    });
    const result = Object.freeze({
      ...snapshot,
      requestedAssets: rawAssets.length,
      availableAssets: analysed.length,
      unavailableAssets: Object.freeze(rawAssets.filter(item => item?.available === false)),
      eventsConsidered: events.length,
      predictionMarketsConsidered: predictionMarkets.length,
      timeframe: request.timeframe,
      cache: 'MISS'
    });
    return Array.isArray(input.assets) ? result : this.remember(request, result);
  }

  async screen(input = {}) {
    const snapshot = input.snapshot || await this.snapshot(input);
    return runScreen(snapshot.assets || [], input.filters || input);
  }

  async portfolio(input = {}) {
    const snapshot = input.snapshot || await this.snapshot({ ...input, assetIds: (input.positions || []).map(position => position.assetId || position.symbol), maximumAssets: Math.max(1, input.positions?.length || 1) });
    return calculatePortfolioExposure(input.positions || [], snapshot.assets || []);
  }

  async scenario(input = {}) {
    const snapshot = input.snapshot || await this.snapshot({ ...input, assetIds: (input.positions || []).map(position => position.assetId || position.symbol), maximumAssets: Math.max(1, input.positions?.length || 1) });
    return runMarketScenario(input, snapshot.assets || []);
  }

  async sensitivity(input = {}) {
    const snapshot = input.snapshot || await this.snapshot({ ...input, assetIds: (input.positions || []).map(position => position.assetId || position.symbol), maximumAssets: Math.max(1, input.positions?.length || 1) });
    return runSensitivityAnalysis(input, snapshot.assets || []);
  }

  async alerts(owner) {
    const watches = await this.watchlist.list(owner);
    if (!watches.length) return Object.freeze([]);
    const snapshot = await this.snapshot({ assetIds: watches.map(watch => watch.assetId), maximumAssets: watches.length });
    return evaluateMarketAlerts(watches, snapshot.assets || []);
  }
}

export function createMarketIntelligencePlatformService(options) {
  return new MarketIntelligencePlatformService(options);
}
