import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from '../http/router.js';
import { createRequestContext } from '../http/request-context.js';
import { setCommonHeaders, sendJson, errorPayload } from '../http/response.js';
import { createStaticHandler } from '../http/static-server.js';
import { SlidingWindowRateLimiter } from '../http/rate-limiter.js';
import { TtlCache } from '../infra/cache/ttl-cache.js';
import { createFetchClient } from '../infra/http/fetch-client.js';
import { SourceRegistry } from '../sources/source-registry.js';
import { UsgsSource } from '../sources/usgs-source.js';
import { EonetSource } from '../sources/eonet-source.js';
import { GdacsSource } from '../sources/gdacs-source.js';
import { AcledSource } from '../sources/acled-source.js';
import { EventService } from '../services/event-service.js';
import { LocationService } from '../services/location-service.js';
import { DiagnosticsService } from '../services/diagnostics-service.js';
import { RouteService } from '../services/route-service.js';
import { MarketCatalogService } from '../services/market-catalog-service.js';
import { MarketDataService } from '../services/market-data-service.js';
import { MarketAnalysisService } from '../services/market-analysis-service.js';
import { MarketScreenerService } from '../services/market-screener-service.js';
import { PredictionMarketService } from '../services/prediction-market-service.js';
import { OpportunityService } from '../services/opportunity-service.js';
import { MarketReplayService } from '../services/market-replay-service.js';
import { AlertEvaluationService } from '../domain/alerts/alert-service.js';
import { MarketSourceRegistry } from '../market-sources/market-source-registry.js';
import { BinanceSource } from '../market-sources/binance-source.js';
import { CoinGeckoSource } from '../market-sources/coingecko-source.js';
import { AlphaVantageSource } from '../market-sources/alpha-vantage-source.js';
import { NewsSourceRegistry } from '../news-sources/news-source-registry.js';
import { GdeltNewsSource } from '../news-sources/gdelt-news-source.js';
import { RssNewsSource } from '../news-sources/rss-news-source.js';
import { BlueskySocialSource } from '../news-sources/bluesky-social-source.js';
import { XSocialSource } from '../news-sources/x-social-source.js';
import { NewsIntelligenceService } from '../services/news-intelligence-service.js';
import { ShippingSourceRegistry } from '../shipping-sources/registry.js';
import { NoaaCoopsSource } from '../shipping-sources/noaa-coops-source.js';
import { ImfPortWatchSource } from '../shipping-sources/imf-portwatch-source.js';
import { UnComtradeSource } from '../shipping-sources/un-comtrade-source.js';
import { EiaShippingSource } from '../shipping-sources/eia-source.js';
import { ShippingCatalogService } from '../services/shipping-catalog-service.js';
import { ShippingIntelligenceService } from '../services/shipping-intelligence-service.js';
import { TradeFlowService } from '../services/trade-flow-service.js';
import { CommodityShippingService } from '../services/commodity-shipping-service.js';
import { IntelligenceSourceRegistry } from '../intelligence-sources/registry.js';
import { WorldBankSource } from '../intelligence-sources/world-bank-source.js';
import { UkPoliceSource } from '../intelligence-sources/uk-police-source.js';
import { ReliefWebSource } from '../intelligence-sources/reliefweb-source.js';
import { GoogleCivicSource } from '../intelligence-sources/google-civic-source.js';
import { IntelligenceCatalogService } from '../services/intelligence-catalog-service.js';
import { CountryIntelligenceService } from '../services/country-intelligence-service.js';
import { registerApiRoutes } from '../api/register-api-routes.js';
import { JsonDocumentStore } from '../infra/persistence/json-document-store.js';
import { AccountRepository } from '../repositories/account-repository.js';
import { SessionRepository } from '../repositories/session-repository.js';
import { SubscriptionRepository } from '../repositories/subscription-repository.js';
import { UserDataRepository } from '../repositories/user-data-repository.js';
import { AuditRepository } from '../repositories/audit-repository.js';
import { WebhookRepository } from '../repositories/webhook-repository.js';
import { UsageRepository } from '../repositories/usage-repository.js';
import { AuditService } from '../services/audit-service.js';
import { AuthService } from '../services/auth-service.js';
import { EntitlementService } from '../services/entitlement-service.js';
import { UserDataService } from '../services/user-data-service.js';
import { SubscriptionService } from '../services/subscription-service.js';
import { AdminService } from '../services/admin-service.js';
import { BillingProviderRegistry } from '../billing/provider-registry.js';
import { StripeProvider } from '../billing/stripe-provider.js';
import { PayPalProvider } from '../billing/paypal-provider.js';
import { CoinbaseProvider } from '../billing/coinbase-provider.js';
import { MetricsRegistry } from '../observability/metrics-registry.js';
import { RequestMetrics } from '../observability/request-metrics.js';
import { RuntimeSampler } from '../observability/runtime-sampler.js';
import { ClientReportStore } from '../observability/client-report-store.js';
import { HealthEvaluator } from '../observability/health-evaluator.js';
import { DataQualityService } from '../quality/data-quality-service.js';
import { BuildInfoService } from '../deployment/build-info-service.js';
import { verifyRequestOrigin } from '../security/origin-guard.js';
import { ClientVersionPolicy } from '../security/client-version-policy.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

export async function createApplication(options) {
  const { config, logger } = options;
  const metrics = new MetricsRegistry();
  const runtime = new RuntimeSampler({ metrics, intervalMs: config.ops.runtimeSampleMs });
  runtime.start();
  const requestMetrics = new RequestMetrics({ metrics, slowRequestMs: config.ops.slowRequestMs, logger: logger.child({ component: 'request-metrics' }) });
  const clientReports = new ClientReportStore({ maximum: 2000 });
  const clientVersions = new ClientVersionPolicy({ serverVersion: config.version, metrics });
  const accountDataPath = path.isAbsolute(config.accounts.dataFile) ? config.accounts.dataFile : path.join(ROOT_DIR, config.accounts.dataFile);
  const accountStore = new JsonDocumentStore({
    filePath: accountDataPath,
    defaultValue: { schemaVersion: 1, users: [], sessions: [], subscriptions: [], userData: {}, usage: {}, audit: [], webhooks: [] }
  });
  await accountStore.load();
  const accounts = new AccountRepository(accountStore);
  const sessionRepository = new SessionRepository(accountStore);
  const subscriptionRepository = new SubscriptionRepository(accountStore);
  const userDataRepository = new UserDataRepository(accountStore);
  const auditRepository = new AuditRepository(accountStore);
  const webhookRepository = new WebhookRepository(accountStore);
  const usageRepository = new UsageRepository(accountStore);
  const audit = new AuditService(auditRepository);

  const cache = new TtlCache({ maxEntries: 5000 });
  const http = createFetchClient({ timeoutMs: config.httpTimeoutMs, userAgent: config.userAgent, logger: logger.child({ component: 'http-client' }) });
  const sourceOptions = { http, cache, logger: logger.child({ component: 'source' }), refreshMs: config.sourceRefreshMs, staleMs: config.sourceStaleMs };
  const registry = new SourceRegistry({ logger: logger.child({ component: 'source-registry' }) })
    .register(new UsgsSource(sourceOptions))
    .register(new EonetSource(sourceOptions))
    .register(new GdacsSource(sourceOptions))
    .register(new AcledSource({ ...sourceOptions, accessToken: config.acled.accessToken }));

  const marketRegistry = new MarketSourceRegistry({ logger: logger.child({ component: 'market-source-registry' }) })
    .register(new BinanceSource({ ...sourceOptions, enabled: config.markets.binanceEnabled, baseUrl: config.markets.binanceBaseUrl }))
    .register(new CoinGeckoSource({ ...sourceOptions, enabled: config.markets.coinGeckoEnabled, apiKey: config.markets.coinGeckoApiKey, baseUrl: config.markets.coinGeckoBaseUrl }))
    .register(new AlphaVantageSource({ ...sourceOptions, apiKey: config.markets.alphaVantageApiKey, baseUrl: config.markets.alphaVantageBaseUrl }));


  const newsSourceOptions = {
    http,
    cache,
    logger: logger.child({ component: 'news-source' }),
    refreshMs: config.news.refreshMs,
    staleMs: config.news.staleMs
  };
  const newsRegistry = new NewsSourceRegistry({ logger: logger.child({ component: 'news-source-registry' }) })
    .register(new GdeltNewsSource({ ...newsSourceOptions, configured: config.news.gdeltEnabled, baseUrl: config.news.gdeltBaseUrl }))
    .register(new RssNewsSource({ ...newsSourceOptions, feeds: config.news.rssFeeds }))
    .register(new BlueskySocialSource({ ...newsSourceOptions, configured: config.news.blueskyEnabled, baseUrl: config.news.blueskyBaseUrl }))
    .register(new XSocialSource({ ...newsSourceOptions, bearerToken: config.news.xBearerToken, baseUrl: config.news.xBaseUrl }));

  const shippingSourceOptions = {
    http, cache, logger: logger.child({ component: 'shipping-source' }),
    refreshMs: config.shipping.refreshMs, staleMs: config.shipping.staleMs
  };
  const shippingRegistry = new ShippingSourceRegistry({ logger: logger.child({ component: 'shipping-source-registry' }) })
    .register(new ImfPortWatchSource({ ...shippingSourceOptions, baseUrl: config.shipping.portWatchBaseUrl, portField: config.shipping.portWatchPortField }))
    .register(new NoaaCoopsSource({ ...shippingSourceOptions, enabled: config.shipping.noaaEnabled, baseUrl: config.shipping.noaaBaseUrl }))
    .register(new UnComtradeSource({ ...shippingSourceOptions, enabled: config.shipping.comtradeEnabled, baseUrl: config.shipping.comtradeBaseUrl, subscriptionKey: config.shipping.comtradeSubscriptionKey }))
    .register(new EiaShippingSource({ ...shippingSourceOptions, apiKey: config.shipping.eiaApiKey, routeUrl: config.shipping.eiaRouteUrl }));

  const intelligenceSourceOptions = {
    http, cache, logger: logger.child({ component: 'intelligence-source' }),
    refreshMs: config.intelligence.refreshMs, staleMs: config.intelligence.staleMs
  };
  const intelligenceRegistry = new IntelligenceSourceRegistry({ logger: logger.child({ component: 'intelligence-source-registry' }) })
    .register(new WorldBankSource({ ...intelligenceSourceOptions, enabled: config.intelligence.worldBankEnabled, baseUrl: config.intelligence.worldBankBaseUrl }))
    .register(new UkPoliceSource({ ...intelligenceSourceOptions, enabled: config.intelligence.ukPoliceEnabled, baseUrl: config.intelligence.ukPoliceBaseUrl }))
    .register(new ReliefWebSource({ ...intelligenceSourceOptions, appName: config.intelligence.reliefWebAppName, baseUrl: config.intelligence.reliefWebBaseUrl }))
    .register(new GoogleCivicSource({ ...intelligenceSourceOptions, apiKey: config.intelligence.googleCivicApiKey, baseUrl: config.intelligence.googleCivicBaseUrl }));

  const billingProviders = new BillingProviderRegistry()
    .register(new StripeProvider({ ...config.billing.stripe, logger: logger.child({ component: 'billing-stripe' }) }))
    .register(new PayPalProvider({ ...config.billing.paypal, logger: logger.child({ component: 'billing-paypal' }) }))
    .register(new CoinbaseProvider({ ...config.billing.coinbase, logger: logger.child({ component: 'billing-coinbase' }) }));

  const locationService = await LocationService.create({ http, placesPath: path.join(ROOT_DIR, 'data/places.json') });
  const routeService = await RouteService.create({ routesPath: path.join(ROOT_DIR, 'data/routes.json') });
  const intelligenceCatalog = await IntelligenceCatalogService.create({
    countriesPath: path.join(ROOT_DIR, 'data/countries.json'), citiesPath: path.join(ROOT_DIR, 'data/cities.json')
  });
  const shippingCatalog = await ShippingCatalogService.create({
    portsPath: path.join(ROOT_DIR, 'data/ports.json'), chokepointsPath: path.join(ROOT_DIR, 'data/chokepoints.json'),
    commoditiesPath: path.join(ROOT_DIR, 'data/shipping-commodities.json'), routesPath: path.join(ROOT_DIR, 'data/routes.json')
  });
  const marketCatalog = await MarketCatalogService.create({ catalogPath: path.join(ROOT_DIR, 'data/market-assets.json') });
  const marketData = new MarketDataService({ catalog: marketCatalog, registry: marketRegistry });
  const marketAnalysis = new MarketAnalysisService({ data: marketData });
  const marketScreener = new MarketScreenerService({ catalog: marketCatalog, analysis: marketAnalysis });
  const predictionMarkets = new PredictionMarketService({ http, cache, baseUrl: config.markets.polymarketBaseUrl });
  const eventService = new EventService({ registry });
  const newsIntelligence = new NewsIntelligenceService({ registry: newsRegistry, events: eventService });
  const shippingIntelligence = new ShippingIntelligenceService({ catalog: shippingCatalog, events: eventService, news: newsIntelligence, sources: shippingRegistry, cache });
  const tradeFlows = new TradeFlowService({ sources: shippingRegistry, catalog: shippingCatalog });
  const commodityShipping = new CommodityShippingService({ catalog: shippingCatalog, shipping: shippingIntelligence, markets: marketAnalysis, sources: shippingRegistry });
  const countryIntelligence = new CountryIntelligenceService({
    catalog: intelligenceCatalog, events: eventService, news: newsIntelligence, sources: intelligenceRegistry, cache
  });
  const opportunities = new OpportunityService({ events: eventService, markets: marketScreener, predictions: predictionMarkets });
  const marketReplay = new MarketReplayService({ data: marketData });
  const alertEvaluation = new AlertEvaluationService();
  const auth = new AuthService({
    accounts, sessions: sessionRepository, audit,
    secret: config.accounts.sessionSecret,
    cookieName: config.accounts.cookieName,
    sessionTtlMs: config.accounts.sessionTtlMs,
    allowRegistration: config.accounts.allowRegistration,
    bootstrap: config.accounts.bootstrapOwner
  });
  await auth.initialize();
  const entitlements = new EntitlementService({ subscriptions: subscriptionRepository, usage: usageRepository });
  const userData = new UserDataService({ repository: userDataRepository, entitlements });
  const subscriptions = new SubscriptionService({
    repository: subscriptionRepository, entitlements, providers: billingProviders,
    webhooks: webhookRepository, audit, accounts
  });
  const admin = new AdminService({ accounts, subscriptions: subscriptionRepository, sessions: sessionRepository, audit, providers: billingProviders });
  const dataQuality = new DataQualityService({
    registries: { events: registry, markets: marketRegistry, news: newsRegistry, shipping: shippingRegistry, intelligence: intelligenceRegistry },
    catalogs: { market: marketCatalog, shipping: shippingCatalog, intelligence: intelligenceCatalog },
    cache
  });
  const health = new HealthEvaluator({
    runtime,
    maximumEventLoopP95Ms: config.ops.maximumEventLoopP95Ms,
    sourceGroups: () => ({ events: registry.health(), markets: marketRegistry.health(), news: newsRegistry.health(), shipping: shippingRegistry.health(), intelligence: intelligenceRegistry.health() })
  });
  const buildInfo = new BuildInfoService({ root: ROOT_DIR, config });

  const router = new Router();
  const diagnostics = new DiagnosticsService({ registry, marketRegistry, newsRegistry, shippingRegistry, shippingCatalog, intelligenceRegistry, intelligenceCatalog, cache, routes: router, config, alertEvaluation });
  const services = {
    config, registry, eventService, locationService, routeService, diagnostics,
    marketRegistry, marketCatalog, marketData, marketAnalysis, marketScreener, predictionMarkets,
    opportunities, marketReplay, alertEvaluation, newsRegistry, newsIntelligence,
    shippingRegistry, shippingCatalog, shippingIntelligence, tradeFlows, commodityShipping,
    intelligenceRegistry, intelligenceCatalog, countryIntelligence,
    accountStore, accounts, sessionRepository, subscriptionRepository, userDataRepository,
    audit, auth, entitlements, userData, subscriptions, admin, billingProviders,
    metrics, runtime, requestMetrics, clientReports, clientVersions, dataQuality, health, buildInfo
  };
  registerApiRoutes(router, services);
  const serveStatic = createStaticHandler({ root: path.join(ROOT_DIR, 'public'), production: config.isProduction, compressionThreshold: 1024 });
  const limiter = new SlidingWindowRateLimiter({ limit: config.rateLimitPerMinute, windowMs: 60_000 });

  async function handle(request, response) {
    const context = createRequestContext(request, `http://${request.headers.host || 'localhost'}`);
    const requestLogger = logger.child({ requestId: context.id, method: context.method, path: context.path });
    const completeMetrics = requestMetrics.begin(context);
    response.once('finish', () => completeMetrics(response.statusCode));
    setCommonHeaders(response, context.id);
    const clientState = clientVersions.inspect(request.headers['x-client-version']);
    response.setHeader('x-server-version', config.version);
    response.setHeader('x-client-state', clientState.state);
    if (config.isProduction) response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
    try {
      if (context.method === 'OPTIONS') { response.statusCode = 204; response.end(); return; }
      verifyRequestOrigin(request, context, {
        protocol: config.isProduction ? 'https' : 'http',
        allowedOrigins: [config.accounts.publicOrigin, ...config.ops.allowedOrigins],
        exemptPaths: ['/api/billing/webhooks/']
      });
      const rate = limiter.consume(context.ip);
      response.setHeader('x-rate-limit-remaining', rate.remaining);
      response.setHeader('x-rate-limit-reset', new Date(rate.resetAt).toISOString());
      if (context.path.startsWith('/api/')) await router.dispatch(request, response, context);
      else if (context.method === 'GET' || context.method === 'HEAD') await serveStatic({ request, response, context });
      else sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed', requestId: context.id } });
      requestLogger.debug('request.completed', { statusCode: response.statusCode, durationMs: Math.round(performance.now() - context.startedAt) });
    } catch (error) {
      const payload = errorPayload(error, context.id);
      if (payload.retryAfterSeconds) response.setHeader('retry-after', payload.retryAfterSeconds);
      sendJson(response, payload.statusCode, payload.body);
      const level = payload.statusCode >= 500 ? 'error' : 'warn';
      requestLogger[level]('request.failed', { statusCode: payload.statusCode, durationMs: Math.round(performance.now() - context.startedAt), error });
    }
  }

  return Object.freeze({ handle, async close() { runtime.stop(); cache.clear(); await accountStore.close(); }, services });
}
