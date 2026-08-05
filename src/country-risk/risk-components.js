import {
  FACTOR_WEIGHTS
}
from './constants.js';
import {
  weightedMean,
  round
}
from './numbers.js';
export function normalizeComponents(factors = {
}) {
  return Object.freeze(Object.entries(factors).filter(([,value])=>value&&Number.isFinite(Number(value.score))).map(([id,value])=>Object.freeze({
    id, ...value, weight: FACTOR_WEIGHTS[id] || value.weight || 0.03
  })));
}
export function componentCoverage(components = []) {
  const possible=Object.values(FACTOR_WEIGHTS).reduce((a,b)=>a+b,0);
  const measured=components.filter(item=>item.state!=='UNAVAILABLE').reduce((sum,item)=>sum+item.weight,0);
  return round(possible?measured/possible*100:0,1);
}
export function componentScore(components = []) {
  const available=components.filter(item=>item.state!=='UNAVAILABLE');
  return round(weightedMean(available.map(item=>({
    value:item.score,weight:item.weight*Math.max(0.1,item.confidence/100)
  }))),1);
}
