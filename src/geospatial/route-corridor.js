import { distanceToPolyline } from './segment-distance.js';
import { polylineBounds } from './polyline.js';
import { bboxExpand } from './bbox.js';
export function routeCorridor(line = [], widthKm = 50) {
    const bounds = polylineBounds(line);
    const approximateDegrees = Math.max(0, Number(widthKm)) / 111.32;
    return Object.freeze({ line: Object.freeze(line.map(point => Object.freeze({ ...point }))), widthKm: Math.max(0, Number(widthKm)), bounds: bounds ? bboxExpand(bounds, approximateDegrees) : null });
}
export function pointInRouteCorridor(point, corridor) { return distanceToPolyline(point, corridor.line).distanceKm <= corridor.widthKm; }
export function featuresNearRoute(features = [], corridor, pointForFeature) {
    return features.map(feature => ({ feature, point: pointForFeature(feature) })).filter(item => item.point).map(item => ({ ...item, distance: distanceToPolyline(item.point, corridor.line) })).filter(item => item.distance.distanceKm <= corridor.widthKm).sort((a, b) => a.distance.distanceKm - b.distance.distanceKm);
}
