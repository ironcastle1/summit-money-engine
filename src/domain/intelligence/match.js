import { haversineKm } from '../geo/distance.js';

export function normalizePlaceText(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function buildCountryLookup(countries) {
  const aliases = new Map();
  for (const country of countries) {
    const values = [country.name, country.nativeName, country.iso2, country.iso3, ...(country.aliases || [])];
    for (const value of values) {
      const key = normalizePlaceText(value);
      if (key && !aliases.has(key)) aliases.set(key, country);
    }
  }
  return aliases;
}

export function countryForEvent(event, countries, lookup) {
  const direct = normalizePlaceText(event.country);
  if (direct && lookup.has(direct)) return { country: lookup.get(direct), method: 'COUNTRY_FIELD', distanceKm: 0 };
  if (direct) {
    for (const [alias, country] of lookup) {
      if (alias.length > 3 && (direct.includes(alias) || alias.includes(direct))) return { country, method: 'COUNTRY_ALIAS', distanceKm: 0 };
    }
  }
  if (!Number.isFinite(event.lat) || !Number.isFinite(event.lon)) return null;
  let best = null;
  for (const country of countries) {
    const distanceKm = haversineKm(event.lat, event.lon, country.lat, country.lon);
    if (!best || distanceKm < best.distanceKm) best = { country, method: 'NEAREST_CENTROID', distanceKm };
  }
  const areaRadius = Math.sqrt(Math.max(1, Number(best?.country?.areaKm2 || 50_000)) / Math.PI);
  return best && best.distanceKm <= Math.max(250, areaRadius * 1.75) ? best : null;
}

export function nearestCity(point, cities, maximumKm = 500) {
  let best = null;
  for (const city of cities) {
    const distanceKm = haversineKm(point.lat, point.lon, city.lat, city.lon);
    if (!best || distanceKm < best.distanceKm) best = { city, distanceKm };
  }
  return best && best.distanceKm <= maximumKm ? best : null;
}
