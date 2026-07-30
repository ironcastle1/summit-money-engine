import { circleFeature, pointFeature, eventCollection } from './geojson.js';
import { applyMapTheme, CATEGORY_COLOURS } from './theme.js';
import { age, number, upper } from '../ui/format.js';
import { escapeHtml } from '../ui/dom.js';
import { ensureMapLibre } from './maplibre-loader.js';
import { FallbackWorldMap } from './fallback-world-map.js';

const EMPTY_COLLECTION = Object.freeze({ type: 'FeatureCollection', features: [] });

export class MapController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.map = null;
    this.popup = null;
    this.routesLoaded = false;
    this.fallback = null;
  }

  async initialize(config) {
    const state = this.store.getState();
    const library = await ensureMapLibre();
    if (!library.available) {
      this.fallback = new FallbackWorldMap({
        container: 'map',
        onSelect: point => {
          this.store.setState({ point }, 'map.point_selected');
          this.updateGeometry();
          window.dispatchEvent(new CustomEvent('summit:scan-requested'));
        },
        onEvent: event => this.showPopup(event)
      });
      this.map = this.fallback;
      this.store.setState({ map: this.map, mapMode: 'FALLBACK' }, 'map.fallback_initialized');
      this.updateGeometry();
      return this.map;
    }
    this.map = new globalThis.maplibregl.Map({
      container: 'map',
      style: config.mapStyleUrl,
      center: [state.point.lon, state.point.lat],
      zoom: 3.2,
      minZoom: 1.5,
      maxZoom: 18,
      attributionControl: true,
      hash: false
    });
    this.map.addControl(new globalThis.maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    this.map.addControl(new globalThis.maplibregl.ScaleControl({ maxWidth: 130, unit: 'metric' }), 'bottom-right');
    await new Promise((resolve, reject) => {
      this.map.once('load', resolve);
      this.map.once('error', reject);
    });
    applyMapTheme(this.map);
    this.#addSourcesAndLayers();
    this.#bindEvents();
    this.store.setState({ map: this.map }, 'map.initialized');
    this.updateGeometry();
    return this.map;
  }

  #addSourcesAndLayers() {
    this.map.addSource('global-events', { type: 'geojson', data: EMPTY_COLLECTION, cluster: true, clusterRadius: 42, clusterMaxZoom: 7 });
    this.map.addSource('local-events', { type: 'geojson', data: EMPTY_COLLECTION });
    this.map.addSource('scan-circle', { type: 'geojson', data: EMPTY_COLLECTION });
    this.map.addSource('scan-point', { type: 'geojson', data: EMPTY_COLLECTION });
    this.map.addSource('routes', { type: 'geojson', data: EMPTY_COLLECTION });

    this.map.addLayer({
      id: 'routes-line', type: 'line', source: 'routes', layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#37b9ff', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 8, 2.4], 'line-opacity': 0.55, 'line-dasharray': [2, 2] }
    });
    this.map.addLayer({ id: 'scan-circle-fill', type: 'fill', source: 'scan-circle', paint: { 'fill-color': '#37b9ff', 'fill-opacity': 0.045 } });
    this.map.addLayer({ id: 'scan-circle-line', type: 'line', source: 'scan-circle', paint: { 'line-color': '#37b9ff', 'line-width': 1.5, 'line-opacity': 0.78, 'line-dasharray': [3, 2] } });
    this.map.addLayer({
      id: 'global-clusters', type: 'circle', source: 'global-events', filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#256a91', 20, '#287fa9', 75, '#2f9fd3', 200, '#37b9ff'],
        'circle-radius': ['step', ['get', 'point_count'], 13, 20, 16, 75, 20, 200, 24],
        'circle-opacity': 0.74,
        'circle-stroke-color': '#bdeaff',
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.45
      }
    });
    this.map.addLayer({
      id: 'global-cluster-count', type: 'symbol', source: 'global-events', filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 10 },
      paint: { 'text-color': '#f4fbff' }
    });
    this.map.addLayer({
      id: 'global-event-points', type: 'circle', source: 'global-events', filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'colour'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 0, 3, 5, 8],
        'circle-opacity': 0.55,
        'circle-stroke-color': '#07111c',
        'circle-stroke-width': 1
      }
    });
    this.map.addLayer({
      id: 'local-event-halo', type: 'circle', source: 'local-events',
      paint: { 'circle-color': ['get', 'colour'], 'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 0, 8, 5, 16], 'circle-opacity': 0.12, 'circle-blur': 0.35 }
    });
    this.map.addLayer({
      id: 'local-event-points', type: 'circle', source: 'local-events',
      paint: { 'circle-color': ['get', 'colour'], 'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 0, 4, 5, 9], 'circle-opacity': 0.95, 'circle-stroke-color': '#f5fbff', 'circle-stroke-width': 0.7 }
    });
    this.map.addLayer({ id: 'scan-point-halo', type: 'circle', source: 'scan-point', paint: { 'circle-radius': 11, 'circle-color': '#37b9ff', 'circle-opacity': 0.15, 'circle-blur': 0.25 } });
    this.map.addLayer({ id: 'scan-point-core', type: 'circle', source: 'scan-point', paint: { 'circle-radius': 4.5, 'circle-color': '#dff6ff', 'circle-stroke-color': '#37b9ff', 'circle-stroke-width': 2 } });
  }

  #bindEvents() {
    this.map.on('click', event => {
      const features = this.map.queryRenderedFeatures(event.point, { layers: ['local-event-points', 'global-event-points'] });
      if (features.length) {
        this.showPopupFromProperties(features[0].properties, event.lngLat);
        return;
      }
      this.store.setState({ point: { lat: event.lngLat.lat, lon: event.lngLat.lng } }, 'map.point_selected');
      this.updateGeometry();
      window.dispatchEvent(new CustomEvent('summit:scan-requested'));
    });

    this.map.on('click', 'global-clusters', async event => {
      const feature = event.features?.[0];
      if (!feature) return;
      const clusterId = feature.properties.cluster_id;
      const zoom = await this.map.getSource('global-events').getClusterExpansionZoom(clusterId);
      this.map.easeTo({ center: feature.geometry.coordinates, zoom });
    });

    for (const layer of ['local-event-points', 'global-event-points', 'global-clusters']) {
      this.map.on('mouseenter', layer, () => { this.map.getCanvas().style.cursor = 'pointer'; });
      this.map.on('mouseleave', layer, () => { this.map.getCanvas().style.cursor = ''; });
    }
  }

  async loadRoutes() {
    if (this.routesLoaded) return;
    const routes = await this.api.routes();
    if (this.fallback) this.fallback.setRoutes(routes);
    else this.map.getSource('routes').setData(routes);
    this.routesLoaded = true;
  }

  async setRoutesVisible(visible) {
    if (visible) await this.loadRoutes();
    if (this.fallback) { this.fallback.setRoutesVisible(visible); return; }
    this.map.setLayoutProperty('routes-line', 'visibility', visible ? 'visible' : 'none');
  }

  setClustersVisible(visible) {
    if (this.fallback) { this.fallback.setClustersVisible(visible); return; }
    const clusterVisibility = visible ? 'visible' : 'none';
    this.map.setLayoutProperty('global-clusters', 'visibility', clusterVisibility);
    this.map.setLayoutProperty('global-cluster-count', 'visibility', clusterVisibility);
    this.map.setLayoutProperty('global-event-points', 'visibility', visible ? 'none' : 'visible');
  }

  setGlobalEvents(events) {
    if (this.fallback) { this.fallback.setEvents(events, 'global'); return; }
    this.map?.getSource('global-events')?.setData(eventCollection(events, CATEGORY_COLOURS));
  }

  setLocalEvents(events) {
    if (this.fallback) { this.fallback.setEvents(events, 'local'); return; }
    this.map?.getSource('local-events')?.setData(eventCollection(events, CATEGORY_COLOURS));
  }

  updateGeometry() {
    const state = this.store.getState();
    if (this.fallback) { this.fallback.updateGeometry(state.point, state.radiusKm); return; }
    if (!this.map?.isStyleLoaded()) return;
    this.map.getSource('scan-circle')?.setData({ type: 'FeatureCollection', features: [circleFeature(state.point, state.radiusKm)] });
    this.map.getSource('scan-point')?.setData({ type: 'FeatureCollection', features: [pointFeature(state.point)] });
  }

  flyTo(point, options = {}) {
    if (this.fallback) { this.fallback.flyTo(point); return; }
    this.map.flyTo({ center: [point.lon, point.lat], zoom: options.zoom || Math.max(5, this.map.getZoom()), duration: options.duration || 800 });
  }

  focusEvent(event) {
    const zoom = this.fallback ? 6 : Math.max(6, this.map.getZoom());
    this.flyTo({ lat: event.lat, lon: event.lon }, { zoom, duration: 650 });
    this.showPopup(event);
  }

  showPopup(event) {
    this.showPopupFromProperties(event, { lng: event.lon, lat: event.lat });
  }

  showPopupFromProperties(properties, lngLat) {
    this.popup?.remove?.();
    const severity = Number(properties.severity);
    if (this.fallback) {
      const message = document.getElementById('map-message');
      if (message) {
        message.textContent = `${upper(properties.category)} / ${properties.title} / SEV ${Number.isFinite(severity) ? number(severity, 1) : 'N/A'}`;
        message.classList.remove('hidden');
        clearTimeout(this.fallbackMessageTimer);
        this.fallbackMessageTimer = setTimeout(() => message.classList.add('hidden'), 6000);
      }
      return;
    }
    const distance = Number(properties.distanceKm);
    this.popup = new globalThis.maplibregl.Popup({ maxWidth: '310px', closeButton: true, offset: 8 })
      .setLngLat(lngLat)
      .setHTML(`
        <article class="event-popup">
          <header><small>${escapeHtml(upper(properties.category))} / ${escapeHtml(properties.source || 'SOURCE')}</small><strong>${escapeHtml(properties.title)}</strong></header>
          <dl>
            <div><dt>AGE</dt><dd>${escapeHtml(age(properties.time))}</dd></div>
            <div><dt>KM</dt><dd>${Number.isFinite(distance) ? number(distance) : 'N/A'}</dd></div>
            <div><dt>SEV</dt><dd>${Number.isFinite(severity) ? number(severity, 1) : 'N/A'}</dd></div>
          </dl>
        </article>
      `)
      .addTo(this.map);
  }
}
