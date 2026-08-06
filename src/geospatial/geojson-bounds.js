import { bbox, bboxUnion } from './bbox.js';
function positions(geometry) {
    if (!geometry)
        return [];
    if (geometry.type === 'GeometryCollection')
        return geometry.geometries.flatMap(positions);
    const output = [];
    const walk = value => { if (!Array.isArray(value))
        return; if (Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])))
        output.push(value);
    else
        value.forEach(walk); };
    walk(geometry.coordinates);
    return output;
}
export function geometryBounds(geometry) {
    const points = positions(geometry);
    if (!points.length)
        return null;
    return bbox(Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1])), Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1])));
}
export function featureBounds(feature) { return geometryBounds(feature?.geometry); }
export function featureCollectionBounds(collection) {
    return (collection?.features || []).map(featureBounds).filter(Boolean).reduce((result, value) => result ? bboxUnion(result, value) : value, null);
}
