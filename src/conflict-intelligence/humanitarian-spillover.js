import {
  clamp,
  round,
  mean
}
from './numbers.js';
export function humanitarianSpillover(events = []) {
  const contributions = events.map(event => Math.min(100,
  Number(event.severity || 0) * .34 + (event.civilianTarget ? 10 : 0) + (Math.min(28,
  Math.log2((event.fatalities || 0) + 1) * 5))));
  const score = clamp(mean(contributions) * .75 + Math.min(25,
  events.length * 1.2));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    label: 'Humanitarian access and displacement pressure',
    drivers: events.filter(event => contributions[events.indexOf(event)] >= 35).slice(0,
    8).map(event => event.id)
  });
}
