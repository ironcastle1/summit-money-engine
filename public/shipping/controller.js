import { $, $$, text, escapeHtml } from '../ui/dom.js';
import { number, age } from '../ui/format.js';
import { ShippingMap } from './map.js';
import { renderShippingSources } from './source-strip.js';
import { renderShippingTable } from './table.js';
import { renderShippingDetail } from './detail.js';

function cloneSnapshot(snapshot, filters) {
  const search = filters.search.trim().toLowerCase();
  const commodity = filters.commodity.toLowerCase();
  const minimumRisk = Number(filters.minimumRisk || 0);
  const match = item => {
    const score = item.risk?.score ?? item.supplyRisk;
    const textValue = `${item.name || ''} ${item.country || ''} ${item.region || ''} ${item.class || ''} ${(item.commodities || []).join(' ')}`.toLowerCase();
    const commodityMatch = !commodity || item.commodities?.includes?.(commodity) || item.commodity === commodity || item.id === commodity;
    return commodityMatch && (!search || textValue.includes(search)) && (!Number.isFinite(score) || score >= minimumRisk);
  };
  return { ...snapshot, ports: snapshot.ports.filter(match), chokepoints: snapshot.chokepoints.filter(match), routes: snapshot.routes.filter(match), commodities: snapshot.commodities.filter(match) };
}

function risk(value) { return Number.isFinite(value) ? number(value, 1) : 'N/A'; }
function sourceOnlineCount(sources = {}) { const values = Object.values(sources); return `${values.filter(item => item.state === 'ONLINE' || item.state === 'DEGRADED').length}/${values.length}`; }
function saveJson(payload, filename) { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function displayError(error) { const node = $('#shipping-error'); if (!node) return; node.textContent = `${error.code || 'SHIPPING_ERROR'} / ${error.message}`; node.classList.remove('hidden'); }
function clearError() { $('#shipping-error')?.classList.add('hidden'); }

export class ShippingController {
  constructor(options) {
    this.store = options.store; this.api = options.api; this.initialized = false; this.loading = false; this.abortController = null;
    this.map = new ShippingMap({ store: this.store, onSelect: (type, id) => this.select(type, id) });
  }

  async ensureInitialized() {
    if (this.initialized) { this.map.resize(); return; }
    this.initialized = true; this.bind();
    try {
      const catalog = await this.api.shippingCatalog({ limit: 500 });
      this.store.setState({ shippingCatalog: catalog }, 'shipping.catalog_loaded');
      this.populateCommodities(catalog.commodities || []);
      await this.map.initialize(this.store.getState().config, catalog);
      const payload = await this.api.shippingSnapshot({ hours: this.store.getState().shippingFilters.hours });
      this.applySnapshot(payload);
      void this.refresh({ background: true });
    } catch (error) { if (!basic) displayError(error); }
  }


  applySnapshot(payload) {
    if (!payload) return;
    this.store.setState({ shippingSnapshot: payload }, 'shipping.snapshot_loaded');
    this.map.update(payload);
    this.render();
    if (!this.store.getState().shippingSelection) {
      const first = payload.chokepoints?.[0] || payload.ports?.[0];
      if (first) this.select(payload.chokepoints?.[0] ? 'chokepoints' : 'ports', first.id, false, { live: false });
    }
  }

  bind() {
    $('#shipping-refresh')?.addEventListener('click', () => this.refresh());
    $('#shipping-search')?.addEventListener('input', event => { this.updateFilter({ search: event.target.value }); this.render(); });
    $('#shipping-hours')?.addEventListener('change', event => { this.updateFilter({ hours: Number(event.target.value) }); this.refresh(); });
    $('#shipping-min-risk')?.addEventListener('change', event => { this.updateFilter({ minimumRisk: Number(event.target.value) }); this.render(); });
    $('#shipping-commodity')?.addEventListener('change', event => { this.updateFilter({ commodity: event.target.value }); this.render(); });
    $$('.shipping-tab').forEach(button => button.addEventListener('click', () => { this.store.setState({ shippingEntityType: button.dataset.shippingTab }, 'shipping.tab_changed'); this.render(); }));
    $('#shipping-export')?.addEventListener('click', () => { const snapshot = this.store.getState().shippingSnapshot; if (snapshot) saveJson(snapshot, `summit-shipping-${new Date().toISOString().slice(0,10)}.json`); });
    $('#shipping-trade-run')?.addEventListener('click', () => this.runTrade());
  }

  updateFilter(patch) {
    this.store.setState(state => ({ ...state, shippingFilters: { ...state.shippingFilters, ...patch } }), 'shipping.filters_changed');
  }

  populateCommodities(commodities) {
    const select = $('#shipping-commodity');
    if (select) select.innerHTML = '<option value="">ALL</option>' + commodities.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name.toUpperCase())}</option>`).join('');
    const trade = $('#shipping-trade-commodity');
    if (trade) trade.innerHTML = '<option value="TOTAL">TOTAL</option>' + commodities.map(item => `<option value="${escapeHtml(item.hsCodes?.[0] || 'TOTAL')}">${escapeHtml(item.name.toUpperCase())}</option>`).join('');
  }

  async refresh({ background = false } = {}) {
    if (this.loading) this.abortController?.abort();
    this.loading = true; this.abortController = new AbortController(); clearError();
    const button = $('#shipping-refresh'); if (button && !background) { button.disabled = true; button.textContent = '...'; }
    try {
      const filters = this.store.getState().shippingFilters;
      const payload = await this.api.shippingSnapshotLive({ hours: filters.hours }, { signal: this.abortController.signal, timeoutMs: 8_000 });
      this.applySnapshot(payload);
    } catch (error) { if (!this.store.getState().shippingSnapshot && (error.code !== 'TIMEOUT' || !this.abortController.signal.aborted)) displayError(error); }
    finally { this.loading = false; if (button && !background) { button.disabled = false; button.textContent = 'REFRESH'; } }
  }

  render() {
    const state = this.store.getState(); const snapshot = state.shippingSnapshot; if (!snapshot) return;
    const filtered = cloneSnapshot(snapshot, state.shippingFilters);
    $$('.shipping-tab').forEach(button => button.classList.toggle('active', button.dataset.shippingTab === state.shippingEntityType));
    renderShippingTable($('#shipping-rows'), state.shippingEntityType, filtered, state.shippingSelection?.id);
    $$('#shipping-rows [data-shipping-id]').forEach(button => button.addEventListener('click', () => this.select(button.dataset.shippingType, button.dataset.shippingId)));
    const summary = snapshot.summary || {};
    text('#shipping-port-risk', risk(summary.ports?.weighted)); text('#shipping-port-max', risk(summary.ports?.maximum));
    text('#shipping-choke-risk', risk(summary.chokepoints?.weighted)); text('#shipping-route-risk', risk(summary.routes?.weighted));
    text('#shipping-critical-count', number((summary.ports?.criticalCount || 0) + (summary.chokepoints?.criticalCount || 0), 0));
    text('#shipping-high-count', number((summary.ports?.highCount || 0) + (summary.chokepoints?.highCount || 0), 0));
    text('#shipping-record-count', number(filtered[state.shippingEntityType]?.length || 0, 0));
    text('#shipping-source-count', sourceOnlineCount(snapshot.sourceStatus?.shipping));
    text('#shipping-updated', age(snapshot.generatedAt));
    renderShippingSources($('#shipping-source-strip'), snapshot.sourceStatus?.shipping);
    renderShippingDetail($('#shipping-detail'), state.shippingSelection);
  }

  async select(type, id, focus = true, { live = true } = {}) {
    const snapshot = this.store.getState().shippingSnapshot;
    const basic = snapshot?.[type]?.find(item => item.id === id) || null;
    if (basic) { this.store.setState({ shippingSelection: { ...basic, kind: type.slice(0, -1).toUpperCase() } }, 'shipping.selection_preview'); this.render(); if (focus) this.map.focus(type, basic); }
    if (!live) return;
    try {
      let detail;
      if (type === 'ports') detail = await this.api.shippingPort({ id, hours: this.store.getState().shippingFilters.hours });
      else if (type === 'chokepoints') detail = await this.api.shippingChokepoint({ id, hours: this.store.getState().shippingFilters.hours });
      else if (type === 'routes') detail = await this.api.shippingRoute({ id, hours: this.store.getState().shippingFilters.hours });
      else detail = await this.api.shippingCommodity({ id, hours: this.store.getState().shippingFilters.hours, timeframe: '1d' });
      const normalized = type === 'commodities' ? { ...detail, ...detail.commodity, name: detail.commodity?.name, risk: { score: detail.supplyRisk, confidence: null, evidenceCount: (detail.routes?.length || 0) + (detail.chokepoints?.length || 0), band: Number.isFinite(detail.supplyRisk) ? (detail.supplyRisk >= 80 ? 'CRITICAL' : detail.supplyRisk >= 60 ? 'HIGH' : detail.supplyRisk >= 40 ? 'ELEVATED' : detail.supplyRisk >= 20 ? 'GUARDED' : 'LOW') : 'N/A' }, kind: 'COMMODITY' } : { ...detail, kind: type.slice(0, -1).toUpperCase() };
      this.store.setState({ shippingSelection: normalized }, 'shipping.selection_loaded'); this.render();
    } catch (error) { displayError(error); }
  }

  async runTrade() {
    clearError(); const button = $('#shipping-trade-run'); if (button) { button.disabled = true; button.textContent = '...'; }
    try {
      const payload = await this.api.shippingTrade({ reporterCode: $('#shipping-trade-reporter').value, period: $('#shipping-trade-period').value, flowCode: $('#shipping-trade-flow').value, commodityCode: $('#shipping-trade-commodity').value, transportCode: $('#shipping-trade-mode').value, limit: 500 }, { timeoutMs: 35_000 });
      this.renderTrade(payload);
    } catch (error) { displayError(error); }
    finally { if (button) { button.disabled = false; button.textContent = 'RUN'; } }
  }

  renderTrade(payload) {
    text('#shipping-trade-records', number(payload.records?.length || 0)); text('#shipping-trade-hhi', number(payload.partnerConcentration?.hhi, 0)); text('#shipping-trade-top1', Number.isFinite(payload.partnerConcentration?.top1Pct) ? `${number(payload.partnerConcentration.top1Pct, 1)}%` : 'N/A');
    const root = $('#shipping-trade-rows');
    root.innerHTML = (payload.byPartner || []).slice(0, 20).map(item => `<div class="shipping-trade-row"><strong>${escapeHtml(item.key)}</strong><span>$${number(item.valueUsd, 0)}</span><span>${number(item.sharePct, 2)}%</span><small>${number(item.records)}</small></div>`).join('') || '<div class="shipping-empty">0 RECORDS</div>';
  }
}
