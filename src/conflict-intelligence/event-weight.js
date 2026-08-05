import {
  clamp,
  round
}
from './numbers.js';
import {
  recencyWeight
}
from './time.js';
export function conflictEventWeight(event,
now = Date.now()) {
  const recency = recencyWeight(event.time,
  event.type === 'MOBILIZATION' ? 168 : 96,
  now),
  evidence = (Number(event.evidence?.score) || 50) / 100,
  severity = (Number(event.severity) || 0) / 100,
  fatality = Math.min(1,
  Math.log2((Number(event.fatalities) || 0) + 1) / 8),
  strategic = event.weapons?.some(item => ['CBRN',
  'MISSILE'].includes(item)) ? .12 : 0;
  return round(clamp((severity * .54 + evidence * .18 + fatality * .16 + strategic) * recency,
  0,
  1),
  4);
}
