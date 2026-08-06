import { haversineKm } from './geo.js';
export function pointInCircle(point, circle) { return haversineKm(point, circle.center) <= Number(circle.radiusKm || 0); }
export function routeIntersectsCircle(edges, circle) {
  const matches = [];
  for (const edge of edges || []) for (const coordinate of edge.coordinates || []) {
    const distanceKm = haversineKm({ lon: coordinate[0], lat: coordinate[1] }, circle.center);
    if (distanceKm <= circle.radiusKm) { matches.push({ edgeId: edge.id, distanceKm }); break; }
  }
  return Object.freeze({ intersects: matches.length > 0, matches: Object.freeze(matches.sort((a, b) => a.distanceKm - b.distanceKm)) });
}
export function evaluateGeofences(edges, geofences = []) { return geofences.map(geofence => Object.freeze({ id: geofence.id, name: geofence.name, ...routeIntersectsCircle(edges, geofence) })); }
