import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function civilianExposure(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (event.civilianTarget ? 18 : 0) + (Math.min(35,
  Math.log2((event.fatalities || 0) + 1) * 6))));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Civilian-targeting and fatality evidence',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
