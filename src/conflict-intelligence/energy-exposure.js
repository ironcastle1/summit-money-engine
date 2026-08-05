import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function energyExposure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (event.infrastructure?.some(item => ["POWER",
  "ENERGY"].includes(item)) ? 24 : 0) + (event.type === "SABOTAGE" ? 12 : 0)));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Energy production and grid exposure',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
