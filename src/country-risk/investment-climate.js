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
export function assessInvestmentClimate(input = {
}) {
  const events = input.events || [];
  const values = [input.propertyRights,
  input.contractEnforcement,
  input.capitalControlsRisk,
  input.expropriationRisk].map(Number).filter(Number.isFinite);
  const score = values.length ? 100-mean(values.map((v,i)=>i<2?100-v:v)) : 0;
  const evidence = input.evidence || [];
  return factor('investment', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Investment protection and capital mobility', evidence
  });
}
