import { ASSET_CLASSES, EVIDENCE_GRADES, MARKET_API_VERSION, MARKET_REGIMES, OPPORTUNITY_HORIZONS, SIGNAL_DIRECTIONS } from './constants.js';
import { EVENT_MARKET_RULES } from './event-market-rules.js';
export function marketIntelligenceCatalog() {
  return Object.freeze({
    version: MARKET_API_VERSION,
    assetClasses: ASSET_CLASSES,
    regimes: MARKET_REGIMES,
    directions: SIGNAL_DIRECTIONS,
    evidenceGrades: EVIDENCE_GRADES,
    opportunityHorizons: OPPORTUNITY_HORIZONS,
    heatmapMetrics: Object.freeze(['changePercent', 'opportunityScore', 'riskScore']),
    screenFields: Object.freeze(['symbol', 'price', 'changePercent', 'opportunityScore', 'riskScore', 'liquidityScore', 'momentumScore', 'trendScore', 'evidenceGrade']),
    eventRules: Object.freeze(EVENT_MARKET_RULES.map(rule => ({ id: rule.id, tags: rule.tags, direction: rule.direction, strength: rule.strength }))),
    capabilities: Object.freeze(['live-snapshot', 'technical-analysis', 'event-market-linking', 'prediction-market-linking', 'saved-screens', 'watchlists', 'alerts', 'portfolio-exposure', 'scenario-analysis', 'sensitivity-analysis', 'csv-export', 'map-signals']),
    generatedAt: new Date().toISOString()
  });
}
