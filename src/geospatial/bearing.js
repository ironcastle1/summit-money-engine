import { normalizeLongitude } from './longitude.js';
const radians = value => Number(value) * Math.PI / 180;
const degrees = value => Number(value) * 180 / Math.PI;
export function initialBearing(from, to) {
    const phi1 = radians(from.lat);
    const phi2 = radians(to.lat);
    const lambda = radians(Number(to.lon) - Number(from.lon));
    const y = Math.sin(lambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda);
    return (degrees(Math.atan2(y, x)) + 360) % 360;
}
export function bearingDifference(left, right) { return Math.abs(normalizeLongitude(Number(left) - Number(right))); }
