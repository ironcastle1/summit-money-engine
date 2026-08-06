export const TILE_SIZE = 256;
export const MAX_LATITUDE = 85.0511287798066;
export const MAX_ZOOM = 18;
export const SVG_NS = 'http://www.w3.org/2000/svg';
export const DEFAULT_CENTER = Object.freeze({ lat: 22, lon: 5 });
export const DEFAULT_LAYERS = Object.freeze({ events: true, news: true, routes: false, ports: true, places: true, labels: true });
export const ENTITY_COLOURS = Object.freeze({
  alert: '#dc4c64',
  news: '#5b69d8',
  port: '#007f72',
  place: '#52616b',
  route: '#1677a7',
  conflict: '#d64045',
  disaster: '#d97706',
  economic: '#7c3aed',
  political: '#2563eb',
  other: '#455a64'
});
