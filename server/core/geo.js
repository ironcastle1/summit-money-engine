function stableId(input) {
  return Buffer.from(String(input || Math.random()).slice(0, 800)).toString("base64url").slice(0, 40);
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const vals = [lat1, lon1, lat2, lon2].map(Number);
  if (!vals.every(Number.isFinite)) return null;
  const R = 6371;
  const dLat = (vals[2] - vals[0]) * Math.PI / 180;
  const dLon = (vals[3] - vals[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(vals[0] * Math.PI / 180) * Math.cos(vals[2] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bboxAround(lat, lng, km = 4) {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos(Number(lat) * Math.PI / 180) || 1);
  return { south: Number(lat) - dLat, west: Number(lng) - dLng, north: Number(lat) + dLat, east: Number(lng) + dLng };
}

function averageLonLat(coords) {
  const valid = (coords || []).filter(p => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]))).map(p => ({ lng: Number(p[0]), lat: Number(p[1]) }));
  if (!valid.length) return null;
  return { lng: valid.reduce((s, p) => s + p.lng, 0) / valid.length, lat: valid.reduce((s, p) => s + p.lat, 0) / valid.length };
}

function centroidFromGeometry(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return { lng: Number(geometry.coordinates[0]), lat: Number(geometry.coordinates[1]) };
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) return averageLonLat(geometry.coordinates[0] || []);
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) return averageLonLat((geometry.coordinates[0] && geometry.coordinates[0][0]) || []);
  return null;
}

module.exports = { stableId, number, haversineKm, bboxAround, averageLonLat, centroidFromGeometry };
