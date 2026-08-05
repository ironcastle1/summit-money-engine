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
export function assessMediaEnvironment(input = {
}) {
  const events = input.events || [];
  const value = Number(input.pressFreedomRisk ?? input.mediaRestriction);
  const score = Number.isFinite(value) ? clamp(value) : 0;
  const evidence = input.evidence || [];
  return factor('media', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Media freedom and information restrictions', evidence
  });
}
