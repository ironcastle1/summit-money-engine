import { clamp, round } from '../../core/numbers.js';

function keyFor(opportunity) {
  if (opportunity.assetId) return `ASSET:${opportunity.assetId}`;
  if (opportunity.category) return `CATEGORY:${opportunity.category}`;
  if (opportunity.kind) return `KIND:${opportunity.kind}`;
  return 'OTHER';
}

export function exposureProfile(opportunities = []) {
  const buckets = new Map();
  let totalScore = 0;
  let weightedRisk = 0;
  for (const item of opportunities) {
    const score = Number(item.score) || 0;
    const risk = Number(item.risk) || 50;
    const key = keyFor(item);
    const bucket = buckets.get(key) || { key, count: 0, score: 0, risk: 0, directions: new Set() };
    bucket.count += 1;
    bucket.score += score;
    bucket.risk += risk;
    bucket.directions.add(item.direction);
    buckets.set(key, bucket);
    totalScore += score;
    weightedRisk += score * risk;
  }
  const rows = [...buckets.values()].map(bucket => ({
    key: bucket.key,
    count: bucket.count,
    scoreShare: totalScore > 0 ? round(bucket.score / totalScore, 4) : 0,
    averageRisk: round(bucket.risk / bucket.count, 1),
    directions: [...bucket.directions]
  })).sort((a, b) => b.scoreShare - a.scoreShare);
  const concentration = rows.reduce((sum, row) => sum + row.scoreShare ** 2, 0);
  return {
    count: opportunities.length,
    weightedRisk: totalScore > 0 ? round(weightedRisk / totalScore, 1) : null,
    concentration: round(concentration, 4),
    concentrationScore: round(clamp(concentration * 180, 0, 100), 1),
    largestExposure: rows[0] || null,
    buckets: rows
  };
}

export function applyExposurePenalty(opportunities = []) {
  const seen = new Map();
  return opportunities.map(item => {
    const key = keyFor(item);
    const count = seen.get(key) || 0;
    seen.set(key, count + 1);
    const penalty = Math.min(28, count * 7);
    return { ...item, rawScore: item.score, score: Number.isFinite(item.score) ? round(clamp(item.score - penalty, 0, 100), 1) : null, exposurePenalty: penalty };
  });
}
