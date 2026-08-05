const STORAGE_KEY = 'merlin.market-intelligence.v20';
const defaults = Object.freeze({ timeframe: '1d', maximumAssets: 30, heatmapMetric: 'changePercent', selectedAssetId: null, filters: { minimumOpportunity: 0, maximumRisk: 100, minimumLiquidity: 0, sortBy: 'opportunityScore', sortDirection: 'desc' } });
export class MarketIntelligenceStateStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.restore();
  }
  restore() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { ...defaults }; }
  }
  get() { return this.state; }
  set(patch) {
    this.state = { ...this.state, ...patch };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch {}
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
