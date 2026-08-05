import {
  sortNewest
}
from './time.js';
export function conflictTimeline(events = [],
limit = 200) {
  return Object.freeze(sortNewest(events).slice(0,
  limit).map(event => Object.freeze({
    id: event.id,
    time: event.time,
    type: event.type,
    title: event.title,
    severity: event.severity,
    actors: event.actors.map(actor => actor.name),
    location: Object.freeze({
      lat: event.lat,
      lon: event.lon
    }),
    evidence: Object.freeze({
      grade: event.evidence.grade,
      score: event.evidence.score,
      sources: event.evidence.sources
    })
  })));
}
