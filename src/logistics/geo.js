import { EARTH_RADIUS_KM } from './constants.js';
import { clamp, round } from './numbers.js';
function radians(value) { return Number(value) * Math.PI / 180; }
function degrees(value) { return Number(value) * 180 / Math.PI; }
export function haversineKm(a, b) {
  const lat1 = radians(a.lat); const lat2 = radians(b.lat); const deltaLat = lat2 - lat1; const deltaLon = radians(b.lon - a.lon);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(value)));
}
export function bearingDegrees(a, b) {
  const lat1 = radians(a.lat); const lat2 = radians(b.lat); const deltaLon = radians(b.lon - a.lon);
  const y = Math.sin(deltaLon) * Math.cos(lat2); const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return (degrees(Math.atan2(y, x)) + 360) % 360;
}
export function destinationPoint(start, distanceKm, bearing) {
  const angular = Number(distanceKm) / EARTH_RADIUS_KM; const theta = radians(bearing); const lat1 = radians(start.lat); const lon1 = radians(start.lon);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(theta));
  const lon2 = lon1 + Math.atan2(Math.sin(theta) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2));
  return Object.freeze({ lat: round(degrees(lat2), 6), lon: round(((degrees(lon2) + 540) % 360) - 180, 6) });
}
export function interpolateGreatCircle(a, b, steps = 32) {
  const distance = haversineKm(a, b); const bearing = bearingDegrees(a, b); const count = Math.max(1, Math.trunc(steps));
  return Array.from({ length: count + 1 }, (_, index) => destinationPoint(a, distance * index / count, bearing));
}
export function pointToSegmentKm(point, start, end) {
  const total = haversineKm(start, end); if (total < 0.001) return haversineKm(point, start);
  const samples = interpolateGreatCircle(start, end, clamp(Math.ceil(total / 80), 2, 80));
  return Math.min(...samples.map(sample => haversineKm(point, sample)));
}
export function polylineLengthKm(coordinates = []) {
  let total = 0; for (let index = 1; index < coordinates.length; index += 1) total += haversineKm({ lon: coordinates[index - 1][0], lat: coordinates[index - 1][1] }, { lon: coordinates[index][0], lat: coordinates[index][1] });
  return total;
}
