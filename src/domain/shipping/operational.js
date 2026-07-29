import { clamp, round, mean, standardDeviation } from '../../core/numbers.js';

export function robustZScore(value, history) {
  const values = (history || []).filter(Number.isFinite);
  if (!Number.isFinite(value) || values.length < 7) return null;
  const average = mean(values);
  const deviation = standardDeviation(values);
  if (!Number.isFinite(deviation) || deviation === 0) return 0;
  return (value - average) / deviation;
}

export function portActivityScore(activity) {
  if (!activity) return { score: null, sampleSize: 0, metrics: {} };
  const metrics = {};
  const components = [];
  if (Number.isFinite(activity.callsChangePct)) {
    metrics.callsChangePct = round(activity.callsChangePct, 1);
    components.push(clamp(-activity.callsChangePct * 1.3, 0, 100));
  }
  if (Number.isFinite(activity.tradeVolumeChangePct)) {
    metrics.tradeVolumeChangePct = round(activity.tradeVolumeChangePct, 1);
    components.push(clamp(-activity.tradeVolumeChangePct * 1.1, 0, 100));
  }
  if (Number.isFinite(activity.waitingTimeChangePct)) {
    metrics.waitingTimeChangePct = round(activity.waitingTimeChangePct, 1);
    components.push(clamp(activity.waitingTimeChangePct * 1.25, 0, 100));
  }
  if (Number.isFinite(activity.waterLevelAnomalyMetres)) {
    metrics.waterLevelAnomalyMetres = round(activity.waterLevelAnomalyMetres, 2);
    components.push(clamp(Math.abs(activity.waterLevelAnomalyMetres) * 65, 0, 100));
  }
  if (!components.length) return { score: null, sampleSize: 0, metrics };
  return { score: round(mean(components), 1), sampleSize: Number(activity.sampleSize || components.length), metrics };
}

export function calculateCongestion(activity) {
  if (!activity) return { index: null, confidence: null };
  const values = [];
  if (Number.isFinite(activity.waitingVessels)) values.push(clamp(activity.waitingVessels / 50 * 100, 0, 100));
  if (Number.isFinite(activity.medianWaitHours)) values.push(clamp(activity.medianWaitHours / 72 * 100, 0, 100));
  if (Number.isFinite(activity.waitingTimeChangePct)) values.push(clamp(50 + activity.waitingTimeChangePct, 0, 100));
  if (!values.length) return { index: null, confidence: null };
  return { index: round(mean(values), 1), confidence: round(clamp(35 + values.length * 17 + Math.log2(Number(activity.sampleSize || 1) + 1) * 8, 0, 95), 1) };
}
