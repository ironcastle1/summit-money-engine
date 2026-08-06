import { clamp, round } from './numbers.js';
export function gradeEvidence(input = {}) {
  const sourceCount = Math.max(0, Number(input.sourceCount) || 0);
  const independentSources = Math.max(0, Number(input.independentSources) || sourceCount);
  const freshness = clamp(Number(input.freshnessScore ?? 50), 0, 100);
  const provenance = clamp(Number(input.provenanceScore ?? 50), 0, 100);
  const corroboration = clamp(Number(input.corroborationScore ?? independentSources * 20), 0, 100);
  const contradictions = Math.max(0, Number(input.contradictions) || 0);
  const score = clamp(Math.min(100, independentSources * 15) * 0.25 + freshness * 0.2 + provenance * 0.25 + corroboration * 0.3 - contradictions * 8, 0, 100);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score > 0 ? 'D' : 'UNRATED';
  return Object.freeze({ score: round(score, 2), grade, sourceCount, independentSources, freshness, provenance, corroboration, contradictions, explanation: `Evidence ${grade}: ${independentSources} independent source(s), ${round(corroboration, 0)} corroboration, ${contradictions} contradiction(s).` });
}
