import { positiveModulo } from './number.js';
export function normalizeLongitude(value) {
    const longitude = Number(value);
    if (!Number.isFinite(longitude))
        return 0;
    const normalized = positiveModulo(longitude + 180, 360) - 180;
    return normalized === -180 && longitude > 0 ? 180 : normalized;
}
export function shortestLongitudeDelta(from, to) {
    return normalizeLongitude(Number(to) - Number(from));
}
export function unwrapLongitude(value, reference = 0) {
    let longitude = normalizeLongitude(value);
    while (longitude - reference > 180)
        longitude -= 360;
    while (longitude - reference < -180)
        longitude += 360;
    return longitude;
}
export function unwrapLongitudes(values, reference = undefined) {
    const output = [];
    let previous = reference;
    for (const value of values || []) {
        const next = previous === undefined ? normalizeLongitude(value) : unwrapLongitude(value, previous);
        output.push(next);
        previous = next;
    }
    return output;
}
