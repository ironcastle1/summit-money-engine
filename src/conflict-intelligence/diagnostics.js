export function conflictDiagnostics(platform) {
  return Object.freeze({
    platform: 'MERLIN_CONFLICT_INTELLIGENCE',
    version: '20.11.0',
    cacheEntries: platform?.snapshotCache?.size || 0,
    eventSource: Boolean(platform?.eventService),
    countryCatalog: Boolean(platform?.countryCatalog),
    shippingCatalog: Boolean(platform?.shippingCatalog),
    sourcePolicy: 'No synthetic live conflict events are emitted when connectors return no evidence.',
    generatedAt: new Date().toISOString()
  });
}
