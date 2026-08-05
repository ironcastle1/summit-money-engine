const EARTH_RADIUS_KM = 6371.0088;
export function validCoordinate(value) {
    return Boolean(value) && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lon))
        && Number(value.lat) >= -90 && Number(value.lat) <= 90 && Number(value.lon) >= -180 && Number(value.lon) <= 180;
}
export function normalizeCoordinate(value) {
    if (!validCoordinate(value))
        return null;
    return { lat: Number(value.lat), lon: wrapLongitude(Number(value.lon)) };
}
export function wrapLongitude(lon) {
    return ((Number(lon) + 540) % 360) - 180;
}
export function haversineDistanceKm(a, b) {
    if (!validCoordinate(a) || !validCoordinate(b))
        return Infinity;
    const radians = degree => degree * Math.PI / 180;
    const dLat = radians(Number(b.lat) - Number(a.lat));
    const dLon = radians(Number(b.lon) - Number(a.lon));
    const lat1 = radians(Number(a.lat));
    const lat2 = radians(Number(b.lat));
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function bearingDegrees(a, b) {
    if (!validCoordinate(a) || !validCoordinate(b))
        return null;
    const r = degree => degree * Math.PI / 180;
    const lat1 = r(a.lat);
    const lat2 = r(b.lat);
    const dLon = r(b.lon - a.lon);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
export function centroid(points) {
    const valid = (points || []).filter(validCoordinate);
    if (!valid.length)
        return null;
    let x = 0;
    let y = 0;
    let z = 0;
    for (const point of valid) {
        const lat = point.lat * Math.PI / 180;
        const lon = point.lon * Math.PI / 180;
        x += Math.cos(lat) * Math.cos(lon);
        y += Math.cos(lat) * Math.sin(lon);
        z += Math.sin(lat);
    }
    x /= valid.length;
    y /= valid.length;
    z /= valid.length;
    return { lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI, lon: Math.atan2(y, x) * 180 / Math.PI };
}
export function boundingBox(center, radiusKm) {
    if (!validCoordinate(center))
        return null;
    const latDelta = Number(radiusKm) / 110.574;
    const lonDelta = Number(radiusKm) / Math.max(1, 111.320 * Math.cos(center.lat * Math.PI / 180));
    return { south: Math.max(-90, center.lat - latDelta), north: Math.min(90, center.lat + latDelta), west: wrapLongitude(center.lon - lonDelta), east: wrapLongitude(center.lon + lonDelta) };
}
export function pointInBounds(point, bounds) {
    if (!validCoordinate(point) || !bounds)
        return false;
    const latitude = point.lat >= bounds.south && point.lat <= bounds.north;
    const longitude = bounds.west <= bounds.east ? point.lon >= bounds.west && point.lon <= bounds.east : point.lon >= bounds.west || point.lon <= bounds.east;
    return latitude && longitude;
}
export function approximateGeoCell(point, precision = 2) {
    if (!validCoordinate(point))
        return null;
    const factor = 10 ** Math.max(0, Math.min(5, precision));
    return `${Math.round(point.lat * factor) / factor}:${Math.round(point.lon * factor) / factor}`;
}
