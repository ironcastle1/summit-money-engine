import { circleAreaKm2, haversineKm } from '../geo/distance.js';
import { betaPosterior } from './beta.js';
import { severityMetrics } from './severity.js';
import { activityTrend } from './trend.js';
import { dataConfidence, freshnessStatus, sourceCoverage } from './confidence.js';
import { DAY_MS, toTimestamp, utcDayKey } from '../../core/time.js';
import { clamp, round } from '../../core/numbers.js';

function withinLookback(events, now, lookbackDays) {
  const cutoff = now - lookbackDays * DAY_MS;
  return events.filter(event => {
    const timestamp = toTimestamp(event.time);
    return timestamp !== null && timestamp >= cutoff && timestamp <= now + 5 * 60_000;
  });
}

function activeDays(events) {
  return new Set(events.map(event => utcDayKey(event.time))).size;
}

function sourceCount(events) {
  return new Set(events.flatMap(event => event.attributes?.sources || [event.source]).filter(Boolean)).size;
}

function distanceWeightedRisk(events, radiusKm, now) {
  if (!events.length) return null;
  let total = 0;
  let maximum = 0;
  for (const event of events) {
    const ageHours = Math.max(0, (now - toTimestamp(event.time)) / 3_600_000);
    const ageWeight = Math.exp(-ageHours / 72);
    const distanceWeight = Math.exp(-event.distanceKm / Math.max(25, radiusKm * 0.55));
    const severityWeight = clamp(event.severity / 5, 0, 1);
    const score = ageWeight * distanceWeight * severityWeight;
    total += score;
    maximum = Math.max(maximum, score);
  }
  return round(clamp((1 - Math.exp(-(total * 0.7 + maximum * 0.5))) * 100, 0, 100));
}

export function analyzeRadius(options) {
  const now = options.now || Date.now();
  const radiusKm = options.radiusKm;
  const lookbackDays = options.lookbackDays || 30;
  const localEvents = options.events
    .map(event => ({ ...event, distanceKm: haversineKm(options.lat, options.lon, event.lat, event.lon) }))
    .filter(event => Number.isFinite(event.distanceKm) && event.distanceKm <= radiusKm)
    .sort((left, right) => toTimestamp(right.time) - toTimestamp(left.time));
  const history = withinLookback(localEvents, now, lookbackDays);
  const day1 = withinLookback(history, now, 1);
  const day7 = withinLookback(history, now, 7);
  const observedDays = lookbackDays;
  const eventDays = activeDays(history);
  const posterior = history.length >= 3 ? betaPosterior(eventDays, observedDays, 1, 1) : null;
  const trend = activityTrend(history, now);
  const severity = severityMetrics(day7.length ? day7 : history);
  const coverage = sourceCoverage(options.sources);
  const newestEvent = history[0]?.time || null;
  const freshness = freshnessStatus(newestEvent, now);
  const sourcesInRadius = sourceCount(history);
  const confidence = dataConfidence({
    sampleSize: history.length,
    observationDays: observedDays,
    sourceRatio: coverage.ratio,
    sourceCount: sourcesInRadius,
    configuredSources: coverage.configured,
    newestEventTime: newestEvent,
    now
  });
  const areaKm2 = circleAreaKm2(radiusKm);
  const dailyRate = history.length / observedDays;
  const probability = posterior ? posterior.mean * 100 : null;
  const interval = posterior ? posterior.interval90.map(value => round(value * 100)) : [null, null];
  const expectedWaitHours = dailyRate > 0 ? 24 / dailyRate : null;

  return Object.freeze({
    metrics: Object.freeze({
      eventProbability24h: round(probability),
      probabilityRange90: interval,
      expectedNextEventHours: Number.isFinite(expectedWaitHours) ? round(Math.min(expectedWaitHours, 99_999)) : null,
      activityChangePct: trend.changePct,
      activityDirection: trend.direction,
      proximityRiskIndex: distanceWeightedRisk(day7, radiusKm, now),
      severityIndex: severity.index,
      meanSeverity: severity.mean,
      eventCount24h: day1.length,
      eventCount7d: day7.length,
      eventCount30d: history.length,
      activeDays30d: eventDays,
      dailyEventRate: round(dailyRate, 2),
      densityPer10kKm2: areaKm2 ? round(history.length / areaKm2 * 10_000, 3) : null,
      sourceCoveragePct: round(coverage.ratio * 100),
      sourceCount: sourcesInRadius,
      confidencePct: confidence,
      dataAgeMinutes: freshness.ageMinutes,
      freshnessBand: freshness.band,
      sampleSize: history.length,
      observationDays: observedDays
    }),
    events: Object.freeze(history),
    trend: Object.freeze(trend),
    severity: Object.freeze(severity),
    coverage: Object.freeze(coverage)
  });
}
