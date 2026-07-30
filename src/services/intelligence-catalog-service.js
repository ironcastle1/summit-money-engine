import fs from 'node:fs/promises';
import { buildCountryLookup, normalizePlaceText, nearestCity } from '../domain/intelligence/match.js';
import { haversineKm } from '../domain/geo/distance.js';
import { intelligenceGeoJson } from '../domain/intelligence/layers.js';

function freezeItems(items) { return Object.freeze(items.map(item => Object.freeze({ ...item }))); }

export class IntelligenceCatalogService {
  static async create(options) {
    const [countryPayload, cityPayload] = await Promise.all([
      fs.readFile(options.countriesPath, 'utf8').then(JSON.parse),
      fs.readFile(options.citiesPath, 'utf8').then(JSON.parse)
    ]);
    return new IntelligenceCatalogService({ countries: countryPayload.countries || [], cities: cityPayload.cities || [] });
  }

  constructor(options) {
    this.countries = freezeItems(options.countries);
    this.cities = freezeItems(options.cities);
    this.byIso2 = new Map(this.countries.map(item => [item.iso2, item]));
    this.byIso3 = new Map(this.countries.map(item => [item.iso3, item]));
    this.byCountryId = new Map(this.countries.map(item => [item.id, item]));
    this.byCityId = new Map(this.cities.map(item => [item.id, item]));
    this.countryLookup = buildCountryLookup(this.countries);
  }

  summary() {
    const regions = new Set(this.countries.map(item => item.region).filter(Boolean));
    return Object.freeze({ countries: this.countries.length, cities: this.cities.length, regions: regions.size });
  }

  country(id) {
    const value = String(id || '').trim();
    return this.byIso2.get(value.toUpperCase()) || this.byIso3.get(value.toUpperCase()) || this.byCountryId.get(value.toLowerCase()) || this.countryLookup.get(normalizePlaceText(value)) || null;
  }

  city(id) { return this.byCityId.get(String(id || '').toLowerCase()) || null; }

  listCountries(options = {}) {
    const query = normalizePlaceText(options.query);
    const region = normalizePlaceText(options.region);
    const limit = Math.max(1, Math.min(500, Number(options.limit || 500)));
    return this.countries.filter(item => {
      if (region && normalizePlaceText(item.region) !== region && normalizePlaceText(item.subregion) !== region) return false;
      if (!query) return true;
      return [item.name, item.nativeName, item.iso2, item.iso3, item.capital, ...(item.aliases || [])].some(value => normalizePlaceText(value).includes(query));
    }).slice(0, limit);
  }

  listCities(options = {}) {
    const query = normalizePlaceText(options.query);
    const countryCode = String(options.countryCode || '').toUpperCase();
    const limit = Math.max(1, Math.min(1000, Number(options.limit || 500)));
    return this.cities.filter(item => {
      if (countryCode && item.countryCode !== countryCode) return false;
      if (!query) return true;
      return normalizePlaceText(`${item.name} ${item.country} ${item.countryCode}`).includes(query);
    }).slice(0, limit);
  }

  nearestCity(point, maximumKm) { return nearestCity(point, this.cities, maximumKm); }
  nearestCountry(point) {
    let best = null;
    for (const country of this.countries) {
      const centroidDistance = haversineKm(point.lat, point.lon, country.lat, country.lon);
      const capitalDistance = haversineKm(point.lat, point.lon, country.capitalLat, country.capitalLon);
      const distanceKm = Math.min(centroidDistance ?? Infinity, capitalDistance ?? Infinity);
      if (!best || distanceKm < best.distanceKm) best = { country, distanceKm };
    }
    return best;
  }
  geojson(countryMetrics, cityMetrics) { return intelligenceGeoJson(this.countries, this.cities, countryMetrics, cityMetrics); }
}
