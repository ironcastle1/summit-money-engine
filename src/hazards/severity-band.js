import {
  clamp, round
}
from './numbers.js';
export function severityBand(score) {
  const n=clamp(score);
  if(n>=90)return'CATASTROPHIC';
  if(n>=75)return'SEVERE';
  if(n>=60)return'HIGH';
  if(n>=40)return'ELEVATED';
  if(n>=20)return'GUARDED';
  return'LOW';
}
export function severityIndex(event= {
}) {
  const base=Number(event.severity);
  const magnitude=Number(event.magnitude);
  const explicit=Number(event.impactScore ?? event.attributes?.impactScore);
  const candidates=[];
  if(Number.isFinite(base)) candidates.push(base<=5?base*20:base);
  if(Number.isFinite(magnitude)) candidates.push(Math.min(100, Math.max(0, (magnitude-3)*20)));
  if(Number.isFinite(explicit)) candidates.push(explicit);
  const score=round(candidates.length?Math.max(...candidates):20, 1);
  return Object.freeze( {
    score, band:severityBand(score)
  });
}
