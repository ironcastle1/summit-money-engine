import {
  round
}
from './numbers.js';
function distance(a,
b) {
  const x = (a.lon - b.lon) * Math.cos((a.lat + b.lat) * Math.PI / 360),
  y = a.lat - b.lat;
  return Math.sqrt(x * x + y * y) * 111.32;
}
export function buildFrontlines(events = [],
options = {
}) {
  const eligible = events.filter(event => ['BATTLE',
  'SHELLING',
  'INCURSION',
  'TERRITORIAL_CHANGE'].includes(event.type)),
  maximumKm = Number(options.maximumGapKm) || 180,
  fronts = [];
  for (const event of eligible) {
    let front = fronts.find(item => item.events.some(other => distance(event,
    other) <= maximumKm));
    if (!front) {
      front = {
        id: `front-${fronts.length + 1}`,
        events: []
      };
      fronts.push(front);
    }
    front.events.push(event);
  }
  return Object.freeze(fronts.map(front => {
    const lat = front.events.reduce((s,
    e) => s + e.lat,
    0) / front.events.length,
    lon = front.events.reduce((s,
    e) => s + e.lon,
    0) / front.events.length;
    return Object.freeze({
      id: front.id,
      eventIds: front.events.map(e => e.id),
      center: Object.freeze({
        lat: round(lat,
        4),
        lon: round(lon,
        4)
      }),
      intensity: round(front.events.reduce((s,
      e) => s + e.severity,
      0) / front.events.length,
      1),
      geometry: Object.freeze({
        type: 'LineString',
        coordinates: front.events.sort((a,
        b) => a.lon - b.lon).map(e => [e.lon,
        e.lat])
      })
    });
  }));
}
