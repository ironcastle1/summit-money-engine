import { polylineLengthKm } from './geo.js';
import { clamp, round } from './numbers.js';
export function normalizeSegment(input, index = 0) {
  const coordinates = Array.isArray(input.geometry?.coordinates) ? input.geometry.coordinates : Array.isArray(input.coordinates) ? input.coordinates : [];
  const distanceKm = Number.isFinite(Number(input.distanceKm)) ? Number(input.distanceKm) : polylineLengthKm(coordinates);
  return Object.freeze({
    id: String(input.id || input.properties?.id || `segment-${index + 1}`).toLowerCase(),
    name: String(input.name || input.properties?.name || `Segment ${index + 1}`),
    mode: String(input.mode || input.properties?.mode || 'SEA').toUpperCase(),
    from: String(input.from || input.properties?.from || ''),
    to: String(input.to || input.properties?.to || ''),
    distanceKm: round(distanceKm, 1),
    baseSpeedKmh: clamp(Number(input.baseSpeedKmh || input.properties?.baseSpeedKmh || 31.5), 1, 900),
    importance: clamp(Number(input.importance || input.properties?.importance || 50), 0, 100),
    commodity: String(input.commodity || input.properties?.commodity || 'mixed').toLowerCase(),
    restrictions: Object.freeze({ ...(input.restrictions || input.properties?.restrictions || {}) }),
    coordinates: Object.freeze(coordinates.map(value => Object.freeze([Number(value[0]), Number(value[1])]))),
    metadata: Object.freeze({ ...(input.metadata || {}) })
  });
}
export function reverseSegment(segment) {
  return Object.freeze({ ...segment, id: `${segment.id}:reverse`, from: segment.to, to: segment.from, coordinates: Object.freeze([...segment.coordinates].reverse()) });
}
