import { normalizeLongitude } from '../geospatial/longitude.js';
import { validLatitude } from '../geospatial/latitude.js';
import { haversineDistance } from '../geospatial/distance.js';
function normalize(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9\p{L}]+/gu, ' ').trim(); }
function words(value) { return normalize(value).split(/\s+/).filter(Boolean); }
function parseCoordinates(query) {
    const match = String(query || '').trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
    if (!match)
        return null;
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (!validLatitude(lat) || !Number.isFinite(lon))
        return null;
    return { id: `coordinate:${lat}:${lon}`, kind: 'COORDINATE', name: `${lat.toFixed(5)}, ${normalizeLongitude(lon).toFixed(5)}`, secondary: 'Coordinates', point: { lat, lon: normalizeLongitude(lon) }, score: 1000 };
}
function score(queryWords, values, importance = 0) {
    const normalizedValues = values.map(normalize).filter(Boolean);
    let result = importance;
    for (const word of queryWords) {
        const exact = normalizedValues.some(value => value === word);
        const prefix = normalizedValues.some(value => value.startsWith(word));
        const contains = normalizedValues.some(value => value.includes(word));
        if (!contains)
            return -Infinity;
        result += exact ? 120 : prefix ? 80 : 45;
    }
    return result;
}
export class MapSearchService {
    constructor(options) { Object.assign(this, options); this.records = this.#buildRecords(); }
    #buildRecords() {
        const countries = this.intelligenceCatalog.countries.map(country => ({ id: `country:${country.iso2}`, kind: 'COUNTRY', name: country.name, localName: country.nativeName, secondary: `${country.region} · ${country.iso2}`, point: { lat: country.lat, lon: country.lon }, values: [country.name, country.nativeName, country.iso2, country.iso3, ...(country.aliases || [])], importance: 100 }));
        const cities = this.intelligenceCatalog.cities.map(city => ({ id: `city:${city.id}`, kind: 'CITY', name: city.name, localName: city.localName || '', secondary: `${city.country} · ${city.countryCode}`, point: { lat: city.lat, lon: city.lon }, values: [city.name, city.localName, city.country, city.countryCode], importance: city.kind === 'capital' ? 95 : 65 }));
        const ports = this.shippingCatalog.ports.map(port => ({ id: `port:${port.id}`, kind: 'PORT', name: port.name, localName: port.localName || '', secondary: `${port.country} · ${port.unlocode || port.countryCode}`, point: port.coordinates, values: [port.name, port.localName, port.country, port.countryCode, port.unlocode], importance: 60 + port.importance / 2 }));
        const chokepoints = this.shippingCatalog.chokepoints.map(item => ({ id: `chokepoint:${item.id}`, kind: 'CHOKEPOINT', name: item.name, localName: item.localName || '', secondary: 'Maritime chokepoint', point: item.coordinates, values: [item.name, item.localName, ...(item.aliases || [])], importance: 70 + item.importance / 3 }));
        return Object.freeze([...countries, ...cities, ...ports, ...chokepoints].map(record => Object.freeze(record)));
    }
    search(query, options = {}) {
        const coordinateResult = parseCoordinates(query);
        const queryWords = words(query);
        if (!queryWords.length)
            return coordinateResult ? [coordinateResult] : [];
        const near = options.near;
        const ranked = this.records.map(record => {
            let recordScore = score(queryWords, record.values, record.importance);
            if (near && Number.isFinite(recordScore))
                recordScore += Math.max(0, 50 - haversineDistance(near, record.point) / 200);
            return { ...record, score: recordScore, label: record.localName && normalize(record.localName) !== normalize(record.name) ? `${record.name} (${record.localName})` : record.name };
        }).filter(record => Number.isFinite(record.score)).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
        if (coordinateResult)
            ranked.unshift(coordinateResult);
        return ranked.slice(0, Math.max(1, Math.min(50, Number(options.limit || 12))));
    }
    byId(id) { return this.records.find(record => record.id === String(id)) || null; }
    summary() { return Object.freeze({ records: this.records.length, kinds: Object.freeze([...new Set(this.records.map(record => record.kind))]) }); }
}
