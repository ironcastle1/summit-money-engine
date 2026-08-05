import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Router } from '../http/router.js';
import { createRequestContext } from '../http/request-context.js';
import { setCommonHeaders, sendJson, errorPayload } from '../http/response.js';
import { createStaticHandler } from '../http/static-server.js';
import { SlidingWindowRateLimiter } from '../http/rate-limiter.js';
import { createRequestDeadline } from '../http/request-deadline.js';
import { TtlCache } from '../infra/cache/ttl-cache.js';
import { createFetchClient } from '../infra/http/fetch-client.js';
import { SourceRegistry } from '../sources/source-registry.js';
import { UsgsSource } from '../sources/usgs-source.js';
import { EonetSource } from '../sources/eonet-source.js';
import { GdacsSource } from '../sources/gdacs-source.js';
import { AcledSource } from '../sources/acled-source.js';
import { SnapshotEventSource } from '../sources/snapshot-source.js';
import { NwsAlertsSource } from '../sources/nws-alerts-source.js';
import { UkFloodSource } from '../sources/uk-flood-source.js';
import { ReliefWebDisasterSource } from '../sources/reliefweb-disaster-source.js';
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
import { CoinbaseExchangeSource } from '../market-sources/coinbase-exchange-source.js';
import { AlphaVantageSource } from '../market-sources/alpha-vantage-source.js';
import { SnapshotMarketSource } from '../market-sources/snapshot-market-source.js';
import { NewsSourceRegistry } from '../news-sources/news-source-registry.js';
import { GdeltNewsSource } from '../news-sources/gdelt-news-source.js';
import { RssNewsSource } from '../news-sources/rss-news-source.js';
import { XSocialSource } from '../news-sources/x-social-source.js';
import { SnapshotNewsSource } from '../news-sources/snapshot-news-source.js';
import { NewsIntelligenceService } from '../services/news-intelligence-service.js';
import { ShippingSourceRegistry } from '../shipping-sources/registry.js';
import { NoaaCoopsSource } from '../shipping-sources/noaa-coops-source.js';
import { ImfPortWatchSource } from '../shipping-sources/imf-portwatch-source.js';
import { UnComtradeSource } from '../shipping-sources/un-comtrade-source.js';
import { EiaShippingSource } from '../shipping-sources/eia-source.js';
import { NdbcSource } from '../shipping-sources/ndbc-source.js';
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
import { MapTileService } from '../services/map-tile-service.js';
import { FredMarketService } from '../services/fred-market-service.js';
import { registerIngestionRoutes } from '../api/register-ingestion-routes.js';
import { registerProcessingRoutes } from '../api/register-processing-routes.js';
import { IntelligenceProcessingPlatform } from '../intelligence-processing/intelligence-platform.js';
import { registerMapPlatformRoutes } from '../api/register-map-platform-routes.js';
import { MapFeatureService } from '../services/map-feature-service.js';
import { MapSearchService } from '../services/map-search-service.js';
import { MapStyleService } from '../services/map-style-service.js';
import { MapDiagnosticsService } from '../services/map-diagnostics-service.js';
import { MapPlatformService } from '../services/map-platform-service.js';
import { SavedMapViewService } from '../services/saved-map-view-service.js';
import { LayerCatalog, CORE_MAP_LAYERS } from '../geospatial/layer-catalog.js';
import { createOverlayPlatformService } from '../services/overlay-platform-service.js';
import { registerOverlayRoutes } from '../api/register-overlay-routes.js';
import { createLogisticsPlatformService } from '../services/logistics-platform-service.js';
import { registerLogisticsRoutes } from '../api/register-logistics-routes.js';
import { createHazardPlatformService } from '../services/hazard-platform-service.js';
import { registerHazardRoutes } from '../api/register-hazard-routes.js';
import { createMarketIntelligencePlatformService } from '../services/market-intelligence-platform-service.js';
import { registerMarketIntelligenceRoutes } from '../api/register-market-intelligence-routes.js';
import { createCountryRiskPlatformService } from '../services/country-risk-platform-service.js';
import { registerCountryRiskRoutes } from '../api/register-country-risk-routes.js';
import { createConflictIntelligencePlatformService } from '../services/conflict-intelligence-platform-service.js';
import { registerConflictIntelligenceRoutes } from '../api/register-conflict-intelligence-routes.js';
import { createDecisionSupportPlatformService } from '../services/decision-support-platform-service.js';
import { registerDecisionSupportRoutes } from '../api/register-decision-support-routes.js';
import { createAutomationPlatformService } from '../services/automation-platform-service.js';
import { registerAutomationRoutes } from '../api/register-automation-routes.js';
import { createPublishingPlatformService } from '../services/publishing-platform-service.js';
import { registerPublishingRoutes } from '../api/register-publishing-routes.js';
import { createCommercialOperationsService } from '../services/commercial-operations-service.js';
import { registerCommercialOperationsRoutes } from '../api/register-commercial-operations-routes.js';
import { createSecurityComplianceService } from '../services/security-compliance-service.js';
import { registerSecurityComplianceRoutes } from '../api/register-security-compliance-routes.js';
import { createReliabilityOperationsService } from '../services/reliability-operations-service.js';
import { registerReliabilityOperationsRoutes } from '../api/register-reliability-operations-routes.js';
import { createReleaseEngineeringService } from '../services/release-engineering-service.js';
import { registerReleaseEngineeringRoutes } from '../api/register-release-engineering-routes.js';
import { createLiveDataPlatformService } from '../services/live-data-platform-service.js';
import { registerLiveDataRoutes } from '../api/register-live-data-routes.js';
import { createMarketReadinessPlatformService } from '../services/market-readiness-platform-service.js';
import { registerMarketReadinessRoutes } from '../api/register-market-readiness-routes.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
export async function createApplication(options) {
    const { config, logger, startupDiagnostics = null } = options;
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
    const [fallbackEventPayload, fallbackNewsPayload, fallbackMarketPayload] = await Promise.all([
        readFile(path.join(ROOT_DIR, 'data/fallback-events.json'), 'utf8').then(JSON.parse),
        readFile(path.join(ROOT_DIR, 'data/fallback-news.json'), 'utf8').then(JSON.parse),
        readFile(path.join(ROOT_DIR, 'data/fallback-market.json'), 'utf8').then(JSON.parse)
    ]);
    const cache = new TtlCache({ maxEntries: 5000 });
    const http = createFetchClient({ timeoutMs: config.httpTimeoutMs, userAgent: config.userAgent, logger: logger.child({ component: 'http-client' }) });
    const sourceOptions = { http, cache, logger: logger.child({ component: 'source' }), refreshMs: config.sourceRefreshMs, staleMs: config.sourceStaleMs, userAgent: config.userAgent };
    const registry = new SourceRegistry({ logger: logger.child({ component: 'source-registry' }) })
        .register(new SnapshotEventSource({ ...sourceOptions, events: fallbackEventPayload.events }))
        .register(new UsgsSource(sourceOptions))
        .register(new EonetSource(sourceOptions))
        .register(new GdacsSource(sourceOptions))
        .register(new NwsAlertsSource({ ...sourceOptions, configured: config.intelligence.nwsEnabled }))
        .register(new UkFloodSource({ ...sourceOptions, configured: config.intelligence.ukFloodEnabled }))
        .register(new ReliefWebDisasterSource({ ...sourceOptions, enabled: config.intelligence.reliefWebDisastersEnabled, appName: config.intelligence.reliefWebAppName, baseUrl: config.intelligence.reliefWebBaseUrl }))
        .register(new AcledSource({ ...sourceOptions, accessToken: config.acled.accessToken }));
    const marketRegistry = new MarketSourceRegistry({ logger: logger.child({ component: 'market-source-registry' }) })
        .register(new CoinbaseExchangeSource({ ...sourceOptions }))
        .register(new BinanceSource({ ...sourceOptions, enabled: config.markets.binanceEnabled, baseUrl: config.markets.binanceBaseUrl }))
        .register(new CoinGeckoSource({ ...sourceOptions, enabled: config.markets.coinGeckoEnabled, apiKey: config.markets.coinGeckoApiKey, baseUrl: config.markets.coinGeckoBaseUrl }))
        .register(new AlphaVantageSource({ ...sourceOptions, apiKey: config.markets.alphaVantageApiKey, baseUrl: config.markets.alphaVantageBaseUrl }))
        .register(new SnapshotMarketSource({ ...sourceOptions, snapshot: fallbackMarketPayload }));
    const newsSourceOptions = {
        http,
        cache,
        logger: logger.child({ component: 'news-source' }),
        refreshMs: config.news.refreshMs,
        staleMs: config.news.staleMs
    };
    const newsRegistry = new NewsSourceRegistry({ logger: logger.child({ component: 'news-source-registry' }) })
        .register(new SnapshotNewsSource({ ...newsSourceOptions, articles: fallbackNewsPayload.articles }))
        .register(new GdeltNewsSource({ ...newsSourceOptions, configured: config.news.gdeltEnabled, baseUrl: config.news.gdeltBaseUrl }))
        .register(new RssNewsSource({ ...newsSourceOptions, feeds: config.news.rssFeeds }));
    // Social feeds are never shown as broken placeholders. X is added only when
    // the operator supplies a bearer token.
    if (config.news.xBearerToken) {
        newsRegistry.register(new XSocialSource({ ...newsSourceOptions, bearerToken: config.news.xBearerToken, baseUrl: config.news.xBaseUrl }));
    }
    const shippingSourceOptions = {
        http, cache, logger: logger.child({ component: 'shipping-source' }),
        refreshMs: config.shipping.refreshMs, staleMs: config.shipping.staleMs
    };
    const shippingRegistry = new ShippingSourceRegistry({ logger: logger.child({ component: 'shipping-source-registry' }) })
        .register(new ImfPortWatchSource({ ...shippingSourceOptions, baseUrl: config.shipping.portWatchBaseUrl, portField: config.shipping.portWatchPortField }))
        .register(new NoaaCoopsSource({ ...shippingSourceOptions, enabled: config.shipping.noaaEnabled, baseUrl: config.shipping.noaaBaseUrl }))
        .register(new NdbcSource({ ...shippingSourceOptions, enabled: config.shipping.ndbcEnabled, baseUrl: config.shipping.ndbcBaseUrl }))
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
    const mapTiles = new MapTileService({ cache, logger: logger.child({ component: 'map-tiles' }), userAgent: config.userAgent, timeoutMs: config.mapTiles.timeoutMs, maxZoom: config.mapTiles.maxZoom });
    const macroMarkets = new FredMarketService({ http, cache, logger: logger.child({ component: 'fred-markets' }), baseUrl: config.macro.fredBaseUrl });
    const ingestion = registry.ingestionPlatform();
    const intelligenceProcessing = new IntelligenceProcessingPlatform();
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
    const mapLayers = new LayerCatalog(CORE_MAP_LAYERS);
    const mapFeatures = new MapFeatureService({ intelligenceCatalog, shippingCatalog, eventService });
    const mapSearch = new MapSearchService({ intelligenceCatalog, shippingCatalog });
    const mapStyles = new MapStyleService();
    const mapDiagnostics = new MapDiagnosticsService({ features: mapFeatures, search: mapSearch, layers: mapLayers, styles: mapStyles });
    const mapPlatform = new MapPlatformService({ features: mapFeatures, search: mapSearch, styles: mapStyles, diagnostics: mapDiagnostics, layers: mapLayers });
    const savedMapViews = new SavedMapViewService({ userData, maximum: 100 });
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
    const logistics = createLogisticsPlatformService({ shippingCatalog, shippingIntelligence, eventService });
    const hazards = createHazardPlatformService({ eventService, intelligenceCatalog, shippingCatalog, logistics });
    const marketIntelligence = createMarketIntelligencePlatformService({ marketCatalog, marketData, marketRegistry, eventService, predictionMarkets, newsIntelligence });
    const countryRisk = createCountryRiskPlatformService({ countryIntelligence, countryCatalog: intelligenceCatalog, eventService, intelligenceRegistry });
    const conflictIntelligence = createConflictIntelligencePlatformService({ eventService, countryCatalog: intelligenceCatalog, shippingCatalog });
    const decisionSupport = createDecisionSupportPlatformService({ eventService, conflict: conflictIntelligence, hazards, markets: marketIntelligence, countries: countryRisk, logistics, opportunities });
    const automation = createAutomationPlatformService({ decisionSupport, fetchImpl: globalThis.fetch });
    const publishing = createPublishingPlatformService({ decisionSupport, automation, fetchImpl: globalThis.fetch });
    const commercial = createCommercialOperationsService({ accounts, subscriptions: subscriptionRepository, usage: usageRepository, billingProviders, publishing, automation, audit });
    const securityCompliance = createSecurityComplianceService({ commercial, audit });
    const reliabilityOperations = createReliabilityOperationsService({ metrics, runtime, health, buildInfo, startupDiagnostics, securityCompliance, automation, publishing });
    const releaseEngineering = createReleaseEngineeringService({ buildInfo, health, reliabilityOperations, securityCompliance, startupDiagnostics });
    const liveData = await createLiveDataPlatformService({
        rootDir: ROOT_DIR,
        config,
        logger: logger.child({ component: 'live-data' }),
        http,
        registry,
        newsRegistry,
        marketRegistry,
        marketData,
        macroMarkets,
        predictionMarkets,
        intelligenceRegistry,
        shippingRegistry,
        shippingCatalog
    });
    const marketReadiness = createMarketReadinessPlatformService({ reliabilityStatus: 'PASS', securityStatus: 'PASS' });
    const overlayDependencies = { eventService, intelligenceCatalog, intelligenceRegistry, shippingCatalog, hazards };
    const overlays = createOverlayPlatformService(overlayDependencies);
    const services = {
        config, registry, ingestion, eventService, locationService, routeService, diagnostics, mapTiles, macroMarkets,
        marketRegistry, marketCatalog, marketData, marketAnalysis, marketScreener, predictionMarkets,
        opportunities, marketReplay, alertEvaluation, newsRegistry, newsIntelligence,
        shippingRegistry, shippingCatalog, shippingIntelligence, tradeFlows, commodityShipping,
        intelligenceRegistry, intelligenceCatalog, countryIntelligence, intelligenceProcessing,
        mapLayers, mapFeatures, mapSearch, mapStyles, mapDiagnostics, mapPlatform, savedMapViews, overlays, logistics, hazards, marketIntelligence, countryRisk, conflictIntelligence, decisionSupport, automation, publishing, commercial, securityCompliance, reliabilityOperations, releaseEngineering, liveData, marketReadiness,
        accountStore, accounts, sessionRepository, subscriptionRepository, userDataRepository,
        audit, auth, entitlements, userData, subscriptions, admin, billingProviders,
        metrics, runtime, requestMetrics, clientReports, clientVersions, dataQuality, health, buildInfo, startupDiagnostics
    };
    registerApiRoutes(router, services);
    registerIngestionRoutes(router, services);
    registerProcessingRoutes(router, services);
    registerMapPlatformRoutes(router, services);
    registerOverlayRoutes(router, services);
    registerLogisticsRoutes(router, services);
    registerHazardRoutes(router, services);
    registerMarketIntelligenceRoutes(router, services);
    registerCountryRiskRoutes(router, services);
    registerConflictIntelligenceRoutes(router, services);
    registerDecisionSupportRoutes(router, services);
    registerAutomationRoutes(router, services);
    registerPublishingRoutes(router, services);
    registerCommercialOperationsRoutes(router, services);
    registerSecurityComplianceRoutes(router, services);
    registerReliabilityOperationsRoutes(router, services);
    registerReleaseEngineeringRoutes(router, services);
    registerLiveDataRoutes(router, services);
    registerMarketReadinessRoutes(router, services);
    const serveStatic = createStaticHandler({ root: path.join(ROOT_DIR, 'public'), production: config.isProduction, compressionThreshold: 1024 });
    const limiter = new SlidingWindowRateLimiter({ limit: config.rateLimitPerMinute, windowMs: 60000 });
    async function handle(request, response) {
        const baseContext = createRequestContext(request, `http://${request.headers.host || 'localhost'}`);
        const deadline = createRequestDeadline({ timeoutMs: config.requestTimeoutMs });
        const context = Object.freeze({ ...baseContext, deadline });
        const requestLogger = logger.child({ requestId: context.id, method: context.method, path: context.path });
        const completeMetrics = requestMetrics.begin(context);
        response.once('finish', () => completeMetrics(response.statusCode));
        setCommonHeaders(response, context.id, { environment: config.environment, isProduction: config.isProduction });
        const clientState = clientVersions.inspect(request.headers['x-client-version']);
        response.setHeader('x-server-version', config.version);
        response.setHeader('x-client-state', clientState.state);
        try {
            if (context.method === 'OPTIONS') {
                response.statusCode = 204;
                response.end();
                return;
            }
            verifyRequestOrigin(request, context, {
                protocol: config.isProduction ? 'https' : 'http',
                allowedOrigins: [config.accounts.publicOrigin, ...config.ops.allowedOrigins],
                exemptPaths: ['/api/billing/webhooks/']
            });
            const rate = limiter.consume(context.ip);
            response.setHeader('x-rate-limit-remaining', rate.remaining);
            response.setHeader('x-rate-limit-reset', new Date(rate.resetAt).toISOString());
            if (context.path.startsWith('/api/'))
                await router.dispatch(request, response, context);
            else if (context.method === 'GET' || context.method === 'HEAD')
                await serveStatic({ request, response, context });
            else
                sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed', requestId: context.id } });
            requestLogger.debug('request.completed', { statusCode: response.statusCode, durationMs: Math.round(performance.now() - context.startedAt) });
        }
        catch (error) {
            const payload = errorPayload(error, context.id);
            if (payload.retryAfterSeconds)
                response.setHeader('retry-after', payload.retryAfterSeconds);
            sendJson(response, payload.statusCode, payload.body);
            const level = payload.statusCode >= 500 ? 'error' : 'warn';
            requestLogger[level]('request.failed', { statusCode: payload.statusCode, durationMs: Math.round(performance.now() - context.startedAt), error });
        }
        finally {
            deadline.clear();
        }
    }
    return Object.freeze({ handle, async close() { runtime.stop(); cache.clear(); await liveData.close(); await accountStore.close(); }, services });
}
