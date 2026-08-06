import { GEOJSON_TYPES } from './constants.js';
function coordinateValid(value) { return Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])); }
function nestedCoordinatesValid(value) {
    if (coordinateValid(value))
        return true;
    return Array.isArray(value) && value.length > 0 && value.every(item => nestedCoordinatesValid(item));
}
export function validateGeometry(geometry) {
    const errors = [];
    if (!geometry || typeof geometry !== 'object')
        return ['Geometry is required'];
    if (!GEOJSON_TYPES.has(geometry.type) || ['Feature', 'FeatureCollection'].includes(geometry.type))
        errors.push(`Unsupported geometry type: ${geometry.type}`);
    if (geometry.type === 'GeometryCollection') {
        if (!Array.isArray(geometry.geometries))
            errors.push('GeometryCollection.geometries must be an array');
        else
            geometry.geometries.forEach((item, index) => validateGeometry(item).forEach(error => errors.push(`geometries[${index}]: ${error}`)));
    }
    else if (!nestedCoordinatesValid(geometry.coordinates))
        errors.push('Geometry coordinates are invalid');
    return errors;
}
export function validateFeature(feature) {
    const errors = [];
    if (!feature || feature.type !== 'Feature')
        return ['Value must be a GeoJSON Feature'];
    validateGeometry(feature.geometry).forEach(error => errors.push(`geometry: ${error}`));
    if (feature.properties !== null && (typeof feature.properties !== 'object' || Array.isArray(feature.properties)))
        errors.push('properties must be an object or null');
    return errors;
}
export function validateFeatureCollection(collection) {
    if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features))
        return ['Value must be a GeoJSON FeatureCollection'];
    return collection.features.flatMap((feature, index) => validateFeature(feature).map(error => `features[${index}]: ${error}`));
}
