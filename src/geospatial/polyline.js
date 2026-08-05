import { haversineDistance } from './distance.js';
import { bbox } from './bbox.js';
export function polylineLength(points = []) {
    let total = 0;
    for (let index = 1; index < points.length; index += 1)
        total += haversineDistance(points[index - 1], points[index]);
    return total;
}
export function polylineBounds(points = []) {
    if (!points.length)
        return null;
    return bbox(Math.min(...points.map(point => point.lon)), Math.min(...points.map(point => point.lat)), Math.max(...points.map(point => point.lon)), Math.max(...points.map(point => point.lat)));
}
export function pointAlongPolyline(points = [], fraction = 0.5) {
    if (!points.length)
        return null;
    if (points.length === 1)
        return { ...points[0] };
    const segments = points.slice(1).map((point, index) => haversineDistance(points[index], point));
    const target = segments.reduce((sum, value) => sum + value, 0) * Math.max(0, Math.min(1, Number(fraction)));
    let travelled = 0;
    for (let index = 0; index < segments.length; index += 1) {
        if (travelled + segments[index] >= target) {
            const ratio = segments[index] ? (target - travelled) / segments[index] : 0;
            return { lat: points[index].lat + (points[index + 1].lat - points[index].lat) * ratio, lon: points[index].lon + (points[index + 1].lon - points[index].lon) * ratio };
        }
        travelled += segments[index];
    }
    return { ...points.at(-1) };
}
