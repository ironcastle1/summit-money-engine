import { mean, round, clamp } from './numbers.js';
export function evidenceCoverage(signals = []) {
  if (!signals.length) return Object.freeze({ score: 0, band: 'NONE', measured: 0, corroborated: 0, unavailable: 0 });
  const measured = signals.filter(item => item.sourceState === 'MEASURED').length;
  const corroborated = signals.filter(item => item.sourceState === 'CORROBORATED').length;
  const unavailable = signals.filter(item => item.sourceState === 'UNAVAILABLE').length;
  const score = clamp(mean(signals.map(item => item.attention?.confidence?.score ?? item.confidence ?? 0)) - unavailable / signals.length * 20);
  return Object.freeze({ score: round(score, 1), band: score >= 80 ? 'STRONG' : score >= 60 ? 'ADEQUATE' : score >= 40 ? 'THIN' : 'WEAK', measured, corroborated, unavailable });
}
