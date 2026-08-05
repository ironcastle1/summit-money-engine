import {
  slug
}
from './text.js';
export function theatreKey(event) {
  return slug(event.theatreId || event.country || event.region || `${Math.round(event.lat / 5) * 5}-${Math.round(event.lon / 5) * 5}`);
}
export function theatreLabel(events = []) {
  const first = events[0] || {
  };
  return first.raw?.attributes?.theatreName || first.country || first.region || `Theatre ${theatreKey(first)}`;
}
