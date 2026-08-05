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
export function assessRuleOfLaw(input = {
}) {
  const events = input.events || [];
  const value = Number(input.ruleOfLaw);
  const score = Number.isFinite(value) ? 100 - (value <= 2.5 && value >= -2.5 ? (value + 2.5) * 20 : value) : 0;
  const evidence = input.evidence || [];
  return factor('ruleOfLaw', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Rule-of-law weakness', evidence
  });
}
