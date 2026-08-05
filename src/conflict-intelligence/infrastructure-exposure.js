import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function infrastructureExposure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (Math.min(24,
  (event.infrastructure?.length || 0) * 8)) + (event.infrastructure?.includes("POWER") || event.infrastructure?.includes("PORT") ? 10 : 0)));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Critical infrastructure damage',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
