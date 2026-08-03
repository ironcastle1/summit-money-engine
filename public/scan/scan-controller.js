import { renderScan } from './metric-renderer.js';
import { showMapMessage } from '../ui/message.js';

export class ScanController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.mapController = options.mapController;
    this.eventList = options.eventList;
    this.categoryFilters = options.categoryFilters;
    this.abortController = null;
  }

  async scan() {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const state = this.store.getState();
    this.store.setState({ loading: true, lastError: null }, 'scan.started');
    try {
      const result = await this.api.scan({
        lat: state.point.lat,
        lon: state.point.lon,
        radiusKm: state.radiusKm,
        limit: 1000
      });
      this.store.setState({
        scan: result,
        localEvents: result.events || [],
        sourceStatus: result.sourceStatus || {},
        location: result.location || null,
        loading: false
      }, 'scan.completed');
      renderScan(result);
      this.categoryFilters.render();
      this.applyFilters();
      window.dispatchEvent(new CustomEvent('merlin:sources-updated'));
    } catch (error) {
      if (error.name === 'AbortError') return;
      this.store.setState({ loading: false, lastError: error }, 'scan.failed');
      showMapMessage(`${error.code || 'SCAN_ERROR'} / ${error.message}`);
    }
  }

  applyFilters() {
    const state = this.store.getState();
    const cutoff = Date.now() - state.windowDays * 86_400_000;
    const filtered = state.localEvents.filter(event => {
      const categoryMatch = !state.categories.size || state.categories.has(event.category);
      const timeMatch = Date.parse(event.time) >= cutoff;
      return categoryMatch && timeMatch;
    });
    this.eventList.render(filtered);
    this.mapController.setLocalEvents(filtered);
  }
}
