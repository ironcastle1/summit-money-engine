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
export function assessCurrencyStress(input = {
}) {
  const events = input.events || [];
  const depreciation = Math.abs(Number(input.currencyChange90d));
  const reserves = Number(input.reserveMonths);
  const inflation = Number(input.inflation);
  const score = mean([depreciation*2, Math.max(0,6-reserves)*12, Math.max(0,inflation-4)*2].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('currency', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Currency, reserves and inflation pressure', evidence
  });
}
