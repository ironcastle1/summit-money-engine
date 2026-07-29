const SOURCE_COUNTRIES = 'intelligence-countries';
const SOURCE_CITIES = 'intelligence-cities';
function expression(layer) { return ['coalesce', ['get', layer.toLowerCase()], -1]; }
function colour(layer) { return ['interpolate', ['linear'], expression(layer), -1, '#52616e', 0, '#2aa876', 20, '#8ea83a', 40, '#d09a31', 60, '#d66b2f', 80, '#d33f49', 100, '#8f1f36']; }

export class IntelligenceMap {
  constructor(options) { this.onSelect = options.onSelect; this.map = null; this.layer = 'COMPOSITE'; this.catalog = null; this.overview = null; }
  async initialize(config, catalog) {
    this.catalog = catalog;
    this.map = new window.maplibregl.Map({ container: 'intelligence-map', style: config.mapStyleUrl, center: [8, 24], zoom: 1.45, minZoom: 1, maxZoom: 12, attributionControl: false });
    this.map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    await new Promise((resolve, reject) => { this.map.once('load', resolve); this.map.once('error', reject); });
    this.map.addSource(SOURCE_COUNTRIES, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterRadius: 34, clusterMaxZoom: 4 });
    this.map.addSource(SOURCE_CITIES, { type: 'geojson', data: { type: 'FeatureCollection', features: (catalog.cities || []).map(city => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [city.lon, city.lat] }, properties: { ...city, kind: 'city' } })) } });
    this.map.addLayer({ id: 'intelligence-country-clusters', type: 'circle', source: SOURCE_COUNTRIES, filter: ['has', 'point_count'], paint: { 'circle-radius': ['step', ['get', 'point_count'], 13, 20, 17, 75, 22], 'circle-color': '#18334a', 'circle-stroke-color': '#6a9bc2', 'circle-stroke-width': 1.5, 'circle-opacity': 0.9 } });
    this.map.addLayer({ id: 'intelligence-country-cluster-count', type: 'symbol', source: SOURCE_COUNTRIES, filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 11 }, paint: { 'text-color': '#e8f3fb' } });
    this.map.addLayer({ id: 'intelligence-country-points', type: 'circle', source: SOURCE_COUNTRIES, filter: ['!', ['has', 'point_count']], paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 6, 9], 'circle-color': colour(this.layer), 'circle-opacity': 0.9, 'circle-stroke-color': '#d9e9f5', 'circle-stroke-width': 0.7 } });
    this.map.addLayer({ id: 'intelligence-city-points', type: 'circle', source: SOURCE_CITIES, minzoom: 4.3, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2, 10, 6], 'circle-color': '#c4d7e6', 'circle-opacity': 0.72, 'circle-stroke-color': '#173044', 'circle-stroke-width': 0.7 } });
    this.map.on('click', 'intelligence-country-points', event => { const feature = event.features?.[0]; if (feature) this.onSelect('country', feature.properties.countryCode); });
    this.map.on('click', 'intelligence-city-points', event => { const feature = event.features?.[0]; if (feature) this.onSelect('city', feature.properties.id); });
    this.map.on('click', 'intelligence-country-clusters', async event => { const feature = event.features?.[0]; const zoom = await this.map.getSource(SOURCE_COUNTRIES).getClusterExpansionZoom(feature.properties.cluster_id); this.map.easeTo({ center: feature.geometry.coordinates, zoom }); });
    for (const layer of ['intelligence-country-points', 'intelligence-city-points', 'intelligence-country-clusters']) { this.map.on('mouseenter', layer, () => { this.map.getCanvas().style.cursor = 'pointer'; }); this.map.on('mouseleave', layer, () => { this.map.getCanvas().style.cursor = ''; }); }
  }
  update(payload) { this.overview = payload; this.map?.getSource(SOURCE_COUNTRIES)?.setData(payload.geojson?.countries || { type: 'FeatureCollection', features: [] }); }
  setLayer(layer) { this.layer = layer; if (this.map?.getLayer('intelligence-country-points')) this.map.setPaintProperty('intelligence-country-points', 'circle-color', colour(layer)); }
  focus(entity) { if (!this.map || !entity) return; this.map.flyTo({ center: [entity.lon ?? entity.capitalLon, entity.lat ?? entity.capitalLat], zoom: entity.kind ? 7 : 4.5, duration: 650 }); }
  resize() { this.map?.resize(); }
}
