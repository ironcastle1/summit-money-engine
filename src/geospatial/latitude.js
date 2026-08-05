import { MAX_MERCATOR_LATITUDE } from './constants.js';
import { clamp } from './number.js';
export function clampLatitude(value, mercator = true) {
    const limit = mercator ? MAX_MERCATOR_LATITUDE : 90;
    return clamp(value, -limit, limit);
}
export function validLatitude(value) {
    const latitude = Number(value);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}
