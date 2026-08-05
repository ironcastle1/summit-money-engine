const EARTH_RADIUS_KM = 6371.0088;
const DEG_TO_RAD = Math.PI / 180;

export function normalizeLongitude(longitude) {
  let value = Number(longitude);
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

export function validCoordinate(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

export function haversineKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  if (!validCoordinate(latitudeA, longitudeA) || !validCoordinate(latitudeB, longitudeB)) return null;
  const lat1 = latitudeA * DEG_TO_RAD;
  const lat2 = latitudeB * DEG_TO_RAD;
  const deltaLat = (latitudeB - latitudeA) * DEG_TO_RAD;
  const deltaLon = normalizeLongitude(longitudeB - longitudeA) * DEG_TO_RAD;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function initialBearing(latitudeA, longitudeA, latitudeB, longitudeB) {
  if (!validCoordinate(latitudeA, longitudeA) || !validCoordinate(latitudeB, longitudeB)) return null;
  const lat1 = latitudeA * DEG_TO_RAD;
  const lat2 = latitudeB * DEG_TO_RAD;
  const deltaLon = normalizeLongitude(longitudeB - longitudeA) * DEG_TO_RAD;
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return (Math.atan2(y, x) / DEG_TO_RAD + 360) % 360;
}

export function destinationPoint(latitude, longitude, bearingDegrees, distanceKm) {
  if (!validCoordinate(latitude, longitude) || !Number.isFinite(bearingDegrees) || !Number.isFinite(distanceKm)) return null;
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const bearing = bearingDegrees * DEG_TO_RAD;
  const lat1 = latitude * DEG_TO_RAD;
  const lon1 = longitude * DEG_TO_RAD;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance)
    + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );
  return {
    lat: lat2 / DEG_TO_RAD,
    lon: normalizeLongitude(lon2 / DEG_TO_RAD)
  };
}

export function circleAreaKm2(radiusKm) {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return null;
  return Math.PI * radiusKm ** 2;
}
