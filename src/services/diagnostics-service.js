export class DiagnosticsService {
  constructor(options) {
    this.registry = options.registry;
    this.marketRegistry = options.marketRegistry;
    this.newsRegistry = options.newsRegistry;
    this.shippingRegistry = options.shippingRegistry;
    this.shippingCatalog = options.shippingCatalog;
    this.intelligenceRegistry = options.intelligenceRegistry;
    this.intelligenceCatalog = options.intelligenceCatalog;
    this.cache = options.cache;
    this.startedAt = Date.now();
    this.routes = options.routes;
    this.config = options.config;
    this.alertEvaluation = options.alertEvaluation;
  }

  snapshot() {
    const memory = process.memoryUsage();
    return {
      version: this.config.version,
      environment: this.config.environment,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      processUptimeSeconds: Math.round(process.uptime()),
      node: process.version,
      memoryMb: {
        rss: Math.round(memory.rss / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      cache: this.cache.stats(),
      eventSources: this.registry.health(),
      marketSources: this.marketRegistry?.health() || {},
      newsSources: this.newsRegistry?.health() || {},
      shippingSources: this.shippingRegistry?.health() || {},
      shippingCatalog: this.shippingCatalog?.summary?.() || {},
      intelligenceSources: this.intelligenceRegistry?.health?.() || {},
      intelligenceCatalog: this.intelligenceCatalog?.summary?.() || {},
      alerts: this.alertEvaluation?.diagnostics?.() || { cooldowns: 0 },
      capabilities: ['MAP', 'RADIUS', 'NEWS', 'SOCIAL', 'VERIFICATION', 'CORRELATION', 'SHIPPING', 'PORTS', 'TRADE_FLOWS', 'COMMODITIES', 'COUNTRIES', 'CITIES', 'CRIME', 'ELECTIONS', 'SAFETY', 'CONFLICT', 'DISASTERS', 'MARKETS', 'MARKET_INTELLIGENCE', 'MARKET_REGIMES', 'MARKET_SCREENERS', 'MARKET_SCENARIOS', 'CONFLICT_THEATRES', 'ESCALATION_ANALYSIS', 'FRONTLINES', 'CEASEFIRE_MONITORING', 'CONFLICT_THEATRES', 'ESCALATION_ANALYSIS', 'FRONTLINES', 'CEASEFIRE_MONITORING', 'PREDICTIONS', 'OPPORTUNITIES', 'ALERTS', 'REPLAY', 'WORKSPACES', 'EXPORT'],
      routes: this.routes.list(),
      generatedAt: new Date().toISOString()
    };
  }
}
