import { normalizeLongitude } from './distance.js';

export function pointInBounds(latitude, longitude, bounds) {
  if (!bounds) return true;
  const south = Math.min(bounds.south, bounds.north);
  const north = Math.max(bounds.south, bounds.north);
  const west = normalizeLongitude(bounds.west);
  const east = normalizeLongitude(bounds.east);
  const lon = normalizeLongitude(longitude);
  const insideLatitude = latitude >= south && latitude <= north;
  const insideLongitude = west <= east ? lon >= west && lon <= east : lon >= west || lon <= east;
  return insideLatitude && insideLongitude;
}

export function boundsFromPoints(points) {
  const valid = points.filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon));
  if (!valid.length) return null;
  return {
    south: Math.min(...valid.map(point => point.lat)),
    north: Math.max(...valid.map(point => point.lat)),
    west: Math.min(...valid.map(point => point.lon)),
    east: Math.max(...valid.map(point => point.lon))
  };
}
