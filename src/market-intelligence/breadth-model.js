import { clamp, mean, round } from './numbers.js';
export function calculateBreadth(assets = []) {
  const usable = assets.filter(asset => asset?.trend && asset?.momentum);
  if (!usable.length) return Object.freeze({ score: 50, state: 'UNKNOWN', advancingPercent: 0, aboveTrendPercent: 0, participation: 0 });
  const advancing = usable.filter(asset => Number(asset.quote?.changePercent || asset.momentum?.returns?.one || 0) > 0).length;
  const aboveTrend = usable.filter(asset => Number(asset.trend.score) > 50).length;
  const strong = usable.filter(asset => Number(asset.momentum.score) >= 60).length;
  const weak = usable.filter(asset => Number(asset.momentum.score) <= 40).length;
  const advancingPercent = advancing / usable.length * 100; const aboveTrendPercent = aboveTrend / usable.length * 100;
  const score = clamp(mean([advancingPercent, aboveTrendPercent, 50 + (strong - weak) / usable.length * 50]), 0, 100);
  return Object.freeze({ score: round(score, 2), state: score >= 65 ? 'BROAD_ADVANCE' : score <= 35 ? 'BROAD_DECLINE' : 'MIXED', advancingPercent: round(advancingPercent, 2), aboveTrendPercent: round(aboveTrendPercent, 2), participation: usable.length, strong, weak });
}
