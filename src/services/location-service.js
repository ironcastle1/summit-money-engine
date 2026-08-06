import { readFile } from 'node:fs/promises';
import { boundedString } from '../core/validation.js';
import { stableId } from '../core/ids.js';
import { TtlCache } from '../infra/cache/ttl-cache.js';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function levenshtein(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);
  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + cost);
    }
    for (let column = 0; column <= right.length; column += 1) previous[column] = current[column];
  }
  return previous[right.length];
}

function scorePlace(query, place) {
  const q = normalize(query);
  const name = normalize(place.name);
  const country = normalize(place.country);
  const combined = `${name} ${country}`;
  if (name === q) return 1;
  if (combined === q) return 0.99;
  if (name.startsWith(q)) return 0.94 - Math.min(0.12, (name.length - q.length) * 0.01);
  if (combined.includes(q)) return 0.86;
  const distance = levenshtein(q, name);
  const similarity = 1 - distance / Math.max(q.length, name.length, 1);
  return similarity * 0.82;
}

export class LocationService {
  #places;
  #http;
  #cache;

  static async create(options) {
    const places = JSON.parse(await readFile(options.placesPath, 'utf8'));
    return new LocationService({ ...options, places });
  }

  constructor(options) {
    this.#places = options.places;
    this.#http = options.http;
    this.#cache = new TtlCache({ maxEntries: 1000 });
  }

  localSearch(query, limit = 8) {
    const normalized = boundedString(query, 'q', { min: 2, max: 120 });
    return this.#places
      .map(place => ({ ...place, score: scorePlace(normalized, place) }))
      .filter(place => place.score >= 0.48)
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
      .slice(0, limit)
      .map(place => ({
        id: stableId('place', place.name, place.country, place.lat, place.lon),
        name: place.name,
        country: place.country,
        displayName: `${place.name}, ${place.country}`,
        lat: place.lat,
        lon: place.lon,
        corrected: normalize(place.name) !== normalize(normalized),
        score: Math.round(place.score * 100),
        source: 'LOCAL'
      }));
  }

  async search(query, limit = 8) {
    const normalized = boundedString(query, 'q', { min: 2, max: 120 });
    const local = this.localSearch(normalized, limit);
    let remote = [];
    try {
      const result = await this.#cache.getOrLoad(`search:${normalize(normalized)}`, { ttlMs: 24 * 3_600_000, staleMs: 7 * 86_400_000 }, async () => {
        const payload = await this.#http.json(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(normalized)}`, {
          upstream: 'nominatim-search',
          attempts: 1,
          timeoutMs: 4_500
        });
        return payload.map(item => ({
          id: stableId('osm', item.osm_type, item.osm_id),
          name: item.name || item.display_name?.split(',')[0] || normalized,
          country: item.address?.country || item.display_name?.split(',').at(-1)?.trim() || '',
          displayName: item.display_name,
          lat: Number(item.lat),
          lon: Number(item.lon),
          corrected: false,
          score: Math.round(Number(item.importance || 0.5) * 100),
          source: 'OPENSTREETMAP'
        })).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lon));
      });
      remote = result.value;
    } catch {
      remote = [];
    }
    return [...local, ...remote]
      .filter((item, index, all) => index === all.findIndex(other => Math.abs(other.lat - item.lat) < 0.015 && Math.abs(other.lon - item.lon) < 0.015))
      .slice(0, limit);
  }

  async reverse(lat, lon) {
    const key = `reverse:${lat.toFixed(3)}:${lon.toFixed(3)}`;
    try {
      const result = await this.#cache.getOrLoad(key, { ttlMs: 7 * 86_400_000, staleMs: 30 * 86_400_000 }, async () => {
        const payload = await this.#http.json(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
          upstream: 'nominatim-reverse',
          attempts: 1,
          timeoutMs: 4_500
        });
        const address = payload.address || {};
        return {
          name: address.city || address.town || address.village || address.municipality || address.county || payload.name || null,
          country: address.country || null,
          countryCode: address.country_code?.toUpperCase() || null,
          region: address.state || address.region || null,
          displayName: payload.display_name || null,
          source: 'OPENSTREETMAP'
        };
      });
      return result.value;
    } catch {
      const nearest = this.#places
        .map(place => ({ ...place, distance: (place.lat - lat) ** 2 + (place.lon - lon) ** 2 }))
        .sort((left, right) => left.distance - right.distance)[0];
      return nearest && nearest.distance < 4
        ? { name: nearest.name, country: nearest.country, countryCode: null, region: null, displayName: `${nearest.name}, ${nearest.country}`, source: 'LOCAL' }
        : { name: null, country: null, countryCode: null, region: null, displayName: null, source: 'NONE' };
    }
  }
}
