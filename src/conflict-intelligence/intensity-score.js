import {
  clamp,
  round,
  sum
}
from './numbers.js';
import {
  conflictEventWeight
}
from './event-weight.js';
export function conflictIntensity(events,
now = Date.now()) {
  const weights = (events || []).map(event => conflictEventWeight(event,
  now)),
  weighted = sum(weights),
  fatalities = sum((events || []).map(event => event.fatalities)),
  activeActors = new Set((events || []).flatMap(event => event.actors?.map(actor => actor.id) || [])).size,
  score = clamp(12 * Math.log2(weighted + 1) + Math.min(25,
  Math.log2(fatalities + 1) * 5) + Math.min(18,
  activeActors * 2.2) + Math.min(15,
  events.length * .8));
  return Object.freeze({
    score: round(score,
    1),
    eventCount: events.length,
    weightedActivity: round(weighted,
    2),
    fatalities,
    activeActors
  });
}
