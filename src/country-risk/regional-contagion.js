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
export function assessRegionalContagion(input = {
}) {
  const events = input.events || [];
  const neighbours = input.neighbors || [];
  const exposed = neighbours.map(item=>Number(item.riskScore ?? item.score)).filter(Number.isFinite);
  const tradeWeights = neighbours.map(item=>Number(item.tradeShare||1));
  const score = exposed.length ? exposed.reduce((sum,value,index)=>sum+value*(tradeWeights[index]||1),0)/tradeWeights.reduce((a,b)=>a+b,0) : 0;
  const evidence = input.evidence || [];
  return factor('contagion', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Spillover from neighbouring countries', evidence
  });
}
