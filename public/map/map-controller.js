import { age, number, upper } from '../ui/format.js';
import { FallbackWorldMap } from './fallback-world-map.js';

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function finite(value) { return Number.isFinite(Number(value)); }
function safeLink(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null; }
  catch { return null; }
}

export class MapController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.map = null;
    this.routesLoaded = false;
    this.closeBound = false;
  }

  async initialize() {
    if (this.map) { this.map.resize(); return this.map; }
    const state = this.store.getState();
    this.map = new FallbackWorldMap({
      container: 'map',
      initialPoint: { lat: 0, lon: 0 },
      initialZoom: 1,
      onSelect: point => {
        this.store.setState({ point }, 'map.point_selected');
        this.updateGeometry();
        window.dispatchEvent(new CustomEvent('merlin:scan-requested'));
      },
      onEvent: event => this.showPopup(event)
    });
    this.store.setState({ map: this.map, mapMode: 'DETAILED_RASTER_VECTOR' }, 'map.detailed_initialized');
    this.updateGeometry();
    this.#bindDetailClose();
    requestAnimationFrame(() => this.map?.resize());
    setTimeout(() => this.map?.resize(), 100);
    return this.map;
  }

  #bindDetailClose() {
    if (this.closeBound) return;
    this.closeBound = true;
    document.getElementById('map-event-close')?.addEventListener('click', () => document.getElementById('map-event-detail')?.classList.add('hidden'));
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

  setClustersVisible(visible) { this.map?.setClustersVisible(visible); }
  setGlobalEvents(events) { this.map?.setEvents(events, 'global'); }
  setLocalEvents(events) { this.map?.setEvents(events, 'local'); }

  updateGeometry() {
    const state = this.store.getState();
    this.map?.updateGeometry(state.point, state.radiusKm);
  }

  flyTo(point, options = {}) { this.map?.flyTo(point, options); }

  focusEvent(event) {
    if (finite(event?.lat) && finite(event?.lon)) this.flyTo({ lat: Number(event.lat), lon: Number(event.lon) }, { zoom: 7, duration: 500 });
    this.showPopup(event);
  }

  showPopup(event) {
    if (!event) return;
    const panel = document.getElementById('map-event-detail');
    if (panel) {
      setText('map-event-category', upper(event.category || event.entityType || 'EVENT'));
      setText('map-event-title', event.title || event.name || 'EVENT');
      const magnitude = finite(event.magnitude) ? `M${number(event.magnitude, 1)}` : finite(event.severity) ? number(event.severity, 1) : 'N/A';
      setText('map-event-magnitude', magnitude);
      setText('map-event-age', event.time ? age(event.time) : 'N/A');
      setText('map-event-distance', finite(event.distanceKm) ? `${number(event.distanceKm)} KM` : 'N/A');
      const depth = event.attributes?.depthKm ?? event.depthKm;
      setText('map-event-depth', finite(depth) ? `${number(depth, 1)} KM` : 'N/A');
      setText('map-event-source', upper(event.source || 'N/A'));
      setText('map-event-position', finite(event.lat) && finite(event.lon) ? `${Number(event.lat).toFixed(3)}, ${Number(event.lon).toFixed(3)}` : 'N/A');
      const link = document.getElementById('map-event-link');
      const href = safeLink(event.url);
      if (link) {
        link.classList.toggle('hidden', !href);
        if (href) link.href = href;
      }
      panel.classList.remove('hidden');
    }

    const message = document.getElementById('map-message');
    if (!message) return;
    const pieces = [
      upper(event.category || event.entityType),
      event.title || event.name || 'EVENT',
      event.time ? `AGE ${age(event.time)}` : null,
      finite(event.distanceKm) ? `${number(event.distanceKm)} KM` : null,
      finite(event.magnitude) ? `M${number(event.magnitude, 1)}` : finite(event.severity) ? `SEV ${number(event.severity, 1)}` : null
    ].filter(Boolean);
    message.textContent = pieces.join(' / ');
    message.classList.remove('hidden');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => message.classList.add('hidden'), 4500);
  }
}
