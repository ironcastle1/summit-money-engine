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
export function assessHumanitarianPressure(input = {
}) {
  const events = input.events || [];
  const humanitarian = events.filter(event => /humanitarian|displacement|famine|food|health|refugee/i.test(`${event.category||''} ${event.title||''} ${event.summary||''}`));
  const score = clamp(humanitarian.reduce((sum,event)=>sum + Math.max(5,Number(event.severity||25)*0.6),0));
  const evidence = input.evidence || [];
  return factor('humanitarian', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Humanitarian stress and service disruption', evidence
  });
}
