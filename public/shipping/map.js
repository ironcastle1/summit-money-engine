import { FallbackWorldMap } from '../map/fallback-world-map.js';

function scoreColour(score) {
  if (!Number.isFinite(score)) return '#62778a';
  if (score >= 80) return '#ff4d5d';
  if (score >= 60) return '#ff8a3d';
  if (score >= 40) return '#ffce45';
  if (score >= 20) return '#42b7e9';
  return '#4bd49c';
}

function featurePoint(feature, item, entityType) {
  const coordinates = feature?.geometry?.coordinates || [];
  const score = item?.risk?.score ?? item?.supplyRisk ?? null;
  return {
    id: feature?.properties?.id || item?.id,
    entityType,
    title: feature?.properties?.name || item?.name || 'Shipping entity',
    category: entityType === 'ports' ? 'PORT' : 'CHOKEPOINT',
    source: Number.isFinite(score) ? `RISK ${Number(score).toFixed(0)}` : 'RISK N/A',
    lat: Number(coordinates[1]),
    lon: Number(coordinates[0]),
    severity: Number.isFinite(score) ? Math.max(0.6, score / 20) : Math.max(0.6, Number(feature?.properties?.importance || 50) / 25),
    colour: scoreColour(score),
    risk: score
  };
}

function routeCollection(collection, values) {
  const lookup = new Map((values || []).map(item => [item.id, item]));
  return {
    type: 'FeatureCollection',
    features: (collection?.features || []).map(feature => {
      const item = lookup.get(feature.properties?.id);
      const score = item?.risk?.score;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          risk: Number.isFinite(score) ? score : null,
          colour: scoreColour(score)
        }
      };
    })
  };
}

export class ShippingMap {
  constructor(options) {
    this.store = options.store;
    this.onSelect = options.onSelect;
    this.map = null;
    this.catalog = null;
    this.snapshot = null;
  }

  async initialize(_config, catalog) {
    if (this.map) { this.map.resize(); return; }
    this.catalog = catalog;
    this.map = new FallbackWorldMap({
      container: 'shipping-map',
      initialPoint: { lat: 0, lon: 0 },
      initialZoom: 1,
      onSelect: () => {},
      onEvent: item => this.onSelect?.(item.entityType, item.id)
    });
    this.map.setRoutes(catalog.geojson?.routes || { type: 'FeatureCollection', features: [] });
    this.map.setRoutesVisible(true);
    this.#renderMarkers();
    this.store.setState({ shippingMap: this.map, shippingMapMode: 'LOCAL_VECTOR' }, 'shipping.map_ready');
  }

  #renderMarkers() {
    if (!this.map || !this.catalog) return;
    const portLookup = new Map((this.snapshot?.ports || []).map(item => [item.id, item]));
    const chokeLookup = new Map((this.snapshot?.chokepoints || []).map(item => [item.id, item]));
    const ports = (this.catalog.geojson?.ports?.features || []).map(feature => featurePoint(feature, portLookup.get(feature.properties?.id), 'ports'));
    const chokepoints = (this.catalog.geojson?.chokepoints?.features || []).map(feature => featurePoint(feature, chokeLookup.get(feature.properties?.id), 'chokepoints'));
    this.map.setEvents(ports, 'global');
    this.map.setEvents(chokepoints, 'local');
    this.map.setRoutes(routeCollection(this.catalog.geojson?.routes, this.snapshot?.routes));
    this.map.setRoutesVisible(true);
  }

  update(snapshot) {
    this.snapshot = snapshot || null;
    this.#renderMarkers();
  }

  focus(type, item) {
    if (!this.map || !item) return;
    if (item.coordinates) {
      this.map.flyTo({ lon: item.coordinates.lon, lat: item.coordinates.lat }, { zoom: type === 'chokepoints' ? 7 : 8, duration: 450 });
      return;
    }
    if (item.geometry?.coordinates?.length) this.map.fitBounds(item.geometry.coordinates, { padding: 70 });
  }

  resize() {
    this.map?.resize();
  }
}
