import { clamp, round } from '../../core/numbers.js';
import { combineEvidence } from './evidence-grade.js';
import { applyExposurePenalty, exposureProfile } from './exposure.js';
import { filterOpportunities } from './filter.js';
import { normalizeOpportunity } from './opportunity-schema.js';

function similarity(left, right) {
  let score = 0;
  if (left.assetId && right.assetId && left.assetId === right.assetId) score += 0.55;
  const leftTags = new Set(left.tags || []);
  const rightTags = new Set(right.tags || []);
  const leftAssetTag = left.assetId ? String(left.assetId).toUpperCase() : null;
  const rightAssetTag = right.assetId ? String(right.assetId).toUpperCase() : null;
  if (leftAssetTag && rightTags.has(leftAssetTag)) score += 0.45;
  if (rightAssetTag && leftTags.has(rightAssetTag)) score += 0.45;
  if (left.category && right.category && left.category === right.category) score += 0.25;
  const overlap = [...leftTags].filter(tag => rightTags.has(tag)).length;
  const union = new Set([...leftTags, ...rightTags]).size;
  if (union) score += 0.35 * overlap / union;
  if (left.direction === right.direction) score += 0.1;
  return clamp(score, 0, 1);
}

function buildComposite(seed, partners) {
  const items = [seed, ...partners];
  const evidence = combineEvidence(items.map(item => ({ available: Number.isFinite(item.evidenceScore), score: item.evidenceScore })));
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0.2, (item.confidence || 40) / 100), 0);
  const weightedScore = items.reduce((sum, item) => sum + (item.score || 0) * Math.max(0.2, (item.confidence || 40) / 100), 0) / totalWeight;
  const agreement = items.filter(item => item.direction === seed.direction || item.direction === 'WATCH').length / items.length;
  const score = clamp(weightedScore + (agreement - 0.5) * 14 + Math.min(10, partners.length * 3), 0, 100);
  const riskValues = items.map(item => item.risk).filter(Number.isFinite);
  const risk = riskValues.length ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length : null;
  const strongest = [...items].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  return normalizeOpportunity({
    kind: 'COMPOSITE',
    id: `composite-${items.map(item => item.id).sort().join('-')}`,
    title: strongest.title,
    subtitle: `${items.length} SIGNALS / ${items.map(item => item.kind).join('+')}`,
    direction: seed.direction,
    score: round(score, 1),
    confidence: evidence.score,
    risk,
    probability: seed.probability,
    expectedMove: seed.expectedMove,
    liquidity: seed.liquidity,
    severity: Math.max(...items.map(item => item.severity || 0)),
    evidenceGrade: evidence.grade,
    evidenceScore: evidence.score,
    sampleSize: items.reduce((sum, item) => sum + (item.sampleSize || 0), 0),
    sourceCount: new Set(items.flatMap(item => item.sources || [])).size,
    horizon: seed.horizon,
    assetId: seed.assetId,
    symbol: seed.symbol,
    category: seed.category,
    latitude: seed.latitude,
    longitude: seed.longitude,
    observedAt: new Date(items.map(item => Date.parse(item.observedAt || '')).filter(Number.isFinite).sort((a, b) => b - a)[0] || Date.now()).toISOString(),
    generatedAt: new Date().toISOString(),
    sources: [...new Set(items.flatMap(item => item.sources || []))],
    tags: [...new Set(items.flatMap(item => item.tags || []))],
    components: items.map(item => ({ id: item.id, kind: item.kind, score: item.score, direction: item.direction })),
    metadata: { agreement: round(agreement, 3), componentCount: items.length }
  });
}

export function fuseOpportunities(input = {}) {
  const base = [...(input.market || []), ...(input.events || []), ...(input.predictions || [])].filter(Boolean);
  const composites = [];
  const consumedPairs = new Set();
  for (const seed of base) {
    const partners = base
      .filter(candidate => candidate.id !== seed.id && candidate.kind !== seed.kind)
      .map(candidate => ({ candidate, similarity: similarity(seed, candidate) }))
      .filter(item => item.similarity >= 0.42)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.candidate);
    if (!partners.length) continue;
    const signature = [seed.id, ...partners.map(item => item.id)].sort().join('|');
    if (consumedPairs.has(signature)) continue;
    consumedPairs.add(signature);
    composites.push(buildComposite(seed, partners));
  }
  const merged = [...base, ...composites].sort((a, b) => (b.score || -1) - (a.score || -1));
  const exposureAdjusted = applyExposurePenalty(merged).sort((a, b) => (b.score || -1) - (a.score || -1));
  const filtered = filterOpportunities(exposureAdjusted, input.filters || {});
  return {
    opportunities: filtered,
    totals: {
      market: base.filter(item => item.kind === 'MARKET').length,
      events: base.filter(item => item.kind === 'EVENT').length,
      predictions: base.filter(item => item.kind === 'PREDICTION').length,
      composites: composites.length,
      returned: filtered.length
    },
    exposure: exposureProfile(filtered),
    generatedAt: new Date().toISOString()
  };
}
