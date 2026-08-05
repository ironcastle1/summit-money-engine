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
export function assessTradeDependency(input = {
}) {
  const events = input.events || [];
  const concentration = Number(input.exportConcentration ?? input.tradeConcentration);
  const tradeGdp = Number(input.tradeToGdp);
  const score = mean([Number.isFinite(concentration)?concentration:null, Number.isFinite(tradeGdp)?Math.max(0,tradeGdp-40):null].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('trade', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Trade concentration and external dependency', evidence
  });
}
