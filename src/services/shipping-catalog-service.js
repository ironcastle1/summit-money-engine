import { readFile } from 'node:fs/promises';
import { normalizePort, normalizeChokepoint, normalizeCommodity } from '../domain/shipping/schema.js';
import { fuzzyPortMatch } from '../domain/shipping/text-match.js';
import { routeLengthKm } from '../domain/shipping/network.js';

async function load(path) { return JSON.parse(await readFile(path, 'utf8')); }
function geoFeature(id, name, coordinates, properties) { return { type: 'Feature', id, properties: { id, name, ...properties }, geometry: { type: 'Point', coordinates: [coordinates.lon, coordinates.lat] } }; }

export class ShippingCatalogService {
  static async create(options) {
    const [portPayload, chokepointPayload, commodityPayload, routePayload] = await Promise.all([
      load(options.portsPath), load(options.chokepointsPath), load(options.commoditiesPath), load(options.routesPath)
    ]);
    return new ShippingCatalogService({
      ports: (portPayload.ports || []).map(normalizePort), chokepoints: (chokepointPayload.chokepoints || []).map(normalizeChokepoint),
      commodities: (commodityPayload.commodities || []).map(normalizeCommodity), routes: routePayload
    });
  }

  constructor(options) {
    this.ports = Object.freeze(options.ports);
    this.chokepoints = Object.freeze(options.chokepoints);
    this.commodities = Object.freeze(options.commodities);
    this.routes = Object.freeze({ type: 'FeatureCollection', features: (options.routes.features || []).map(feature => Object.freeze({ ...feature, properties: Object.freeze({ ...feature.properties, lengthKm: Math.round(routeLengthKm(feature)) }) })) });
    this.portMap = new Map(this.ports.map(port => [port.id, port]));
    this.chokepointMap = new Map(this.chokepoints.map(item => [item.id, item]));
    this.commodityMap = new Map(this.commodities.map(item => [item.id, item]));
    this.routeMap = new Map(this.routes.features.map(item => [item.properties.id, item]));
  }

  listPorts(filters = {}) {
    let output = this.ports;
    if (filters.query) output = output.filter(port => fuzzyPortMatch(filters.query, port) > 0);
    if (filters.region) output = output.filter(port => port.region.toLowerCase() === String(filters.region).toLowerCase());
    if (filters.countryCode) output = output.filter(port => port.countryCode === String(filters.countryCode).toUpperCase());
    if (filters.commodity) output = output.filter(port => port.commodities.includes(String(filters.commodity).toLowerCase()));
    if (filters.type) output = output.filter(port => port.type === String(filters.type).toLowerCase());
    return [...output].sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name)).slice(0, filters.limit || 500);
  }

  port(id) { return this.portMap.get(String(id).toLowerCase()) || null; }
  chokepoint(id) { return this.chokepointMap.get(String(id).toLowerCase()) || null; }
  commodity(id) { return this.commodityMap.get(String(id).toLowerCase()) || null; }
  route(id) { return this.routeMap.get(String(id).toLowerCase()) || null; }

  listChokepoints(filters = {}) {
    let output = this.chokepoints;
    if (filters.commodity) output = output.filter(item => item.commodities.includes(String(filters.commodity).toLowerCase()));
    return [...output].sort((a, b) => b.importance - a.importance).slice(0, filters.limit || 100);
  }

  listCommodities() { return this.commodities; }
  listRoutes() { return this.routes; }

  geojson() {
    return {
      ports: { type: 'FeatureCollection', features: this.ports.map(port => geoFeature(port.id, port.name, port.coordinates, { kind: 'PORT', country: port.country, countryCode: port.countryCode, region: port.region, importance: port.importance, type: port.type, commodities: port.commodities })) },
      chokepoints: { type: 'FeatureCollection', features: this.chokepoints.map(item => geoFeature(item.id, item.name, item.coordinates, { kind: 'CHOKEPOINT', importance: item.importance, radiusKm: item.radiusKm, commodities: item.commodities })) },
      routes: this.routes
    };
  }

  summary() {
    return { ports: this.ports.length, chokepoints: this.chokepoints.length, routes: this.routes.features.length, commodities: this.commodities.length, regions: [...new Set(this.ports.map(port => port.region))].sort(), countries: [...new Set(this.ports.map(port => port.countryCode))].sort() };
  }
}
