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
export function assessPolicyVolatility(input = {
}) {
  const events = input.events || [];
  const changes = input.policyEvents || [];
  const score = clamp(changes.reduce((sum,item)=>sum + Math.max(3, Number(item.impact || item.severity || 20) * (item.reversal ? 1.4 : 0.7)),0));
  const evidence = input.evidence || [];
  return factor('policy', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Policy change frequency and reversal risk', evidence
  });
}
