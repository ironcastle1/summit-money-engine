import { CandleChart } from './candle-chart.js';
import { MarketMetricPanel } from './metric-panel.js';
import { MarketSourceStrip } from './market-source-strip.js';
import { MarketTable } from './market-table.js';
import { MarketWatchlist } from './watchlist.js';
import { TimeframeMatrix } from './timeframe-matrix.js';

export class MarketController {
  constructor(options) {
    this.api = options.api;
    this.store = options.store;
    this.initialized = false;
    this.loading = false;
    this.watchlist = new MarketWatchlist();
    this.chart = new CandleChart(document.querySelector('#market-chart'));
    this.metrics = new MarketMetricPanel();
    this.sources = new MarketSourceStrip(document.querySelector('#market-source-status'));
    this.table = new MarketTable({ container: document.querySelector('#market-results'), onSelect: assetId => this.select(assetId) });
    this.timeframes = new TimeframeMatrix(document.querySelector('#timeframe-matrix'));
  }

  bind() {
    document.querySelector('#market-timeframe').addEventListener('change', event => {
      this.store.setState({ marketTimeframe: event.target.value }, 'market.timeframe');
      this.refresh();
    });
    document.querySelector('#market-refresh').addEventListener('click', () => this.refresh());
    document.querySelector('#market-watch-toggle').addEventListener('click', () => {
      const id = this.store.getState().selectedMarketAsset;
      if (!id) return;
      const active = this.watchlist.toggle(id);
      this.updateWatchButton(active);
      this.refreshScreener();
    });
    document.querySelector('#market-asset-class').addEventListener('change', event => {
      this.store.setState({ marketAssetClass: event.target.value }, 'market.asset_class');
      this.loadCatalog();
    });
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    await this.loadCatalog();
    await this.refresh();
  }

  async loadCatalog() {
    try {
      const payload = await this.api.marketCatalog({ assetClass: this.store.getState().marketAssetClass || '' });
      this.store.setState({ marketCatalog: payload.assets || [] }, 'market.catalog');
      this.sources.render(payload.sourceHealth || {});
    } catch (error) {
      this.showError(error);
    }
  }

  async refresh() {
    if (this.loading) return;
    this.loading = true;
    this.setLoading(true);
    try {
      await this.refreshScreener();
      const selected = this.store.getState().selectedMarketAsset || this.table.results.find(item => item.available)?.asset?.id || this.watchlist.list()[0];
      if (selected) await this.select(selected, false);
    } finally {
      this.loading = false;
      this.setLoading(false);
    }
  }

  async refreshScreener() {
    const state = this.store.getState();
    const catalog = state.marketCatalog || [];
    let ids = this.watchlist.list();
    if (state.marketAssetClass) {
      const allowed = new Set(catalog.map(asset => asset.id));
      ids = ids.filter(id => allowed.has(id));
      if (!ids.length) ids = catalog.slice(0, 12).map(asset => asset.id);
    }
    try {
      const payload = await this.api.marketScreener({ assets: ids, timeframe: state.marketTimeframe || '1h', limit: Math.min(24, ids.length || 12) }, { timeoutMs: 90_000 });
      this.store.setState({ marketResults: payload.results || [], marketSources: payload.sourceHealth || {} }, 'market.screener');
      this.table.setResults(payload.results || []);
      this.sources.render(payload.sourceHealth || {});
      document.querySelector('#market-result-count').textContent = `${payload.availableCount || 0}/${payload.requestedCount || 0}`;
      document.querySelector('#market-generated-at').textContent = payload.generatedAt ? new Date(payload.generatedAt).toLocaleTimeString('en-GB') : '--';
    } catch (error) {
      this.showError(error);
    }
  }

  async select(assetId, updateTable = true) {
    this.store.setState({ selectedMarketAsset: assetId }, 'market.selected');
    if (updateTable) this.table.setSelected(assetId);
    this.updateWatchButton(this.watchlist.has(assetId));
    const timeframe = this.store.getState().marketTimeframe || '1h';
    this.setDetailLoading(true);
    try {
      const [analysis, multi] = await Promise.all([
        this.api.marketAnalysis({ asset: assetId, timeframe, limit: 750 }, { timeoutMs: 60_000 }),
        this.api.marketMultiTimeframe({ asset: assetId }, { timeoutMs: 90_000 }).catch(error => ({ analyses: {}, consensus: { available: false, reason: error.code || 'MULTI_TIMEFRAME_FAILED' } }))
      ]);
      this.store.setState({ marketAnalysis: analysis, marketMultiTimeframe: multi }, 'market.analysis');
      this.metrics.render(analysis);
      this.timeframes.render(multi);
      if (analysis.available && analysis.candles?.length) this.chart.setData(analysis.candles, analysis.asset);
      else this.chart.clear(analysis.reason || 'ANALYSIS UNAVAILABLE');
    } catch (error) {
      this.chart.clear(error.code || 'MARKET ERROR');
      this.metrics.render({ reason: error.code || error.message });
      this.showError(error);
    } finally {
      this.setDetailLoading(false);
    }
  }

  updateWatchButton(active) {
    const button = document.querySelector('#market-watch-toggle');
    button.classList.toggle('active', active);
    button.textContent = active ? 'WATCHING' : 'WATCH';
  }

  setLoading(active) {
    const button = document.querySelector('#market-refresh');
    button.disabled = active;
    button.textContent = active ? 'SCANNING' : 'SCAN';
  }

  setDetailLoading(active) {
    document.querySelector('#market-detail').classList.toggle('loading', active);
  }

  showError(error) {
    const element = document.querySelector('#market-error');
    element.textContent = `${error.code || 'MARKET_ERROR'} / ${error.message}`;
    element.classList.remove('hidden');
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => element.classList.add('hidden'), 8000);
  }
}
