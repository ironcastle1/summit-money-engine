import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function foodExposure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (/farm|grain|food|agriculture/i.test(event.title) ? 18 : 0) + (event.type === "BLOCKADE" ? 10 : 0)));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Food production and distribution exposure',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
