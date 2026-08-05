import {
  factor,
  confidenceFromEvidence
}
from './factor.js';
import {
  clamp,
  mean
}
from './numbers.js';
export function assessSovereignRisk(input = {
}) {
  const events = input.events || [];
  const spread = Number(input.sovereignSpreadBps);
  const ratingRisk = Number(input.ratingRisk);
  const defaultProbability = Number(input.defaultProbability);
  const score = mean([spread/10,ratingRisk,defaultProbability].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('sovereign', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Sovereign financing and default risk', evidence
  });
}
