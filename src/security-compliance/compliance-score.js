import { average, clamp, percentage } from './utilities.js';

export function complianceScore(input = {}) {
  const assessments = input.assessments || [];
  const applicable = assessments.filter(item => item.state !== 'NOT_APPLICABLE');
  const score = Math.round(average(applicable.map(item => item.score), 0));
  const implemented = applicable.filter(item => item.state === 'IMPLEMENTED').length;
  const evidenceCurrent = (input.evidence || []).filter(item => item.state === 'CURRENT').length;
  const evidenceCoverage = percentage(evidenceCurrent, Math.max(1, input.evidence?.length || 0));
  const openCriticalFindings = (input.findings || []).filter(item => item.state !== 'CLOSED' && item.severity === 'CRITICAL').length;
  const adjusted = clamp(score - openCriticalFindings * 8);
  return Object.freeze({
    score: adjusted,
    rawControlScore: score,
    implemented,
    applicable: applicable.length,
    implementationRate: percentage(implemented, applicable.length),
    evidenceCoverage: Math.round(evidenceCoverage),
    openCriticalFindings,
    band: adjusted >= 85 ? 'STRONG' : adjusted >= 70 ? 'MANAGED' : adjusted >= 50 ? 'DEVELOPING' : 'WEAK'
  });
}
