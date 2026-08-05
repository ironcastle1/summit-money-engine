import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function displacementPressure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (event.type === "INCURSION" || event.type === "TERRITORIAL_CHANGE" ? 12 : 0) + (event.civilianTarget ? 8 : 0)));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Population displacement risk',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
