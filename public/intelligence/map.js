import { FallbackWorldMap } from '../map/fallback-world-map.js';

function scoreColour(score) {
  if (!Number.isFinite(score)) return '#62778a';
  if (score >= 80) return '#ff4d5d';
  if (score >= 60) return '#ff8a3d';
  if (score >= 40) return '#ffce45';
  if (score >= 20) return '#42b7e9';
  return '#4bd49c';
}

function featureMarker(feature, layer, kind) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates || [];
  const key = String(layer || 'COMPOSITE').toLowerCase();
  const score = Number(properties[key]);
  return {
    id: properties.id,
    entityType: kind,
    title: properties.name || properties.country || 'Place',
    category: kind === 'country' ? 'COUNTRY' : 'CITY',
    source: Number.isFinite(score) && score >= 0 ? `${layer} ${score.toFixed(0)}` : `${layer} N/A`,
    lat: Number(coordinates[1]),
    lon: Number(coordinates[0]),
    severity: Number.isFinite(score) && score >= 0 ? Math.max(0.7, score / 20) : 0.8,
    colour: scoreColour(Number.isFinite(score) && score >= 0 ? score : null),
    score
  };
}

export class IntelligenceMap {
  constructor(options) {
    this.onSelect = options.onSelect;
    this.map = null;
    this.layer = 'COMPOSITE';
    this.catalog = null;
    this.overview = null;
  }

  async initialize(_config, catalog) {
    if (this.map) { this.map.resize(); return; }
    this.catalog = catalog;
    this.map = new FallbackWorldMap({
      container: 'intelligence-map',
      initialPoint: { lat: 24, lon: 8 },
      initialZoom: 1,
      onSelect: () => {},
      onEvent: item => this.onSelect?.(item.entityType, item.id)
    });
    const cityFeatures = (catalog.cities || []).map(city => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [city.lon, city.lat] },
      properties: { ...city, kind: 'city', composite: null }
    }));
    this.cityFeatures = cityFeatures;
    this.#render();
  }

  #render() {
    if (!this.map) return;
    const countryFeatures = this.overview?.geojson?.countries?.features || [];
    const countries = countryFeatures.map(feature => featureMarker(feature, this.layer, 'country'));
    const cities = (this.cityFeatures || []).map(feature => {
      const item = featureMarker(feature, this.layer, 'city');
      item.colour = '#9cc9dc';
      item.severity = 0.65;
      item.source = feature.properties?.country || 'CITY';
      return item;
    });
    this.map.setEvents(countries, 'global');
    this.map.setEvents(cities, 'local');
    this.map.setClustersVisible(true);
  }

  update(payload) {
    this.overview = payload || null;
    this.#render();
  }

  setLayer(layer) {
    this.layer = layer || 'COMPOSITE';
    this.#render();
  }

  focus(entity) {
    if (!this.map || !entity) return;
    const lon = entity.lon ?? entity.capitalLon;
    const lat = entity.lat ?? entity.capitalLat;
    if (Number.isFinite(Number(lon)) && Number.isFinite(Number(lat))) this.map.flyTo({ lon: Number(lon), lat: Number(lat) }, { zoom: entity.kind ? 8 : 6, duration: 450 });
  }

  resize() {
    this.map?.resize();
  }
}
