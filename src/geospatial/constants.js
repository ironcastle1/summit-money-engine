export const EARTH_RADIUS_KM = 6371.0088;
export const MAX_MERCATOR_LATITUDE = 85.0511287798066;
export const TILE_SIZE = 256;
export const MIN_MAP_ZOOM = 0;
export const MAX_MAP_ZOOM = 20;
export const WORLD_BOUNDS = Object.freeze({ west: -180, south: -MAX_MERCATOR_LATITUDE, east: 180, north: MAX_MERCATOR_LATITUDE });
export const DEFAULT_VIEWPORT = Object.freeze({ center: Object.freeze({ lat: 20, lon: 0 }), zoom: 2, bearing: 0, pitch: 0, width: 1280, height: 720 });
export const GEOJSON_TYPES = Object.freeze(new Set(['Feature', 'FeatureCollection', 'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection']));
