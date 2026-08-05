import { normalizeQuote } from './quote-normalizer.js';
import { normalizeSeries, closingPrices } from './series-normalizer.js';
import { calculateMomentum } from './momentum-model.js';
import { calculateTrend } from './trend-model.js';
import { calculateVolatility } from './volatility-model.js';
import { calculateDrawdown } from './drawdown-model.js';
import { calculateLiquidity } from './liquidity-model.js';
import { gradeEvidence } from './evidence-grade.js';
import { calculateRiskScore } from './risk-score.js';
import { buildOpportunity } from './opportunity-builder.js';
import { detectCatalysts } from './catalyst-detector.js';
import { calculatePredictionDivergence } from './prediction-divergence.js';
import { commodityTags } from './commodity-taxonomy.js';
export function analyzeAsset(input = {}) {
  const asset = Object.freeze({ ...(input.asset || {}) });
  const series = normalizeSeries(input.series || input.candles || [], { limit: input.limit || 1000 });
  const prices = closingPrices(series);
  const quote = normalizeQuote(input.quote || (series.length ? { price: series.at(-1).close, updatedAt: series.at(-1).time, volume: series.at(-1).volume } : null), asset);
  const momentum = calculateMomentum(prices);
  const trend = calculateTrend(prices);
  const volatility = calculateVolatility(series, input.periodsPerYear || 252);
  const drawdown = calculateDrawdown(prices);
  const liquidity = calculateLiquidity(series, quote);
  const evidence = gradeEvidence({
    sourceCount: input.sourceCount || (input.source ? 1 : 0),
    independentSources: input.independentSources || (input.source ? 1 : 0),
    freshnessScore: quote?.freshness === 'FRESH' ? 90 : quote?.freshness === 'DELAYED' ? 65 : 35,
    provenanceScore: input.source ? 75 : 35,
    corroborationScore: input.corroborationScore || 50,
    contradictions: input.contradictions || 0
  });
  const preliminary = { asset, series, quote, momentum, trend, volatility, drawdown, liquidity, evidence, eventRisk: input.eventRisk || 0 };
  const predictionDivergence = calculatePredictionDivergence(preliminary, input.predictionLinks || []);
  const catalysts = detectCatalysts(preliminary, input.eventLinks || [], input.predictionLinks || []);
  const risk = calculateRiskScore({ ...preliminary, catalysts, predictionDivergence });
  const analysis = Object.freeze({ ...preliminary, catalysts, predictionDivergence, risk, commodity: commodityTags(asset), source: input.source || null });
  const opportunity = buildOpportunity(analysis);
  return Object.freeze({ ...analysis, opportunity });
}
