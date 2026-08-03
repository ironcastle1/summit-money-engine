import { clamp, round } from '../../core/numbers.js';
import { DAY_MS, toTimestamp } from '../../core/time.js';

function weightedCount(events, start, end) {
  return events.reduce((sum, event) => {
    const timestamp = toTimestamp(event.time);
    if (timestamp < start || timestamp >= end) return sum;
    return sum + Math.max(0.25, Math.min(5, Number(event.severity || 1)));
  }, 0);
}

export function activityTrend(events, now = Date.now()) {
  const recentStart = now - 3 * DAY_MS;
  const previousStart = now - 10 * DAY_MS;
  const recent = weightedCount(events, recentStart, now) / 3;
  const previous = weightedCount(events, previousStart, recentStart) / 7;
  const sample = events.filter(event => toTimestamp(event.time) >= previousStart).length;
  if (sample < 4 || previous <= 0.05) {
    return {
      changePct: null,
      direction: 'N/A',
      recentDailyRate: round(recent, 2),
      previousDailyRate: round(previous, 2),
      sampleSize: sample
    };
  }
  const change = clamp((recent - previous) / previous * 100, -500, 500);
  return {
    changePct: round(change),
    direction: change >= 20 ? 'UP' : change <= -20 ? 'DOWN' : 'FLAT',
    recentDailyRate: round(recent, 2),
    previousDailyRate: round(previous, 2),
    sampleSize: sample
  };
}
