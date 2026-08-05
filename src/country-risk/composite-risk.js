import {
  componentCoverage,
  componentScore,
  normalizeComponents
}
from './risk-components.js';
import {
  riskBand
}
from './risk-band.js';
import {
  round
}
from './numbers.js';
export function compositeCountryRisk(factors = {
}, options = {
}) {
  const components=normalizeComponents(factors);
  const score=componentScore(components);
  const coverage=componentCoverage(components);
  const confidence=round(components.length?components.reduce((sum,item)=>sum+item.confidence*item.weight,0)/components.reduce((sum,item)=>sum+item.weight,0):0,1);
  return Object.freeze({
    score,band:riskBand(score),confidence,coverage,components,generatedAt:new Date(options.now||Date.now()).toISOString(),disclosure:coverage<50?'Limited evidence coverage; treat this score as provisional.':'Score combines measured, reference and inferred risk factors.'
  });
}
