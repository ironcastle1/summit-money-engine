import {
  conflictEvents
}
from './conflict-event-normalizer.js';
import {
  theatreKey
}
from './theatre-key.js';
import {
  buildTheatre
}
from './theatre-builder.js';
import {
  conflictMapFeatures
}
from './map-features.js';
export function buildConflictSnapshot(rawEvents = [],
options = {
}) {
  const normalized = conflictEvents(rawEvents,
  options.now),
  groups = new Map();
  for (const event of normalized) {
    const key = theatreKey(event),
    items = groups.get(key) || [];
    items.push(event);
    groups.set(key,
    items);
  }
  const theatres = [...groups.values()].map(events => buildTheatre(events,
  options)).filter(Boolean).filter(item => item.risk.score >= Number(options.minimumRisk || 0)).filter(item => !options.country || item.country === options.country).filter(item => !options.query || `${item.name} ${item.country || ''} ${item.region || ''}`.toLowerCase().includes(String(options.query).toLowerCase())).sort((a,
  b) => b.risk.score - a.risk.score).slice(0,
  Number(options.limit) || 100);
  return Object.freeze({
    theatres,
    events: normalized,
    features: conflictMapFeatures(theatres),
    summary: Object.freeze({
      theatres: theatres.length,
      events: normalized.length,
      critical: theatres.filter(item => item.risk.score >= 65).length,
      intense: theatres.filter(item => item.phase === 'INTENSE').length,
      ceasefires: theatres.filter(item => item.ceasefire.status === 'HOLDING').length,
      averageRisk: theatres.length ? Math.round(theatres.reduce((s,
      t) => s + t.risk.score,
      0) / theatres.length * 10) / 10 : 0
    }),
    generatedAt: new Date(options.now || Date.now()).toISOString()
  });
}
