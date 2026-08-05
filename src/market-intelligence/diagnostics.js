export function marketIntelligenceDiagnostics(platform) {
  const dependencies = {
    catalog: Boolean(platform.marketCatalog),
    data: Boolean(platform.marketData),
    events: Boolean(platform.eventService),
    predictions: Boolean(platform.predictionMarkets),
    marketRegistry: Boolean(platform.marketRegistry)
  };
  return Object.freeze({
    name: 'market-intelligence-platform',
    state: dependencies.catalog && dependencies.data ? 'READY' : 'DEGRADED',
    dependencies: Object.freeze(dependencies),
    savedScreenOwners: platform.screens?.records?.size || 0,
    watchlistOwners: platform.watchlist?.records?.size || 0,
    policies: Object.freeze({ noFabricatedLiveData: true, sourceStatusRequired: true, analyticalDisclosureRequired: true }),
    generatedAt: new Date().toISOString()
  });
}
