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
export function assessSanctionsExposure(input = {
}) {
  const events = input.events || [];
  const sanctions = input.sanctions || [];
  const active = sanctions.filter(item => item.active !== false);
  const score = clamp(active.reduce((sum,item)=>sum + ({
    SECTORAL:12,TARGETED:8,COMPREHENSIVE:28,FINANCIAL:18,TRADE:15
  }
  [String(item.scope||item.type||'TARGETED').toUpperCase()] || 7),0));
  const evidence = input.evidence || [];
  return factor('sanctions', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Active sanctions and restrictions', evidence
  });
}
