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
export function assessDemographicPressure(input = {
}) {
  const events = input.events || [];
  const youthUnemployment = Number(input.youthUnemployment);
  const dependency = Number(input.dependencyRatio);
  const growth = Number(input.populationGrowth);
  const score = mean([youthUnemployment*1.5,Math.max(0,dependency-45),Math.max(0,growth-1)*15].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('demographic', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Demographic and labour-market pressure', evidence
  });
}
