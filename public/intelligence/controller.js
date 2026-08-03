import { $, $$, text } from '../ui/dom.js';
import { number, age } from '../ui/format.js';
import { IntelligenceMap } from './map.js';
import { renderCountryRows, renderCityRows } from './table.js';
import { renderIntelligenceDetail } from './detail.js';
import { renderIntelligenceSources } from './source-strip.js';
import { metric, sourceRatio } from './format.js';

function errorText(error) { return `${error.code || 'INTELLIGENCE_ERROR'} / ${error.message}`; }
function download(payload) { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `merlin-intelligence-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

export class IntelligenceController {
  constructor(options) {
    this.store = options.store; this.api = options.api; this.initialized = false; this.loading = false;
    this.catalog = null; this.overview = null; this.selection = null; this.tab = 'countries';
    this.filters = { search: '', region: '', layer: 'COMPOSITE', hours: 168, minimumRisk: 0, includeNews: false };
    this.map = new IntelligenceMap({ onSelect: (kind, id) => kind === 'country' ? this.selectCountry(id) : this.selectCity(id) });
  }

  async ensureInitialized() {
    if (this.initialized) { this.map.resize(); return; }
    this.initialized = true; this.bind();
    try {
      this.catalog = await this.api.intelligenceCatalog({ limit: 1000 });
      this.populateRegions();
      await this.map.initialize(this.store.getState().config, this.catalog);
      this.overview = await this.api.intelligenceOverview({ hours: this.filters.hours });
      this.map.update(this.overview); this.map.setLayer(this.filters.layer); this.render();
      if (!this.selection && this.overview.countries?.length) this.selectCountry(this.overview.countries[0].country.iso2, false, { live: false });
      void this.refresh({ background: true });
    } catch (error) { this.showError(error); }
  }

  bind() {
    $('#intelligence-refresh')?.addEventListener('click', () => this.refresh());
    $('#intelligence-export')?.addEventListener('click', () => this.overview && download(this.overview));
    $('#intelligence-search')?.addEventListener('input', event => { this.filters.search = event.target.value; this.render(); });
    $('#intelligence-region')?.addEventListener('change', event => { this.filters.region = event.target.value; this.refresh(); });
    $('#intelligence-hours')?.addEventListener('change', event => { this.filters.hours = Number(event.target.value); this.refresh(); });
    $('#intelligence-min-risk')?.addEventListener('change', event => { this.filters.minimumRisk = Number(event.target.value); this.render(); });
    $('#intelligence-layer')?.addEventListener('change', event => { this.filters.layer = event.target.value; this.map.setLayer(event.target.value); this.render(); });
    $('#intelligence-news-toggle')?.addEventListener('click', event => { this.filters.includeNews = !this.filters.includeNews; event.currentTarget.classList.toggle('active', this.filters.includeNews); event.currentTarget.textContent = `NEWS ${this.filters.includeNews ? 'ON' : 'OFF'}`; this.refresh(); });
    $$('.intelligence-tab').forEach(button => button.addEventListener('click', () => { this.tab = button.dataset.intelligenceTab; this.render(); }));
  }

  populateRegions() {
    const regions = [...new Set((this.catalog.countries || []).map(item => item.region).filter(Boolean))].sort();
    const select = $('#intelligence-region');
    if (select) select.innerHTML = '<option value="">ALL</option>' + regions.map(region => `<option value="${region}">${region.toUpperCase()}</option>`).join('');
  }

  showError(error) { const node = $('#intelligence-error'); if (node) { node.textContent = errorText(error); node.classList.remove('hidden'); } }
  clearError() { $('#intelligence-error')?.classList.add('hidden'); }

  async refresh({ background = false } = {}) {
    if (this.loading) return;
    this.loading = true; this.clearError();
    const button = $('#intelligence-refresh'); if (button && !background) { button.disabled = true; button.textContent = '...'; }
    try {
      this.overview = await this.api.intelligenceOverviewLive({ hours: this.filters.hours, region: this.filters.region, minimumRisk: 0, limit: 300, includeNews: this.filters.includeNews }, { timeoutMs: 8_000 });
      this.map.update(this.overview); this.map.setLayer(this.filters.layer); this.render();
      if (!this.selection && this.overview.countries?.length) this.selectCountry(this.overview.countries[0].country.iso2, false, { live: false });
    } catch (error) { if (!this.overview) this.showError(error); }
    finally { this.loading = false; if (button && !background) { button.disabled = false; button.textContent = 'REFRESH'; } }
  }

  visibleCountries() {
    const query = this.filters.search.trim().toLowerCase();
    return (this.overview?.countries || []).filter(item => {
      const score = item.metrics?.[this.filters.layer.toLowerCase()]?.score ?? item.metrics?.composite?.score;
      const haystack = `${item.country.name} ${item.country.nativeName} ${item.country.capital} ${item.country.iso2}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!Number.isFinite(score) || score >= this.filters.minimumRisk);
    });
  }

  visibleCities() {
    const query = this.filters.search.trim().toLowerCase();
    const regionCountries = new Set((this.catalog?.countries || []).filter(country => !this.filters.region || country.region === this.filters.region).map(country => country.iso2));
    return (this.catalog?.cities || []).filter(city => regionCountries.has(city.countryCode) && (!query || `${city.name} ${city.country} ${city.countryCode}`.toLowerCase().includes(query))).slice(0, 500);
  }

  render() {
    if (!this.overview || !this.catalog) return;
    $$('.intelligence-tab').forEach(button => button.classList.toggle('active', button.dataset.intelligenceTab === this.tab));
    const countries = this.visibleCountries(); const cities = this.visibleCities();
    if (this.tab === 'countries') renderCountryRows($('#intelligence-rows'), countries, this.selection?.country?.iso2 || this.selection?.countryCode);
    else renderCityRows($('#intelligence-rows'), cities, this.selection?.city?.id || this.selection?.id);
    $$('#intelligence-rows [data-country-id]').forEach(button => button.addEventListener('click', () => this.selectCountry(button.dataset.countryId)));
    $$('#intelligence-rows [data-city-id]').forEach(button => button.addEventListener('click', () => this.selectCity(button.dataset.cityId)));
    const highRisk = countries.filter(item => Number(item.metrics?.composite?.score) >= 60).length;
    const severe = countries.filter(item => Number(item.metrics?.composite?.score) >= 80).length;
    const eventCount = countries.reduce((sum, item) => sum + Number(item.eventCount || 0), 0);
    text('#intelligence-country-count', number(countries.length)); text('#intelligence-city-count', number(cities.length));
    text('#intelligence-high-count', number(highRisk)); text('#intelligence-severe-count', number(severe)); text('#intelligence-event-count', number(eventCount));
    text('#intelligence-source-count', sourceRatio(this.overview.intelligenceSources)); text('#intelligence-updated', age(this.overview.generatedAt));
    text('#intelligence-layer-value', this.filters.layer);
    renderIntelligenceSources($('#intelligence-source-strip'), this.overview.intelligenceSources);
    renderIntelligenceDetail($('#intelligence-detail'), this.selection);
  }

  async selectCountry(id, focus = true, { live = true } = {}) {
    const preview = this.overview?.countries?.find(item => item.country.iso2 === id);
    if (preview) { this.selection = { country: preview.country, metrics: preview.metrics, events: [], stories: [], sources: { intelligence: this.overview.intelligenceSources } }; this.render(); if (focus) this.map.focus(preview.country); }
    if (!live) return;
    try { this.selection = await this.api.intelligenceCountry({ id, hours: this.filters.hours }, { timeoutMs: 35_000 }); this.render(); }
    catch (error) { this.showError(error); }
  }

  async selectCity(id, focus = true, { live = true } = {}) {
    const city = this.catalog?.cities?.find(item => item.id === id);
    if (city) {
      if (focus) this.map.focus(city);
      this.selection = { city, country: { name: city.country, iso2: city.countryCode }, metrics: {}, events: [], stories: [], sources: { intelligence: this.overview?.intelligenceSources || {} } };
      this.render();
    }
    if (!live) return;
    try { this.selection = await this.api.intelligenceCity({ id, radiusKm: 100, lookbackDays: Math.min(30, Math.ceil(this.filters.hours / 24)) }, { timeoutMs: 35_000 }); this.render(); }
    catch (error) { this.showError(error); }
  }
}
