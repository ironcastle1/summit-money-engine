import {
  clamp,
  round
}
from './numbers.js';
export function verificationGap(events = []) {
  const weak = events.filter(event => Number(event.evidence?.score || 0) < 55),
  singleSource = events.filter(event => Number(event.evidence?.independentSources || 0) < 2),
  missingActors = events.filter(event => !event.actors?.length),
  score = clamp((weak.length / events.length || 0) * 45 + (singleSource.length / events.length || 0) * 35 + (missingActors.length / events.length || 0) * 20);
  return Object.freeze({
    score: round(score,
    1),
    weakEvidence: weak.length,
    singleSource: singleSource.length,
    missingActors: missingActors.length,
    total: events.length
  });
}
