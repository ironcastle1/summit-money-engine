import {
  clamp,
  round
}
from './numbers.js';
export function actorCapability(actor,
events = []) {
  const relevant = events.filter(event => event.actors?.some(item => item.id === actor.id)),
  weapons = new Set(relevant.flatMap(event => event.weapons || [])),
  geography = new Set(relevant.map(event => `${Math.round(event.lat)}:${Math.round(event.lon)}`)),
  severity = relevant.reduce((sum,
  event) => sum + Number(event.severity || 0),
  0) / Math.max(1,
  relevant.length),
  score = clamp(severity * .45 + Math.min(25,
  weapons.size * 5) + Math.min(20,
  geography.size * 2) + Math.min(10,
  relevant.length));
  return Object.freeze({
    actorId: actor.id,
    score: round(score,
    1),
    eventCount: relevant.length,
    weapons: [...weapons],
    operatingCells: geography.size
  });
}
