import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function economicExposure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (event.infrastructure?.some(item => ["POWER",
  "ENERGY",
  "PORT"].includes(item)) ? 14 : 0) + (event.type === "BLOCKADE" || event.type === "SABOTAGE" ? 14 : 0)));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Economic activity and asset exposure',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
