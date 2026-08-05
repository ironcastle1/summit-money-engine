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
export function assessConflictExposure(input = {
}) {
  const events = input.events || [];
  const severe = events.filter(event => ['conflict','war','terror','military'].includes(String(event.category || event.kind || '').toLowerCase()));
  const score = 100 * (1 - Math.exp(-severe.reduce((sum,event)=>sum + Math.max(0.2, Number(event.severity || event.score || 35)/100),0)/4));
  const evidence = input.evidence || [];
  return factor('conflict', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Active conflict and security incidents', evidence
  });
}
