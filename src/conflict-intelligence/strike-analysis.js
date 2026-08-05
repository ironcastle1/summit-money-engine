import {
  round
}
from './numbers.js';
export function analyzeStrikes(events = []) {
  const strikes = events.filter(event => ['AIRSTRIKE',
  'MISSILE_STRIKE',
  'DRONE_STRIKE',
  'SHELLING'].includes(event.type)),
  byType = Object.fromEntries([...new Set(strikes.map(event => event.type))].map(type => [type,
  strikes.filter(event => event.type === type).length]));
  return Object.freeze({
    count: strikes.length,
    byType,
    strategic: strikes.filter(event => event.weapons.some(item => ['MISSILE',
    'CBRN'].includes(item))).length,
    civilian: strikes.filter(event => event.civilianTarget).length,
    averageSeverity: round(strikes.reduce((s,
    e) => s + e.severity,
    0) / Math.max(1,
    strikes.length),
    1),
    events: strikes.slice(0,
    100)
  });
}
