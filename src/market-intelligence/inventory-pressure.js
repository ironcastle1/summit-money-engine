import { clamp, mean, percentile, round } from './numbers.js';
export function inventoryPressure(history = []) {
  const values = history.map(item => Number(item.value ?? item.inventory ?? item)).filter(Number.isFinite);
  if (!values.length) return Object.freeze({ score: 50, state: 'UNKNOWN', percentile: 0.5, change: 0 });
  const current = values.at(-1);
  const prior = values.length > 1 ? values.at(-2) : current;
  const change = prior ? current / prior - 1 : 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = sorted.findLastIndex(value => value <= current) / Math.max(1, sorted.length - 1);
  const recentAverage = mean(values.slice(-5));
  const longAverage = mean(values.slice(-52));
  const deviation = longAverage ? current / longAverage - 1 : 0;
  const score = clamp(50 - deviation * 120 - change * 100, 0, 100);
  return Object.freeze({
    score: round(score, 2), state: score >= 70 ? 'DRAWING_FAST' : score >= 58 ? 'DRAWING' : score <= 30 ? 'BUILDING_FAST' : score <= 42 ? 'BUILDING' : 'STABLE',
    current: round(current, 4), change: round(change * 100, 3), deviationFromAverage: round(deviation * 100, 3),
    percentile: round(rank, 3), quartileThresholds: Object.freeze({ low: percentile(values, 0.25), median: percentile(values, 0.5), high: percentile(values, 0.75) }),
    recentAverage: round(recentAverage, 4), longAverage: round(longAverage, 4)
  });
}
