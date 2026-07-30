import { DAY_MS } from '../core/time.js';
import { finiteNumber, boundedString, clampInteger, oneOf, booleanParam } from '../core/validation.js';
import { publicAsset } from '../domain/markets/asset-schema.js';
import { TIMEFRAME_IDS } from '../domain/markets/timeframes.js';
import { sendJson } from '../http/response.js';
import { readJsonBody } from '../http/body.js';
import { STRATEGY_IDS } from '../domain/replay/strategy-schema.js';
import { INTELLIGENCE_LAYERS } from '../domain/intelligence/constants.js';
import { registerAccountRoutes } from './register-account-routes.js';
import { registerOpsRoutes } from './register-ops-routes.js';

function categoryList(value) {
  return String(value || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean).slice(0, 30);
}

function symbolList(value) {
  return String(value || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean).slice(0, 30);
}

function upperList(value) {
  return String(value || '').split(',').map(item => item.trim().toUpperCase()).filter(Boolean).slice(0, 30);
}

function publicCandles(candles) {
  return candles.map(candle => [candle.timestamp, candle.open, candle.high, candle.low, candle.close, candle.volume]);
}

export function registerApiRoutes(router, services) {
  router.get('/api/config', async ({ response }) => {
    sendJson(response, 200, {
      version: services.config.version,
      mapStyleUrl: services.config.mapStyleUrl,
      radiusOptionsKm: [25, 50, 100, 250, 500, 1000, 2000, 2500],
      defaultPoint: { lat: 51.5074, lon: -0.1278 },
      defaultRadiusKm: 250,
      marketTimeframes: ['15m', '1h', '4h', '1d'],
      defaultMarketTimeframe: '1h',
      capabilities: ['ACCOUNTS', 'SUBSCRIPTIONS', 'BILLING', 'USER_DATA', 'ADMIN', 'MAP', 'RADIUS', 'NEWS', 'SOCIAL', 'VERIFICATION', 'CORRELATION', 'SHIPPING', 'PORTS', 'TRADE_FLOWS', 'COMMODITIES', 'COUNTRIES', 'CITIES', 'CRIME', 'ELECTIONS', 'SAFETY', 'CONFLICT', 'DISASTERS', 'MARKETS', 'PREDICTIONS', 'OPPORTUNITIES', 'ALERTS', 'REPLAY', 'WORKSPACES', 'EXPORT', 'PWA', 'OFFLINE_SHELL', 'OBSERVABILITY', 'DATA_QUALITY', 'HEALTH_CHECKS', 'COMPRESSED_STATIC', 'SECURITY_HARDENING'],
      eventCategories: ['earthquake', 'volcano', 'wildfire', 'storm', 'flood', 'drought', 'landslide', 'ice', 'conflict', 'protest', 'terror', 'crime', 'infrastructure', 'transport', 'energy', 'economic', 'health', 'other']
    }, { cacheControl: 'public, max-age=300' });
  });

  router.get('/api/health', async ({ response }) => { const health = services.health.snapshot(); sendJson(response, health.ready ? 200 : 503, { ok: health.ready, version: services.config.version, ...health }); });
  router.get('/api/diagnostics', async ({ response }) => sendJson(response, 200, services.diagnostics.snapshot()));

  router.get('/api/sources', async ({ response }) => {
    const snapshot = await services.eventService.globalSnapshot({ maxAgeMs: 20_000, limit: 1 });
    sendJson(response, 200, { sources: snapshot.sources, rawCount: snapshot.rawCount, eventCount: snapshot.eventCount, clusterCount: snapshot.clusterCount, generatedAt: snapshot.generatedAt, durationMs: snapshot.durationMs });
  });

  router.get('/api/events', async ({ response, context }) => {
    const days = clampInteger(context.query.get('days'), 30, 1, 30);
    const limit = clampInteger(context.query.get('limit'), 2000, 1, 5000);
    const categories = categoryList(context.query.get('categories'));
    const snapshot = await services.eventService.globalSnapshot({ categories, since: Date.now() - days * DAY_MS, limit, maxAgeMs: 20_000 });
    sendJson(response, 200, { events: snapshot.events, sources: snapshot.sources, rawCount: snapshot.rawCount, totalCount: snapshot.eventCount, filteredCount: snapshot.filteredCount, generatedAt: snapshot.generatedAt });
  });

  router.get('/api/scan', async ({ response, context }) => {
    const lat = finiteNumber(context.query.get('lat'), 'lat', { min: -90, max: 90 });
    const lon = finiteNumber(context.query.get('lon'), 'lon', { min: -180, max: 180 });
    const radiusKm = finiteNumber(context.query.get('radiusKm') || 250, 'radiusKm', { min: 25, max: 2500 });
    const eventLimit = clampInteger(context.query.get('limit'), 250, 1, 1000);
    const [scan, location] = await Promise.all([services.eventService.scanRadius({ lat, lon, radiusKm, lookbackDays: 30, eventLimit }), services.locationService.reverse(lat, lon)]);
    sendJson(response, 200, { ...scan, location });
  });

  router.get('/api/search', async ({ response, context }) => {
    const query = boundedString(context.query.get('q'), 'q', { min: 2, max: 120 });
    const limit = clampInteger(context.query.get('limit'), 8, 1, 12);
    sendJson(response, 200, { query, results: await services.locationService.search(query, limit) });
  });

  router.get('/api/reverse', async ({ response, context }) => {
    const lat = finiteNumber(context.query.get('lat'), 'lat', { min: -90, max: 90 });
    const lon = finiteNumber(context.query.get('lon'), 'lon', { min: -180, max: 180 });
    sendJson(response, 200, await services.locationService.reverse(lat, lon));
  });

  router.get('/api/routes', async ({ response }) => sendJson(response, 200, services.routeService.list(), { cacheControl: 'public, max-age=3600' }));

  router.get('/api/markets/catalog', async ({ response, context }) => {
    const search = String(context.query.get('q') || '');
    const assetClass = String(context.query.get('assetClass') || '');
    sendJson(response, 200, { assets: services.marketCatalog.list({ search, assetClass }), sourceHealth: services.marketRegistry.health() }, { cacheControl: 'public, max-age=300' });
  });

  router.get('/api/markets/sources', async ({ response }) => sendJson(response, 200, { sources: services.marketRegistry.health(), generatedAt: new Date().toISOString() }));

  router.get('/api/markets/quote', async ({ response, context }) => {
    const assetId = boundedString(context.query.get('asset'), 'asset', { min: 1, max: 64 });
    const result = await services.marketData.quote(assetId);
    sendJson(response, 200, { asset: publicAsset(result.asset), quote: result.quote, source: result.source });
  });

  router.get('/api/markets/candles', async ({ response, context }) => {
    const assetId = boundedString(context.query.get('asset'), 'asset', { min: 1, max: 64 });
    const timeframeId = oneOf(String(context.query.get('timeframe') || '1h'), TIMEFRAME_IDS, '1h');
    const limit = clampInteger(context.query.get('limit'), 500, 50, 1000);
    const result = await services.marketData.candles(assetId, timeframeId, limit);
    sendJson(response, 200, { asset: publicAsset(result.asset), timeframe: result.timeframe, candles: publicCandles(result.candles), source: result.source });
  });

  router.get('/api/markets/analyse', async ({ response, context }) => {
    const assetId = boundedString(context.query.get('asset'), 'asset', { min: 1, max: 64 });
    const timeframeId = oneOf(String(context.query.get('timeframe') || '1h'), TIMEFRAME_IDS, '1h');
    const limit = clampInteger(context.query.get('limit'), 750, 200, 1000);
    const result = await services.marketAnalysis.analyse({ assetId, timeframeId, limit });
    if (Array.isArray(result.candles)) result.candles = publicCandles(result.candles.slice(-500));
    sendJson(response, 200, result);
  });

  router.get('/api/markets/multi-timeframe', async ({ response, context }) => {
    const assetId = boundedString(context.query.get('asset'), 'asset', { min: 1, max: 64 });
    const result = await services.marketAnalysis.analyseMultiple({ assetId, timeframes: ['15m', '1h', '4h', '1d'], limit: 750 });
    for (const analysis of Object.values(result.analyses)) if (Array.isArray(analysis.candles)) delete analysis.candles;
    sendJson(response, 200, result);
  });

  router.get('/api/markets/screener', async ({ response, context }) => {
    const timeframeId = oneOf(String(context.query.get('timeframe') || '1h'), TIMEFRAME_IDS, '1h');
    const assetIds = symbolList(context.query.get('assets'));
    const limit = clampInteger(context.query.get('limit'), 16, 1, 24);
    const result = await services.marketScreener.screen({ assetIds, timeframeId, limit, maximumAssets: limit, concurrency: 4 });
    for (const analysis of result.results) if (Array.isArray(analysis.candles)) delete analysis.candles;
    sendJson(response, 200, result);
  });

  router.get('/api/news/sources', async ({ response }) => {
    sendJson(response, 200, { sources: services.newsIntelligence.health(), generatedAt: new Date().toISOString() });
  });

  router.get('/api/news', async ({ response, context }) => {
    const query = String(context.query.get('q') || '').slice(0, 240);
    const sourceQuery = String(context.query.get('sourceQuery') || query).slice(0, 500);
    const hours = clampInteger(context.query.get('hours'), 24, 1, 168);
    const limit = clampInteger(context.query.get('limit'), 80, 1, 200);
    const minimumVerification = finiteNumber(context.query.get('minimumVerification') || 0, 'minimumVerification', { min: 0, max: 100 });
    const result = await services.newsIntelligence.search({
      query,
      sourceQuery,
      filterQuery: String(context.query.get('filter') || '').slice(0, 240),
      hours,
      limit,
      sourceLimit: clampInteger(context.query.get('sourceLimit'), 100, 10, 250),
      sources: categoryList(context.query.get('sources')),
      categories: categoryList(context.query.get('categories')),
      sourceTypes: upperList(context.query.get('sourceTypes')),
      countries: upperList(context.query.get('countries')),
      tickers: upperList(context.query.get('tickers')),
      minimumVerification,
      correlationHours: clampInteger(context.query.get('correlationHours'), 36, 6, 72),
      includeEventLinks: booleanParam(context.query.get('includeEventLinks'), true),
      sort: oneOf(String(context.query.get('sort') || 'latest'), ['latest', 'relevance'], 'latest')
    });
    sendJson(response, 200, result);
  });

  router.get('/api/news/story', async ({ response, context }) => {
    const storyId = boundedString(context.query.get('id'), 'id', { min: 4, max: 160 });
    const snapshot = services.newsIntelligence.snapshot();
    const story = snapshot?.stories?.find(item => item.id === storyId);
    if (!story) {
      sendJson(response, 404, { error: { code: 'STORY_NOT_FOUND', message: 'Story not found in current news snapshot' } });
      return;
    }
    const articles = snapshot.articles.filter(article => story.articleIds.includes(article.id));
    sendJson(response, 200, { story, articles, generatedAt: snapshot.generatedAt });
  });

  router.get('/api/prediction-markets', async ({ response, context }) => {
    const limit = clampInteger(context.query.get('limit'), 30, 1, 100);
    const search = String(context.query.get('q') || '').slice(0, 120);
    sendJson(response, 200, await services.predictionMarkets.list({ limit, search }));
  });

  router.get('/api/opportunities', async ({ response, context }) => {
    const timeframeId = oneOf(String(context.query.get('timeframe') || '1h'), TIMEFRAME_IDS, '1h');
    const assetIds = symbolList(context.query.get('assets'));
    const kinds = categoryList(context.query.get('kinds')).map(value => value.toUpperCase());
    const directions = categoryList(context.query.get('directions')).map(value => value.toUpperCase());
    const minimumScore = finiteNumber(context.query.get('minimumScore') || 45, 'minimumScore', { min: 0, max: 100 });
    const minimumConfidence = finiteNumber(context.query.get('minimumConfidence') || 35, 'minimumConfidence', { min: 0, max: 100 });
    const maximumRisk = finiteNumber(context.query.get('maximumRisk') || 85, 'maximumRisk', { min: 0, max: 100 });
    const limit = clampInteger(context.query.get('limit'), 50, 1, 100);
    const search = String(context.query.get('q') || '').slice(0, 120);
    const result = await services.opportunities.list({
      timeframeId,
      assetIds,
      kinds: kinds.length ? kinds : undefined,
      directions: directions.length ? directions : undefined,
      minimumScore,
      minimumConfidence,
      maximumRisk,
      limit,
      search
    });
    sendJson(response, 200, result);
  });

  router.get('/api/replay/market', async ({ response, context }) => {
    const assetId = boundedString(context.query.get('asset'), 'asset', { min: 1, max: 64 });
    const timeframeId = oneOf(String(context.query.get('timeframe') || '1h'), TIMEFRAME_IDS, '1h');
    const strategyId = oneOf(String(context.query.get('strategy') || 'TREND_PULLBACK').toUpperCase(), STRATEGY_IDS, 'TREND_PULLBACK');
    const limit = clampInteger(context.query.get('limit'), 1000, 200, 1000);
    const result = await services.marketReplay.run({
      assetId,
      timeframeId,
      limit,
      config: {
        strategyId,
        startingCapital: finiteNumber(context.query.get('capital') || 10000, 'capital', { min: 100, max: 100000000 }),
        riskPerTrade: finiteNumber(context.query.get('risk') || 0.01, 'risk', { min: 0.001, max: 0.1 }),
        feeRate: finiteNumber(context.query.get('fee') || 0.001, 'fee', { min: 0, max: 0.02 }),
        slippageRate: finiteNumber(context.query.get('slippage') || 0.0005, 'slippage', { min: 0, max: 0.02 }),
        stopAtr: finiteNumber(context.query.get('stopAtr') || 1.8, 'stopAtr', { min: 0.25, max: 10 }),
        targetAtr: finiteNumber(context.query.get('targetAtr') || 3, 'targetAtr', { min: 0.25, max: 20 }),
        maximumHoldingBars: clampInteger(context.query.get('holdingBars'), 48, 1, 500),
        allowShort: String(context.query.get('allowShort') || 'true').toLowerCase() !== 'false',
        walkForwardFolds: clampInteger(context.query.get('folds'), 4, 2, 12)
      }
    });
    sendJson(response, 200, result);
  });

  router.post('/api/alerts/evaluate', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 750000 });
    const rules = Array.isArray(body.rules) ? body.rules : [];
    const targets = Array.isArray(body.targets) ? body.targets : [];
    sendJson(response, 200, services.alertEvaluation.evaluate({ rules, targets }));
  });

  router.get('/api/shipping/catalog', async ({ response, context }) => {
    const query = String(context.query.get('q') || '').slice(0, 120);
    const commodity = String(context.query.get('commodity') || '').slice(0, 64).toLowerCase();
    const region = String(context.query.get('region') || '').slice(0, 80);
    const countryCode = String(context.query.get('countryCode') || '').slice(0, 3).toUpperCase();
    const type = String(context.query.get('type') || '').slice(0, 32).toLowerCase();
    const limit = clampInteger(context.query.get('limit'), 200, 1, 500);
    sendJson(response, 200, {
      summary: services.shippingCatalog.summary(),
      ports: services.shippingCatalog.listPorts({ query, commodity, region, countryCode, type, limit }),
      chokepoints: services.shippingCatalog.listChokepoints({ commodity }),
      commodities: services.shippingCatalog.listCommodities(),
      geojson: services.shippingCatalog.geojson(),
      sources: services.shippingRegistry.health()
    }, { cacheControl: 'public, max-age=300' });
  });

  router.get('/api/shipping/sources', async ({ response }) => {
    sendJson(response, 200, { sources: services.shippingRegistry.health(), generatedAt: new Date().toISOString() });
  });

  router.get('/api/shipping/snapshot', async ({ response, context }) => {
    const hours = clampInteger(context.query.get('hours'), 48, 6, 168);
    const query = String(context.query.get('q') || '').slice(0, 180);
    const payload = await services.shippingIntelligence.snapshot({ hours, query });
    const minimumRisk = finiteNumber(context.query.get('minimumRisk') || 0, 'minimumRisk', { min: 0, max: 100 });
    const commodity = String(context.query.get('commodity') || '').toLowerCase();
    const search = String(context.query.get('search') || '').toLowerCase();
    const matches = item => (!commodity || item.commodities?.includes?.(commodity) || item.commodity === commodity)
      && (!search || `${item.name || ''} ${item.country || ''} ${item.region || ''} ${(item.commodities || []).join(' ')}`.toLowerCase().includes(search))
      && Number(item.risk?.score || item.supplyRisk || 0) >= minimumRisk;
    sendJson(response, 200, {
      ...payload,
      ports: payload.ports.filter(matches), chokepoints: payload.chokepoints.filter(matches),
      routes: payload.routes.filter(matches), commodities: payload.commodities.filter(matches)
    });
  });

  router.get('/api/shipping/port', async ({ response, context }) => {
    const id = boundedString(context.query.get('id'), 'id', { min: 2, max: 96 }).toLowerCase();
    const hours = clampInteger(context.query.get('hours'), 72, 6, 168);
    sendJson(response, 200, await services.shippingIntelligence.portDetail(id, { hours }));
  });

  router.get('/api/shipping/chokepoint', async ({ response, context }) => {
    const id = boundedString(context.query.get('id'), 'id', { min: 2, max: 96 }).toLowerCase();
    const hours = clampInteger(context.query.get('hours'), 72, 6, 168);
    sendJson(response, 200, await services.shippingIntelligence.chokepointDetail(id, { hours }));
  });

  router.get('/api/shipping/route', async ({ response, context }) => {
    const id = boundedString(context.query.get('id'), 'id', { min: 2, max: 96 }).toLowerCase();
    const hours = clampInteger(context.query.get('hours'), 72, 6, 168);
    sendJson(response, 200, await services.shippingIntelligence.routeDetail(id, { hours }));
  });

  router.get('/api/shipping/impact', async ({ response, context }) => {
    const lat = finiteNumber(context.query.get('lat'), 'lat', { min: -90, max: 90 });
    const lon = finiteNumber(context.query.get('lon'), 'lon', { min: -180, max: 180 });
    const radiusKm = finiteNumber(context.query.get('radiusKm') || 500, 'radiusKm', { min: 25, max: 5000 });
    const hours = clampInteger(context.query.get('hours'), 48, 6, 168);
    sendJson(response, 200, await services.shippingIntelligence.impactAtPoint({ lat, lon }, radiusKm, { hours }));
  });

  router.get('/api/shipping/trade', async ({ response, context }) => {
    const defaultPeriod = String(new Date().getUTCFullYear() - 1);
    const query = {
      period: String(context.query.get('period') || defaultPeriod).slice(0, 12),
      reporterCode: boundedString(context.query.get('reporterCode'), 'reporterCode', { min: 1, max: 8 }),
      partnerCode: String(context.query.get('partnerCode') || '0').slice(0, 8),
      flowCode: oneOf(String(context.query.get('flowCode') || 'X').toUpperCase(), ['X', 'M', 'X,M', 'M,X'], 'X'),
      commodityCode: String(context.query.get('commodityCode') || 'TOTAL').slice(0, 16).toUpperCase(),
      transportCode: String(context.query.get('transportCode') || '0').slice(0, 8),
      limit: clampInteger(context.query.get('limit'), 500, 1, 500)
    };
    sendJson(response, 200, await services.tradeFlows.query(query));
  });

  router.get('/api/shipping/commodity', async ({ response, context }) => {
    const id = boundedString(context.query.get('id'), 'id', { min: 2, max: 96 }).toLowerCase();
    const timeframeId = oneOf(String(context.query.get('timeframe') || '1d'), TIMEFRAME_IDS, '1d');
    const hours = clampInteger(context.query.get('hours'), 72, 6, 168);
    sendJson(response, 200, await services.commodityShipping.detail(id, { timeframeId, hours }));
  });

  router.get('/api/intelligence/catalog', async ({ response, context }) => {
    const query = String(context.query.get('q') || '').slice(0, 120);
    const region = String(context.query.get('region') || '').slice(0, 80);
    const countryCode = String(context.query.get('countryCode') || '').slice(0, 3).toUpperCase();
    const limit = clampInteger(context.query.get('limit'), 500, 1, 1000);
    sendJson(response, 200, {
      summary: services.intelligenceCatalog.summary(),
      countries: services.intelligenceCatalog.listCountries({ query, region, limit }),
      cities: services.intelligenceCatalog.listCities({ query, countryCode, limit }),
      layers: INTELLIGENCE_LAYERS,
      sources: services.intelligenceRegistry.health()
    }, { cacheControl: 'public, max-age=300' });
  });

  router.get('/api/intelligence/sources', async ({ response }) => {
    sendJson(response, 200, { sources: services.intelligenceRegistry.health(), generatedAt: new Date().toISOString() });
  });

  router.get('/api/intelligence/overview', async ({ response, context }) => {
    const hours = clampInteger(context.query.get('hours'), 168, 24, 720);
    const limit = clampInteger(context.query.get('limit'), 250, 1, 300);
    const minimumRisk = finiteNumber(context.query.get('minimumRisk') || 0, 'minimumRisk', { min: 0, max: 100 });
    const region = String(context.query.get('region') || '').slice(0, 80);
    const query = String(context.query.get('q') || '').slice(0, 120);
    const includeNews = booleanParam(context.query.get('includeNews'), false);
    sendJson(response, 200, await services.countryIntelligence.overview({ hours, limit, minimumRisk, region, query, includeNews }));
  });

  router.get('/api/intelligence/country', async ({ response, context }) => {
    const id = boundedString(context.query.get('id'), 'id', { min: 2, max: 120 });
    const hours = clampInteger(context.query.get('hours'), 168, 24, 720);
    sendJson(response, 200, await services.countryIntelligence.countryDetail(id, { hours }));
  });

  router.get('/api/intelligence/city', async ({ response, context }) => {
    const id = boundedString(context.query.get('id'), 'id', { min: 2, max: 160 });
    const radiusKm = finiteNumber(context.query.get('radiusKm') || 100, 'radiusKm', { min: 10, max: 500 });
    const lookbackDays = clampInteger(context.query.get('lookbackDays'), 7, 1, 30);
    sendJson(response, 200, await services.countryIntelligence.cityDetail(id, { radiusKm, lookbackDays }));
  });

  router.get('/api/intelligence/point', async ({ response, context }) => {
    const lat = finiteNumber(context.query.get('lat'), 'lat', { min: -90, max: 90 });
    const lon = finiteNumber(context.query.get('lon'), 'lon', { min: -180, max: 180 });
    const radiusKm = finiteNumber(context.query.get('radiusKm') || 100, 'radiusKm', { min: 10, max: 1000 });
    const lookbackDays = clampInteger(context.query.get('lookbackDays'), 7, 1, 30);
    sendJson(response, 200, await services.countryIntelligence.pointDetail({ lat, lon }, { radiusKm, lookbackDays }));
  });

  router.get('/api/intelligence/crime', async ({ response, context }) => {
    const lat = finiteNumber(context.query.get('lat'), 'lat', { min: -90, max: 90 });
    const lon = finiteNumber(context.query.get('lon'), 'lon', { min: -180, max: 180 });
    const countryCode = boundedString(context.query.get('countryCode'), 'countryCode', { min: 2, max: 3 }).toUpperCase();
    sendJson(response, 200, await services.intelligenceRegistry.get('uk-police').crimesAt({ lat, lon }, { countryCode, date: String(context.query.get('date') || '') || undefined }));
  });

  router.get('/api/intelligence/elections', async ({ response, context }) => {
    const countryCode = String(context.query.get('countryCode') || '').slice(0, 3).toUpperCase();
    const result = await services.intelligenceRegistry.get('google-civic').elections();
    const { analyseElections } = await import('../domain/intelligence/elections.js');
    sendJson(response, 200, { ...result, analysis: analyseElections(result.data, { countryCode }) });
  });


  registerOpsRoutes(router, services);
  registerAccountRoutes(router, services);
}
