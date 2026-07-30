import { age, number, upper } from '../ui/format.js';
import { FallbackWorldMap } from './fallback-world-map.js';

export class MapController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.map = null;
    this.routesLoaded = false;
  }

  async initialize() {
    const state = this.store.getState();
    this.map = new FallbackWorldMap({
      container: 'map',
      initialPoint: state.point,
      initialZoom: 1,
      onSelect: point => {
        this.store.setState({ point }, 'map.point_selected');
        this.updateGeometry();
        window.dispatchEvent(new CustomEvent('summit:scan-requested'));
      },
      onEvent: event => this.showPopup(event)
    });
    this.store.setState({ map: this.map, mapMode: 'LOCAL_VECTOR' }, 'map.local_vector_initialized');
    this.updateGeometry();
    return this.map;
  }

  async loadRoutes() {
    if (this.routesLoaded) return;
    const routes = await this.api.routes();
    this.map?.setRoutes(routes);
    this.routesLoaded = true;
  }

  async setRoutesVisible(visible) {
    if (visible) await this.loadRoutes();
    this.map?.setRoutesVisible(visible);
  }

  setClustersVisible(visible) {
    this.map?.setClustersVisible(visible);
  }

  setGlobalEvents(events) {
    this.map?.setEvents(events, 'global');
  }

  setLocalEvents(events) {
    this.map?.setEvents(events, 'local');
  }

  updateGeometry() {
    const state = this.store.getState();
    this.map?.updateGeometry(state.point, state.radiusKm);
  }

  flyTo(point, options = {}) {
    this.map?.flyTo(point, options);
  }

  focusEvent(event) {
    this.flyTo({ lat: event.lat, lon: event.lon }, { zoom: 7, duration: 500 });
    this.showPopup(event);
  }

  showPopup(event) {
    const message = document.getElementById('map-message');
    if (!message) return;
    const severity = Number(event.severity);
    const distance = Number(event.distanceKm);
    const pieces = [
      upper(event.category),
      event.title || event.name || 'EVENT',
      `AGE ${age(event.time)}`,
      Number.isFinite(distance) ? `${number(distance)} KM` : null,
      Number.isFinite(severity) ? `SEV ${number(severity, 1)}` : null
    ].filter(Boolean);
    message.textContent = pieces.join(' / ');
    message.classList.remove('hidden');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => message.classList.add('hidden'), 7000);
  }
}
