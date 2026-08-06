import { EARTH_RADIUS_KM } from './constants.js';
import { shortestLongitudeDelta } from './longitude.js';
const radians = value => Number(value) * Math.PI / 180;
export function haversineDistance(left, right) {
    const deltaLatitude = radians(Number(right.lat) - Number(left.lat));
    const deltaLongitude = radians(shortestLongitudeDelta(left.lon, right.lon));
    const latitude1 = radians(left.lat);
    const latitude2 = radians(right.lat);
    const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
export function withinDistance(left, right, maximumKm) { return haversineDistance(left, right) <= Number(maximumKm); }
