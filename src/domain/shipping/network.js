import { haversineKm } from '../geo/distance.js';

function radians(value) { return value * Math.PI / 180; }
function degrees(value) { return value * 180 / Math.PI; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function pointToSegmentKm(point, start, end) {
  const lat0 = radians(point.lat);
  const x1 = radians(start.lon - point.lon) * Math.cos(lat0) * 6371.0088;
  const y1 = radians(start.lat - point.lat) * 6371.0088;
  const x2 = radians(end.lon - point.lon) * Math.cos(lat0) * 6371.0088;
  const y2 = radians(end.lat - point.lat) * 6371.0088;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const denominator = dx * dx + dy * dy;
  const t = denominator ? clamp(-(x1 * dx + y1 * dy) / denominator, 0, 1) : 0;
  return Math.hypot(x1 + t * dx, y1 + t * dy);
}

export function pointToLineKm(point, coordinates) {
  if (!Array.isArray(coordinates) || !coordinates.length) return null;
  if (coordinates.length === 1) return haversineKm(point.lat, point.lon, coordinates[0][1], coordinates[0][0]);
  let minimum = Infinity;
  for (let index = 1; index < coordinates.length; index += 1) {
    const start = { lat: coordinates[index - 1][1], lon: coordinates[index - 1][0] };
    const end = { lat: coordinates[index][1], lon: coordinates[index][0] };
    minimum = Math.min(minimum, pointToSegmentKm(point, start, end));
  }
  return Number.isFinite(minimum) ? minimum : null;
}

export function routeLengthKm(feature) {
  const coordinates = feature?.geometry?.coordinates || [];
  let distance = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    distance += haversineKm(coordinates[index - 1][1], coordinates[index - 1][0], coordinates[index][1], coordinates[index][0]);
  }
  return distance;
}

export function routeBounds(feature) {
  const coordinates = feature?.geometry?.coordinates || [];
  const lats = coordinates.map(value => value[1]);
  const lons = coordinates.map(value => value[0]);
  if (!lats.length) return null;
  return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLon: Math.min(...lons), maxLon: Math.max(...lons) };
}

export function corridorEvents(feature, events, widthKm = 180) {
  const coordinates = feature?.geometry?.coordinates || [];
  return events.map(event => {
    const distanceKm = pointToLineKm({ lat: event.lat, lon: event.lon }, coordinates);
    return { event, distanceKm };
  }).filter(item => Number.isFinite(item.distanceKm) && item.distanceKm <= widthKm).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function nearestNetworkNode(point, ports, chokepoints) {
  const nodes = [
    ...ports.map(port => ({ kind: 'PORT', id: port.id, name: port.name, coordinates: port.coordinates })),
    ...chokepoints.map(item => ({ kind: 'CHOKEPOINT', id: item.id, name: item.name, coordinates: item.coordinates }))
  ];
  return nodes.map(node => ({ ...node, distanceKm: haversineKm(point.lat, point.lon, node.coordinates.lat, node.coordinates.lon) })).sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
}

export function bearingDegrees(start, end) {
  const lat1 = radians(start.lat); const lat2 = radians(end.lat); const delta = radians(end.lon - start.lon);
  const y = Math.sin(delta) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(delta);
  return (degrees(Math.atan2(y, x)) + 360) % 360;
}
