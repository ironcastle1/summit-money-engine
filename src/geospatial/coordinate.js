import { clampLatitude, validLatitude } from './latitude.js';
import { normalizeLongitude } from './longitude.js';
import { roundTo } from './number.js';
export function coordinate(lat, lon, options = {}) {
    return Object.freeze({
        lat: roundTo(clampLatitude(lat, options.mercator !== false), options.digits ?? 7),
        lon: roundTo(normalizeLongitude(lon), options.digits ?? 7)
    });
}
export function validCoordinate(value) {
    return Boolean(value) && validLatitude(value.lat) && Number.isFinite(Number(value.lon));
}
export function coordinateFromGeoJson(value) {
    if (!Array.isArray(value) || value.length < 2)
        throw new TypeError('GeoJSON coordinate must contain longitude and latitude');
    return coordinate(value[1], value[0], { mercator: false });
}
export function coordinateToGeoJson(value) {
    if (!validCoordinate(value))
        throw new TypeError('Coordinate is invalid');
    return [Number(value.lon), Number(value.lat)];
}
export function coordinateKey(value, precision = 5) {
    if (!validCoordinate(value))
        return '';
    return `${Number(value.lat).toFixed(precision)},${normalizeLongitude(value.lon).toFixed(precision)}`;
}
