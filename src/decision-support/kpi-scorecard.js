import { mean, round } from './numbers.js';
export function kpiScorecard(snapshot) {
  const signals = snapshot.signals || [];
  const actionable = signals.filter(item => item.attention.actionability.score >= 50).length;
  const highConfidence = signals.filter(item => item.attention.confidence.score >= 70).length;
  return Object.freeze({
    signalCount: signals.length,
    averagePriority: round(mean(signals.map(item => item.attention.score)), 1),
    criticalRate: round(signals.length ? signals.filter(item => item.attention.band === 'CRITICAL').length / signals.length * 100 : 0, 1),
    actionableRate: round(signals.length ? actionable / signals.length * 100 : 0, 1),
    highConfidenceRate: round(signals.length ? highConfidence / signals.length * 100 : 0, 1),
    watchHitCount: snapshot.alerts?.length || 0,
    evidenceCoverage: snapshot.brief?.coverage?.score || 0,
    staleCount: snapshot.brief?.stale?.count || 0
  });
}
