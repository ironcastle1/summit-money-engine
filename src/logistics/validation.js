import { CARGO_CLASSES, ROUTE_POLICY_IDS, TRANSPORT_MODES, VESSEL_CLASSES } from './constants.js';
import { assertLogistics } from './errors.js';
import { clamp, finite } from './numbers.js';
export function requiredString(value, field, maximum = 160) {
  const text = String(value ?? '').trim();
  assertLogistics(text.length > 0, 'INVALID_FIELD', `${field} is required`, { field });
  assertLogistics(text.length <= maximum, 'INVALID_FIELD', `${field} is too long`, { field, maximum });
  return text;
}
export function optionalString(value, maximum = 160) { return String(value ?? '').trim().slice(0, maximum); }
export function enumValue(value, allowed, field, fallback = null) {
  const normalized = String(value ?? fallback ?? '').trim().toUpperCase();
  assertLogistics(allowed.includes(normalized), 'INVALID_ENUM', `${field} is invalid`, { field, allowed, value });
  return normalized;
}
export function coordinate(value, field) {
  const lat = Number(value?.lat ?? value?.latitude); const lon = Number(value?.lon ?? value?.longitude);
  assertLogistics(Number.isFinite(lat) && lat >= -90 && lat <= 90, 'INVALID_COORDINATE', `${field}.lat is invalid`, { field, lat });
  assertLogistics(Number.isFinite(lon) && lon >= -180 && lon <= 180, 'INVALID_COORDINATE', `${field}.lon is invalid`, { field, lon });
  return Object.freeze({ lat, lon });
}
export function normalizeRouteRequest(input = {}) {
  return Object.freeze({
    originId: optionalString(input.originId, 96).toLowerCase() || null,
    destinationId: optionalString(input.destinationId, 96).toLowerCase() || null,
    origin: input.origin ? coordinate(input.origin, 'origin') : null,
    destination: input.destination ? coordinate(input.destination, 'destination') : null,
    vesselClass: enumValue(input.vesselClass || 'PANAMAX', VESSEL_CLASSES, 'vesselClass'),
    cargoClass: enumValue(input.cargoClass || 'GENERAL', CARGO_CLASSES, 'cargoClass'),
    mode: enumValue(input.mode || 'SEA', TRANSPORT_MODES, 'mode'),
    policyId: enumValue(input.policyId || 'BALANCED', ROUTE_POLICY_IDS, 'policyId'),
    cargoTonnes: clamp(finite(input.cargoTonnes, 10_000), 1, 500_000),
    departureAt: new Date(input.departureAt || Date.now()).toISOString(),
    avoidNodeIds: Object.freeze((input.avoidNodeIds || []).map(value => optionalString(value, 96).toLowerCase()).filter(Boolean).slice(0, 100)),
    avoidRouteIds: Object.freeze((input.avoidRouteIds || []).map(value => optionalString(value, 96).toLowerCase()).filter(Boolean).slice(0, 100)),
    maximumAlternatives: Math.trunc(clamp(finite(input.maximumAlternatives, 5), 1, 12))
  });
}
