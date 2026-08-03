import { text } from '../ui/dom.js';
import { percent, number, coordinate, durationHours, upper } from '../ui/format.js';

function signedPercent(value) {
  return Number.isFinite(value) ? percent(value, { sign: true }) : 'N/A';
}

function dataAge(scan, metrics) {
  if (Number.isFinite(Number(scan.snapshotAgeMs))) return `${Math.max(0, Math.round(Number(scan.snapshotAgeMs) / 60_000))}M DATA`;
  if (Number.isFinite(Number(metrics.dataAgeMinutes))) return `${number(metrics.dataAgeMinutes)}M EVENT`;
  return 'N/A';
}

export function renderScan(scan) {
  const metrics = scan.metrics || {};
  const location = scan.location || {};
  text('#location-name', upper([location.name, location.country].filter(Boolean).join(', '), 'COORDINATES'));
  text('#coordinates', `${coordinate(scan.point.lat)}, ${coordinate(scan.point.lon)}`);
  text('#analysis-radius', `${number(scan.point.radiusKm)} KM`);
  text('#scan-age', dataAge(scan, metrics));
  text('#metric-probability', percent(metrics.eventProbability24h));
  text('#metric-probability-range', metrics.probabilityRange90?.every(Number.isFinite)
    ? `90% ${number(metrics.probabilityRange90[0])}–${number(metrics.probabilityRange90[1])}%`
    : '90% N/A');
  text('#metric-activity', signedPercent(metrics.activityChangePct));
  text('#metric-activity-direction', metrics.activityDirection || 'N/A');
  text('#metric-proximity', number(metrics.proximityRiskIndex));
  text('#metric-severity', number(metrics.severityIndex));
  text('#metric-count-24', number(metrics.eventCount24h));
  text('#metric-rate', `${number(metrics.dailyEventRate, 2)}/D`);
  text('#metric-count-7', number(metrics.eventCount7d));
  text('#metric-count-30', `${number(metrics.eventCount30d)} / 30D`);
  text('#metric-next-event', durationHours(metrics.expectedNextEventHours));
  text('#metric-density', number(metrics.densityPer10kKm2, 3));
  text('#metric-coverage', percent(metrics.sourceCoveragePct));
  text('#metric-source-count', `${number(metrics.sourceCount)} ONLINE / ${number(metrics.localSourceCount)} LOCAL`);
  text('#metric-confidence', percent(metrics.confidencePct));
  text('#metric-sample', `N=${number(metrics.sampleSize)} / D=${number(metrics.observationDays)}`);
  text('#local-event-count', number(scan.events?.length || 0));
}
