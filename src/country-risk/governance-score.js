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
export function assessGovernanceScore(input = {
}) {
  const events = input.events || [];
  const values = [input.ruleOfLaw,
  input.governmentEffectiveness,
  input.voiceAccountability,
  input.controlOfCorruption].map(Number).filter(Number.isFinite);
  const score = values.length ? 100 - mean(values.map(value => value <= 2.5 && value >= -2.5 ? (value + 2.5) * 20 : value)) : 0;
  const evidence = input.evidence || [];
  return factor('governance', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Governance quality and public-sector effectiveness', evidence
  });
}
