import {
  clamp,
  round,
  weightedMean
}
from './numbers.js';
export function theatreConfidence(events = [],
verification = {
},
contradictions = {
}) {
  const evidence = weightedMean(events.map(event => ({
    value: event.evidence?.score || 0,
    weight: Math.max(1,
    event.severity)
  }))),
  coverage = Math.min(100,
  events.length * 8),
  penalty = (verification.score || 0) * .28 + (contradictions.count || 0) * 5,
  score = clamp(evidence * .72 + coverage * .28 - penalty);
  return Object.freeze({
    score: round(score,
    1),
    band: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : score >= 40 ? 'LOW' : 'VERY_LOW',
    coverage: round(coverage,
    1)
  });
}
