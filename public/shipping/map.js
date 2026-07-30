import { escapeHtml } from '../ui/dom.js';
import { applyMapTheme } from '../map/theme.js';

const EMPTY = { type: 'FeatureCollection', features: [] };
function scoreColour(score) { if (!Number.isFinite(score)) return '#62778a'; if (score >= 80) return '#ff4d5d'; if (score >= 60) return '#ff8a3d'; if (score >= 40) return '#ffce45'; if (score >= 20) return '#42b7e9'; return '#4bd49c'; }
function enrich(collection, values) {
  const lookup = new Map(values.map(item => [item.id, item]));
  return { ...collection, features: collection.features.map(feature => { const item = lookup.get(feature.properties.id); const score = item?.risk?.score ?? item?.supplyRisk; return { ...feature, properties: { ...feature.properties, risk: Number.isFinite(score) ? score : -1, band: item?.risk?.band || 'N/A', colour: scoreColour(score) } }; }) };
}
function enrichRoutes(collection, values) {
  const lookup = new Map(values.map(item => [item.id, item]));
  return { ...collection, features: collection.features.map(feature => { const item = lookup.get(feature.properties.id); const score = item?.risk?.score; return { ...feature, properties: { ...feature.properties, risk: Number.isFinite(score) ? score : -1, band: item?.risk?.band || 'N/A', colour: scoreColour(score) } }; }) };
}

export class ShippingMap {
  constructor(options) { this.store = options.store; this.onSelect = options.onSelect; this.map = null; this.catalog = null; this.loaded = false; }
  async initialize(config, catalog) {
    if (this.map) { this.map.resize(); return; }
    this.catalog = catalog;
    this.map = new maplibregl.Map({ container: 'shipping-map', style: config.mapStyleUrl, center: [20, 18], zoom: 1.7, minZoom: 1.2, maxZoom: 16, attributionControl: true, hash: false });
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    this.map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right');
    await new Promise((resolve, reject) => { this.map.once('load', resolve); this.map.once('error', reject); });
    applyMapTheme(this.map);
    this.map.addSource('shipping-routes', { type: 'geojson', data: catalog.geojson?.routes || EMPTY });
    this.map.addSource('shipping-ports', { type: 'geojson', data: catalog.geojson?.ports || EMPTY, cluster: true, clusterRadius: 36, clusterMaxZoom: 5 });
    this.map.addSource('shipping-chokepoints', { type: 'geojson', data: catalog.geojson?.chokepoints || EMPTY });
    this.map.addLayer({ id: 'shipping-route-halo', type: 'line', source: 'shipping-routes', paint: { 'line-color': ['get', 'colour'], 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2, 7, 8], 'line-opacity': 0.12, 'line-blur': 3 } });
    this.map.addLayer({ id: 'shipping-route-line', type: 'line', source: 'shipping-routes', paint: { 'line-color': ['get', 'colour'], 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.8, 7, 2.8], 'line-opacity': 0.8 } });
    this.map.addLayer({ id: 'shipping-port-clusters', type: 'circle', source: 'shipping-ports', filter: ['has', 'point_count'], paint: { 'circle-color': '#1b5979', 'circle-radius': ['step', ['get', 'point_count'], 13, 10, 17, 30, 21], 'circle-stroke-color': '#8ddcff', 'circle-stroke-width': 1, 'circle-opacity': 0.82 } });
    this.map.addLayer({ id: 'shipping-port-cluster-count', type: 'symbol', source: 'shipping-ports', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 10 }, paint: { 'text-color': '#fff' } });
    this.map.addLayer({ id: 'shipping-port-points', type: 'circle', source: 'shipping-ports', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': ['get', 'colour'], 'circle-radius': ['interpolate', ['linear'], ['get', 'importance'], 60, 4, 100, 8], 'circle-stroke-color': '#06101a', 'circle-stroke-width': 1.4, 'circle-opacity': 0.94 } });
    this.map.addLayer({ id: 'shipping-chokepoint-halo', type: 'circle', source: 'shipping-chokepoints', paint: { 'circle-color': ['get', 'colour'], 'circle-radius': ['interpolate', ['linear'], ['get', 'importance'], 75, 10, 100, 22], 'circle-opacity': 0.11, 'circle-blur': 0.4 } });
    this.map.addLayer({ id: 'shipping-chokepoint-points', type: 'symbol', source: 'shipping-chokepoints', layout: { 'text-field': '◆', 'text-size': ['interpolate', ['linear'], ['get', 'importance'], 75, 12, 100, 20], 'text-allow-overlap': true }, paint: { 'text-color': ['get', 'colour'], 'text-halo-color': '#07111c', 'text-halo-width': 1.5 } });
    this.#bind(); this.loaded = true; this.store.setState({ shippingMap: this.map }, 'shipping.map_ready');
  }
  #bind() {
    for (const [layer, type] of [['shipping-port-points','ports'],['shipping-chokepoint-points','chokepoints'],['shipping-route-line','routes']]) {
      this.map.on('click', layer, event => { const feature = event.features?.[0]; if (feature) this.onSelect(type, feature.properties.id); });
      this.map.on('mouseenter', layer, () => { this.map.getCanvas().style.cursor = 'pointer'; });
      this.map.on('mouseleave', layer, () => { this.map.getCanvas().style.cursor = ''; });
    }
    this.map.on('click', 'shipping-port-clusters', async event => { const feature = event.features?.[0]; if (!feature) return; const zoom = await this.map.getSource('shipping-ports').getClusterExpansionZoom(feature.properties.cluster_id); this.map.easeTo({ center: feature.geometry.coordinates, zoom }); });
    this.map.on('mousemove', event => {
      const features = this.map.queryRenderedFeatures(event.point, { layers: ['shipping-port-points','shipping-chokepoint-points','shipping-route-line'] });
      const item = features[0]; const node = document.querySelector('#shipping-map-hover');
      if (!node) return;
      if (!item) { node.classList.add('hidden'); return; }
      node.innerHTML = `<strong>${escapeHtml(item.properties.name)}</strong><span>${item.properties.risk >= 0 ? Number(item.properties.risk).toFixed(1) : 'N/A'} RISK</span><small>${escapeHtml(item.properties.band || 'N/A')}</small>`;
      node.style.left = `${event.point.x + 14}px`; node.style.top = `${event.point.y + 14}px`; node.classList.remove('hidden');
    });
  }
  update(snapshot) {
    if (!this.map || !snapshot || !this.catalog) return;
    this.map.getSource('shipping-ports')?.setData(enrich(this.catalog.geojson.ports, snapshot.ports));
    this.map.getSource('shipping-chokepoints')?.setData(enrich(this.catalog.geojson.chokepoints, snapshot.chokepoints));
    this.map.getSource('shipping-routes')?.setData(enrichRoutes(this.catalog.geojson.routes, snapshot.routes));
  }
  focus(type, item) {
    if (!this.map || !item) return;
    if (item.coordinates) this.map.flyTo({ center: [item.coordinates.lon, item.coordinates.lat], zoom: type === 'chokepoints' ? 5.2 : 6, duration: 650 });
    else if (item.geometry?.coordinates?.length) this.map.fitBounds(item.geometry.coordinates.reduce((bounds, point) => bounds.extend(point), new maplibregl.LngLatBounds(item.geometry.coordinates[0], item.geometry.coordinates[0])), { padding: 80, duration: 700 });
  }
  resize() { this.map?.resize(); }
}
