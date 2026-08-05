import { featureCollection } from '../geospatial/feature-collection.js';
import { applyBilingualProperties } from '../geospatial/label-language.js';
import { SpatialIndex } from '../geospatial/spatial-index.js';
import { bbox } from '../geospatial/bbox.js';
function pointFeature(id, point, properties) {
    return applyBilingualProperties({ type: 'Feature', id, geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] }, properties });
}
function routeFeature(feature) {
    return { ...feature, id: feature.id || feature.properties?.id, properties: { kind: 'ROUTE', labelType: 'route', ...feature.properties, nameEnglish: feature.properties?.name } };
}
export class MapFeatureService {
    constructor(options) {
        Object.assign(this, options);
        this.staticCollections = this.#buildStaticCollections();
        this.indexes = new Map(Object.entries(this.staticCollections).map(([id, collection]) => [id, new SpatialIndex({ zoom: id === 'cities' ? 8 : 6 }).load(collection.features)]));
    }
    #buildStaticCollections() {
        const countries = featureCollection(this.intelligenceCatalog.countries.map(country => pointFeature(`country:${country.iso2}`, { lat: country.lat, lon: country.lon }, {
            kind: 'COUNTRY', labelType: 'country', nameEnglish: country.name, nameLocal: country.nativeName, iso2: country.iso2, iso3: country.iso3,
            region: country.region, subregion: country.subregion, population: country.populationBaseline, areaKm2: country.areaKm2, capitalName: country.capital
        })), { namespace: 'country' });
        const cities = featureCollection(this.intelligenceCatalog.cities.map(city => pointFeature(`city:${city.id}`, city, {
            kind: 'CITY', labelType: city.kind === 'capital' ? 'capital' : 'city', nameEnglish: city.name, country: city.country, countryCode: city.countryCode
        })), { namespace: 'city' });
        const shipping = this.shippingCatalog.geojson();
        const ports = featureCollection(shipping.ports.features.map(feature => applyBilingualProperties({ ...feature, properties: { ...feature.properties, labelType: 'port', nameEnglish: feature.properties.name } })), { namespace: 'port' });
        const chokepoints = featureCollection(shipping.chokepoints.features.map(feature => applyBilingualProperties({ ...feature, properties: { ...feature.properties, labelType: 'chokepoint', nameEnglish: feature.properties.name } })), { namespace: 'chokepoint' });
        const routes = featureCollection(shipping.routes.features.map(routeFeature), { namespace: 'route' });
        return Object.freeze({ countries, cities, ports, chokepoints, routes });
    }
    layerIds() { return Object.keys(this.staticCollections); }
    collection(layerId) { return this.staticCollections[String(layerId)] || featureCollection([]); }
    query(layerId, bounds, options = {}) {
        const id = String(layerId);
        const collection = this.collection(id);
        if (!bounds)
            return featureCollection(collection.features.slice(0, options.limit || 5000), { namespace: id });
        const normalizedBounds = bbox(bounds.west, bounds.south, bounds.east, bounds.north);
        const records = this.indexes.get(id)?.withinBounds(normalizedBounds, options.limit || 5000) || [];
        return featureCollection(records.map(record => record.feature), { namespace: id });
    }
    async events(options = {}) {
        const snapshot = await this.eventService.globalSnapshot({ limit: options.limit || 2000, maxAgeMs: options.maxAgeMs || 20000 });
        const features = snapshot.events.filter(event => Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lon))).map(event => pointFeature(`event:${event.id}`, event, {
            kind: 'EVENT', labelType: 'event', nameEnglish: event.title || event.category, title: event.title, category: event.category,
            severity: event.severity, magnitude: event.magnitude, source: event.source, time: event.time || event.updatedAt, material: event.material !== false
        }));
        return { collection: featureCollection(features, { namespace: 'event' }), generatedAt: snapshot.generatedAt, sources: snapshot.sources };
    }
    summary() { return Object.freeze(Object.fromEntries(Object.entries(this.staticCollections).map(([id, collection]) => [id, collection.features.length]))); }
}
