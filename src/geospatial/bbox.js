import { clampLatitude } from './latitude.js';
import { normalizeLongitude, unwrapLongitude } from './longitude.js';
export function bbox(west, south, east, north) {
    const normalizedWest = normalizeLongitude(west);
    let normalizedEast = unwrapLongitude(east, normalizedWest);
    if (Number(east) - Number(west) >= 360)
        normalizedEast = normalizedWest + 360;
    return Object.freeze({ west: normalizedWest, south: clampLatitude(south, false), east: normalizedEast, north: clampLatitude(north, false) });
}
export function bboxFromArray(value) {
    if (!Array.isArray(value) || value.length < 4)
        throw new TypeError('Bounding box must contain west, south, east and north');
    return bbox(value[0], value[1], value[2], value[3]);
}
export function bboxWidth(value) { return Math.max(0, Number(value.east) - Number(value.west)); }
export function bboxHeight(value) { return Math.max(0, Number(value.north) - Number(value.south)); }
export function bboxCenter(value) { return { lat: (Number(value.south) + Number(value.north)) / 2, lon: normalizeLongitude((Number(value.west) + Number(value.east)) / 2) }; }
export function bboxContains(value, point) {
    const longitude = unwrapLongitude(point.lon, value.west);
    return longitude >= value.west && longitude <= value.east && Number(point.lat) >= value.south && Number(point.lat) <= value.north;
}
export function bboxIntersects(left, right) {
    const shiftedWest = unwrapLongitude(right.west, left.west);
    const shiftedEast = shiftedWest + bboxWidth(right);
    return !(shiftedEast < left.west || shiftedWest > left.east || right.north < left.south || right.south > left.north);
}
export function bboxExpand(value, amount = 0) {
    const delta = Math.max(0, Number(amount) || 0);
    return bbox(value.west - delta, value.south - delta, value.east + delta, value.north + delta);
}
export function bboxUnion(left, right) {
    const west = Math.min(left.west, unwrapLongitude(right.west, left.west));
    const rightEast = unwrapLongitude(right.east, west);
    return bbox(west, Math.min(left.south, right.south), Math.max(left.east, rightEast), Math.max(left.north, right.north));
}
