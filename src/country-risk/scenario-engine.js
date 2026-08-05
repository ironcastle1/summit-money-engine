import {
  scenarioDefinition
}
from './scenario-catalog.js';
import {
  clamp,
  round
}
from './numbers.js';
import {
  riskBand
}
from './risk-band.js';
export function runCountryScenario(profile, input = {
}) {
  const scenario=scenarioDefinition(input.type);
  const severity=clamp(input.severity??50)/100;
  const before=Number(profile.risk?.score??profile.score??0);
  const componentImpacts=Object.entries(scenario.factors).map(([id,value])=>Object.freeze({
    id,impact:round(value*severity,1),before:Number(profile.factors?.[id]?.score||0),after:clamp(Number(profile.factors?.[id]?.score||0)+value*severity)
  }));
  const total=componentImpacts.reduce((sum,item)=>sum+item.impact,0)/Math.max(3,componentImpacts.length);
  const after=clamp(before+total);
  return Object.freeze({
    country:profile.country,scenario:scenario.id,label:scenario.label,severity:round(severity*100,1),horizonDays:Number(input.horizonDays)||90,before:round(before,1),after:round(after,1),delta:round(after-before,1),band:riskBand(after),componentImpacts,assumptions:Object.freeze({
      ...input.assumptions
    }),generatedAt:new Date().toISOString()
  });
}
