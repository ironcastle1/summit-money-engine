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
export function assessCorruptionRisk(input = {
}) {
  const events = input.events || [];
  const value = Number(input.controlOfCorruption ?? input.corruptionPerception);
  const score = Number.isFinite(value) ? (value <= 2.5 && value >= -2.5 ? 100 - (value + 2.5) * 20 : 100 - value) : 0;
  const evidence = input.evidence || [];
  return factor('corruption', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Corruption and integrity risk', evidence
  });
}
