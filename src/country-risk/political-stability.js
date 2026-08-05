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
export function assessPoliticalStability(input = {
}) {
  const events = input.events || [];
  const stability = Number(input.politicalStability);
  const eventPressure = Number(input.eventPressure || 0);
  const score = Number.isFinite(stability) ? 100 - (stability <= 2.5 && stability >= -2.5 ? (stability + 2.5) * 20 : stability) : eventPressure;
  const evidence = input.evidence || [];
  return factor('stability', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Political stability and violence pressure', evidence
  });
}
