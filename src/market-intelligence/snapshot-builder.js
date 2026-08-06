import { analyzeAsset } from './asset-analyzer.js';
import { calculateBreadth } from './breadth-model.js';
import { classifyMarketRegime } from './market-regime.js';
import { buildCorrelationMatrix } from './correlation-matrix.js';
import { buildMarketHeatmap } from './heatmap-builder.js';
import { rankOpportunities } from './opportunity-ranker.js';
import { marketMapFeatures } from './market-map-features.js';
import { aggregateSourceStatus } from './source-status.js';
export function buildMarketSnapshot(input = {}) {
  const analyses = (input.assets || []).map(value => value.opportunity && value.risk ? value : analyzeAsset(value));
  const breadth = calculateBreadth(analyses);
  const averageVolatility = analyses.length ? analyses.reduce((sum, item) => sum + Number(item.volatility?.score || 50), 0) / analyses.length : 50;
  const averageLiquidity = analyses.length ? analyses.reduce((sum, item) => sum + Number(item.liquidity?.score || 50), 0) / analyses.length : 50;
  const regime = classifyMarketRegime({ breadth, volatility: averageVolatility, liquidity: averageLiquidity, inflationPressure: input.inflationPressure, growthPressure: input.growthPressure });
  const opportunities = rankOpportunities(analyses.map(item => item.opportunity), { limit: input.opportunityLimit || 50 });
  const correlations = buildCorrelationMatrix(analyses.map(item => ({ id: item.asset.id, prices: item.series.map(point => point.close) })).slice(0, 20));
  return Object.freeze({
    assets: Object.freeze(analyses),
    breadth,
    regime,
    opportunities,
    correlations,
    heatmap: buildMarketHeatmap(analyses, { metric: input.heatmapMetric || 'changePercent' }),
    mapFeatures: marketMapFeatures(analyses),
    eventLinks: Object.freeze(input.eventLinks || []),
    predictionLinks: Object.freeze(input.predictionLinks || []),
    sourceStatus: aggregateSourceStatus(input.sourceGroups || {}),
    generatedAt: new Date().toISOString(),
    disclosure: 'Analytical market intelligence only; not investment advice.'
  });
}
