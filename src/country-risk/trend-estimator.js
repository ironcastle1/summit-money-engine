import {
  round
}
from './numbers.js';
import {
  riskDirection
}
from './risk-band.js';
export function estimateRiskTrend(history = []) {
  const points=history.map(item=>({
    time:new Date(item.time||item.generatedAt).getTime(),score:Number(item.score)
  })).filter(item=>Number.isFinite(item.time)&&Number.isFinite(item.score)).sort((a,b)=>a.time-b.time);
  if(points.length<2)return Object.freeze({
    direction:'UNKNOWN',delta:0,slopePerDay:0,points:points.length
  });
  const first=points[0],
  last=points.at(-1),
  days=Math.max(1,(last.time-first.time)/86400000),
  delta=last.score-first.score;
  return Object.freeze({
    direction:riskDirection(delta),delta:round(delta,1),slopePerDay:round(delta/days,2),points:points.length
  });
}
