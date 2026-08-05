const EARTH_RADIUS_KM = 6371.0088;

function destination(lat, lon, bearingDegrees, distanceKm) {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const bearing = bearingDegrees * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing));
  const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2));
  let normalizedLon = lon2 * 180 / Math.PI;
  while (normalizedLon > 180) normalizedLon -= 360;
  while (normalizedLon < -180) normalizedLon += 360;
  return [normalizedLon, lat2 * 180 / Math.PI];
}

export function circleFeature(point, radiusKm, steps = 96) {
  const coordinates = [];
  for (let index = 0; index < steps; index += 1) coordinates.push(destination(point.lat, point.lon, index / steps * 360, radiusKm));
  if (coordinates.length) coordinates.push([...coordinates[0]]);
  return { type: 'Feature', properties: { radiusKm }, geometry: { type: 'Polygon', coordinates: [coordinates] } };
}

export function pointFeature(point) {
  return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [point.lon, point.lat] } };
}

export function eventCollection(events, categoryColours) {
  return {
    type: 'FeatureCollection',
    features: events.map(event => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [event.lon, event.lat] },
      properties: {
        id: event.id,
        title: event.title,
        category: event.category,
        source: event.source,
        time: event.time,
        severity: event.severity,
        distanceKm: event.distanceKm ?? null,
        colour: categoryColours[event.category] || categoryColours.other
      }
    }))
  };
}
