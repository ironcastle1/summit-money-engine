import { MAX_LATITUDE, TILE_SIZE } from './constants.js';
import { clamp, modulo } from './math.js';
export function normalizeLongitude(value) { const normalized = modulo(Number(value) + 180, 360) - 180; return normalized === -180 && Number(value) > 0 ? 180 : normalized; }
export function worldSize(zoom) { return TILE_SIZE * (2 ** Number(zoom)); }
export function lonToX(longitude, zoom) { return ((normalizeLongitude(longitude) + 180) / 360) * worldSize(zoom); }
export function latToY(latitude, zoom) { const limited = clamp(latitude, -MAX_LATITUDE, MAX_LATITUDE); const sine = Math.sin(limited * Math.PI / 180); return (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * worldSize(zoom); }
export function xToLon(x, zoom) { return normalizeLongitude((Number(x) / worldSize(zoom)) * 360 - 180); }
export function yToLat(y, zoom) { const n = Math.PI - (2 * Math.PI * Number(y)) / worldSize(zoom); return 180 / Math.PI * Math.atan(Math.sinh(n)); }
export function project(point, zoom) { return { x: lonToX(point.lon, zoom), y: latToY(point.lat, zoom) }; }
export function unproject(point, zoom) { return { lat: yToLat(point.y, zoom), lon: xToLon(point.x, zoom) }; }
