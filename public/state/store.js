const initialState = Object.freeze({
  config: null,
  map: null,
  activeView: 'map',
  point: { lat: 51.5074, lon: -0.1278 },
  radiusKm: 250,
  windowDays: 30,
  globalEvents: [],
  localEvents: [],
  sourceStatus: {},
  scan: null,
  location: null,
  categories: new Set(),
  routesVisible: false,
  clustersVisible: true,
  loading: false,
  lastError: null,
  searchResults: [],
  marketCatalog: [],
  marketResults: [],
  marketSources: {},
  marketAnalysis: null,
  marketTimeframe: '1h',
  marketAssetClass: '',
  selectedMarketAsset: 'btc-usd',
  opportunities: [],
  opportunityPayload: null,
  selectedOpportunityId: null,
  opportunityFilters: { timeframe: '1h', minimumScore: 45, minimumConfidence: 35, maximumRisk: 85, kinds: [], search: '' },
  replaySettings: { asset: 'btc-usd', timeframe: '1h', strategy: 'TREND_PULLBACK', capital: 10000, risk: 1, fee: 0.1, slippage: 0.05, stopAtr: 1.8, targetAtr: 3, holdingBars: 48, folds: 4, allowShort: true },
  replayResult: null,
  shippingCatalog: null,
  shippingSnapshot: null,
  shippingSelection: null,
  shippingEntityType: 'ports',
  shippingFilters: { hours: 48, minimumRisk: 0, commodity: '', search: '' },
  shippingMap: null
});

export function createStore(seed = {}) {
  let state = { ...initialState, ...seed };
  const listeners = new Set();
  return Object.freeze({
    getState: () => state,
    setState(patch, reason = 'update') {
      const previous = state;
      state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
      for (const listener of listeners) listener(state, previous, reason);
      return state;
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  });
}
