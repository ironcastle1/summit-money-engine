import { evaluateConditions } from './condition-evaluator.js';
const EARTH_RADIUS_KM = 6371;
function radians(value) { return Number(value) * Math.PI / 180; }
export function distanceKm(a, b) {
    const dLat = radians(Number(b.lat) - Number(a.lat));
    const dLon = radians(Number(b.lon) - Number(a.lon));
    const lat1 = radians(a.lat);
    const lat2 = radians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
export function evaluateGeofenceTrigger(trigger, context = {}) {
    const point = context.location || context.signal?.location || context.event?.location || {};
    const center = trigger.configuration.center || {};
    const distance = Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lon)) ? distanceKm(center, point) : Infinity;
    const radiusKm = Number(trigger.configuration.radiusKm || 100);
    const conditions = evaluateConditions(trigger.conditions, { ...context, point, distanceKm: distance }, trigger.match);
    return Object.freeze({ passed: distance <= radiusKm && conditions.passed, reason: Number.isFinite(distance) ? `Signal is ${distance.toFixed(1)} km from geofence centre` : 'Signal location unavailable', distanceKm: distance, radiusKm, details: conditions });
}
