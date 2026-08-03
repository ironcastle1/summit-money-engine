import { clamp, mean, percentile, round } from '../../core/numbers.js';

const CATEGORY_MULTIPLIERS = Object.freeze({
  terror: 1.2,
  conflict: 1.15,
  earthquake: 1.1,
  volcano: 1.1,
  storm: 1.05,
  flood: 1,
  wildfire: 1,
  infrastructure: 1,
  transport: 0.95,
  protest: 0.85,
  drought: 0.85,
  ice: 0.75,
  other: 0.8
});

function eventImpact(event) {
  const severity = clamp(Number(event.severity || 0), 0, 5);
  const categoryMultiplier = CATEGORY_MULTIPLIERS[event.category] || 0.8;
  const magnitudeBoost = Number.isFinite(event.magnitude) ? Math.max(0, event.magnitude - 4) * 0.2 : 0;
  const fatalities = Number(event.attributes?.fatalities || 0);
  const fatalityBoost = fatalities > 0 ? Math.min(1.2, Math.log10(fatalities + 1) * 0.45) : 0;
  return clamp((severity + magnitudeBoost + fatalityBoost) * categoryMultiplier, 0, 5);
}

export function severityMetrics(events) {
  if (!events.length) return {
    index: null,
    mean: null,
    p90: null,
    max: null
  };
  const impacts = events.map(eventImpact);
  const average = mean(impacts);
  const p90 = percentile(impacts, 0.9);
  const maximum = Math.max(...impacts);
  const blended = average * 0.45 + p90 * 0.35 + maximum * 0.2;
  return {
    index: round(clamp(blended / 5 * 100, 0, 100)),
    mean: round(average, 2),
    p90: round(p90, 2),
    max: round(maximum, 2)
  };
}
