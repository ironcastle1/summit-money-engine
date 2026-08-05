import {
  sum
}
from './numbers.js';
export function escalationIndicators(events = []) {
  const count = predicate => events.filter(predicate).length;
  return Object.freeze({
    crossBorder: count(event => event.crossBorder),
    strategicWeapons: count(event => event.weapons?.some(item => ['CBRN',
    'MISSILE'].includes(item))),
    civilianTargets: count(event => event.civilianTarget),
    mobilization: count(event => event.type === 'MOBILIZATION'),
    territorialChange: count(event => event.territorialChange),
    ceasefireViolations: count(event => event.type === 'CEASEFIRE_VIOLATION'),
    airAndMissile: count(event => ['AIRSTRIKE',
    'MISSILE_STRIKE',
    'DRONE_STRIKE'].includes(event.type)),
    infrastructureHits: sum(events.map(event => event.infrastructure?.length || 0)),
    highFatality: count(event => event.fatalities >= 20)
  });
}
