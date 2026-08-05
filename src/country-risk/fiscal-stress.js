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
export function assessFiscalStress(input = {
}) {
  const events = input.events || [];
  const debt = Number(input.debtToGdp);
  const deficit = Number(input.fiscalDeficit);
  const interest = Number(input.interestToRevenue);
  const score = mean([Math.max(0,debt-35),Math.max(0,deficit)*8,interest].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('fiscal', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Debt, deficit and fiscal-space pressure', evidence
  });
}
