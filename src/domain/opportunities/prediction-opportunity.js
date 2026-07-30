import { clamp, round } from '../../core/numbers.js';
import { evidenceScore } from './evidence-grade.js';
import { normalizeOpportunity } from './opportunity-schema.js';

function marketProbability(market) {
  if (Number.isFinite(market.yesProbability)) return market.yesProbability;
  if (Number.isFinite(market.probability)) return market.probability;
  if (Number.isFinite(market.yesPrice)) return market.yesPrice;
  return null;
}

export function fromPredictionMarket(market, options = {}) {
  const probability = marketProbability(market);
  if (!Number.isFinite(probability)) return null;
  const volume = Number(market.volume24h || market.volume || 0);
  const liquidity = Number(market.liquidity || 0);
  const change24h = Number(market.change24h || 0);
  const ageMinutes = Math.max(0, (Date.now() - Date.parse(market.updatedAt || market.createdAt || new Date())) / 60_000);
  const evidence = evidenceScore({
    sourceCount: 1,
    sampleSize: clamp(Math.round(Math.log10(Math.max(1, volume)) * 15), 1, 100),
    sampleTarget: 80,
    ageMinutes,
    maximumUsefulMinutes: 360,
    coverage: liquidity > 100000 ? 0.95 : liquidity > 10000 ? 0.75 : 0.5,
    intervalWidth: clamp(0.5 - Math.log10(Math.max(1, liquidity)) * 0.06, 0.08, 0.45)
  });
  const directionalEdge = Math.abs(probability - 0.5) * 200;
  const momentum = clamp(Math.abs(change24h) * 500, 0, 100);
  const liquidityScore = clamp(Math.log10(Math.max(1, liquidity)) * 16, 0, 100);
  const score = clamp(0.4 * directionalEdge + 0.22 * momentum + 0.2 * liquidityScore + 0.18 * (evidence.score || 0), 0, 100);
  const direction = probability >= 0.5 ? 'YES' : 'NO';
  return normalizeOpportunity({
    kind: 'PREDICTION',
    id: `prediction-${market.id || market.slug}`,
    title: market.question || market.title || 'PREDICTION MARKET',
    subtitle: market.category || market.group || 'POLYMARKET',
    direction,
    score: round(score, 1),
    confidence: evidence.score,
    risk: round(100 - liquidityScore, 1),
    probability: direction === 'YES' ? probability : 1 - probability,
    expectedMove: change24h,
    liquidity: liquidityScore,
    evidenceGrade: evidence.grade,
    evidenceScore: evidence.score,
    sampleSize: evidence.components.find(item => item.name === 'sample')?.score || null,
    sourceCount: 1,
    horizon: options.horizon || '7D',
    marketId: market.id || market.slug,
    observedAt: market.updatedAt,
    generatedAt: options.generatedAt || new Date().toISOString(),
    sources: ['POLYMARKET'],
    tags: [market.category, direction].filter(Boolean),
    metadata: { volume, liquidity, change24h, url: market.url || null, rawProbability: probability }
  });
}
