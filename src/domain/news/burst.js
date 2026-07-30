import { clamp, round } from '../../core/numbers.js';
import { HOUR_MS, toTimestamp } from '../../core/time.js';

function countWindow(articles, now, startHours, endHours) {
  return articles.filter(article => {
    const age = (now - toTimestamp(article.publishedAt)) / HOUR_MS;
    return age >= startHours && age < endHours;
  }).length;
}

function poissonZ(observed, expected) {
  if (expected <= 0) return observed > 0 ? null : 0;
  return (observed - expected) / Math.sqrt(expected);
}

export function burstMetrics(articles, options = {}) {
  const now = options.now || Date.now();
  const recentHours = options.recentHours || 3;
  const baselineHours = options.baselineHours || 21;
  const recentCount = countWindow(articles, now, 0, recentHours);
  const baselineCount = countWindow(articles, now, recentHours, recentHours + baselineHours);
  const recentRate = recentCount / recentHours;
  const baselineRate = baselineCount / baselineHours;
  const expected = baselineRate * recentHours;
  const rateRatio = baselineRate > 0 ? recentRate / baselineRate : recentCount > 0 ? null : 1;
  const zScore = poissonZ(recentCount, expected);
  const score = rateRatio === null ? clamp(55 + recentCount * 8, 0, 100) : clamp((rateRatio - 1) * 22 + Math.max(0, zScore || 0) * 10 + 35, 0, 100);
  const state = recentCount < 2 ? 'LOW_SAMPLE' : score >= 80 ? 'EXTREME' : score >= 65 ? 'HIGH' : score >= 50 ? 'ELEVATED' : 'NORMAL';
  return Object.freeze({
    recentHours,
    baselineHours,
    recentCount,
    baselineCount,
    recentRate: round(recentRate, 2),
    baselineRate: round(baselineRate, 2),
    rateRatio: Number.isFinite(rateRatio) ? round(rateRatio, 2) : null,
    zScore: Number.isFinite(zScore) ? round(zScore, 2) : null,
    score: round(score),
    state
  });
}
