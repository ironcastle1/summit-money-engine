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
export function assessBorderRisk(input = {
}) {
  const events = input.events || [];
  const borderEvents = events.filter(event => /border|frontier|crossing|incursion|blockade/i.test(`${event.title||''} ${event.summary||''} ${event.category||''}`));
  const disputes = Number(input.activeBorderDisputes||0);
  const score = clamp(disputes*18 + borderEvents.reduce((sum,event)=>sum+Number(event.severity||20)*0.5,0));
  const evidence = input.evidence || [];
  return factor('border', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Border disputes and crossing disruption', evidence
  });
}
