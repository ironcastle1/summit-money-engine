import { canonicalName, normalizeText } from './text-normalizer.js';
import { haversineDistanceKm, validCoordinate } from './geo-utils.js';
const DEFAULT_PLACES = [
    { id: 'country-gb', type: 'COUNTRY', name: 'United Kingdom', localName: 'United Kingdom', iso2: 'GB', lat: 54.7, lon: -3.3, aliases: ['UK', 'Britain', 'Great Britain'] },
    { id: 'city-london', type: 'CITY', name: 'London', localName: 'London', countryCode: 'GB', lat: 51.5074, lon: -0.1278, aliases: ['Greater London'] },
    { id: 'country-ua', type: 'COUNTRY', name: 'Ukraine', localName: 'Україна', iso2: 'UA', lat: 48.4, lon: 31.2, aliases: ['Ukraina'] },
    { id: 'city-kyiv', type: 'CITY', name: 'Kyiv', localName: 'Київ', countryCode: 'UA', lat: 50.4501, lon: 30.5234, aliases: ['Kiev'] },
    { id: 'country-ru', type: 'COUNTRY', name: 'Russia', localName: 'Россия', iso2: 'RU', lat: 61.5, lon: 105.3, aliases: ['Russian Federation'] },
    { id: 'city-moscow', type: 'CITY', name: 'Moscow', localName: 'Москва', countryCode: 'RU', lat: 55.7558, lon: 37.6173, aliases: ['Moskva'] },
    { id: 'country-sy', type: 'COUNTRY', name: 'Syria', localName: 'سوريا', iso2: 'SY', lat: 35, lon: 38, aliases: ['Syrian Arab Republic'] },
    { id: 'city-damascus', type: 'CITY', name: 'Damascus', localName: 'دمشق', countryCode: 'SY', lat: 33.5138, lon: 36.2765, aliases: ['Dimashq'] },
    { id: 'country-cn', type: 'COUNTRY', name: 'China', localName: '中国', iso2: 'CN', lat: 35.9, lon: 104.2, aliases: ["People's Republic of China", 'PRC'] },
    { id: 'city-beijing', type: 'CITY', name: 'Beijing', localName: '北京', countryCode: 'CN', lat: 39.9042, lon: 116.4074, aliases: ['Peking'] },
    { id: 'country-us', type: 'COUNTRY', name: 'United States', localName: 'United States', iso2: 'US', lat: 39.8, lon: -98.6, aliases: ['USA', 'US', 'United States of America', 'America'] },
    { id: 'city-washington', type: 'CITY', name: 'Washington, D.C.', localName: 'Washington, D.C.', countryCode: 'US', lat: 38.9072, lon: -77.0369, aliases: ['Washington DC', 'DC'] },
    { id: 'port-suez', type: 'CHOKEPOINT', name: 'Suez Canal', localName: 'قناة السويس', countryCode: 'EG', lat: 30.45, lon: 32.35, aliases: ['Suez'] },
    { id: 'port-panama', type: 'CHOKEPOINT', name: 'Panama Canal', localName: 'Canal de Panamá', countryCode: 'PA', lat: 9.08, lon: -79.68, aliases: ['Panama'] },
    { id: 'port-hormuz', type: 'CHOKEPOINT', name: 'Strait of Hormuz', localName: 'تنگه هرمز', lat: 26.56, lon: 56.25, aliases: ['Hormuz'] },
    { id: 'port-bab', type: 'CHOKEPOINT', name: 'Bab el-Mandeb', localName: 'باب المندب', lat: 12.58, lon: 43.33, aliases: ['Bab al-Mandab', 'Bab el Mandeb'] }
];
export class PlaceIndex {
    constructor(places = DEFAULT_PLACES) {
        this.places = [];
        this.aliases = new Map();
        for (const place of places)
            this.add(place);
    }
    add(place) {
        if (!place?.id || !place?.name || !validCoordinate(place))
            return false;
        const frozen = Object.freeze({ ...place, lat: Number(place.lat), lon: Number(place.lon), aliases: [...(place.aliases || [])] });
        this.places.push(frozen);
        for (const name of [place.name, place.localName, ...(place.aliases || [])].filter(Boolean)) {
            const key = canonicalName(name);
            if (!key)
                continue;
            if (!this.aliases.has(key))
                this.aliases.set(key, []);
            this.aliases.get(key).push(frozen);
        }
        return true;
    }
    resolve(name, context = {}) {
        const key = canonicalName(name);
        if (!key)
            return [];
        const direct = this.aliases.get(key) || [];
        const candidates = direct.length ? direct : this.places.filter(place => canonicalName(place.name).includes(key) || key.includes(canonicalName(place.name)));
        return candidates.map(place => ({ place, score: this.#score(place, name, context) })).sort((a, b) => b.score - a.score);
    }
    search(query, limit = 10) {
        const q = normalizeText(query);
        if (!q)
            return [];
        return this.places.map(place => ({ ...place, score: this.#score(place, query, {}) })).filter(item => item.score > 0.2).sort((a, b) => b.score - a.score).slice(0, limit);
    }
    nearest(point, limit = 5) {
        if (!validCoordinate(point))
            return [];
        return this.places.map(place => ({ place, distanceKm: haversineDistanceKm(point, place) })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit);
    }
    #score(place, raw, context) {
        const query = canonicalName(raw);
        const names = [place.name, place.localName, ...(place.aliases || [])].map(canonicalName);
        let score = names.includes(query) ? 0.85 : names.some(name => name.includes(query) || query.includes(name)) ? 0.55 : 0;
        if (context.countryCode && place.countryCode === String(context.countryCode).toUpperCase())
            score += 0.12;
        if (context.type && place.type === context.type)
            score += 0.08;
        if (validCoordinate(context.coordinate))
            score += Math.max(0, 0.15 - haversineDistanceKm(context.coordinate, place) / 20000);
        return Math.min(1, score);
    }
}
export function defaultPlaceIndex() { return new PlaceIndex(); }
