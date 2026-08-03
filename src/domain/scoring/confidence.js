import { clamp, round } from '../../core/numbers.js';
import { ageMs, DAY_MS, HOUR_MS } from '../../core/time.js';
import { SOURCE_STATES } from '../../sources/source-status.js';

function sourceAvailability(source) {
  if (!source.configured || source.state === SOURCE_STATES.NOT_CONFIGURED) return 0;
  if (source.state === SOURCE_STATES.ONLINE && !source.stale) return 1;
  if (source.state === SOURCE_STATES.DEGRADED || source.stale) return 0.55;
  if (source.state === SOURCE_STATES.STARTING) return 0.25;
  return 0;
}

export function sourceCoverage(sources) {
  const entries = Object.values(sources || {});
  const configured = entries.filter(source => source.configured);
  if (!configured.length) return { ratio: 0, configured: 0, online: 0, weightedOnline: 0, weightedTotal: 0 };
  const weightedTotal = configured.reduce((sum, source) => sum + Number(source.weight || 1), 0);
  const weightedOnline = configured.reduce((sum, source) => sum + Number(source.weight || 1) * sourceAvailability(source), 0);
  return {
    ratio: weightedTotal ? weightedOnline / weightedTotal : 0,
    configured: configured.length,
    online: configured.filter(source => source.state === SOURCE_STATES.ONLINE).length,
    weightedOnline,
    weightedTotal
  };
}

export function dataConfidence(options) {
  const sampleSize = Math.max(0, options.sampleSize || 0);
  const observationDays = Math.max(0, options.observationDays || 0);
  const sourceRatio = clamp(options.sourceRatio || 0, 0, 1);
  const sourceDiversity = clamp((options.sourceCount || 0) / Math.max(1, options.configuredSources || 1), 0, 1);
  const newestAge = options.newestEventTime ? ageMs(options.newestEventTime, options.now) : null;
  const freshness = newestAge === null ? 0 : Math.exp(-newestAge / (36 * HOUR_MS));
  const sample = 1 - Math.exp(-sampleSize / 18);
  const history = clamp(observationDays / 30, 0, 1);
  const raw = 0.32 * sample + 0.23 * history + 0.25 * sourceRatio + 0.12 * sourceDiversity + 0.08 * freshness;
  const penalty = observationDays < 7 ? 0.45 : sampleSize < 3 ? 0.62 : 1;
  return round(clamp(raw * penalty * 100, 0, 100));
}

export function freshnessStatus(newestEventTime, now = Date.now()) {
  const age = newestEventTime ? ageMs(newestEventTime, now) : null;
  if (age === null) return { ageMinutes: null, band: 'NONE' };
  if (age <= HOUR_MS) return { ageMinutes: Math.round(age / 60_000), band: 'LIVE' };
  if (age <= 6 * HOUR_MS) return { ageMinutes: Math.round(age / 60_000), band: 'RECENT' };
  if (age <= DAY_MS) return { ageMinutes: Math.round(age / 60_000), band: 'AGED' };
  return { ageMinutes: Math.round(age / 60_000), band: 'STALE' };
}
