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
export function assessElectionRisk(input = {
}) {
  const events = input.events || [];
  const elections = input.elections || [];
  const now = Date.now();
  const upcoming = elections.map(item => ({
    ...item, days: (new Date(item.date).getTime()-now)/86400000
  })).filter(item => item.days >= -14 && item.days <= 365);
  const closest = upcoming.sort((a,b)=>Math.abs(a.days)-Math.abs(b.days))[0];
  const score = closest ? clamp(75 - Math.min(60, Math.abs(closest.days)/5) + Number(closest.contestationRisk || 0)*0.25) : 0;
  const evidence = input.evidence || [];
  return factor('elections', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Election proximity, contestation and transfer risk', evidence
  });
}
