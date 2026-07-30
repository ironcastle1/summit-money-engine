import { destinationPoint } from './distance.js';

export function circlePolygon(latitude, longitude, radiusKm, steps = 96) {
  const safeSteps = Math.max(16, Math.min(360, Math.floor(steps)));
  const coordinates = [];
  for (let index = 0; index < safeSteps; index += 1) {
    const bearing = index / safeSteps * 360;
    const point = destinationPoint(latitude, longitude, bearing, radiusKm);
    if (point) coordinates.push([point.lon, point.lat]);
  }
  if (coordinates.length) coordinates.push([...coordinates[0]]);
  return {
    type: 'Feature',
    properties: { radiusKm },
    geometry: { type: 'Polygon', coordinates: [coordinates] }
  };
}
