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
export function assessCyberPolicyRisk(input = {
}) {
  const events = input.events || [];
  const cyber = (input.cyberEvents || events).filter(event => /cyber|ransomware|data breach|critical infrastructure/i.test(`${event.category||''} ${event.title||''} ${event.summary||''}`));
  const score = clamp(cyber.reduce((sum,event)=>sum + Number(event.severity||20)*0.7,0) + Number(input.cyberRestrictionRisk||0)*0.4);
  const evidence = input.evidence || [];
  return factor('cyber', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Cyber incidents and state digital-policy risk', evidence
  });
}
