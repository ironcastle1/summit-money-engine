import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function logisticsExposure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (event.infrastructure?.some(item => ["PORT",
  "AIRPORT",
  "RAIL",
  "BRIDGE"].includes(item)) ? 20 : 0) + (event.type === "BLOCKADE" ? 22 : 0)));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Transport corridor disruption',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
