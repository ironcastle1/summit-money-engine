import { ACCEPTANCE_DOMAINS, BROWSER_MATRIX, CUSTOMER_JOURNEYS, DEVICE_MATRIX, THEMES } from './catalog.js';

export function buildMarketReadinessDiagnostics(options = {}) {
  const journeySnapshot = options.journeys?.snapshot?.() || { results: [], coverage: 0, passRate: 0 };
  return Object.freeze({
    version: options.version || '20.20.0',
    status: options.gate?.status || 'NOT_EVALUATED',
    inventory: Object.freeze({
      devices: DEVICE_MATRIX.length,
      browsers: BROWSER_MATRIX.length,
      journeys: CUSTOMER_JOURNEYS.length,
      themes: THEMES.length,
      acceptanceDomains: ACCEPTANCE_DOMAINS.length
    }),
    journeys: journeySnapshot,
    gate: options.gate || null,
    generatedAt: new Date().toISOString()
  });
}
