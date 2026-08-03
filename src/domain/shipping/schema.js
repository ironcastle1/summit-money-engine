import { clamp } from '../../core/numbers.js';

function text(value, fallback = '') { return String(value ?? fallback).trim(); }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(item => text(item).toLowerCase()).filter(Boolean))]; }

export function normalizePort(raw) {
  const lat = Number(raw.coordinates?.lat ?? raw.lat);
  const lon = Number(raw.coordinates?.lon ?? raw.lon);
  if (!raw.id || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw Object.assign(new Error('Invalid port record'), { code: 'INVALID_PORT', details: { id: raw.id } });
  }
  return Object.freeze({
    id: text(raw.id).toLowerCase(), unlocode: text(raw.unlocode).toUpperCase(), name: text(raw.name, raw.id),
    country: text(raw.country), countryCode: text(raw.countryCode).toUpperCase(), region: text(raw.region),
    coordinates: Object.freeze({ lat, lon }), importance: Math.round(clamp(Number(raw.importance || 0), 0, 100)),
    type: text(raw.type, 'gateway').toLowerCase(), commodities: Object.freeze(list(raw.commodities)),
    routeIds: Object.freeze(list(raw.routeIds)), noaaStation: text(raw.noaaStation) || null,
    portwatchId: text(raw.portwatchId) || null
  });
}

export function normalizeChokepoint(raw) {
  const lat = Number(raw.coordinates?.lat ?? raw.lat);
  const lon = Number(raw.coordinates?.lon ?? raw.lon);
  if (!raw.id || !Number.isFinite(lat) || !Number.isFinite(lon)) throw Object.assign(new Error('Invalid chokepoint record'), { code: 'INVALID_CHOKEPOINT' });
  return Object.freeze({
    id: text(raw.id).toLowerCase(), name: text(raw.name, raw.id), coordinates: Object.freeze({ lat, lon }),
    radiusKm: clamp(Number(raw.radiusKm || 100), 25, 1000), importance: Math.round(clamp(Number(raw.importance || 0), 0, 100)),
    routeIds: Object.freeze(list(raw.routeIds)), alternateRouteIds: Object.freeze(list(raw.alternateRouteIds)),
    commodities: Object.freeze(list(raw.commodities)), countries: Object.freeze((raw.countries || []).map(value => text(value).toUpperCase()).filter(Boolean))
  });
}

export function normalizeCommodity(raw) {
  if (!raw.id) throw Object.assign(new Error('Invalid commodity record'), { code: 'INVALID_COMMODITY' });
  return Object.freeze({
    id: text(raw.id).toLowerCase(), name: text(raw.name, raw.id), unit: text(raw.unit),
    marketAssetIds: Object.freeze(list(raw.marketAssetIds)), hsCodes: Object.freeze((raw.hsCodes || []).map(value => text(value).toUpperCase()).filter(Boolean)),
    routeIds: Object.freeze(list(raw.routeIds)), chokepointIds: Object.freeze(list(raw.chokepointIds)), keywords: Object.freeze(list(raw.keywords))
  });
}
