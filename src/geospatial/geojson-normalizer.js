import { assignFeatureId } from './feature-id.js';
import { validateFeature } from './geojson-validator.js';
function normalizePosition(position) { return [Number(position[0]), Number(position[1]), ...position.slice(2).map(Number).filter(Number.isFinite)]; }
function normalizeCoordinates(value) { return Array.isArray(value?.[0]) ? value.map(normalizeCoordinates) : normalizePosition(value); }
export function normalizeGeometry(geometry) {
    if (!geometry)
        return null;
    if (geometry.type === 'GeometryCollection')
        return Object.freeze({ type: geometry.type, geometries: Object.freeze((geometry.geometries || []).map(normalizeGeometry)) });
    return Object.freeze({ type: geometry.type, coordinates: Object.freeze(normalizeCoordinates(geometry.coordinates)) });
}
export function normalizeFeature(feature, options = {}) {
    const errors = validateFeature(feature);
    if (errors.length)
        throw Object.assign(new TypeError('GeoJSON feature is invalid'), { errors });
    return assignFeatureId(Object.freeze({ type: 'Feature', geometry: normalizeGeometry(feature.geometry), properties: Object.freeze({ ...(feature.properties || {}) }) }), options.namespace);
}
export function normalizeFeatureCollection(collection, options = {}) {
    return Object.freeze({ type: 'FeatureCollection', features: Object.freeze((collection?.features || []).map(feature => normalizeFeature(feature, options))) });
}
