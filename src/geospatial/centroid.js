import { coordinateFromGeoJson } from './coordinate.js';
import { ringCentroid } from './polygon.js';
function flattenCoordinates(geometry) {
    if (!geometry)
        return [];
    if (geometry.type === 'Point')
        return [geometry.coordinates];
    if (geometry.type === 'MultiPoint' || geometry.type === 'LineString')
        return geometry.coordinates;
    if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon')
        return geometry.coordinates.flat(1);
    if (geometry.type === 'MultiPolygon')
        return geometry.coordinates.flat(2);
    if (geometry.type === 'GeometryCollection')
        return geometry.geometries.flatMap(flattenCoordinates);
    return [];
}
export function geometryCentroid(geometry) {
    if (!geometry)
        return null;
    if (geometry.type === 'Point')
        return coordinateFromGeoJson(geometry.coordinates);
    if (geometry.type === 'Polygon')
        return ringCentroid(geometry.coordinates[0]);
    if (geometry.type === 'MultiPolygon') {
        const candidates = geometry.coordinates.map(polygon => ({ point: ringCentroid(polygon[0]), size: Math.abs(polygon[0]?.length || 0) })).sort((a, b) => b.size - a.size);
        return candidates[0]?.point || null;
    }
    const points = flattenCoordinates(geometry);
    if (!points.length)
        return null;
    return { lon: points.reduce((sum, point) => sum + Number(point[0]), 0) / points.length, lat: points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length };
}
export function featureCentroid(feature) { return geometryCentroid(feature?.geometry); }
