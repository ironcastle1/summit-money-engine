import { MAX_MERCATOR_LATITUDE, TILE_SIZE } from './constants.js';
import { clamp } from './number.js';
import { normalizeLongitude } from './longitude.js';
export function mercatorX(longitude) { return (normalizeLongitude(longitude) + 180) / 360; }
export function mercatorY(latitude) {
    const limited = clamp(latitude, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
    const radians = limited * Math.PI / 180;
    return (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2;
}
export function longitudeFromMercator(x) { return normalizeLongitude(Number(x) * 360 - 180); }
export function latitudeFromMercator(y) {
    const radians = Math.atan(Math.sinh(Math.PI * (1 - 2 * Number(y))));
    return radians * 180 / Math.PI;
}
export function worldSize(zoom, tileSize = TILE_SIZE) { return Number(tileSize) * (2 ** Number(zoom)); }
export function projectWorld(point, zoom, tileSize = TILE_SIZE) {
    const size = worldSize(zoom, tileSize);
    return { x: mercatorX(point.lon) * size, y: mercatorY(point.lat) * size };
}
export function unprojectWorld(point, zoom, tileSize = TILE_SIZE) {
    const size = worldSize(zoom, tileSize);
    return { lat: latitudeFromMercator(point.y / size), lon: longitudeFromMercator(point.x / size) };
}
