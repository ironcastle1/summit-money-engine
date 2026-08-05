import { MarketIntelligenceApiClient } from './api-client.js';
import { MarketIntelligenceStateStore } from './state-store.js';
import { renderHeatmap } from './heatmap.js';
import { renderScreenerTable } from './screener-table.js';
import { renderAssetDetail } from './detail-panel.js';
import { renderWatchlist } from './watchlist-panel.js';
import { renderScenarioPanel } from './scenario-panel.js';
import { MarketSignalLayer } from './market-layer.js';
import { age } from './format.js';
export class MarketIntelligenceController {
  constructor(options = {}) {
    this.api = options.api || new MarketIntelligenceApiClient();
    this.store = options.store || new MarketIntelligenceStateStore();
    this.layer = new MarketSignalLayer(options.map);
    this.snapshot = null;
    this.catalog = null;
    this.watches = [];
    this.alerts = [];
    this.scenarioResult = null;
    this.loading = false;
    this.active = false;
  }
  async start() {
    const [catalog, watches] = await Promise.all([this.api.catalog(), this.api.watchlist().catch(() => ({ watches: [] }))]);
    this.catalog = catalog; this.watches = watches.watches || [];
    return this;
  }
  async activate() {
    this.active = true;
    if (!this.snapshot) await this.refresh(); else this.render();
  }
  deactivate() { this.active = false; }
  async refresh() {
    if (this.loading) return;
    this.loading = true; this.renderLoading();
    try {
      const state = this.store.get();
      this.snapshot = await this.api.snapshot({ timeframe: state.timeframe, maximumAssets: state.maximumAssets, heatmapMetric: state.heatmapMetric });
      this.layer.setData(this.snapshot.mapFeatures);
      this.render();
    } catch (error) { this.renderError(error); }
    finally { this.loading = false; }
  }
  select(assetId) { this.store.set({ selectedAssetId: assetId }); this.renderDetail(); }
  async addWatch(assetId) {
    const item = this.snapshot?.assets?.find(asset => asset.asset?.id === assetId); if (!item) return;
    const watch = await this.api.addWatch({ assetId, symbol: item.asset.symbol, minimumOpportunity: 60, maximumRisk: 75, minimumMovePercent: 2 });
    this.watches = [...this.watches.filter(value => value.id !== watch.id), watch]; this.renderWatchlist();
  }
  async removeWatch(id) { await this.api.removeWatch(id); this.watches = this.watches.filter(value => value.id !== id); this.renderWatchlist(); }
  async refreshAlerts() { const result = await this.api.alerts(); this.alerts = result.alerts || []; this.renderWatchlist(); }
  async runScenario(shock) {
    const positions = (this.watches.length ? this.watches : this.snapshot?.assets?.slice(0, 5).map(item => ({ assetId: item.asset.id, symbol: item.asset.symbol })) || []).map(item => ({ assetId: item.assetId, symbol: item.symbol, marketValue: 10_000 }));
    this.scenarioResult = await this.api.scenario({ positions, shocks: [{ targetType: 'ASSET_CLASS', ...shock }] }); this.renderScenario();
  }
  renderLoading() {
    const content = document.getElementById('sheet-content'); if (content) content.innerHTML = '<div class="mi-loading"><span></span><strong>BUILDING MARKET INTELLIGENCE SNAPSHOT</strong></div>';
  }
  renderError(error) {
    const content = document.getElementById('sheet-content'); if (content) content.innerHTML = `<div class="mi-error"><strong>MARKET INTELLIGENCE UNAVAILABLE</strong><span>${error.message}</span><button type="button" data-mi-retry>RETRY</button></div>`;
    content?.querySelector('[data-mi-retry]')?.addEventListener('click', () => this.refresh());
  }
  render() {
    if (!this.active || !this.snapshot) return;
    const summary = document.getElementById('sheet-summary'); const content = document.getElementById('sheet-content');
    document.getElementById('sheet-kicker').textContent = 'PRICE / EVENTS / PREDICTIONS / RISK';
    document.getElementById('sheet-title').textContent = 'MARKET INTELLIGENCE';
    summary.innerHTML = [['ASSETS', this.snapshot.availableAssets, 'analysed'], ['REGIME', this.snapshot.regime?.regime, `${Math.round(this.snapshot.regime?.confidence || 0)} confidence`], ['BREADTH', Math.round(this.snapshot.breadth?.score || 0), this.snapshot.breadth?.state], ['OPPORTUNITIES', this.snapshot.opportunities?.filter(item => item.tier !== 'PASS').length || 0, 'ranked'], ['UPDATED', age(this.snapshot.generatedAt), this.snapshot.cache]].map(item => `<div class="summary-metric"><span>${item[0]}</span><strong>${item[1]}</strong><small>${item[2]}</small></div>`).join('');
    content.innerHTML = '<div class="mi-shell"><section class="mi-toolbar"><button type="button" data-mi-refresh>REFRESH</button><select data-mi-timeframe><option value="1h">1 HOUR</option><option value="4h">4 HOURS</option><option value="1d">1 DAY</option><option value="1w">1 WEEK</option></select><input data-mi-query type="search" placeholder="FILTER ASSETS"><label>MIN OPPORTUNITY<input data-mi-min-opportunity type="number" min="0" max="100" value="0"></label></section><div class="mi-layout"><div><section class="mi-panel"><header><h2>MARKET HEATMAP</h2></header><div data-mi-heatmap></div></section><section class="mi-panel"><header><h2>INTELLIGENCE SCREENER</h2></header><div data-mi-table></div></section></div><aside><div class="mi-panel" data-mi-detail></div><div class="mi-panel" data-mi-watchlist></div><div class="mi-panel" data-mi-scenario></div></aside></div></div>';
    const timeframe = content.querySelector('[data-mi-timeframe]'); timeframe.value = this.store.get().timeframe;
    content.querySelector('[data-mi-refresh]').addEventListener('click', () => this.refresh());
    timeframe.addEventListener('change', () => { this.store.set({ timeframe: timeframe.value }); this.refresh(); });
    content.querySelector('[data-mi-query]').addEventListener('input', event => this.renderTable(event.target.value));
    content.querySelector('[data-mi-min-opportunity]').addEventListener('input', event => { this.store.set({ filters: { ...this.store.get().filters, minimumOpportunity: Number(event.target.value) } }); this.renderTable(); });
    renderHeatmap(content.querySelector('[data-mi-heatmap]'), this.snapshot.heatmap, id => this.select(id));
    this.renderTable(); this.renderDetail(); this.renderWatchlist(); this.renderScenario();
  }
  renderTable(query = '') {
    const root = document.querySelector('[data-mi-table]'); if (!root || !this.snapshot) return;
    const minimum = this.store.get().filters.minimumOpportunity || 0;
    const assets = this.snapshot.assets.filter(item => (!query || `${item.asset.symbol} ${item.asset.name}`.toLowerCase().includes(query.toLowerCase())) && Number(item.opportunity?.score || 0) >= minimum).sort((a, b) => Number(b.opportunity?.score || 0) - Number(a.opportunity?.score || 0));
    renderScreenerTable(root, assets, id => this.select(id), id => this.addWatch(id));
  }
  renderDetail() { const id = this.store.get().selectedAssetId; const item = this.snapshot?.assets?.find(asset => asset.asset?.id === id) || this.snapshot?.assets?.[0]; renderAssetDetail(document.querySelector('[data-mi-detail]'), item); }
  renderWatchlist() { renderWatchlist(document.querySelector('[data-mi-watchlist]'), this.watches, this.alerts, { remove: id => this.removeWatch(id), refreshAlerts: () => this.refreshAlerts() }); }
  renderScenario() { renderScenarioPanel(document.querySelector('[data-mi-scenario]'), this.catalog, this.scenarioResult, { run: shock => this.runScenario(shock) }); }
}
