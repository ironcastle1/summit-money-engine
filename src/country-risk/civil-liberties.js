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
export function assessCivilLiberties(input = {
}) {
  const events = input.events || [];
  const value = Number(input.civilLiberties);
  const score = Number.isFinite(value) ? (value <= 7 ? (value-1)/6*100 : 100-value) : 0;
  const evidence = input.evidence || [];
  return factor('civilLiberties', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Civil-liberties restrictions', evidence
  });
}
