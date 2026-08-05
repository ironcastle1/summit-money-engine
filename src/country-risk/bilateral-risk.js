import {
  factor
}
from './factor.js';
import {
  clamp,
  mean
}
from './numbers.js';
export function assessBilateralRisk(input = {
}) {
  const trade = Number(input.tradeRestrictionRisk);
  const diplomatic = Number(input.diplomaticTension);
  const security = Number(input.securityTension);
  const visa = Number(input.mobilityRestrictionRisk);
  const score = mean([trade,diplomatic,security,visa].filter(Number.isFinite));
  return factor('bilateral', clamp(score), {
    confidence: input.confidence || 45, state: [trade,diplomatic,security,visa].some(Number.isFinite) ? 'MEASURED' : 'UNAVAILABLE', explanation: 'Bilateral political, trade, security and mobility friction', evidence: input.evidence || []
  });
}
export function bilateralMatrix(countries = [], relations = []) {
  const byPair = new Map(relations.map(item => [[item.from,item.to].sort().join(':'), item]));
  return Object.freeze(countries.flatMap((from,index)=>countries.slice(index+1).map(to=>{
    const relation=byPair.get([from.iso2,to.iso2].sort().join(':'))||{
    };
    return Object.freeze({
      from:from.iso2,to:to.iso2,risk:assessBilateralRisk(relation).score
    });
  })));
}
