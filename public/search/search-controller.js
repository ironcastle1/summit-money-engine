import { $, setClass, escapeHtml } from '../ui/dom.js';

function coordinates(query) {
  const match = String(query).trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { lat, lon } : null;
}

export class SearchController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.mapController = options.mapController;
    this.input = $('#place-search');
    this.results = $('#search-results');
    this.timer = null;
    this.activeIndex = -1;
  }

  bind() {
    this.input.addEventListener('input', () => {
      clearTimeout(this.timer);
      const query = this.input.value.trim();
      if (query.length < 2) return this.hide();
      this.timer = setTimeout(() => this.search(query), 220);
    });
    this.input.addEventListener('keydown', event => this.onKeyDown(event));
    document.addEventListener('keydown', event => {
      if (event.key === '/' && document.activeElement !== this.input) {
        event.preventDefault();
        this.input.focus();
        this.input.select();
      }
      if (event.key === 'Escape') this.hide();
    });
    document.addEventListener('click', event => {
      if (!this.results.contains(event.target) && event.target !== this.input) this.hide();
    });
  }

  async search(query) {
    const point = coordinates(query);
    if (point) {
      this.render([{ id: 'coordinates', name: `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`, displayName: 'COORDINATES', lat: point.lat, lon: point.lon, score: 100, source: 'INPUT' }]);
      return;
    }
    try {
      const payload = await this.api.search({ q: query, limit: 10 });
      this.render(payload.results || []);
    } catch {
      this.render([]);
    }
  }

  render(results) {
    this.store.setState({ searchResults: results }, 'search.results');
    this.activeIndex = -1;
    if (!results.length) {
      this.results.innerHTML = '<div class="empty-state">0 RESULTS</div>';
      setClass(this.results, 'hidden', false);
      return;
    }
    this.results.innerHTML = results.map((item, index) => `
      <button class="search-result" type="button" data-index="${index}" role="option">
        <span><strong>${escapeHtml(item.name)}${item.corrected ? ' ≈' : ''}</strong><small>${escapeHtml(item.displayName || item.country || '')}</small></span>
        <b>${escapeHtml(item.source)} / ${Number(item.score || 0)}</b>
      </button>
    `).join('');
    setClass(this.results, 'hidden', false);
    this.results.querySelectorAll('.search-result').forEach(button => button.addEventListener('click', () => this.select(Number(button.dataset.index))));
  }

  select(index) {
    const item = this.store.getState().searchResults[index];
    if (!item) return;
    this.input.value = item.displayName || `${item.name}, ${item.country}`;
    this.store.setState({ point: { lat: item.lat, lon: item.lon } }, 'search.selected');
    this.mapController.updateGeometry();
    this.mapController.flyTo({ lat: item.lat, lon: item.lon }, { zoom: 7 });
    this.hide();
    window.dispatchEvent(new CustomEvent('summit:scan-requested'));
  }

  onKeyDown(event) {
    const results = this.store.getState().searchResults;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.activeIndex >= 0) this.select(this.activeIndex);
      else this.search(this.input.value.trim());
      return;
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !results.length) return;
    event.preventDefault();
    this.activeIndex = event.key === 'ArrowDown'
      ? (this.activeIndex + 1) % results.length
      : (this.activeIndex - 1 + results.length) % results.length;
    this.results.querySelectorAll('.search-result').forEach((button, index) => button.classList.toggle('active', index === this.activeIndex));
  }

  hide() {
    setClass(this.results, 'hidden', true);
    this.activeIndex = -1;
  }
}
