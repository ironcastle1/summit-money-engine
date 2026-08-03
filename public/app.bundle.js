/* MERLIN CLIENT BUNDLE — generated; edit source modules, not this file. */

'use strict';

const __modules = Object.create(null);

// MODULE: state/store.js
__modules['state/store.js'] = (() => {

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

function createStore(seed = {}) {
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

return Object.freeze({createStore});
})();

// MODULE: markets/direct-market-data.js
__modules['markets/direct-market-data.js'] = (() => {

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const IDS = Object.freeze({
  'btc-usd': 'bitcoin',
  'eth-usd': 'ethereum',
  'sol-usd': 'solana',
  'ada-usd': 'cardano',
  'avax-usd': 'avalanche-2',
  'bnb-usd': 'binancecoin',
  'doge-usd': 'dogecoin',
  'xrp-usd': 'ripple'
});
const TIMEFRAME_MS = Object.freeze({ '15m': 900_000, '1h': 3_600_000, '4h': 14_400_000, '1d': 86_400_000 });
const cache = new Map();

function withTimeout(promise, milliseconds = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);
  return promise(controller.signal).finally(() => clearTimeout(timer));
}

async function fetchJson(url, milliseconds = 12_000) {
  return withTimeout(async signal => {
    const response = await fetch(url, { headers: { accept: 'application/json' }, mode: 'cors', cache: 'no-store', signal });
    if (!response.ok) throw Object.assign(new Error(`CoinGecko HTTP ${response.status}`), { code: `COINGECKO_${response.status}` });
    return response.json();
  }, milliseconds);
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function quantile(values, probability) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index); const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function wilson(successes, total, z = 1.6448536269514722) {
  if (!total) return { lower: null, upper: null };
  const p = successes / total;
  const denominator = 1 + z * z / total;
  const centre = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator;
  return { lower: Math.max(0, centre - margin), upper: Math.min(1, centre + margin) };
}

function rsi(values, period = 14) {
  if (values.length <= period) return null;
  let gains = 0; let losses = 0;
  for (let index = values.length - period; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) gains += change; else losses -= change;
  }
  if (!losses) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function standardDeviation(values) {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) return null;
  const mean = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  return Math.sqrt(finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (finite.length - 1));
}

function movingAverage(values, period) {
  if (values.length < period) return null;
  return values.slice(-period).reduce((sum, value) => sum + value, 0) / period;
}

function bucketCandles(prices, volumes, timeframeId) {
  const requested = TIMEFRAME_MS[timeframeId] || TIMEFRAME_MS['1h'];
  // CoinGecko's free historical feed is normally hourly. Never pretend hourly
  // observations are fifteen-minute candles.
  const interval = Math.max(requested, TIMEFRAME_MS['1h']);
  const volumeMap = new Map((volumes || []).map(([timestamp, volume]) => [Number(timestamp), Number(volume)]));
  const buckets = new Map();
  for (const row of prices || []) {
    const timestamp = Number(row?.[0]); const price = Number(row?.[1]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(price)) continue;
    const key = Math.floor(timestamp / interval) * interval;
    const current = buckets.get(key);
    if (!current) buckets.set(key, { timestamp: key, open: price, high: price, low: price, close: price, volume: Number(volumeMap.get(timestamp)) || 0 });
    else {
      current.high = Math.max(current.high, price); current.low = Math.min(current.low, price); current.close = price;
      current.volume = Math.max(current.volume, Number(volumeMap.get(timestamp)) || 0);
    }
  }
  return [...buckets.values()].sort((a, b) => a.timestamp - b.timestamp).map(item => [item.timestamp, item.open, item.high, item.low, item.close, item.volume]);
}

function empiricalOutcome(candles, horizonBars) {
  const closes = candles.map(row => Number(row[4]));
  const returns = [];
  for (let index = 0; index + horizonBars < closes.length; index += 1) {
    if (closes[index] > 0) returns.push(closes[index + horizonBars] / closes[index] - 1);
  }
  if (returns.length < 30) return { available: false, sampleSize: returns.length };
  const rises = returns.filter(value => value > 0).length;
  const probability = rises / returns.length;
  const interval = wilson(rises, returns.length);
  return {
    available: true,
    riseProbability: probability,
    probabilityRange90: interval,
    medianReturn: median(returns),
    returnRange80: { lower: quantile(returns, 0.1), upper: quantile(returns, 0.9) },
    sampleSize: returns.length,
    confidence: Math.round(Math.min(92, 34 + Math.log10(returns.length + 1) * 22))
  };
}

function analyse(asset, quote, candles, timeframeId) {
  const closes = candles.map(row => Number(row[4])).filter(Number.isFinite);
  if (candles.length < 140) return {
    asset, quote, timeframe: timeframeId, available: false, reason: 'INSUFFICIENT_DIRECT_HISTORY',
    candleCount: candles.length, requiredCandleCount: 140, candles, generatedAt: new Date().toISOString(),
    source: { quote: { id: 'coingecko-direct' }, candles: { id: 'coingecko-direct' } }
  };
  const returns = closes.slice(1).map((value, index) => closes[index] > 0 ? value / closes[index] - 1 : null).filter(Number.isFinite);
  const ma20 = movingAverage(closes, 20); const ma50 = movingAverage(closes, 50);
  const volatility = standardDeviation(returns.slice(-60));
  const atr = median(candles.slice(-14).map(row => Number(row[4]) > 0 ? (Number(row[2]) - Number(row[3])) / Number(row[4]) : null));
  const outcomes = [1, 6, 24].map(horizonBars => ({ label: `${horizonBars}${timeframeId === '1d' ? 'd' : timeframeId === '4h' ? '×4h' : 'h'}`, ...empiricalOutcome(candles, horizonBars) }));
  const primary = outcomes.find(item => item.available) || outcomes[0];
  const riseProbability = Number(primary?.riseProbability);
  const confidence = Number(primary?.confidence) || 0;
  const trend = ma20 && ma50 ? (ma20 > ma50 * 1.005 ? 'UP' : ma20 < ma50 * 0.995 ? 'DOWN' : 'SIDEWAYS') : 'N/A';
  const direction = riseProbability >= 0.56 ? 'RISE' : riseProbability <= 0.44 ? 'FALL' : 'NEUTRAL';
  const opportunityScore = Number.isFinite(riseProbability) ? Math.round(Math.min(100, Math.abs(riseProbability - 0.5) * 180 * confidence / 70)) : null;
  const riskScore = Number.isFinite(volatility) ? Math.round(Math.min(100, volatility * 1000)) : null;
  return {
    asset, quote, timeframe: timeframeId, available: Boolean(primary?.available), reason: primary?.available ? null : 'INSUFFICIENT_DIRECT_HISTORY',
    candleCount: candles.length,
    firstCandleAt: new Date(candles[0][0]).toISOString(), lastCandleAt: new Date(candles.at(-1)[0]).toISOString(),
    generatedAt: new Date().toISOString(), candles,
    feature: { rsi14: rsi(closes), atrPct: atr, ma20, ma50 },
    regime: { trend, volatility: Number.isFinite(volatility) ? (volatility > 0.035 ? 'HIGH' : volatility > 0.015 ? 'MEDIUM' : 'LOW') : 'N/A' },
    outcomes,
    opportunity: { direction, score: opportunityScore }, risk: { score: riskScore },
    source: { quote: { id: 'coingecko-direct' }, candles: { id: 'coingecko-direct' } },
    model: 'EMPIRICAL_HISTORY'
  };
}

function publicAsset(assetId, catalog = []) {
  const found = catalog.find(item => item.id === assetId);
  if (found) return found;
  const symbol = String(assetId).split('-')[0].toUpperCase();
  return { id: assetId, symbol, name: symbol, assetClass: 'crypto', quoteCurrency: 'USD', sourceIds: ['coingecko-direct'] };
}

async function priceSnapshot(assetIds, catalog = []) {
  const supported = assetIds.filter(id => IDS[id]);
  if (!supported.length) return [];
  const ids = supported.map(id => IDS[id]).join(',');
  const payload = await fetchJson(`${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`, 10_000);
  return supported.map(assetId => {
    const row = payload[IDS[assetId]] || {};
    const asset = publicAsset(assetId, catalog);
    const price = Number(row.usd); const change = Number(row.usd_24h_change);
    return {
      asset,
      quote: { assetId, symbol: asset.symbol, price: Number.isFinite(price) ? price : null, change24h: Number.isFinite(change) ? change / 100 : null, quoteVolume24h: Number(row.usd_24h_vol) || null, quoteCurrency: 'USD', marketTime: Number(row.last_updated_at) * 1000 || Date.now(), receivedAt: new Date().toISOString() },
      timeframe: '1h', available: false, reason: 'QUOTE_ONLY', candleCount: 0,
      source: { quote: { id: 'coingecko-direct' }, candles: { id: 'N/A' } }
    };
  });
}

async function history(assetId, timeframeId, catalog = []) {
  const coinId = IDS[assetId];
  if (!coinId) throw Object.assign(new Error('Direct history is available for supported crypto assets only'), { code: 'DIRECT_UNSUPPORTED' });
  const key = `${assetId}:30d`;
  let payload = cache.get(key);
  if (!payload || Date.now() - payload.cachedAt > 120_000) {
    const data = await fetchJson(`${COINGECKO_BASE}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=30`, 15_000);
    payload = { ...data, cachedAt: Date.now() };
    cache.set(key, payload);
  }
  const candles = bucketCandles(payload.prices, payload.total_volumes, timeframeId);
  const last = candles.at(-1)?.[4]; const previous = candles.length > 24 ? candles.at(-25)?.[4] : candles[0]?.[4];
  const asset = publicAsset(assetId, catalog);
  const quote = { assetId, symbol: asset.symbol, price: Number(last), change24h: previous > 0 ? last / previous - 1 : null, quoteVolume24h: candles.at(-1)?.[5] || null, quoteCurrency: 'USD', marketTime: candles.at(-1)?.[0] || Date.now(), receivedAt: new Date().toISOString() };
  return analyse(asset, quote, candles, timeframeId);
}

function createDirectMarketData({ catalog = () => [] } = {}) {
  return Object.freeze({
    async screener(params = {}) {
      const ids = Array.isArray(params.assets) ? params.assets : String(params.assets || '').split(',').filter(Boolean);
      const selected = ids.length ? ids : Object.keys(IDS);
      const results = await priceSnapshot(selected, catalog());
      return { timeframe: params.timeframe || '1h', requestedCount: selected.length, availableCount: results.filter(item => Number.isFinite(item.quote?.price)).length, results, generatedAt: new Date().toISOString(), sourceHealth: { 'coingecko-direct': { id: 'coingecko-direct', name: 'CoinGecko Direct', state: 'ONLINE', configured: true, recordCount: results.length } } };
    },
    analysis: (params = {}) => history(params.asset, params.timeframe || '1h', catalog()),
    async multi(params = {}) {
      const timeframes = ['1h', '4h', '1d'];
      const analyses = {};
      for (const timeframe of timeframes) {
        try { analyses[timeframe] = await history(params.asset, timeframe, catalog()); }
        catch (error) { analyses[timeframe] = { timeframe, available: false, reason: error.code || 'DIRECT_FAILED' }; }
      }
      return { assetId: params.asset, analyses, consensus: { available: Object.values(analyses).some(item => item.available), source: 'COINGECKO_DIRECT' }, generatedAt: new Date().toISOString() };
    }
  });
}

return Object.freeze({createDirectMarketData});
})();

// MODULE: fallback/local-intelligence.js
__modules['fallback/local-intelligence.js'] = (() => {

const DAY_MS = 86_400_000;
let eventPromise;

function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function round(value, digits = 0) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }

function haversine(a, b) {
  const toRad = value => value * Math.PI / 180;
  const lat1 = toRad(Number(a.lat)); const lat2 = toRad(Number(b.lat));
  const dLat = lat2 - lat1; const dLon = toRad(Number(b.lon) - Number(a.lon));
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function wilson(successes, total, z = 1.6448536269514722) {
  if (!total) return [0, 100];
  const p = successes / total; const denominator = 1 + z * z / total;
  const centre = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator;
  return [round(clamp((centre - margin) * 100, 0, 100)), round(clamp((centre + margin) * 100, 0, 100))];
}

async function loadFallbackEvents() {
  eventPromise ||= fetch('/data/fallback-events.json', { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error(`Fallback events HTTP ${response.status}`);
    return response.json();
  }).then(payload => Array.isArray(payload.events) ? payload.events : []);
  return eventPromise;
}

async function localEvents(params = {}) {
  const days = clamp(Number(params.days) || 30, 1, 30);
  const limit = clamp(Number(params.limit) || 2000, 1, 5000);
  const cutoff = Date.now() - days * DAY_MS;
  const categories = new Set(Array.isArray(params.categories) ? params.categories : String(params.categories || '').split(',').filter(Boolean));
  const all = await loadFallbackEvents();
  const events = all.filter(event => Date.parse(event.time) >= cutoff && (!categories.size || categories.has(event.category))).slice(0, limit);
  const health = { id: 'snapshot', name: 'Local verified snapshot', state: 'ONLINE', configured: true, recordCount: all.length, weight: 2, stale: false };
  return { events, sources: { snapshot: health }, rawCount: all.length, totalCount: all.length, filteredCount: events.length, generatedAt: new Date().toISOString(), fallback: true };
}

async function localScan(params = {}) {
  const point = { lat: finite(params.lat) ?? 51.5074, lon: finite(params.lon) ?? -0.1278 };
  const radiusKm = clamp(finite(params.radiusKm) ?? 250, 25, 2500);
  const all = await loadFallbackEvents();
  const now = Date.now();
  const local = all.map(event => ({ ...event, distanceKm: haversine(point, event) }))
    .filter(event => event.distanceKm <= radiusKm && now - Date.parse(event.time) <= 30 * DAY_MS)
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const recent = days => local.filter(event => now - Date.parse(event.time) <= days * DAY_MS);
  const day1 = recent(1); const day7 = recent(7); const day30 = recent(30);
  const activeDays = new Set(day30.map(event => Math.floor((now - Date.parse(event.time)) / DAY_MS))).size;
  const alpha = activeDays + 0.5; const beta = 30 - activeDays + 0.5;
  const probability = alpha / (alpha + beta);
  const prior7 = local.filter(event => now - Date.parse(event.time) > 7 * DAY_MS && now - Date.parse(event.time) <= 14 * DAY_MS).length;
  const activityChange = prior7 ? (day7.length / prior7 - 1) * 100 : day7.length ? 100 : 0;
  const nearest = day30.length ? Math.min(...day30.map(event => event.distanceKm)) : null;
  const severities = day30.map(event => finite(event.severity)).filter(Number.isFinite);
  const meanSeverity = severities.length ? severities.reduce((a, b) => a + b, 0) / severities.length : 0;
  const area = Math.PI * radiusKm * radiusKm;
  const newestTime = day30.length ? Math.max(...day30.map(event => Date.parse(event.time)).filter(Number.isFinite)) : null;
  const confidence = clamp(18 + Math.log10(day30.length + 1) * 24, 18, 82);
  const health = { id: 'snapshot', name: 'Local verified snapshot', state: 'ONLINE', configured: true, recordCount: all.length, weight: 2, stale: false };
  return {
    point: { ...point, radiusKm },
    metrics: {
      eventProbability24h: round(probability * 100), probabilityRange90: wilson(activeDays, 30),
      expectedNextEventHours: probability > 0 ? round(24 / probability) : null,
      activityChangePct: round(clamp(activityChange, -100, 999), 1), activityDirection: activityChange > 10 ? 'RISING' : activityChange < -10 ? 'FALLING' : 'FLAT',
      proximityRiskIndex: nearest === null ? 0 : round(clamp(100 * (1 - nearest / radiusKm), 0, 100)),
      severityIndex: round(clamp(meanSeverity * 12, 0, 100)), meanSeverity: round(meanSeverity, 2),
      eventCount24h: day1.length, eventCount7d: day7.length, eventCount30d: day30.length,
      activeDays30d: activeDays, dailyEventRate: round(day30.length / 30, 2),
      densityPer10kKm2: round(area ? day30.length / area * 10_000 : 0, 3),
      sourceCoveragePct: 100, sourceCount: 1, localSourceCount: day30.length ? 1 : 0,
      confidencePct: round(confidence), dataAgeMinutes: newestTime ? round((now - newestTime) / 60_000) : null,
      freshnessBand: newestTime ? 'SNAPSHOT' : 'NONE', sampleSize: day30.length, observationDays: 30,
      estimateSupported: true, estimatePrior: { alpha: 0.5, beta: 0.5 }
    },
    events: local.slice(0, clamp(Number(params.limit) || 1000, 1, 1000)),
    sourceStatus: { snapshot: health }, generatedAt: new Date().toISOString(), snapshotAgeMs: 0,
    location: { name: `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`, country: 'Selected area', displayName: `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`, source: 'LOCAL_COORDINATES' },
    fallback: true
  };
}

return Object.freeze({loadFallbackEvents, localEvents, localScan});
})();

// MODULE: fallback/preloads.js
__modules['fallback/preloads.js'] = (() => {

const cache = new Map();

async function load(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`Preload HTTP ${response.status}`);
      return response.json();
    }));
  }
  return cache.get(path);
}

const preloadNews = () => load('/data/preload-news.json');
const preloadShippingCatalog = () => load('/data/preload-shipping-catalog.json');
const preloadShipping = () => load('/data/preload-shipping.json');
const preloadIntelligenceCatalog = () => load('/data/preload-intelligence-catalog.json');
const preloadIntelligence = () => load('/data/preload-intelligence.json');
const preloadMarketsCatalog = () => load('/data/preload-markets-catalog.json');
const preloadMarkets = () => load('/data/preload-markets.json');
const preloadOpportunities = () => load('/data/preload-opportunities.json');

return Object.freeze({preloadNews, preloadShippingCatalog, preloadShipping, preloadIntelligenceCatalog, preloadIntelligence, preloadMarketsCatalog, preloadMarkets, preloadOpportunities});
})();

// MODULE: api/client.js
__modules['api/client.js'] = (() => {
const { createDirectMarketData } = __modules['markets/direct-market-data.js'];
const { localEvents, localScan } = __modules['fallback/local-intelligence.js'];
const { preloadNews, preloadShippingCatalog, preloadShipping, preloadIntelligenceCatalog, preloadIntelligence, preloadMarketsCatalog, preloadMarkets, preloadOpportunities } = __modules['fallback/preloads.js'];



class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status || 0;
    this.code = options.code || 'API_ERROR';
    this.requestId = options.requestId || null;
    this.details = options.details || null;
  }
}

function createApiClient(options = {}) {
  const baseUrl = options.baseUrl || '';
  const timeoutMs = options.timeoutMs || 20_000;
  let csrfToken = null;
  let marketCatalogCache = [];
  const directMarkets = createDirectMarketData({ catalog: () => marketCatalogCache });

  async function get(path, params = {}, requestOptions = {}) {
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) url.searchParams.set(key, value.join(','));
      else url.searchParams.set(key, String(value));
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestOptions.timeoutMs || timeoutMs);
    try {
      const response = await fetch(url, { headers: { accept: 'application/json', 'x-client-version': '17.1.0-merlin' }, credentials: 'same-origin', signal: requestOptions.signal || controller.signal, cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const error = body?.error || {};
        throw new ApiError(error.message || `HTTP ${response.status}`, { status: response.status, code: error.code, requestId: error.requestId, details: error.details });
      }
      return body;
    } catch (error) {
      if (error.name === 'AbortError') throw new ApiError('Request timed out', { code: 'TIMEOUT' });
      throw error;
    } finally { clearTimeout(timeout); }
  }



  async function resilientEvents(params = {}) {
    try {
      const payload = await get('/api/events', params);
      if (Array.isArray(payload?.events) && (payload.events.length || Number(payload.totalCount) > 0)) return payload;
    } catch {}
    return localEvents(params);
  }

  async function resilientScan(params = {}) {
    try {
      const payload = await get('/api/scan', params);
      if (payload?.metrics?.estimateSupported && Number.isFinite(Number(payload.metrics.eventProbability24h))) return payload;
    } catch {}
    return localScan(params);
  }

  async function resilientMarketCatalog(params = {}) {
    const payload = await get('/api/markets/catalog', params);
    marketCatalogCache = Array.isArray(payload?.assets) ? payload.assets : marketCatalogCache;
    return payload;
  }

  async function resilientMarketScreener(params = {}, requestOptions = {}) {
    let serverPayload = null;
    let serverError = null;
    try { serverPayload = await get('/api/markets/screener', params, requestOptions); }
    catch (error) { serverError = error; }
    const serverHasAnalysis = serverPayload?.results?.some?.(item => item.available);
    const serverHasQuotes = serverPayload?.results?.some?.(item => Number.isFinite(item?.quote?.price));
    if (serverHasAnalysis) return serverPayload;
    try {
      const direct = await directMarkets.screener(params);
      if (direct.results?.length) return direct;
    } catch {}
    if (serverHasQuotes) return serverPayload;
    if (serverError) throw serverError;
    return serverPayload || { timeframe: params.timeframe || '1h', requestedCount: 0, availableCount: 0, results: [], sourceHealth: {}, generatedAt: new Date().toISOString() };
  }

  async function resilientMarketAnalysis(params = {}, requestOptions = {}) {
    let serverPayload = null;
    let serverError = null;
    try { serverPayload = await get('/api/markets/analyse', params, requestOptions); }
    catch (error) { serverError = error; }
    if (serverPayload?.available && serverPayload?.candles?.length >= 140) return serverPayload;
    try { return await directMarkets.analysis(params); }
    catch {}
    if (serverPayload) return serverPayload;
    if (serverError) throw serverError;
    throw new ApiError('No market data source is available', { code: 'MARKET_UNAVAILABLE' });
  }

  async function resilientMarketMulti(params = {}, requestOptions = {}) {
    let serverPayload = null;
    try { serverPayload = await get('/api/markets/multi-timeframe', params, requestOptions); }
    catch {}
    if (serverPayload?.consensus?.available) return serverPayload;
    try { return await directMarkets.multi(params); }
    catch {}
    return serverPayload || { assetId: params.asset, analyses: {}, consensus: { available: false, reason: 'MARKET_UNAVAILABLE' }, generatedAt: new Date().toISOString() };
  }

  async function post(path, body, requestOptions = {}) {
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestOptions.timeoutMs || timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'x-client-version': '17.1.0-merlin', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(body || {}),
        credentials: 'same-origin',
        signal: requestOptions.signal || controller.signal,
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const error = payload?.error || {};
        throw new ApiError(error.message || `HTTP ${response.status}`, { status: response.status, code: error.code, requestId: error.requestId, details: error.details });
      }
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') throw new ApiError('Request timed out', { code: 'TIMEOUT' });
      throw error;
    } finally { clearTimeout(timeout); }
  }

  return Object.freeze({
    config: () => get('/api/config'),
    health: () => get('/api/health'),
    diagnostics: () => get('/api/diagnostics'),
    sources: () => get('/api/sources'),
    events: params => resilientEvents(params),
    scan: params => resilientScan(params),
    search: params => get('/api/search', params),
    reverse: params => get('/api/reverse', params),
    routes: () => get('/api/routes'),
    marketCatalog: params => preloadMarketsCatalog().catch(() => resilientMarketCatalog(params)),
    marketCatalogLive: params => resilientMarketCatalog(params),
    marketSources: () => get('/api/markets/sources'),
    marketQuote: params => get('/api/markets/quote', params),
    marketCandles: params => get('/api/markets/candles', params),
    marketAnalysis: (params, requestOptions) => resilientMarketAnalysis(params, requestOptions),
    marketScreener: (params, requestOptions) => preloadMarkets().catch(() => resilientMarketScreener(params, requestOptions)),
    marketScreenerLive: (params, requestOptions) => resilientMarketScreener(params, requestOptions),
    marketMultiTimeframe: (params, requestOptions) => resilientMarketMulti(params, requestOptions),
    newsSources: () => get('/api/news/sources'),
    news: () => preloadNews(),
    newsLive: (params, requestOptions) => get('/api/news', params, requestOptions),
    newsStory: params => get('/api/news/story', params),
    shippingCatalog: () => preloadShippingCatalog(),
    shippingCatalogLive: params => get('/api/shipping/catalog', params),
    shippingSources: () => get('/api/shipping/sources'),
    shippingSnapshot: () => preloadShipping(),
    shippingSnapshotLive: (params, requestOptions) => get('/api/shipping/snapshot', params, requestOptions),
    shippingPort: params => get('/api/shipping/port', params),
    shippingChokepoint: params => get('/api/shipping/chokepoint', params),
    shippingRoute: params => get('/api/shipping/route', params),
    shippingImpact: params => get('/api/shipping/impact', params),
    shippingTrade: (params, requestOptions) => get('/api/shipping/trade', params, requestOptions),
    shippingCommodity: params => get('/api/shipping/commodity', params),
    intelligenceCatalog: () => preloadIntelligenceCatalog(),
    intelligenceCatalogLive: params => get('/api/intelligence/catalog', params),
    intelligenceSources: () => get('/api/intelligence/sources'),
    intelligenceOverview: () => preloadIntelligence(),
    intelligenceOverviewLive: (params, requestOptions) => get('/api/intelligence/overview', params, requestOptions),
    intelligenceCountry: (params, requestOptions) => get('/api/intelligence/country', params, requestOptions),
    intelligenceCity: (params, requestOptions) => get('/api/intelligence/city', params, requestOptions),
    intelligencePoint: (params, requestOptions) => get('/api/intelligence/point', params, requestOptions),
    intelligenceCrime: params => get('/api/intelligence/crime', params),
    intelligenceElections: params => get('/api/intelligence/elections', params),
    predictionMarkets: params => get('/api/prediction-markets', params),
    opportunities: () => preloadOpportunities(),
    opportunitiesLive: (params, requestOptions) => get('/api/opportunities', params, requestOptions),
    marketReplay: (params, requestOptions) => get('/api/replay/market', params, requestOptions),
    evaluateAlerts: (body, requestOptions) => post('/api/alerts/evaluate', body, requestOptions),
    setCsrfToken: value => { csrfToken = value || null; },
    authSession: () => get('/api/auth/session'),
    register: body => post('/api/auth/register', body),
    login: body => post('/api/auth/login', body),
    logout: () => post('/api/auth/logout', {}),
    updateProfile: body => post('/api/account/profile', body),
    changePassword: body => post('/api/account/password', body),
    billingPlans: () => get('/api/billing/plans'),
    billingSubscription: () => get('/api/billing/subscription'),
    createCheckout: body => post('/api/billing/checkout', body),
    userData: bucket => get(`/api/user-data/${encodeURIComponent(bucket)}`),
    saveUserData: (bucket, value) => post(`/api/user-data/${encodeURIComponent(bucket)}`, { value }),
    adminMetrics: () => get('/api/admin/metrics'),
    adminUsers: params => get('/api/admin/users', params),
    adminAudit: params => get('/api/admin/audit', params),
    adminSetRole: (userId, role) => post(`/api/admin/users/${encodeURIComponent(userId)}/role`, { role }),
    adminSetStatus: (userId, status) => post(`/api/admin/users/${encodeURIComponent(userId)}/status`, { status }),
    adminGrantPlan: (userId, body) => post(`/api/admin/users/${encodeURIComponent(userId)}/subscription`, body),
    opsHealth: () => get('/api/ops/health'),
    opsQuality: () => get('/api/ops/quality'),
    opsBuild: () => get('/api/ops/build'),
    opsMetrics: () => get('/api/ops/metrics'),
    opsClientReports: () => get('/api/ops/client-reports'),
    reportClientMetric: body => post('/api/ops/client-report', body)
  });
}

return Object.freeze({ApiError, createApiClient});
})();

// MODULE: ui/format.js
__modules['ui/format.js'] = (() => {

function percent(value, options = {}) {
  if (!Number.isFinite(value)) return 'N/A';
  const digits = options.digits ?? 0;
  const sign = options.sign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

function number(value, digits = 0) {
  return Number.isFinite(value) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : 'N/A';
}

function coordinate(value) {
  return Number.isFinite(value) ? Number(value).toFixed(4) : 'N/A';
}

function age(value, now = Date.now()) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'N/A';
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}H`;
  return `${Math.round(hours / 24)}D`;
}

function durationHours(value) {
  if (!Number.isFinite(value)) return 'N/A';
  if (value < 1) return '<1H';
  if (value < 48) return `${Math.round(value)}H`;
  return `${Math.round(value / 24)}D`;
}

function upper(value, fallback = 'N/A') {
  const text = String(value || '').trim();
  return text ? text.toUpperCase() : fallback;
}

return Object.freeze({percent, number, coordinate, age, durationHours, upper});
})();

// MODULE: map/fallback-world-map.js
__modules['map/fallback-world-map.js'] = (() => {

const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function finiteCoordinate(item) { return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lon)); }
function safeText(value) { return String(value ?? '').replace(/[<>]/g, ''); }
function svgElement(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

function categoryColour(item, set) {
  const category = String(item?.category || '').toLowerCase();
  if (category === 'earthquake') {
    const magnitude = Number(item?.magnitude ?? item?.severity);
    if (Number.isFinite(magnitude)) {
      if (magnitude >= 6) return '#ff4d5d';
      if (magnitude >= 5) return '#ff7a45';
      if (magnitude >= 3.5) return '#ffc857';
      if (magnitude >= 2) return '#63d7ff';
      return '#8db5c8';
    }
    return '#63d7ff';
  }
  const colours = {
    volcano: '#ff7a45', wildfire: '#ff9f43', storm: '#ad91ff', flood: '#37b9ff', drought: '#d7a84a',
    landslide: '#c08457', ice: '#8ee8ff', conflict: '#ef4444', protest: '#f4b942', terror: '#ff2f4b',
    crime: '#a3e635', infrastructure: '#f97316', transport: '#38bdf8', energy: '#facc15', economic: '#42d392',
    health: '#ec4899', port: '#42d392', chokepoint: '#f4b942', country: '#ffb44a', city: '#68bde6'
  };
  return item?.colour || item?.color || colours[category] || (set === 'local' ? '#ffb44a' : '#56bde9');
}

function markerRadius(item, set, zoom) {
  const category = String(item?.category || '').toLowerCase();
  if (category === 'earthquake') {
    const magnitude = Number(item?.magnitude ?? item?.severity);
    const base = Number.isFinite(magnitude) ? clamp(1.7 + magnitude * 0.72, 2, 8) : 3;
    return clamp(base + (zoom - 1) * 0.18, 2, 10);
  }
  const raw = Number(item?.markerSize ?? item?.severity ?? item?.risk ?? 1);
  const normalized = Number.isFinite(raw) ? (raw > 5 ? raw / 20 : raw) : 1;
  return clamp((set === 'local' ? 3.8 : 3) + normalized * .9 + (zoom - 1) * .16, 3, 11);
}

function eventKey(item, index, set) { return String(item?.id || item?.sourceId || `${set}-${index}`); }
function titleFor(item) { return item?.title || item?.name || item?.category || 'Event'; }

class FallbackWorldMap {
  constructor({ container, onSelect, onEvent, initialPoint, initialZoom = 1 } = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    if (!this.container) throw new Error('Map container was not found');
    this.onSelect = onSelect;
    this.onEvent = onEvent;
    this.center = finiteCoordinate(initialPoint) ? { lat: Number(initialPoint.lat), lon: Number(initialPoint.lon) } : { lat: 0, lon: 0 };
    this.zoom = clamp(Math.round(Number(initialZoom) || 1), MIN_ZOOM, MAX_ZOOM);
    this.centerPoint = null;
    this.radiusKm = 250;
    this.globalEvents = [];
    this.localEvents = [];
    this.routes = { type: 'FeatureCollection', features: [] };
    this.routesVisible = false;
    this.clustersVisible = false;
    this.layerState = { events: true, heat: true, grid: false };
    this.size = { width: 1200, height: 600 };
    this.eventLookup = new Map();
    this.routeLookup = new Map();
    this.drag = null;
    this.#renderShell();
    this.resize();
    this.#renderAll();
  }

  #renderShell() {
    this.container.replaceChildren();
    this.container.classList.add('fallback-map-active', 'local-detailed-map');

    this.base = document.createElement('img');
    this.base.className = 'local-detailed-base';
    this.base.src = '/assets/world-base.svg?v=17.1.0';
    this.base.alt = 'Detailed political world map';
    this.base.draggable = false;

    this.overlay = svgElement('svg', { class: 'local-detailed-overlay', role: 'img', 'aria-label': 'Interactive intelligence map' });
    this.gridLayer = svgElement('g', { class: 'local-grid-layer' });
    this.heatLayer = svgElement('g', { class: 'local-heat-layer' });
    this.routeLayer = svgElement('g', { class: 'local-route-layer' });
    this.globalLayer = svgElement('g', { class: 'local-global-layer' });
    this.localLayer = svgElement('g', { class: 'local-local-layer' });
    this.scanLayer = svgElement('g', { class: 'local-scan-layer' });
    this.overlay.append(this.gridLayer, this.heatLayer, this.routeLayer, this.globalLayer, this.localLayer, this.scanLayer);

    this.hitSurface = document.createElement('div');
    this.hitSurface.className = 'local-detailed-hit-surface';
    this.container.append(this.base, this.overlay, this.hitSurface);

    this.controls = document.createElement('div');
    this.controls.className = 'local-map-controls local-detailed-controls';
    this.controls.innerHTML = [
      '<button type="button" data-local-map="zoom-in" aria-label="Zoom in">+</button>',
      '<button type="button" data-local-map="zoom-out" aria-label="Zoom out">−</button>',
      '<button type="button" data-local-map="home" aria-label="World view">◎</button>',
      '<button type="button" data-local-map="layers" aria-label="Map layers">≡</button>'
    ].join('');
    this.container.append(this.controls);

    this.layerPanel = document.createElement('div');
    this.layerPanel.className = 'detailed-layer-panel hidden';
    this.layerPanel.innerHTML = `
      <strong>MAP OVERLAYS</strong>
      <button type="button" data-layer="events" class="active">EVENTS</button>
      <button type="button" data-layer="heat" class="active">DENSITY</button>
      <button type="button" data-layer="grid">GRID</button>
      <small>LOCAL POLITICAL BASE / ALL MAGNITUDES</small>`;
    this.container.append(this.layerPanel);

    this.status = document.createElement('div');
    this.status.className = 'local-map-status local-detailed-status';
    this.container.append(this.status);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'local-map-tooltip hidden';
    this.container.append(this.tooltip);

    this.attribution = document.createElement('div');
    this.attribution.className = 'detailed-map-attribution';
    this.attribution.textContent = 'MERLIN LOCAL VECTOR BASE';
    this.container.append(this.attribution);

    this.controls.addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.localMap;
      if (action === 'zoom-in') this.setZoom(this.zoom + 1);
      if (action === 'zoom-out') this.setZoom(this.zoom - 1);
      if (action === 'home') { this.center = { lat: 0, lon: 0 }; this.zoom = 1; this.#renderAll(); }
      if (action === 'layers') this.layerPanel.classList.toggle('hidden');
    });

    this.layerPanel.addEventListener('click', event => {
      const button = event.target.closest('[data-layer]');
      if (!button) return;
      const layer = button.dataset.layer;
      this.layerState[layer] = !this.layerState[layer];
      button.classList.toggle('active', this.layerState[layer]);
      this.#renderAll({ base: false });
    });

    this.hitSurface.addEventListener('wheel', event => {
      event.preventDefault();
      const point = this.#eventLatLon(event);
      this.#zoomAround(point, clamp(this.zoom + (event.deltaY < 0 ? 1 : -1), MIN_ZOOM, MAX_ZOOM), event);
    }, { passive: false });

    this.hitSurface.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY, center: { ...this.center }, moved: false };
      this.hitSurface.setPointerCapture?.(event.pointerId);
      this.container.classList.add('dragging');
    });
    this.hitSurface.addEventListener('pointermove', event => {
      if (!this.drag) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.drag.moved = true;
      const rect = this.#worldRect(this.drag.center);
      const lonPerPixel = 360 / rect.width;
      const latPerPixel = 180 / rect.height;
      this.center = this.#clampCenter({ lat: this.drag.center.lat + dy * latPerPixel, lon: this.drag.center.lon - dx * lonPerPixel });
      this.#renderAll();
    });
    const finish = event => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      this.drag = null;
      this.hitSurface.releasePointerCapture?.(event.pointerId);
      this.container.classList.remove('dragging');
      if (!moved) this.onSelect?.(this.#eventLatLon(event));
    };
    this.hitSurface.addEventListener('pointerup', finish);
    this.hitSurface.addEventListener('pointercancel', finish);

    this.overlay.addEventListener('click', event => {
      const marker = event.target.closest('[data-event-key]');
      if (marker) {
        event.stopPropagation();
        const item = this.eventLookup.get(marker.dataset.eventKey);
        if (item) { this.#selectMarker(marker); this.onEvent?.(item); }
        return;
      }
      const cluster = event.target.closest('[data-cluster-lat]');
      if (cluster) {
        event.stopPropagation();
        this.flyTo({ lat: Number(cluster.dataset.clusterLat), lon: Number(cluster.dataset.clusterLon) }, { zoom: Math.min(this.zoom + 2, MAX_ZOOM) });
        return;
      }
      const route = event.target.closest('[data-route-key]');
      if (route) {
        event.stopPropagation();
        const feature = this.routeLookup.get(route.dataset.routeKey);
        if (feature) this.onEvent?.({
          id: feature.properties?.id, entityType: 'routes', title: feature.properties?.name || 'Shipping route', category: 'ROUTE',
          source: Number.isFinite(Number(feature.properties?.risk)) ? `RISK ${Number(feature.properties.risk).toFixed(0)}` : 'SHIPPING CORRIDOR',
          geometry: feature.geometry, properties: feature.properties
        });
      }
    });
    this.overlay.addEventListener('pointermove', event => this.#updateTooltip(event));
    this.overlay.addEventListener('pointerleave', () => this.tooltip.classList.add('hidden'));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.boundWindowResize = () => this.resize();
    window.addEventListener('resize', this.boundWindowResize, { passive: true });
  }

  #baseSize() {
    const width = this.size.width;
    return { width, height: width / 2 };
  }

  #worldRect(center = this.center) {
    const base = this.#baseSize();
    const scale = 2 ** (this.zoom - 1);
    const width = base.width * scale;
    const height = base.height * scale;
    const centerX = (Number(center.lon) + 180) / 360 * width;
    const centerY = (90 - Number(center.lat)) / 180 * height;
    return { width, height, left: this.size.width / 2 - centerX, top: this.size.height / 2 - centerY };
  }

  #clampCenter(point) {
    const scale = 2 ** (this.zoom - 1);
    const lonLimit = Math.max(0, 180 - 180 / scale);
    const latLimit = Math.max(0, 85 - 80 / scale);
    return { lon: clamp(Number(point.lon), -lonLimit, lonLimit), lat: clamp(Number(point.lat), -latLimit, latLimit) };
  }

  #project(point) {
    const rect = this.#worldRect();
    return {
      x: rect.left + (Number(point.lon) + 180) / 360 * rect.width,
      y: rect.top + (90 - Number(point.lat)) / 180 * rect.height
    };
  }

  #unproject(x, y) {
    const rect = this.#worldRect();
    return {
      lon: clamp((x - rect.left) / rect.width * 360 - 180, -180, 180),
      lat: clamp(90 - (y - rect.top) / rect.height * 180, -90, 90)
    };
  }

  #eventLatLon(event) {
    const box = this.container.getBoundingClientRect();
    return this.#unproject(event.clientX - box.left, event.clientY - box.top);
  }

  #zoomAround(anchor, nextZoom, event) {
    if (nextZoom === this.zoom) return;
    const box = this.container.getBoundingClientRect();
    const cursor = { x: event.clientX - box.left, y: event.clientY - box.top };
    this.zoom = nextZoom;
    const base = this.#baseSize();
    const scale = 2 ** (this.zoom - 1);
    const width = base.width * scale;
    const height = base.height * scale;
    const anchorWorld = { x: (anchor.lon + 180) / 360 * width, y: (90 - anchor.lat) / 180 * height };
    const desiredCenterWorld = { x: anchorWorld.x - (cursor.x - this.size.width / 2), y: anchorWorld.y - (cursor.y - this.size.height / 2) };
    this.center = this.#clampCenter({ lon: desiredCenterWorld.x / width * 360 - 180, lat: 90 - desiredCenterWorld.y / height * 180 });
    this.#renderAll();
  }

  setZoom(value) {
    const next = clamp(Math.round(Number(value)), MIN_ZOOM, MAX_ZOOM);
    if (next === this.zoom) return;
    this.zoom = next;
    this.center = this.#clampCenter(this.center);
    this.#renderAll();
  }

  #renderBase() {
    const rect = this.#worldRect();
    Object.assign(this.base.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  }

  #renderGrid() {
    this.gridLayer.replaceChildren();
    if (!this.layerState.grid) return;
    const interval = this.zoom >= 6 ? 5 : this.zoom >= 4 ? 10 : 30;
    for (let lon = -180; lon <= 180; lon += interval) {
      const a = this.#project({ lon, lat: -85 }); const b = this.#project({ lon, lat: 85 });
      this.gridLayer.append(svgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'detailed-grid-line' }));
    }
    for (let lat = -60; lat <= 60; lat += interval) {
      const a = this.#project({ lon: -180, lat }); const b = this.#project({ lon: 180, lat });
      this.gridLayer.append(svgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'detailed-grid-line' }));
    }
  }

  #routeSegments(coordinates) {
    const segments = [[]];
    for (let index = 0; index < coordinates.length; index += 1) {
      const current = coordinates[index];
      if (index && Math.abs(Number(current[0]) - Number(coordinates[index - 1][0])) > 180) segments.push([]);
      segments.at(-1).push(current);
    }
    return segments.filter(segment => segment.length > 1);
  }

  #renderRoutes() {
    this.routeLayer.replaceChildren();
    this.routeLookup.clear();
    if (!this.routesVisible) return;
    for (const [index, feature] of (this.routes?.features || []).entries()) {
      if (feature.geometry?.type !== 'LineString') continue;
      const key = String(feature.properties?.id || `route-${index}`);
      this.routeLookup.set(key, feature);
      for (const segment of this.#routeSegments(feature.geometry.coordinates || [])) {
        const points = segment.map(([lon, lat]) => this.#project({ lon, lat }));
        const path = svgElement('path', {
          d: points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '),
          class: 'detailed-route', stroke: feature.properties?.colour || feature.properties?.color || '#39bfff',
          'data-route-key': key, 'data-map-title': feature.properties?.name || 'Route',
          'data-map-meta': Number.isFinite(Number(feature.properties?.risk)) ? `RISK ${Number(feature.properties.risk).toFixed(0)}` : 'SHIPPING CORRIDOR'
        });
        this.routeLayer.append(path);
      }
    }
  }

  #eligibleEvents(set) {
    const events = set === 'local' ? this.localEvents : this.globalEvents;
    return events.filter(finiteCoordinate).slice(0, set === 'local' ? 1500 : 6000);
  }

  #renderEvents(set) {
    const layer = set === 'local' ? this.localLayer : this.globalLayer;
    const eligible = this.#eligibleEvents(set);
    layer.replaceChildren();
    if (!this.layerState.events) return;

    // Individual earthquakes remain visible at world scale. Clustering is only
    // used for exceptionally dense non-earthquake sets.
    const shouldCluster = set === 'global' && this.clustersVisible && this.zoom === 1 && eligible.length > 4500;
    if (shouldCluster) {
      const groups = new Map();
      for (const [index, item] of eligible.entries()) {
        const p = this.#project(item);
        const key = `${Math.floor(p.x / 24)}:${Math.floor(p.y / 24)}`;
        const group = groups.get(key) || { x: 0, y: 0, lat: 0, lon: 0, count: 0, items: [] };
        group.x += p.x; group.y += p.y; group.lat += Number(item.lat); group.lon += Number(item.lon); group.count += 1; group.items.push([item, index]);
        groups.set(key, group);
      }
      for (const group of groups.values()) {
        if (group.count < 4) { group.items.forEach(([item, index]) => this.#appendMarker(layer, item, index, set)); continue; }
        const x = group.x / group.count; const y = group.y / group.count;
        const circle = svgElement('circle', { cx: x, cy: y, r: clamp(6 + Math.log2(group.count) * 1.4, 7, 18), class: 'detailed-cluster', 'data-cluster-lat': group.lat / group.count, 'data-cluster-lon': group.lon / group.count, 'data-map-title': `${group.count} EVENTS`, 'data-map-meta': 'CLICK TO EXPAND' });
        const label = svgElement('text', { x, y: y + 3, class: 'detailed-cluster-label', 'text-anchor': 'middle', 'pointer-events': 'none' });
        label.textContent = String(group.count);
        layer.append(circle, label);
      }
      return;
    }
    eligible.forEach((item, index) => this.#appendMarker(layer, item, index, set));
  }

  #appendMarker(layer, item, index, set) {
    const p = this.#project(item);
    if (p.x < -25 || p.y < -25 || p.x > this.size.width + 25 || p.y > this.size.height + 25) return;
    const key = eventKey(item, index, set);
    this.eventLookup.set(key, item);
    const colour = categoryColour(item, set);
    const radius = markerRadius(item, set, this.zoom);
    const category = String(item.category || '').toLowerCase();
    const group = svgElement('g', { class: `detailed-event-marker detailed-event-${category || 'other'}`, 'data-event-key': key, tabindex: 0 });
    if (category === 'earthquake' && Number(item.magnitude) >= 4.5) group.append(svgElement('circle', { cx: p.x, cy: p.y, r: radius * 1.9, fill: colour, class: 'detailed-event-pulse', opacity: .13 }));
    group.append(svgElement('circle', {
      cx: p.x, cy: p.y, r: radius, fill: colour, class: 'detailed-event-core', 'data-event-key': key,
      'data-map-title': titleFor(item),
      'data-map-meta': [String(item.category || '').toUpperCase(), item.source, Number.isFinite(Number(item.magnitude)) ? `M${Number(item.magnitude).toFixed(1)}` : Number.isFinite(Number(item.severity)) ? `SEV ${Number(item.severity).toFixed(1)}` : ''].filter(Boolean).join(' / ')
    }));
    layer.append(group);
  }

  #renderHeat() {
    this.heatLayer.replaceChildren();
    if (!this.layerState.heat || this.zoom > 5) return;
    const events = [...this.globalEvents, ...this.localEvents].filter(finiteCoordinate).slice(0, 4500);
    for (const item of events) {
      const p = this.#project(item);
      if (p.x < -60 || p.y < -60 || p.x > this.size.width + 60 || p.y > this.size.height + 60) continue;
      const magnitude = Number(item.magnitude ?? item.severity ?? 1);
      const radius = clamp(7 + (Number.isFinite(magnitude) ? magnitude * 2.4 : 3), 8, 28);
      this.heatLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: radius, fill: categoryColour(item, 'global'), class: 'detailed-heat-spot' }));
    }
  }

  #renderScan() {
    this.scanLayer.replaceChildren();
    const point = this.centerPoint || this.center;
    const p = this.#project(point);
    const rect = this.#worldRect();
    const kmPerPixel = Math.max(.01, 40075 * Math.max(.1, Math.cos(Number(point.lat) * Math.PI / 180)) / rect.width);
    const radius = clamp(this.radiusKm / kmPerPixel, 8, Math.max(this.size.width, this.size.height) * 1.5);
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: radius, class: 'detailed-radius' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 12, class: 'detailed-point-halo' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 4, class: 'detailed-point' }));
  }

  #renderStatus() { this.status.textContent = `LOCAL MAP / Z${this.zoom} / ${this.globalEvents.length + this.localEvents.length} MARKERS`; }

  #renderAll({ base = true } = {}) {
    if (base) this.#renderBase();
    this.overlay.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`);
    this.overlay.setAttribute('width', String(this.size.width));
    this.overlay.setAttribute('height', String(this.size.height));
    this.eventLookup.clear();
    this.#renderGrid(); this.#renderHeat(); this.#renderRoutes(); this.#renderEvents('global'); this.#renderEvents('local'); this.#renderScan(); this.#renderStatus();
  }

  #selectMarker(marker) {
    this.overlay.querySelectorAll('.selected').forEach(node => node.classList.remove('selected'));
    marker.closest('.detailed-event-marker')?.classList.add('selected');
  }

  #updateTooltip(event) {
    const target = event.target.closest?.('[data-map-title]');
    if (!target) { this.tooltip.classList.add('hidden'); return; }
    this.tooltip.innerHTML = `<strong>${safeText(target.dataset.mapTitle)}</strong><span>${safeText(target.dataset.mapMeta)}</span>`;
    const box = this.container.getBoundingClientRect();
    this.tooltip.style.left = `${event.clientX - box.left + 14}px`;
    this.tooltip.style.top = `${event.clientY - box.top + 14}px`;
    this.tooltip.classList.remove('hidden');
  }

  updateGeometry(point, radiusKm) {
    if (finiteCoordinate(point)) this.centerPoint = { lat: Number(point.lat), lon: Number(point.lon) };
    this.radiusKm = Number(radiusKm) || this.radiusKm;
    this.#renderScan();
  }
  setEvents(events, set = 'global') {
    if (set === 'local') this.localEvents = Array.isArray(events) ? events : [];
    else this.globalEvents = Array.isArray(events) ? events : [];
    this.eventLookup.clear(); this.#renderHeat(); this.#renderEvents(set); this.#renderStatus();
  }
  setRoutes(collection) { this.routes = collection || { type: 'FeatureCollection', features: [] }; this.#renderRoutes(); }
  setRoutesVisible(visible) { this.routesVisible = Boolean(visible); this.#renderRoutes(); }
  setClustersVisible(visible) { this.clustersVisible = Boolean(visible); this.#renderEvents('global'); }
  flyTo(point, options = {}) {
    if (!finiteCoordinate(point)) return;
    this.center = { lat: Number(point.lat), lon: Number(point.lon) };
    if (Number.isFinite(Number(options.zoom))) this.zoom = clamp(Math.round(Number(options.zoom)), MIN_ZOOM, MAX_ZOOM);
    this.center = this.#clampCenter(this.center);
    this.#renderAll();
  }
  fitBounds(coordinates, options = {}) {
    const points = [];
    const visit = value => {
      if (Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) points.push({ lon: Number(value[0]), lat: Number(value[1]) });
      else if (Array.isArray(value)) value.forEach(visit);
    };
    visit(coordinates);
    if (!points.length) return;
    const minLat = Math.min(...points.map(point => point.lat)); const maxLat = Math.max(...points.map(point => point.lat));
    const minLon = Math.min(...points.map(point => point.lon)); const maxLon = Math.max(...points.map(point => point.lon));
    this.center = { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
    const span = Math.max((maxLon - minLon) / 360, (maxLat - minLat) / 180, .01);
    this.zoom = clamp(Math.floor(1 + Math.log2(.72 / span)), MIN_ZOOM, MAX_ZOOM);
    this.center = this.#clampCenter(this.center);
    this.#renderAll();
  }
  resize() {
    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(320, Math.round(bounds.width || this.container.clientWidth || 1200));
    const height = Math.max(320, Math.round(bounds.height || this.container.clientHeight || 600));
    if (width === this.size.width && height === this.size.height) return;
    this.size = { width, height };
    this.#renderAll();
  }
  destroy() {
    this.resizeObserver?.disconnect?.();
    window.removeEventListener('resize', this.boundWindowResize);
    this.container.replaceChildren();
    this.container.classList.remove('fallback-map-active', 'local-detailed-map', 'dragging');
  }
}

return Object.freeze({FallbackWorldMap});
})();

// MODULE: map/map-controller.js
__modules['map/map-controller.js'] = (() => {
const { age, number, upper } = __modules['ui/format.js'];
const { FallbackWorldMap } = __modules['map/fallback-world-map.js'];


function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function finite(value) { return Number.isFinite(Number(value)); }
function safeLink(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null; }
  catch { return null; }
}

class MapController {
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

return Object.freeze({MapController});
})();

// MODULE: ui/dom.js
__modules['ui/dom.js'] = (() => {

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function text(selector, value, root = document) {
  const node = typeof selector === 'string' ? $(selector, root) : selector;
  if (node) node.textContent = value ?? '';
  return node;
}

function html(selector, value, root = document) {
  const node = typeof selector === 'string' ? $(selector, root) : selector;
  if (node) node.innerHTML = value ?? '';
  return node;
}

function setClass(node, className, enabled) {
  if (!node) return;
  node.classList.toggle(className, Boolean(enabled));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

return Object.freeze({$, $$, text, html, setClass, escapeHtml});
})();

// MODULE: map/theme.js
__modules['map/theme.js'] = (() => {

const CATEGORY_COLOURS = Object.freeze({
  earthquake: '#ff5e68',
  volcano: '#ff7a45',
  wildfire: '#ff9f43',
  storm: '#a78bfa',
  flood: '#37b9ff',
  drought: '#d7a84a',
  landslide: '#c08457',
  ice: '#8ee8ff',
  conflict: '#ef4444',
  protest: '#f4b942',
  terror: '#ff2f4b',
  crime: '#a3e635',
  infrastructure: '#f97316',
  transport: '#38bdf8',
  energy: '#facc15',
  economic: '#42d392',
  health: '#ec4899',
  other: '#94a3b8'
});

function applyMapTheme(map) {
  const style = map.getStyle();
  for (const layer of style.layers || []) {
    const id = String(layer.id || '').toLowerCase();
    try {
      if (layer.type === 'background') map.setPaintProperty(layer.id, 'background-color', '#030a12');
      if (layer.type === 'fill') {
        map.setPaintProperty(layer.id, 'fill-color', id.includes('water') ? '#06121f' : id.includes('park') || id.includes('wood') ? '#0a2630' : '#0b1c2b');
        if (map.getPaintProperty(layer.id, 'fill-opacity') !== undefined) map.setPaintProperty(layer.id, 'fill-opacity', id.includes('building') ? 0.45 : 0.88);
      }
      if (layer.type === 'line') {
        map.setPaintProperty(layer.id, 'line-color', id.includes('boundary') ? '#31516c' : id.includes('water') ? '#124463' : '#15334b');
        if (map.getPaintProperty(layer.id, 'line-opacity') !== undefined) map.setPaintProperty(layer.id, 'line-opacity', 0.72);
      }
      if (layer.type === 'symbol') {
        if (map.getPaintProperty(layer.id, 'text-color') !== undefined) map.setPaintProperty(layer.id, 'text-color', '#7891a6');
        if (map.getPaintProperty(layer.id, 'text-halo-color') !== undefined) map.setPaintProperty(layer.id, 'text-halo-color', '#03101b');
        if (map.getPaintProperty(layer.id, 'text-halo-width') !== undefined) map.setPaintProperty(layer.id, 'text-halo-width', 1.1);
      }
    } catch {}
  }
}

return Object.freeze({CATEGORY_COLOURS, applyMapTheme});
})();

// MODULE: scan/event-list.js
__modules['scan/event-list.js'] = (() => {
const { $, text } = __modules['ui/dom.js'];
const { age, number, upper } = __modules['ui/format.js'];
const { CATEGORY_COLOURS } = __modules['map/theme.js'];



class EventList {
  constructor(options) {
    this.store = options.store;
    this.mapController = options.mapController;
    this.container = $('#event-list');
    this.template = $('#event-row-template');
  }

  render(events) {
    this.container.replaceChildren();
    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '0 EVENTS';
      this.container.append(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const event of events.slice(0, 500)) {
      const row = this.template.content.firstElementChild.cloneNode(true);
      row.style.setProperty('--category-colour', CATEGORY_COLOURS[event.category] || CATEGORY_COLOURS.other);
      text('.event-col-main strong', event.title, row);
      text('.event-col-main small', `${upper(event.category)} / ${upper(event.source)}`, row);
      text('.event-age', age(event.time), row);
      text('.event-distance', Number.isFinite(event.distanceKm) ? number(event.distanceKm) : 'N/A', row);
      text('.event-severity', number(event.severity, 1), row);
      row.addEventListener('click', () => this.mapController.focusEvent(event));
      fragment.append(row);
    }
    this.container.append(fragment);
  }
}

return Object.freeze({EventList});
})();

// MODULE: scan/category-filters.js
__modules['scan/category-filters.js'] = (() => {
const { $, text } = __modules['ui/dom.js'];
const { CATEGORY_COLOURS } = __modules['map/theme.js'];
const { upper } = __modules['ui/format.js'];



class CategoryFilters {
  constructor(options) {
    this.store = options.store;
    this.container = $('#category-filters');
    this.clearButton = $('#clear-category-filters');
    this.clearButton.addEventListener('click', () => {
      this.store.setState({ categories: new Set() }, 'filters.cleared');
      this.render();
      window.dispatchEvent(new CustomEvent('merlin:filters-changed'));
    });
  }

  render() {
    const state = this.store.getState();
    const counts = new Map();
    for (const event of state.localEvents) counts.set(event.category, (counts.get(event.category) || 0) + 1);
    const categories = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    this.container.replaceChildren();
    for (const [category, count] of categories) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-filter${state.categories.has(category) ? ' active' : ''}`;
      button.style.setProperty('--category-colour', CATEGORY_COLOURS[category] || CATEGORY_COLOURS.other);
      button.innerHTML = `<i></i><span>${upper(category)}</span><b>${count}</b>`;
      button.addEventListener('click', () => {
        const next = new Set(this.store.getState().categories);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        this.store.setState({ categories: next }, 'filters.category_toggled');
        this.render();
        window.dispatchEvent(new CustomEvent('merlin:filters-changed'));
      });
      this.container.append(button);
    }
    text(this.clearButton, state.categories.size ? `ALL (${state.categories.size})` : 'ALL');
  }
}

return Object.freeze({CategoryFilters});
})();

// MODULE: scan/metric-renderer.js
__modules['scan/metric-renderer.js'] = (() => {
const { text } = __modules['ui/dom.js'];
const { percent, number, coordinate, durationHours, upper } = __modules['ui/format.js'];


function signedPercent(value) {
  return Number.isFinite(value) ? percent(value, { sign: true }) : 'N/A';
}

function dataAge(scan, metrics) {
  if (Number.isFinite(Number(scan.snapshotAgeMs))) return `${Math.max(0, Math.round(Number(scan.snapshotAgeMs) / 60_000))}M DATA`;
  if (Number.isFinite(Number(metrics.dataAgeMinutes))) return `${number(metrics.dataAgeMinutes)}M EVENT`;
  return 'N/A';
}

function renderScan(scan) {
  const metrics = scan.metrics || {};
  const location = scan.location || {};
  text('#location-name', upper([location.name, location.country].filter(Boolean).join(', '), 'COORDINATES'));
  text('#coordinates', `${coordinate(scan.point.lat)}, ${coordinate(scan.point.lon)}`);
  text('#analysis-radius', `${number(scan.point.radiusKm)} KM`);
  text('#scan-age', dataAge(scan, metrics));
  text('#metric-probability', percent(metrics.eventProbability24h));
  text('#metric-probability-range', metrics.probabilityRange90?.every(Number.isFinite)
    ? `90% ${number(metrics.probabilityRange90[0])}–${number(metrics.probabilityRange90[1])}%`
    : '90% N/A');
  text('#metric-activity', signedPercent(metrics.activityChangePct));
  text('#metric-activity-direction', metrics.activityDirection || 'N/A');
  text('#metric-proximity', number(metrics.proximityRiskIndex));
  text('#metric-severity', number(metrics.severityIndex));
  text('#metric-count-24', number(metrics.eventCount24h));
  text('#metric-rate', `${number(metrics.dailyEventRate, 2)}/D`);
  text('#metric-count-7', number(metrics.eventCount7d));
  text('#metric-count-30', `${number(metrics.eventCount30d)} / 30D`);
  text('#metric-next-event', durationHours(metrics.expectedNextEventHours));
  text('#metric-density', number(metrics.densityPer10kKm2, 3));
  text('#metric-coverage', percent(metrics.sourceCoveragePct));
  text('#metric-source-count', `${number(metrics.sourceCount)} ONLINE / ${number(metrics.localSourceCount)} LOCAL`);
  text('#metric-confidence', percent(metrics.confidencePct));
  text('#metric-sample', `N=${number(metrics.sampleSize)} / D=${number(metrics.observationDays)}`);
  text('#local-event-count', number(scan.events?.length || 0));
}

return Object.freeze({renderScan});
})();

// MODULE: ui/message.js
__modules['ui/message.js'] = (() => {
const { $, setClass } = __modules['ui/dom.js'];

let timer;
function showMapMessage(message, options = {}) {
  const node = $('#map-message');
  clearTimeout(timer);
  node.textContent = message;
  setClass(node, 'hidden', false);
  timer = setTimeout(() => setClass(node, 'hidden', true), options.duration || 4500);
}

return Object.freeze({showMapMessage});
})();

// MODULE: scan/scan-controller.js
__modules['scan/scan-controller.js'] = (() => {
const { renderScan } = __modules['scan/metric-renderer.js'];
const { showMapMessage } = __modules['ui/message.js'];


class ScanController {
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

return Object.freeze({ScanController});
})();

// MODULE: search/search-controller.js
__modules['search/search-controller.js'] = (() => {
const { $, setClass, escapeHtml } = __modules['ui/dom.js'];

function coordinates(query) {
  const match = String(query).trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { lat, lon } : null;
}

class SearchController {
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
    window.dispatchEvent(new CustomEvent('merlin:scan-requested'));
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

return Object.freeze({SearchController});
})();

// MODULE: sources/source-panel.js
__modules['sources/source-panel.js'] = (() => {
const { $, text } = __modules['ui/dom.js'];
const { number } = __modules['ui/format.js'];


function stateClass(value) {
  return String(value || 'OFFLINE').toLowerCase().replaceAll('_', '-');
}

class SourcePanel {
  constructor(options) {
    this.store = options.store;
    this.container = $('#map-source-strip');
  }

  render() {
    const sources = this.store.getState().sourceStatus || {};
    const entries = Object.values(sources);
    const configured = entries.filter(source => source.configured);
    const online = configured.filter(source => source.state === 'ONLINE').length;
    text('#global-source-count', `${online}/${configured.length} SOURCES`);
    this.container.innerHTML = entries.map(source => `
      <span class="source-chip ${stateClass(source.state)}" title="${source.name} / ${source.recordCount || 0} records">
        <i></i><span>${source.id.toUpperCase()}</span><b>${source.state === 'NOT_CONFIGURED' ? 'N/C' : source.recordCount || 0}</b>
      </span>
    `).join('');
  }
}

return Object.freeze({SourcePanel});
})();

// MODULE: sources/diagnostics-drawer.js
__modules['sources/diagnostics-drawer.js'] = (() => {
const { $, escapeHtml } = __modules['ui/dom.js'];
const { number, upper } = __modules['ui/format.js'];


function sourceStateClass(state) { return `state-${String(state || 'offline').toLowerCase()}`; }

function sourceRows(sources, countKey = 'recordCount') {
  return Object.values(sources || {}).map(source => `
    <div class="diagnostic-row">
      <span>${escapeHtml(source.name || source.id)}</span>
      <b class="${sourceStateClass(source.state)}">${escapeHtml(upper(source.state))}</b>
      <b>${number(source[countKey] ?? source.requestCount)}</b>
    </div>`).join('') || '<div class="empty-state">0 SOURCES</div>';
}

class DiagnosticsDrawer {
  constructor(options) { this.api = options.api; this.drawer = $('#diagnostics-drawer'); this.content = $('#diagnostics-content'); }
  bind() {
    $('#diagnostics-toggle').addEventListener('click', () => this.open());
    $('#diagnostics-close').addEventListener('click', () => this.close());
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && this.drawer.classList.contains('open')) this.close(); });
  }
  async open() {
    this.drawer.classList.add('open'); this.drawer.setAttribute('aria-hidden', 'false'); this.content.innerHTML = '<div class="empty-state">LOADING</div>';
    try { this.render(await this.api.diagnostics()); }
    catch (error) { this.content.innerHTML = `<div class="empty-state">${escapeHtml(error.code || 'ERROR')}</div>`; }
  }
  close() { this.drawer.classList.remove('open'); this.drawer.setAttribute('aria-hidden', 'true'); }
  render(data) {
    this.content.innerHTML = `
      <section class="diagnostic-summary">
        <article class="diagnostic-tile"><span>VERSION</span><strong>${escapeHtml(data.version)}</strong></article>
        <article class="diagnostic-tile"><span>UPTIME</span><strong>${number(data.uptimeSeconds)}S</strong></article>
        <article class="diagnostic-tile"><span>RSS</span><strong>${number(data.memoryMb?.rss)}MB</strong></article>
        <article class="diagnostic-tile"><span>CACHE</span><strong>${number(data.cache?.entries)}</strong></article>
        <article class="diagnostic-tile"><span>HITS</span><strong>${number(data.cache?.hits)}</strong></article>
        <article class="diagnostic-tile"><span>ROUTES</span><strong>${number(data.routes?.length)}</strong></article>
      </section>
      <section class="diagnostic-section"><h3>EVENT SOURCES</h3>${sourceRows(data.eventSources || data.sources)}</section>
      <section class="diagnostic-section"><h3>MARKET SOURCES</h3>${sourceRows(data.marketSources, 'requestCount')}</section>
      <section class="diagnostic-section"><h3>CACHE</h3>${Object.entries(data.cache || {}).map(([key, value]) => `<div class="diagnostic-row"><span>${escapeHtml(upper(key))}</span><b>${number(value)}</b><b></b></div>`).join('')}</section>
      <section class="diagnostic-section"><h3>MEMORY MB</h3>${Object.entries(data.memoryMb || {}).map(([key, value]) => `<div class="diagnostic-row"><span>${escapeHtml(upper(key))}</span><b>${number(value)}</b><b></b></div>`).join('')}</section>`;
  }
}

return Object.freeze({DiagnosticsDrawer});
})();

// MODULE: markets/market-format.js
__modules['markets/market-format.js'] = (() => {

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

function marketPrice(value, currency = 'USD') {
  if (!Number.isFinite(value)) return 'N/A';
  const digits = value >= 1000 ? 2 : value >= 1 ? 4 : 6;
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}

function percent(value, digits = 1, signed = false) {
  if (!Number.isFinite(value)) return 'N/A';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

function probability(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'N/A';
}

function score(value) {
  return Number.isFinite(value) ? Math.round(value).toString() : 'N/A';
}

function compactNumber(value) {
  return Number.isFinite(value) ? compact.format(value) : 'N/A';
}

function wholeNumber(value) {
  return Number.isFinite(value) ? integer.format(value) : 'N/A';
}

function age(value) {
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'N/A';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

function stateClass(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'online') return 'positive';
  if (normalized === 'degraded') return 'warning';
  if (normalized === 'offline') return 'negative';
  return 'muted';
}

return Object.freeze({marketPrice, percent, probability, score, compactNumber, wholeNumber, age, stateClass});
})();

// MODULE: markets/candle-chart.js
__modules['markets/candle-chart.js'] = (() => {
const { marketPrice, percent } = __modules['markets/market-format.js'];

const SVG_NS = 'http://www.w3.org/2000/svg';
function node(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function extent(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [0, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = Math.max((max - min) * 0.08, Math.abs(max) * 0.002, 1e-9);
  return [min - pad, max + pad];
}

function movingAverage(values, period) {
  const output = new Array(values.length).fill(null);
  let total = 0;
  for (let index = 0; index < values.length; index += 1) {
    total += values[index];
    if (index >= period) total -= values[index - period];
    if (index >= period - 1) output[index] = total / period;
  }
  return output;
}

class CandleChart {
  constructor(container) {
    this.container = container;
    this.candles = [];
    this.asset = null;
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(container);
  }

  setData(candles, asset) {
    this.candles = (candles || []).map(row => Array.isArray(row) ? { timestamp: row[0], open: row[1], high: row[2], low: row[3], close: row[4], volume: row[5] } : row).slice(-240);
    this.asset = asset;
    this.render();
  }

  clear(message = 'NO MARKET DATA') {
    this.candles = [];
    this.container.innerHTML = `<div class="chart-empty">${message}</div>`;
  }

  render() {
    if (!this.candles.length || this.container.clientWidth < 100) return this.clear();
    const width = Math.max(320, this.container.clientWidth);
    const height = Math.max(260, this.container.clientHeight);
    const margin = { top: 18, right: 72, bottom: 34, left: 12 };
    const volumeHeight = Math.max(42, height * 0.18);
    const priceBottom = height - margin.bottom - volumeHeight - 12;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = priceBottom - margin.top;
    const [minimum, maximum] = extent(this.candles.flatMap(candle => [candle.low, candle.high]));
    const maxVolume = Math.max(...this.candles.map(candle => candle.volume || 0), 1);
    const x = index => margin.left + (index + 0.5) * plotWidth / this.candles.length;
    const y = value => margin.top + (maximum - value) / (maximum - minimum) * plotHeight;
    const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${this.asset?.symbol || ''} price chart` });
    svg.classList.add('candle-svg');

    for (let line = 0; line <= 5; line += 1) {
      const value = minimum + (maximum - minimum) * line / 5;
      const yPosition = y(value);
      svg.append(node('line', { x1: margin.left, x2: width - margin.right, y1: yPosition, y2: yPosition, class: 'chart-grid' }));
      const label = node('text', { x: width - margin.right + 8, y: yPosition + 3, class: 'chart-axis' });
      label.textContent = marketPrice(value, this.asset?.quoteCurrency || 'USD');
      svg.append(label);
    }

    const candleWidth = Math.max(1, Math.min(8, plotWidth / this.candles.length * 0.68));
    this.candles.forEach((candle, index) => {
      const rise = candle.close >= candle.open;
      const group = node('g', { class: rise ? 'candle-up' : 'candle-down' });
      group.append(node('line', { x1: x(index), x2: x(index), y1: y(candle.high), y2: y(candle.low), class: 'candle-wick' }));
      const top = y(Math.max(candle.open, candle.close));
      const bottom = y(Math.min(candle.open, candle.close));
      group.append(node('rect', { x: x(index) - candleWidth / 2, y: top, width: candleWidth, height: Math.max(1, bottom - top), class: 'candle-body' }));
      const volumeTop = height - margin.bottom - (candle.volume || 0) / maxVolume * volumeHeight;
      group.append(node('rect', { x: x(index) - candleWidth / 2, y: volumeTop, width: candleWidth, height: height - margin.bottom - volumeTop, class: 'volume-bar' }));
      svg.append(group);
    });

    const closes = this.candles.map(candle => candle.close);
    const average20 = movingAverage(closes, 20);
    const points = average20.map((value, index) => Number.isFinite(value) ? `${x(index)},${y(value)}` : null).filter(Boolean).join(' ');
    if (points) svg.append(node('polyline', { points, class: 'chart-average' }));

    const first = this.candles[0].close;
    const last = this.candles.at(-1).close;
    const change = first > 0 ? last / first - 1 : null;
    const title = node('text', { x: margin.left + 5, y: margin.top + 12, class: 'chart-title' });
    title.textContent = `${this.asset?.symbol || ''}  ${marketPrice(last, this.asset?.quoteCurrency || 'USD')}  ${percent(change, 2, true)}`;
    svg.append(title);

    const tickCount = Math.min(6, this.candles.length);
    for (let tick = 0; tick < tickCount; tick += 1) {
      const index = Math.round(tick * (this.candles.length - 1) / Math.max(1, tickCount - 1));
      const label = node('text', { x: x(index), y: height - 10, class: 'chart-time', 'text-anchor': tick === 0 ? 'start' : tick === tickCount - 1 ? 'end' : 'middle' });
      label.textContent = new Date(this.candles[index].timestamp).toLocaleString('en-GB', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      svg.append(label);
    }
    this.container.replaceChildren(svg);
  }
}

return Object.freeze({CandleChart});
})();

// MODULE: markets/metric-panel.js
__modules['markets/metric-panel.js'] = (() => {
const { compactNumber, marketPrice, percent, probability, score, wholeNumber } = __modules['markets/market-format.js'];

function put(selector, value, className = '') {
  const element = document.querySelector(selector);
  if (!element) return;
  element.textContent = value;
  element.classList.remove('positive', 'negative', 'warning');
  if (className) element.classList.add(className);
}

class MarketMetricPanel {
  render(analysis) {
    const asset = analysis?.asset || {};
    const outcome = analysis?.outcomes?.[0] || {};
    put('#market-detail-symbol', asset.symbol || 'N/A');
    put('#market-detail-name', asset.name || analysis?.reason || 'NO ANALYSIS');
    put('#market-detail-price', marketPrice(analysis?.quote?.price, asset.quoteCurrency));
    put('#market-detail-change', percent(analysis?.quote?.change24h, 2, true), (analysis?.quote?.change24h || 0) >= 0 ? 'positive' : 'negative');
    put('#market-rise-probability', probability(outcome.riseProbability), outcome.riseProbability >= 0.5 ? 'positive' : 'negative');
    put('#market-probability-range', Number.isFinite(outcome.probabilityRange90?.lower) ? `${probability(outcome.probabilityRange90.lower)}–${probability(outcome.probabilityRange90.upper)}` : 'N/A');
    put('#market-median-return', percent(outcome.medianReturn, 2, true), (outcome.medianReturn || 0) >= 0 ? 'positive' : 'negative');
    put('#market-return-range', Number.isFinite(outcome.returnRange80?.lower) ? `${percent(outcome.returnRange80.lower, 1)} / ${percent(outcome.returnRange80.upper, 1)}` : 'N/A');
    put('#market-opportunity-score', score(analysis?.opportunity?.score));
    put('#market-risk-score', score(analysis?.risk?.score));
    put('#market-confidence', score(outcome.confidence));
    put('#market-sample-size', `N=${wholeNumber(outcome.sampleSize)}`);
    put('#market-regime', analysis?.regime?.trend || 'N/A');
    put('#market-volatility', analysis?.regime?.volatility?.replaceAll('_', ' ') || 'N/A');
    put('#market-rsi', Number.isFinite(analysis?.feature?.rsi14) ? analysis.feature.rsi14.toFixed(1) : 'N/A');
    put('#market-atr', percent(analysis?.feature?.atrPct, 2));
    put('#market-volume', compactNumber(analysis?.quote?.quoteVolume24h));
    put('#market-source', analysis?.source?.candles?.id?.toUpperCase() || 'N/A');
    put('#market-candle-count', wholeNumber(analysis?.candleCount));
    put('#market-history', analysis?.firstCandleAt ? `${new Date(analysis.firstCandleAt).toLocaleDateString('en-GB')}–${new Date(analysis.lastCandleAt).toLocaleDateString('en-GB')}` : 'N/A');
  }
}

return Object.freeze({MarketMetricPanel});
})();

// MODULE: markets/market-source-strip.js
__modules['markets/market-source-strip.js'] = (() => {
const { stateClass } = __modules['markets/market-format.js'];

class MarketSourceStrip {
  constructor(container) { this.container = container; }
  render(sources = {}) {
    this.container.replaceChildren();
    for (const source of Object.values(sources)) {
      const item = document.createElement('span');
      item.className = `market-source-pill ${stateClass(source.state)}`;
      item.innerHTML = `<i></i><b>${source.name || source.id}</b><small>${source.state || 'OFF'}</small>`;
      this.container.append(item);
    }
  }
}

return Object.freeze({MarketSourceStrip});
})();

// MODULE: markets/market-table.js
__modules['markets/market-table.js'] = (() => {
const { marketPrice, percent, probability, score } = __modules['markets/market-format.js'];

class MarketTable {
  constructor(options) {
    this.container = options.container;
    this.onSelect = options.onSelect;
    this.selectedAssetId = null;
    this.results = [];
  }

  setSelected(assetId) {
    this.selectedAssetId = assetId;
    this.render();
  }

  setResults(results) {
    this.results = results || [];
    this.render();
  }

  render() {
    this.container.replaceChildren();
    if (!this.results.length) {
      this.container.innerHTML = '<div class="market-empty">NO RESULTS</div>';
      return;
    }
    for (const result of this.results) {
      const asset = result.asset || {};
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `market-row ${asset.id === this.selectedAssetId ? 'selected' : ''} ${result.available ? '' : 'unavailable'}`;
      const rise = result.outcomes?.[0]?.riseProbability;
      const direction = result.opportunity?.direction;
      row.innerHTML = `
        <span class="market-symbol"><strong>${asset.symbol || '?'}</strong><small>${asset.name || result.reason || 'UNAVAILABLE'}</small></span>
        <span class="market-price"><strong>${marketPrice(result.quote?.price, asset.quoteCurrency)}</strong><small class="${(result.quote?.change24h || 0) >= 0 ? 'positive' : 'negative'}">${percent(result.quote?.change24h, 2, true)}</small></span>
        <span class="market-probability"><strong class="${direction === 'RISE' ? 'positive' : direction === 'FALL' ? 'negative' : ''}">${probability(rise)}</strong><small>${direction || 'N/A'}</small></span>
        <span class="market-score"><strong>${score(result.opportunity?.score)}</strong><small>EDGE</small></span>`;
      row.addEventListener('click', () => this.onSelect?.(asset.id));
      this.container.append(row);
    }
  }
}

return Object.freeze({MarketTable});
})();

// MODULE: markets/watchlist.js
__modules['markets/watchlist.js'] = (() => {

const STORAGE_KEY = 'merlin.market.watchlist.v1';
const DEFAULTS = ['btc-usd', 'eth-usd', 'sol-usd', 'bnb-usd', 'xrp-usd', 'ada-usd', 'doge-usd', 'avax-usd'];

class MarketWatchlist {
  constructor() { this.ids = this.load(); }
  load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(parsed) && parsed.length) return [...new Set(parsed.map(String))].slice(0, 24);
    } catch {}
    return [...DEFAULTS];
  }
  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ids)); }
  list() { return [...this.ids]; }
  has(id) { return this.ids.includes(id); }
  toggle(id) {
    if (this.has(id)) this.ids = this.ids.filter(value => value !== id);
    else this.ids = [...this.ids, id].slice(-24);
    this.save();
    return this.has(id);
  }
  replace(ids) {
    this.ids = [...new Set(ids.map(String))].slice(0, 24);
    this.save();
  }
}

return Object.freeze({MarketWatchlist});
})();

// MODULE: markets/timeframe-matrix.js
__modules['markets/timeframe-matrix.js'] = (() => {
const { percent, probability, score } = __modules['markets/market-format.js'];

class TimeframeMatrix {
  constructor(container) { this.container = container; }
  render(payload) {
    this.container.replaceChildren();
    const order = ['15m', '1h', '4h', '1d'];
    const analyses = payload?.analyses || {};
    for (const timeframe of order) {
      const analysis = analyses[timeframe];
      const outcome = analysis?.outcomes?.[0];
      const row = document.createElement('div');
      row.className = `timeframe-row ${analysis?.available ? '' : 'unavailable'}`;
      row.innerHTML = `<span>${timeframe.toUpperCase()}</span><strong class="${(outcome?.riseProbability || 0) >= .5 ? 'positive' : 'negative'}">${probability(outcome?.riseProbability)}</strong><strong>${percent(outcome?.medianReturn, 2, true)}</strong><strong>${score(outcome?.confidence)}</strong><strong>${score(analysis?.signal?.score)}</strong>`;
      this.container.append(row);
    }
    const consensus = document.querySelector('#market-consensus');
    if (payload?.consensus?.available) {
      consensus.textContent = `${payload.consensus.direction} ${probability(payload.consensus.riseProbability)}`;
      consensus.className = payload.consensus.direction === 'RISE' ? 'positive' : payload.consensus.direction === 'FALL' ? 'negative' : 'warning';
    } else {
      consensus.textContent = 'N/A';
      consensus.className = '';
    }
  }
}

return Object.freeze({TimeframeMatrix});
})();

// MODULE: markets/market-controller.js
__modules['markets/market-controller.js'] = (() => {
const { CandleChart } = __modules['markets/candle-chart.js'];
const { MarketMetricPanel } = __modules['markets/metric-panel.js'];
const { MarketSourceStrip } = __modules['markets/market-source-strip.js'];
const { MarketTable } = __modules['markets/market-table.js'];
const { MarketWatchlist } = __modules['markets/watchlist.js'];
const { TimeframeMatrix } = __modules['markets/timeframe-matrix.js'];






class MarketController {
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
    await this.refreshScreener({ live: false });
    const selected = this.store.getState().selectedMarketAsset || this.table.results[0]?.asset?.id || this.watchlist.list()[0];
    if (selected) this.preview(selected);
    void this.refresh({ background: true });
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

  async refresh({ background = false } = {}) {
    if (this.loading) return;
    this.loading = true;
    if (!background) this.setLoading(true);
    try {
      await this.refreshScreener({ live: true });
      const selected = this.store.getState().selectedMarketAsset || this.table.results.find(item => item.available)?.asset?.id || this.watchlist.list()[0];
      if (selected) { this.preview(selected); void this.select(selected, false); }
    } finally {
      this.loading = false;
      if (!background) this.setLoading(false);
    }
  }

  async refreshScreener({ live = true } = {}) {
    const state = this.store.getState();
    const catalog = state.marketCatalog || [];
    let ids = this.watchlist.list();
    if (state.marketAssetClass) {
      const allowed = new Set(catalog.map(asset => asset.id));
      ids = ids.filter(id => allowed.has(id));
      if (!ids.length) ids = catalog.slice(0, 12).map(asset => asset.id);
    }
    try {
      const method = live ? this.api.marketScreenerLive : this.api.marketScreener;
      const payload = await method({ assets: ids, timeframe: state.marketTimeframe || '1h', limit: Math.min(24, ids.length || 12) }, { timeoutMs: live ? 12_000 : 2_000 });
      this.store.setState({ marketResults: payload.results || [], marketSources: payload.sourceHealth || {} }, 'market.screener');
      this.table.setResults(payload.results || []);
      this.sources.render(payload.sourceHealth || {});
      const visibleCount = (payload.results || []).filter(item => item.available || Number.isFinite(Number(item.quote?.price))).length;
      document.querySelector('#market-result-count').textContent = `${visibleCount}/${payload.requestedCount || (payload.results || []).length}`;
      document.querySelector('#market-generated-at').textContent = payload.generatedAt ? new Date(payload.generatedAt).toLocaleTimeString('en-GB') : '--';
    } catch (error) {
      this.showError(error);
    }
  }


  preview(assetId) {
    const result = (this.store.getState().marketResults || []).find(item => item.asset?.id === assetId) || this.table.results.find(item => item.asset?.id === assetId);
    if (!result) return;
    this.store.setState({ selectedMarketAsset: assetId }, 'market.preview');
    this.table.setSelected(assetId);
    this.metrics.render({ ...result, asset: result.asset, quote: result.quote, source: result.source || {}, outcomes: result.outcomes || [], reason: result.reason });
    this.chart.clear('LOADING VERIFIED HISTORY');
    this.updateWatchButton(this.watchlist.has(assetId));
  }

  async select(assetId, updateTable = true) {
    this.store.setState({ selectedMarketAsset: assetId }, 'market.selected');
    if (updateTable) this.table.setSelected(assetId);
    this.updateWatchButton(this.watchlist.has(assetId));
    const timeframe = this.store.getState().marketTimeframe || '1h';
    this.preview(assetId);
    this.setDetailLoading(true);
    try {
      const [analysis, multi] = await Promise.all([
        this.api.marketAnalysis({ asset: assetId, timeframe, limit: 750 }, { timeoutMs: 15_000 }),
        this.api.marketMultiTimeframe({ asset: assetId }, { timeoutMs: 18_000 }).catch(error => ({ analyses: {}, consensus: { available: false, reason: error.code || 'MULTI_TIMEFRAME_FAILED' } }))
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

return Object.freeze({MarketController});
})();

// MODULE: markets/prediction-controller.js
__modules['markets/prediction-controller.js'] = (() => {
const { compactNumber, probability, percent } = __modules['markets/market-format.js'];
const { escapeHtml } = __modules['ui/dom.js'];


class PredictionController {
  constructor(options) {
    this.api = options.api;
    this.initialized = false;
    this.searchTimer = null;
  }

  bind() {
    document.querySelector('#prediction-refresh').addEventListener('click', () => this.load());
    document.querySelector('#prediction-search').addEventListener('input', event => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.load(event.target.value), 350);
    });
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    await this.load();
  }

  async load(search = '') {
    const button = document.querySelector('#prediction-refresh');
    button.disabled = true;
    button.textContent = 'LOADING';
    try {
      const payload = await this.api.predictionMarkets({ q: search, limit: 60 });
      this.render(payload.markets || []);
      document.querySelector('#prediction-source-state').textContent = payload.source?.stale ? 'STALE' : 'ONLINE';
      document.querySelector('#prediction-source-age').textContent = payload.generatedAt ? new Date(payload.generatedAt).toLocaleTimeString('en-GB') : '--';
    } catch (error) {
      document.querySelector('#prediction-rows').innerHTML = `<div class="prediction-empty">${error.code || 'SOURCE_OFF'} / N/A</div>`;
      document.querySelector('#prediction-source-state').textContent = 'OFF';
    } finally {
      button.disabled = false;
      button.textContent = 'REFRESH';
    }
  }

  render(markets) {
    const container = document.querySelector('#prediction-rows');
    container.replaceChildren();
    document.querySelector('#prediction-count').textContent = String(markets.length);
    for (const market of markets) {
      const row = document.createElement('a');
      row.className = 'prediction-row';
      row.href = market.url || '#';
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.innerHTML = `
        <span class="prediction-question"><strong>${escapeHtml(market.question)}</strong><small>${escapeHtml(market.category.toUpperCase())} · ${market.endDate ? new Date(market.endDate).toLocaleDateString('en-GB') : 'OPEN'}</small></span>
        <span><strong>${probability(market.probability)}</strong><small>YES</small></span>
        <span class="${(market.change24h || 0) >= 0 ? 'positive' : 'negative'}"><strong>${percent(market.change24h, 1, true)}</strong><small>24H</small></span>
        <span><strong>${compactNumber(market.volume)}</strong><small>VOLUME</small></span>
        <span><strong>${compactNumber(market.liquidity)}</strong><small>LIQUIDITY</small></span>`;
      container.append(row);
    }
    if (!markets.length) container.innerHTML = '<div class="prediction-empty">NO MATCHES</div>';
  }
}

return Object.freeze({PredictionController});
})();

// MODULE: export/download.js
__modules['export/download.js'] = (() => {

function filenameSafe(value) {
  return String(value || 'export').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}

function downloadBlob(filename, content, type = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function exportJson(name, value) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadBlob(`${filenameSafe(name)}-${stamp}.json`, `${JSON.stringify(value, null, 2)}\n`, 'application/json;charset=utf-8');
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows, columns) {
  const resolvedColumns = columns?.length ? columns : [...new Set(rows.flatMap(row => Object.keys(row || {})))];
  const lines = [resolvedColumns.map(csvCell).join(',')];
  for (const row of rows) lines.push(resolvedColumns.map(column => csvCell(row?.[column])).join(','));
  return `\ufeff${lines.join('\r\n')}\r\n`;
}

function exportCsv(name, rows, columns) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadBlob(`${filenameSafe(name)}-${stamp}.csv`, rowsToCsv(rows, columns), 'text/csv;charset=utf-8');
}

return Object.freeze({downloadBlob, exportJson, rowsToCsv, exportCsv});
})();

// MODULE: opportunities/controller.js
__modules['opportunities/controller.js'] = (() => {
const { $, $$, escapeHtml, text } = __modules['ui/dom.js'];
const { age, number, percent, upper } = __modules['ui/format.js'];
const { exportCsv, exportJson } = __modules['export/download.js'];



function probability(value) { return Number.isFinite(value) ? percent(value * 100, { digits: 0 }) : 'N/A'; }
function signedPercent(value) { return Number.isFinite(value) ? percent(value * 100, { digits: 2, sign: true }) : 'N/A'; }
function score(value) { return Number.isFinite(value) ? number(value, 1) : 'N/A'; }
function directionClass(direction) { return ['RISE', 'YES'].includes(direction) ? 'positive' : ['FALL', 'NO'].includes(direction) ? 'negative' : 'neutral'; }

function rowHtml(item, selected) {
  return `<button class="opportunity-row ${selected ? 'selected' : ''}" data-id="${escapeHtml(item.id)}" type="button">
    <span class="opportunity-rank">${score(item.score)}</span>
    <span class="opportunity-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle || item.kind)}</small></span>
    <span class="opportunity-kind kind-${item.kind.toLowerCase()}">${escapeHtml(item.kind)}</span>
    <span class="opportunity-direction ${directionClass(item.direction)}">${escapeHtml(item.direction)}</span>
    <span>${probability(item.probability)}</span>
    <span>${score(item.confidence)}</span>
    <span>${escapeHtml(item.evidenceGrade || 'N/A')}</span>
    <span>${age(item.observedAt)}</span>
  </button>`;
}

class OpportunityController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.initialized = false;
    this.loading = false;
    this.abortController = null;
  }

  bind() {
    $('#opportunity-refresh')?.addEventListener('click', () => this.load());
    $('#opportunity-timeframe')?.addEventListener('change', event => { this.updateFilter({ timeframe: event.target.value }); this.load(); });
    $('#opportunity-min-score')?.addEventListener('change', event => { this.updateFilter({ minimumScore: Number(event.target.value) }); this.load(); });
    $('#opportunity-min-confidence')?.addEventListener('change', event => { this.updateFilter({ minimumConfidence: Number(event.target.value) }); this.load(); });
    $('#opportunity-max-risk')?.addEventListener('change', event => { this.updateFilter({ maximumRisk: Number(event.target.value) }); this.load(); });
    $('#opportunity-kind')?.addEventListener('change', event => { this.updateFilter({ kinds: event.target.value ? [event.target.value] : [] }); this.load(); });
    $('#opportunity-search')?.addEventListener('input', event => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => { this.updateFilter({ search: event.target.value }); this.load(); }, 300);
    });
    $('#opportunity-rows')?.addEventListener('click', event => {
      const row = event.target.closest('[data-id]');
      if (row) this.select(row.dataset.id);
    });
    $('#opportunity-export-json')?.addEventListener('click', () => exportJson('merlin-opportunities', this.exportPayload()));
    $('#opportunity-export-csv')?.addEventListener('click', () => exportCsv('merlin-opportunities', this.store.getState().opportunities || [], [
      'id', 'kind', 'title', 'subtitle', 'direction', 'score', 'confidence', 'risk', 'probability', 'expectedMove', 'liquidity', 'evidenceGrade', 'sampleSize', 'sourceCount', 'horizon', 'symbol', 'category', 'observedAt', 'generatedAt'
    ]));
    window.addEventListener('merlin:workspace-restored', () => this.restoreControls());
    this.restoreControls();
  }

  restoreControls() {
    const filters = this.filters();
    if ($('#opportunity-timeframe')) $('#opportunity-timeframe').value = filters.timeframe;
    if ($('#opportunity-min-score')) $('#opportunity-min-score').value = String(filters.minimumScore);
    if ($('#opportunity-min-confidence')) $('#opportunity-min-confidence').value = String(filters.minimumConfidence);
    if ($('#opportunity-max-risk')) $('#opportunity-max-risk').value = String(filters.maximumRisk);
    if ($('#opportunity-kind')) $('#opportunity-kind').value = filters.kinds?.[0] || '';
    if ($('#opportunity-search')) $('#opportunity-search').value = filters.search || '';
  }

  filters() {
    return {
      timeframe: '1h',
      minimumScore: 35,
      minimumConfidence: 35,
      maximumRisk: 100,
      kinds: [],
      search: '',
      ...(this.store.getState().opportunityFilters || {})
    };
  }

  updateFilter(patch) {
    const opportunityFilters = { ...this.filters(), ...patch };
    this.store.setState({ opportunityFilters }, 'opportunities.filters_changed');
  }

  async ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
      this.bind();
      await this.loadPreload();
      void this.load({ background: true });
    }
  }


  applyPayload(payload) {
    if (!payload) return;
    const filters = this.filters();
    const opportunities = (payload.opportunities || []).filter(item =>
      Number(item.score ?? 0) >= filters.minimumScore &&
      Number(item.confidence ?? 0) >= filters.minimumConfidence &&
      (!Number.isFinite(Number(item.risk)) || Number(item.risk) <= filters.maximumRisk) &&
      (!filters.kinds?.length || filters.kinds.includes(item.kind)) &&
      (!filters.search || `${item.title} ${item.subtitle} ${(item.tags || []).join(' ')}`.toLowerCase().includes(filters.search.toLowerCase()))
    );
    const selectedId = opportunities.some(item => item.id === this.store.getState().selectedOpportunityId) ? this.store.getState().selectedOpportunityId : opportunities[0]?.id || null;
    this.store.setState({ opportunities, opportunityPayload: { ...payload, totals: { ...(payload.totals || {}), returned: opportunities.length } }, selectedOpportunityId: selectedId }, 'opportunities.loaded');
    this.render();
    window.dispatchEvent(new CustomEvent('merlin:opportunities-updated', { detail: { opportunities, payload } }));
  }

  async loadPreload() {
    try { this.applyPayload(await this.api.opportunities()); } catch {}
  }

  async load({ background = false } = {}) {
    if (this.loading) this.abortController?.abort();
    this.abortController = new AbortController();
    this.loading = true;
    if (!background) this.setLoading(true);
    const filters = this.filters();
    try {
      const payload = await this.api.opportunitiesLive({
        timeframe: filters.timeframe,
        minimumScore: filters.minimumScore,
        minimumConfidence: filters.minimumConfidence,
        maximumRisk: filters.maximumRisk,
        kinds: filters.kinds,
        q: filters.search,
        limit: 75
      }, { signal: this.abortController.signal, timeoutMs: 40_000 });
      this.applyPayload(payload);
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'TIMEOUT') {
        text('#opportunity-error', `${error.code || 'OPPORTUNITY_ERROR'} / ${error.message}`);
        $('#opportunity-error')?.classList.remove('hidden');
      }
    } finally {
      this.loading = false;
      if (!background) this.setLoading(false);
    }
  }

  setLoading(loading) {
    const button = $('#opportunity-refresh');
    if (button) { button.disabled = loading; button.textContent = loading ? '...' : 'SCAN'; }
    $('#opportunity-workspace')?.classList.toggle('loading', loading);
  }

  select(id) {
    this.store.setState({ selectedOpportunityId: id }, 'opportunities.selected');
    this.renderRows();
    this.renderDetail();
  }

  exportPayload() {
    const state = this.store.getState();
    return { filters: this.filters(), generatedAt: state.opportunityPayload?.generatedAt, totals: state.opportunityPayload?.totals, exposure: state.opportunityPayload?.exposure, opportunities: state.opportunities || [] };
  }

  render() {
    $('#opportunity-error')?.classList.add('hidden');
    const state = this.store.getState();
    const payload = state.opportunityPayload || {};
    text('#opportunity-count', `${state.opportunities?.length || 0}`);
    text('#opportunity-updated', payload.generatedAt ? `${age(payload.generatedAt)} AGO` : '--');
    text('#opportunity-market-count', number(payload.totals?.market || 0));
    text('#opportunity-event-count', number(payload.totals?.events || 0));
    text('#opportunity-prediction-count', number(payload.totals?.predictions || 0));
    text('#opportunity-composite-count', number(payload.totals?.composites || 0));
    text('#opportunity-risk', score(payload.exposure?.weightedRisk));
    text('#opportunity-concentration', score(payload.exposure?.concentrationScore));
    this.renderUpstream(payload.upstream || {});
    this.renderRows();
    this.renderDetail();
  }

  renderUpstream(upstream) {
    const root = $('#opportunity-source-strip');
    if (!root) return;
    root.innerHTML = Object.entries(upstream).map(([name, value]) => `<span class="source-chip ${String(value.state).toLowerCase()}"><i></i>${escapeHtml(name.toUpperCase())} ${escapeHtml(value.state)} ${Number.isFinite(value.count) ? value.count : ''}</span>`).join('');
  }

  renderRows() {
    const root = $('#opportunity-rows');
    if (!root) return;
    const state = this.store.getState();
    const items = state.opportunities || [];
    root.innerHTML = items.length ? items.map(item => rowHtml(item, item.id === state.selectedOpportunityId)).join('') : '<div class="empty-state">0 MATCHES</div>';
  }

  renderDetail() {
    const state = this.store.getState();
    const item = (state.opportunities || []).find(value => value.id === state.selectedOpportunityId);
    const set = (selector, value) => text(selector, value);
    if (!item) {
      ['#op-detail-title', '#op-detail-kind', '#op-detail-score', '#op-detail-probability', '#op-detail-move', '#op-detail-confidence', '#op-detail-risk', '#op-detail-liquidity', '#op-detail-evidence', '#op-detail-sample', '#op-detail-horizon', '#op-detail-age'].forEach(selector => set(selector, 'N/A'));
      $('#op-detail-components').innerHTML = '<div class="empty-state">0 COMPONENTS</div>';
      return;
    }
    set('#op-detail-title', item.title);
    set('#op-detail-kind', `${item.kind} / ${item.direction}`);
    set('#op-detail-score', score(item.score));
    set('#op-detail-probability', probability(item.probability));
    set('#op-detail-move', signedPercent(item.expectedMove));
    set('#op-detail-confidence', score(item.confidence));
    set('#op-detail-risk', score(item.risk));
    set('#op-detail-liquidity', score(item.liquidity));
    set('#op-detail-evidence', `${item.evidenceGrade || 'N/A'} / ${score(item.evidenceScore)}`);
    set('#op-detail-sample', Number.isFinite(item.sampleSize) ? `N=${number(item.sampleSize)}` : 'N/A');
    set('#op-detail-horizon', upper(item.horizon));
    set('#op-detail-age', age(item.observedAt));
    set('#op-detail-sources', (item.sources || []).map(upper).join(' / ') || 'N/A');
    set('#op-detail-tags', (item.tags || []).slice(0, 8).map(upper).join(' / ') || 'N/A');
    const components = item.components || [];
    $('#op-detail-components').innerHTML = components.length ? components.map(component => `<div class="component-row"><span>${escapeHtml(component.kind)}</span><strong>${score(component.score)}</strong><b class="${directionClass(component.direction)}">${escapeHtml(component.direction)}</b></div>`).join('') : '<div class="empty-state">0 COMPONENTS</div>';
  }
}

return Object.freeze({OpportunityController});
})();

// MODULE: news/timeline-chart.js
__modules['news/timeline-chart.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];

function points(values, width, height, padding) {
  const maximum = Math.max(1, ...values);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values.map((value, index) => {
    const x = padding + (values.length <= 1 ? usableWidth / 2 : index / (values.length - 1) * usableWidth);
    const y = padding + usableHeight - value / maximum * usableHeight;
    return [x, y];
  });
}

function linePath(values, width, height, padding) {
  return points(values, width, height, padding).map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

function areaPath(values, width, height, padding) {
  const coordinates = points(values, width, height, padding);
  if (!coordinates.length) return '';
  const baseline = height - padding;
  return `M${coordinates[0][0].toFixed(1)} ${baseline} ${coordinates.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')} L${coordinates.at(-1)[0].toFixed(1)} ${baseline} Z`;
}

function renderTimelineChart(container, timeline) {
  const buckets = timeline?.buckets || [];
  if (!container || !buckets.length) {
    if (container) container.innerHTML = '<div class="news-empty">0 DATA</div>';
    return;
  }
  const width = 900;
  const height = 220;
  const padding = 24;
  const all = buckets.map(bucket => bucket.count);
  const news = buckets.map(bucket => bucket.news);
  const social = buckets.map(bucket => bucket.social);
  const maximum = Math.max(1, ...all);
  const grid = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const y = padding + (height - padding * 2) * (1 - ratio);
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}"/><text x="2" y="${y + 4}">${Math.round(maximum * ratio)}</text>`;
  }).join('');
  const labels = buckets.map((bucket, index) => {
    if (index % Math.max(1, Math.floor(buckets.length / 6)) !== 0 && index !== buckets.length - 1) return '';
    const x = padding + (buckets.length <= 1 ? 0 : index / (buckets.length - 1) * (width - padding * 2));
    const date = new Date(bucket.end);
    return `<text x="${x}" y="${height - 4}" text-anchor="middle">${escapeHtml(date.toISOString().slice(11, 16))}</text>`;
  }).join('');
  container.innerHTML = `<svg class="news-timeline-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Article volume timeline">
    <g class="news-chart-grid">${grid}</g>
    <path class="news-chart-area" d="${areaPath(all, width, height, padding)}"/>
    <path class="news-chart-line all" d="${linePath(all, width, height, padding)}"/>
    <path class="news-chart-line editorial" d="${linePath(news, width, height, padding)}"/>
    <path class="news-chart-line social" d="${linePath(social, width, height, padding)}"/>
    <g class="news-chart-labels">${labels}</g>
  </svg>`;
}

return Object.freeze({renderTimelineChart});
})();

// MODULE: news/source-strip.js
__modules['news/source-strip.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];

function stateClass(state) {
  return state === 'ONLINE' ? 'online' : state === 'DEGRADED' ? 'degraded' : state === 'NOT_CONFIGURED' ? 'not-configured' : 'offline';
}

function renderNewsSourceStrip(container, sources = {}) {
  if (!container) return;
  const entries = Object.values(sources);
  container.innerHTML = entries.map(source => `<div class="news-source-pill ${stateClass(source.state)}" title="${escapeHtml(source.errorCode || source.state)}">
    <i></i><span>${escapeHtml(source.name || source.id)}</span><b>${escapeHtml(source.state)}</b><small>${Number(source.recordCount || 0)}</small>
  </div>`).join('') || '<span class="news-empty-inline">0 SOURCES</span>';
}

return Object.freeze({renderNewsSourceStrip});
})();

// MODULE: news/saved-searches.js
__modules['news/saved-searches.js'] = (() => {

const STORAGE_KEY = 'merlin.news-searches.v1';
const MAX_SEARCHES = 40;

function parse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
function read() {
  const value = parse(localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(value) ? value : [];
}
function write(value) { localStorage.setItem(STORAGE_KEY, JSON.stringify(value.slice(0, MAX_SEARCHES))); }
function identifier() { return globalThis.crypto?.randomUUID?.() || `news-search-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function normalize(input) {
  const now = new Date().toISOString();
  return Object.freeze({
    id: String(input.id || identifier()),
    name: String(input.name || input.query || 'SEARCH').trim().slice(0, 60),
    query: String(input.query || '').trim().slice(0, 240),
    hours: Math.max(1, Math.min(168, Number(input.hours || 24))),
    sourceType: String(input.sourceType || '').toUpperCase(),
    minimumVerification: Math.max(0, Math.min(100, Number(input.minimumVerification || 0))),
    sort: input.sort === 'relevance' ? 'relevance' : 'latest',
    createdAt: input.createdAt || now,
    updatedAt: now,
    runCount: Math.max(0, Number(input.runCount || 0)),
    lastRunAt: input.lastRunAt || null
  });
}

class SavedNewsSearches {
  list() { return read().map(normalize); }
  save(input) {
    const item = normalize(input);
    const items = [item, ...this.list().filter(existing => existing.id !== item.id && existing.name.toLowerCase() !== item.name.toLowerCase())];
    write(items);
    return item;
  }
  remove(id) { write(this.list().filter(item => item.id !== id)); }
  get(id) { return this.list().find(item => item.id === id) || null; }
  recordRun(id) {
    const now = new Date().toISOString();
    write(this.list().map(item => item.id === id ? normalize({ ...item, runCount: item.runCount + 1, lastRunAt: now }) : item));
  }
  clear() { localStorage.removeItem(STORAGE_KEY); }
  export() { return { searches: this.list(), exportedAt: new Date().toISOString(), version: 1 }; }
  import(payload) {
    const searches = Array.isArray(payload?.searches) ? payload.searches.map(normalize) : [];
    const merged = new Map([...searches, ...this.list()].map(item => [item.id, item]));
    write([...merged.values()]);
    return this.list();
  }
}

return Object.freeze({SavedNewsSearches});
})();

// MODULE: news/controller.js
__modules['news/controller.js'] = (() => {
const { $, $$, escapeHtml, text } = __modules['ui/dom.js'];
const { age, number, percent } = __modules['ui/format.js'];
const { renderTimelineChart } = __modules['news/timeline-chart.js'];
const { renderNewsSourceStrip } = __modules['news/source-strip.js'];
const { SavedNewsSearches } = __modules['news/saved-searches.js'];





const DEFAULT_SOURCE_QUERY = '(conflict OR earthquake OR flood OR wildfire OR storm OR energy OR shipping OR sanctions OR election OR cyber OR inflation OR markets)';

function stateClass(state) {
  return String(state || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function score(value) { return Number.isFinite(value) ? String(Math.round(value)) : 'N/A'; }
function list(value, maximum = 5) { return Array.isArray(value) && value.length ? value.slice(0, maximum).join(' · ') : 'N/A'; }

function safeHref(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '#'; } catch { return '#'; }
}

function renderRankList(container, items, suffix = '') {
  if (!container) return;
  const maximum = Math.max(1, ...(items || []).map(item => item.count));
  container.innerHTML = (items || []).slice(0, 10).map(item => `<div class="news-rank-row"><span>${escapeHtml(item.name)}</span><i><b style="width:${Math.round(item.count / maximum * 100)}%"></b></i><strong>${number(item.count)}${suffix}</strong></div>`).join('') || '<div class="news-empty">0 DATA</div>';
}

function storyRow(story, selected) {
  const acceleration = Number.isFinite(story.velocity?.accelerationPct) ? percent(story.velocity.accelerationPct, { sign: true }) : 'N/A';
  return `<button class="news-story-row ${selected ? 'selected' : ''}" type="button" data-story-id="${escapeHtml(story.id)}">
    <span class="news-story-score">${score(story.urgencyScore)}</span>
    <span class="news-story-main"><strong>${escapeHtml(story.title)}</strong><small>${escapeHtml(story.category.toUpperCase())} · ${story.articleCount} ARTICLES · ${age(story.publishedAt)}</small></span>
    <span class="news-story-verify ${stateClass(story.verification.state)}"><b>${score(story.verification.score)}</b><small>${escapeHtml(story.verification.state)}</small></span>
    <span class="news-story-velocity"><b>${number(story.velocity.recentPerHour, 1)}/H</b><small>${acceleration}</small></span>
  </button>`;
}

function sourceRow(source) {
  return `<a class="news-evidence-row" href="${escapeHtml(safeHref(source.url))}" target="_blank" rel="noopener noreferrer">
    <span><strong>${escapeHtml(source.name || source.domain || 'SOURCE')}</strong><small>${escapeHtml(source.domain || source.type)}</small></span>
    <b>${score(source.reliability)}</b><time>${age(source.publishedAt)}</time>
  </a>`;
}

function impactRow(impact) {
  return `<div class="news-impact-row ${stateClass(impact.direction)}"><strong>${escapeHtml(impact.symbol)}</strong><span>${escapeHtml(impact.direction)}</span><b>${score(impact.confidence)}</b><small>${impact.horizonHours}H</small></div>`;
}


function claimRow(claim, conflicts = new Set()) {
  const flagged = conflicts.has(claim.id);
  const value = claim.values?.[0];
  const numeric = value ? Number(value.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A';
  return `<div class="news-claim-row ${flagged ? 'conflict' : ''}">
    <span><strong>${escapeHtml(claim.subject)}</strong><small>${escapeHtml(claim.sentence)}</small></span>
    <b>${escapeHtml(claim.metric)}</b><i>${escapeHtml(claim.direction)}</i><em>${numeric}</em><mark>${score(claim.confidence)}</mark>
  </div>`;
}

function eventRow(event) {
  return `<div class="news-event-link"><span><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.source)} · ${age(event.time)}</small></span><b>${score(event.confidence)}</b></div>`;
}

class NewsController {
  constructor(options) {
    this.api = options.api;
    this.store = options.store;
    this.initialized = false;
    this.loading = false;
    this.payload = null;
    this.selectedId = null;
    this.abortController = null;
    this.savedSearches = new SavedNewsSearches();
    this.activeSavedSearchId = null;
  }

  bind() {
    $('#news-refresh')?.addEventListener('click', () => this.load());
    $('#news-search')?.addEventListener('keydown', event => { if (event.key === 'Enter') this.load(); });
    $('#news-hours')?.addEventListener('change', () => this.load());
    $('#news-source-type')?.addEventListener('change', () => this.load());
    $('#news-min-verification')?.addEventListener('change', () => this.load());
    $('#news-sort')?.addEventListener('change', () => this.load());
    $('#news-save-search')?.addEventListener('click', () => this.saveSearch());
    $('#news-delete-search')?.addEventListener('click', () => this.deleteSearch());
    $('#news-saved-search')?.addEventListener('change', event => this.applySavedSearch(event.target.value));
    $('#news-story-rows')?.addEventListener('click', event => {
      const row = event.target.closest('[data-story-id]');
      if (!row) return;
      this.selectedId = row.dataset.storyId;
      this.renderStories();
      this.renderDetail();
    });
    $('#news-category-bars')?.addEventListener('click', event => {
      const row = event.target.closest('[data-news-category]');
      if (!row) return;
      $('#news-search').value = row.dataset.newsCategory;
      this.load();
    });
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    this.renderSavedSearches();
    await this.loadPreload();
    void this.load({ background: true });
  }



  async loadPreload() {
    try {
      const payload = await this.api.news(this.parameters());
      this.applyPayload(payload);
    } catch {}
  }

  applyPayload(payload) {
    if (!payload) return;
    this.payload = payload;
    if (!payload.stories?.some(story => story.id === this.selectedId)) this.selectedId = payload.stories?.[0]?.id || null;
    this.render();
    window.dispatchEvent(new CustomEvent('merlin:news-updated', { detail: { stories: payload.stories || [] } }));
  }

  currentSearchDefinition() {
    return {
      id: this.activeSavedSearchId || undefined,
      name: $('#news-search')?.value.trim() || `NEWS ${$('#news-hours')?.value || 24}H`,
      query: $('#news-search')?.value.trim() || '',
      hours: Number($('#news-hours')?.value || 24),
      sourceType: $('#news-source-type')?.value || '',
      minimumVerification: Number($('#news-min-verification')?.value || 0),
      sort: $('#news-sort')?.value || 'latest'
    };
  }

  saveSearch() {
    const saved = this.savedSearches.save(this.currentSearchDefinition());
    this.activeSavedSearchId = saved.id;
    this.renderSavedSearches();
  }

  deleteSearch() {
    if (!this.activeSavedSearchId) return;
    this.savedSearches.remove(this.activeSavedSearchId);
    this.activeSavedSearchId = null;
    this.renderSavedSearches();
  }

  applySavedSearch(id) {
    const saved = this.savedSearches.get(id);
    this.activeSavedSearchId = saved?.id || null;
    if (!saved) return;
    $('#news-search').value = saved.query;
    $('#news-hours').value = String(saved.hours);
    $('#news-source-type').value = saved.sourceType;
    $('#news-min-verification').value = String(saved.minimumVerification);
    $('#news-sort').value = saved.sort;
    this.savedSearches.recordRun(saved.id);
    this.load();
  }

  renderSavedSearches() {
    const select = $('#news-saved-search');
    if (!select) return;
    const searches = this.savedSearches.list();
    select.innerHTML = `<option value="">${searches.length} SAVED</option>${searches.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${item.hours}H · ${item.minimumVerification}</option>`).join('')}`;
    select.value = this.activeSavedSearchId || '';
  }

  parameters() {
    const sourceType = $('#news-source-type')?.value || '';
    return {
      q: $('#news-search')?.value.trim() || '',
      sourceQuery: $('#news-search')?.value.trim() || DEFAULT_SOURCE_QUERY,
      hours: Number($('#news-hours')?.value || 24),
      sourceTypes: sourceType ? [sourceType] : [],
      minimumVerification: Number($('#news-min-verification')?.value || 0),
      sort: $('#news-sort')?.value || 'latest',
      limit: 100,
      sourceLimit: 125,
      includeEventLinks: true
    };
  }

  setLoading(value) {
    this.loading = value;
    const button = $('#news-refresh');
    if (button) { button.disabled = value; button.textContent = value ? '...' : 'REFRESH'; }
    $('#news-workspace')?.classList.toggle('loading', value);
  }

  async load({ background = false } = {}) {
    if (this.loading) this.abortController?.abort();
    this.abortController = new AbortController();
    if (!background) this.setLoading(true);
    text('#news-error', '');
    $('#news-error')?.classList.add('hidden');
    try {
      const payload = await this.api.newsLive(this.parameters(), { signal: this.abortController.signal, timeoutMs: 8_000 });
      this.applyPayload(payload);
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (!this.payload) { text('#news-error', `${error.code || 'NEWS_ERROR'} / ${error.message}`); $('#news-error')?.classList.remove('hidden'); }
    } finally { if (!background) this.setLoading(false); }
  }

  render() {
    const analytics = this.payload?.analytics || {};
    text('#news-article-count', number(analytics.articleCount || 0));
    text('#news-story-count', number(analytics.storyCount || 0));
    text('#news-source-count', number(analytics.sourceCount || 0));
    text('#news-news-count', number(analytics.newsCount || 0));
    text('#news-social-count', number(analytics.socialCount || 0));
    text('#news-velocity-index', score(analytics.velocityIndex));
    text('#news-corroborated', percent(analytics.coverage?.corroboratedPct));
    text('#news-supported', percent(analytics.coverage?.supportedPct));
    text('#news-single-source', percent(analytics.coverage?.singleSourcePct));
    text('#news-mean-verification', score(analytics.coverage?.meanVerification));
    text('#news-mean-sources', number(analytics.coverage?.meanSourceCount, 1));
    text('#news-source-diversity', score(analytics.provenance?.sourceDiversityScore));
    text('#news-source-concentration', percent(analytics.provenance?.largestSourceSharePct));
    text('#news-updated', age(this.payload?.generatedAt));
    renderNewsSourceStrip($('#news-source-strip'), this.payload?.sources || {});
    renderTimelineChart($('#news-timeline'), analytics.timeline);
    renderRankList($('#news-category-bars'), analytics.categories);
    renderRankList($('#news-country-bars'), analytics.countries);
    renderRankList($('#news-ticker-bars'), analytics.tickers);
    this.decorateCategoryRows();
    this.renderStories();
    this.renderDetail();
  }

  decorateCategoryRows() {
    $$('#news-category-bars .news-rank-row').forEach(row => {
      row.dataset.newsCategory = row.querySelector('span')?.textContent || '';
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
    });
  }

  renderStories() {
    const container = $('#news-story-rows');
    if (!container) return;
    const stories = this.payload?.stories || [];
    container.innerHTML = stories.map(story => storyRow(story, story.id === this.selectedId)).join('') || '<div class="news-empty">0 STORIES</div>';
  }

  renderDetail() {
    const story = this.payload?.stories?.find(item => item.id === this.selectedId);
    if (!story) {
      text('#news-detail-title', 'NO SELECTION');
      text('#news-detail-category', 'N/A');
      return;
    }
    text('#news-detail-title', story.title);
    text('#news-detail-category', story.category.toUpperCase());
    text('#news-detail-urgency', score(story.urgencyScore));
    text('#news-detail-verification', score(story.verification.score));
    text('#news-detail-state', story.verification.state);
    text('#news-detail-source-count', number(story.verification.independentSources));
    text('#news-detail-rated-count', number(story.verification.ratedSources));
    text('#news-detail-reliability', score(story.verification.averageReliability));
    text('#news-detail-article-count', number(story.articleCount));
    text('#news-detail-rate', `${number(story.velocity.recentPerHour, 1)}/H`);
    text('#news-detail-acceleration', Number.isFinite(story.velocity.accelerationPct) ? percent(story.velocity.accelerationPct, { sign: true }) : 'N/A');
    text('#news-detail-age', age(story.publishedAt));
    text('#news-detail-burst', score(story.burst?.score));
    text('#news-detail-rate-ratio', number(story.burst?.rateRatio, 2));
    text('#news-detail-claims', number(story.claimAgreement?.claimCount || 0));
    text('#news-detail-conflicts', number(story.claimAgreement?.conflictCount || 0));
    text('#news-detail-agreement', percent(story.claimAgreement?.agreementPct));
    text('#news-detail-comparisons', number(story.claimAgreement?.comparisonCount || 0));
    text('#news-detail-burst-z', number(story.burst?.zScore, 2));
    text('#news-detail-burst-state', story.burst?.state || 'N/A');
    text('#news-detail-countries', list(story.countries, 8));
    text('#news-detail-entities', list(story.entities, 8));
    text('#news-detail-keywords', list(story.keywords, 10));
    text('#news-detail-tickers', list(story.tickers, 10));
    const conflictClaims = new Set((story.claimAgreement?.conflicts || []).flatMap(item => [item.leftClaimId, item.rightClaimId]));
    $('#news-claim-list').innerHTML = story.claims.map(claim => claimRow(claim, conflictClaims)).join('') || '<div class="news-empty">0 CLAIMS</div>';
    $('#news-evidence-list').innerHTML = story.sources.map(sourceRow).join('') || '<div class="news-empty">0 SOURCES</div>';
    $('#news-impact-list').innerHTML = story.impacts.map(impactRow).join('') || '<div class="news-empty">0 ASSET LINKS</div>';
    $('#news-event-links').innerHTML = story.eventLinks.map(eventRow).join('') || '<div class="news-empty">0 EVENT LINKS</div>';
  }
}

return Object.freeze({NewsController});
})();

// MODULE: shipping/map.js
__modules['shipping/map.js'] = (() => {
const { FallbackWorldMap } = __modules['map/fallback-world-map.js'];

function scoreColour(score) {
  if (!Number.isFinite(score)) return '#62778a';
  if (score >= 80) return '#ff4d5d';
  if (score >= 60) return '#ff8a3d';
  if (score >= 40) return '#ffce45';
  if (score >= 20) return '#42b7e9';
  return '#4bd49c';
}

function featurePoint(feature, item, entityType) {
  const coordinates = feature?.geometry?.coordinates || [];
  const score = item?.risk?.score ?? item?.supplyRisk ?? null;
  return {
    id: feature?.properties?.id || item?.id,
    entityType,
    title: feature?.properties?.name || item?.name || 'Shipping entity',
    category: entityType === 'ports' ? 'PORT' : 'CHOKEPOINT',
    source: Number.isFinite(score) ? `RISK ${Number(score).toFixed(0)}` : 'RISK N/A',
    lat: Number(coordinates[1]),
    lon: Number(coordinates[0]),
    severity: Number.isFinite(score) ? Math.max(0.6, score / 20) : Math.max(0.6, Number(feature?.properties?.importance || 50) / 25),
    colour: scoreColour(score),
    risk: score
  };
}

function routeCollection(collection, values) {
  const lookup = new Map((values || []).map(item => [item.id, item]));
  return {
    type: 'FeatureCollection',
    features: (collection?.features || []).map(feature => {
      const item = lookup.get(feature.properties?.id);
      const score = item?.risk?.score;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          risk: Number.isFinite(score) ? score : null,
          colour: scoreColour(score)
        }
      };
    })
  };
}

class ShippingMap {
  constructor(options) {
    this.store = options.store;
    this.onSelect = options.onSelect;
    this.map = null;
    this.catalog = null;
    this.snapshot = null;
  }

  async initialize(_config, catalog) {
    if (this.map) { this.map.resize(); return; }
    this.catalog = catalog;
    this.map = new FallbackWorldMap({
      container: 'shipping-map',
      initialPoint: { lat: 0, lon: 0 },
      initialZoom: 1,
      onSelect: () => {},
      onEvent: item => this.onSelect?.(item.entityType, item.id)
    });
    this.map.setRoutes(catalog.geojson?.routes || { type: 'FeatureCollection', features: [] });
    this.map.setRoutesVisible(true);
    this.#renderMarkers();
    this.store.setState({ shippingMap: this.map, shippingMapMode: 'LOCAL_VECTOR' }, 'shipping.map_ready');
  }

  #renderMarkers() {
    if (!this.map || !this.catalog) return;
    const portLookup = new Map((this.snapshot?.ports || []).map(item => [item.id, item]));
    const chokeLookup = new Map((this.snapshot?.chokepoints || []).map(item => [item.id, item]));
    const ports = (this.catalog.geojson?.ports?.features || []).map(feature => featurePoint(feature, portLookup.get(feature.properties?.id), 'ports'));
    const chokepoints = (this.catalog.geojson?.chokepoints?.features || []).map(feature => featurePoint(feature, chokeLookup.get(feature.properties?.id), 'chokepoints'));
    this.map.setEvents(ports, 'global');
    this.map.setEvents(chokepoints, 'local');
    this.map.setRoutes(routeCollection(this.catalog.geojson?.routes, this.snapshot?.routes));
    this.map.setRoutesVisible(true);
  }

  update(snapshot) {
    this.snapshot = snapshot || null;
    this.#renderMarkers();
  }

  focus(type, item) {
    if (!this.map || !item) return;
    if (item.coordinates) {
      this.map.flyTo({ lon: item.coordinates.lon, lat: item.coordinates.lat }, { zoom: type === 'chokepoints' ? 7 : 8, duration: 450 });
      return;
    }
    if (item.geometry?.coordinates?.length) this.map.fitBounds(item.geometry.coordinates, { padding: 70 });
  }

  resize() {
    this.map?.resize();
  }
}

return Object.freeze({ShippingMap});
})();

// MODULE: shipping/source-strip.js
__modules['shipping/source-strip.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];

const PRIORITY = { ONLINE: 0, DEGRADED: 1, STARTING: 2, NOT_CONFIGURED: 3, OFFLINE: 4 };
function renderShippingSources(root, sources = {}) {
  if (!root) return;
  const items = Object.values(sources).sort((a, b) => (PRIORITY[a.state] ?? 9) - (PRIORITY[b.state] ?? 9));
  root.innerHTML = items.map(source => `<span class="shipping-source state-${escapeHtml(String(source.state || 'OFFLINE').toLowerCase())}"><i></i><b>${escapeHtml(source.name || source.id)}</b><em>${escapeHtml(source.state || 'OFFLINE')}</em><small>${Number(source.recordCount || 0)}</small></span>`).join('');
}

return Object.freeze({renderShippingSources});
})();

// MODULE: shipping/table.js
__modules['shipping/table.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];
const { number } = __modules['ui/format.js'];


function risk(value) { return Number.isFinite(value) ? number(value, 1) : 'N/A'; }
function row(type, item, selectedId) {
  const selected = item.id === selectedId ? ' selected' : '';
  const score = item.risk?.score ?? item.supplyRisk;
  const band = item.risk?.band || (Number.isFinite(score) ? (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'ELEVATED' : score >= 20 ? 'GUARDED' : 'LOW') : 'N/A');
  const secondary = type === 'ports' ? `${item.countryCode} / ${item.type}` : type === 'chokepoints' ? `${item.routeIds?.length || 0} ROUTES` : type === 'routes' ? `${item.lengthKm || 0} KM` : `${item.routeCount || 0}R / ${item.chokepointCount || 0}C`;
  const evidence = item.risk?.evidenceCount ?? item.evidenceCount ?? 0;
  return `<button class="shipping-row${selected}" type="button" data-shipping-type="${type}" data-shipping-id="${escapeHtml(item.id)}"><span class="risk-chip band-${band.toLowerCase()}">${risk(score)}</span><span class="shipping-row-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(secondary.toUpperCase())}</small></span><span>${evidence}</span><span>${escapeHtml(band)}</span></button>`;
}

function renderShippingTable(root, type, snapshot, selectedId) {
  const collection = snapshot?.[type] || [];
  root.innerHTML = collection.length ? collection.map(item => row(type, item, selectedId)).join('') : '<div class="shipping-empty">0 RECORDS</div>';
}

return Object.freeze({renderShippingTable});
})();

// MODULE: shipping/detail.js
__modules['shipping/detail.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];
const { number, age } = __modules['ui/format.js'];


function metric(label, value, suffix = '') { return `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(suffix)}</small></article>`; }
function value(input, digits = 1) { return Number.isFinite(input) ? number(input, digits) : 'N/A'; }
function evidenceList(items = []) { return items.slice(0, 8).map(item => `<li><b>${escapeHtml(item.title || item.id)}</b><span>${value(item.contribution, 1)}</span><small>${Number.isFinite(item.distanceKm) ? `${value(item.distanceKm, 0)} KM` : age(item.latestAt || item.timestamp)}</small></li>`).join(''); }

function renderShippingDetail(root, selection) {
  if (!selection) { root.innerHTML = '<div class="shipping-detail-empty"><strong>NO SELECTION</strong><small>SELECT PORT / CHOKEPOINT / ROUTE / COMMODITY</small></div>'; return; }
  const risk = selection.risk || {};
  const coordinates = selection.coordinates ? `${selection.coordinates.lat.toFixed(3)}, ${selection.coordinates.lon.toFixed(3)}` : selection.lengthKm ? `${number(selection.lengthKm)} KM` : '';
  const operational = selection.signals?.operational || {};
  const congestion = selection.congestion || {};
  root.innerHTML = `
    <header class="shipping-detail-header"><small>${escapeHtml((selection.kind || selection.type || 'NETWORK').toUpperCase())}</small><h2>${escapeHtml(selection.name || selection.commodity?.name || selection.id)}</h2><span>${escapeHtml(coordinates)}</span></header>
    <section class="shipping-detail-metrics">
      ${metric('RISK', value(risk.score ?? selection.supplyRisk), risk.band || '0–100')}
      ${metric('CONFIDENCE', value(risk.confidence), `N=${risk.evidenceCount ?? selection.evidenceCount ?? 0}`)}
      ${metric('EVENT', value(selection.signals?.event?.score), `${selection.signals?.event?.count || selection.eventCount || 0} RECORDS`)}
      ${metric('NEWS', value(selection.signals?.news?.score), `${selection.signals?.news?.count || 0} STORIES`)}
      ${metric('OPERATIONS', value(operational.score), `N=${operational.sampleSize || 0}`)}
      ${metric('CONGESTION', value(congestion.index), Number.isFinite(congestion.confidence) ? `${value(congestion.confidence)} CONF` : 'N/A')}
      ${metric('IMPORTANCE', value(selection.importance, 0), '0–100')}
      ${metric('ROUTES', String(selection.routeIds?.length ?? selection.routeCount ?? selection.connectedRoutes?.length ?? 0), '')}
    </section>
    <section class="shipping-detail-block"><div><span>COMMODITIES</span><b>${escapeHtml((selection.commodities || selection.commodity?.keywords || []).join(' / ').toUpperCase() || 'N/A')}</b></div><div><span>REGION</span><b>${escapeHtml((selection.region || selection.country || selection.class || 'N/A').toUpperCase())}</b></div></section>
    <section class="shipping-evidence"><header><span>EVENT EVIDENCE</span><b>${selection.signals?.event?.evidence?.length || selection.evidence?.events?.length || 0}</b></header><ol>${evidenceList(selection.signals?.event?.evidence || selection.evidence?.events)}</ol></section>
    <section class="shipping-evidence"><header><span>NEWS EVIDENCE</span><b>${selection.signals?.news?.evidence?.length || selection.evidence?.news?.length || 0}</b></header><ol>${evidenceList(selection.signals?.news?.evidence || selection.evidence?.news)}</ol></section>`;
}

return Object.freeze({renderShippingDetail});
})();

// MODULE: shipping/controller.js
__modules['shipping/controller.js'] = (() => {
const { $, $$, text, escapeHtml } = __modules['ui/dom.js'];
const { number, age } = __modules['ui/format.js'];
const { ShippingMap } = __modules['shipping/map.js'];
const { renderShippingSources } = __modules['shipping/source-strip.js'];
const { renderShippingTable } = __modules['shipping/table.js'];
const { renderShippingDetail } = __modules['shipping/detail.js'];






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

class ShippingController {
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
    $('#shipping-export')?.addEventListener('click', () => { const snapshot = this.store.getState().shippingSnapshot; if (snapshot) saveJson(snapshot, `merlin-shipping-${new Date().toISOString().slice(0,10)}.json`); });
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

return Object.freeze({ShippingController});
})();

// MODULE: intelligence/map.js
__modules['intelligence/map.js'] = (() => {
const { FallbackWorldMap } = __modules['map/fallback-world-map.js'];

function scoreColour(score) {
  if (!Number.isFinite(score)) return '#62778a';
  if (score >= 80) return '#ff4d5d';
  if (score >= 60) return '#ff8a3d';
  if (score >= 40) return '#ffce45';
  if (score >= 20) return '#42b7e9';
  return '#4bd49c';
}

function featureMarker(feature, layer, kind) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates || [];
  const key = String(layer || 'COMPOSITE').toLowerCase();
  const score = Number(properties[key]);
  return {
    id: properties.id,
    entityType: kind,
    title: properties.name || properties.country || 'Place',
    category: kind === 'country' ? 'COUNTRY' : 'CITY',
    source: Number.isFinite(score) && score >= 0 ? `${layer} ${score.toFixed(0)}` : `${layer} N/A`,
    lat: Number(coordinates[1]),
    lon: Number(coordinates[0]),
    severity: Number.isFinite(score) && score >= 0 ? Math.max(0.7, score / 20) : 0.8,
    colour: scoreColour(Number.isFinite(score) && score >= 0 ? score : null),
    score
  };
}

class IntelligenceMap {
  constructor(options) {
    this.onSelect = options.onSelect;
    this.map = null;
    this.layer = 'COMPOSITE';
    this.catalog = null;
    this.overview = null;
  }

  async initialize(_config, catalog) {
    if (this.map) { this.map.resize(); return; }
    this.catalog = catalog;
    this.map = new FallbackWorldMap({
      container: 'intelligence-map',
      initialPoint: { lat: 0, lon: 0 },
      initialZoom: 1,
      onSelect: () => {},
      onEvent: item => this.onSelect?.(item.entityType, item.id)
    });
    const cityFeatures = (catalog.cities || []).map(city => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [city.lon, city.lat] },
      properties: { ...city, kind: 'city', composite: null }
    }));
    this.cityFeatures = cityFeatures;
    this.#render();
  }

  #render() {
    if (!this.map) return;
    const countryFeatures = this.overview?.geojson?.countries?.features || [];
    const countries = countryFeatures.map(feature => featureMarker(feature, this.layer, 'country'));
    const cities = (this.cityFeatures || []).map(feature => {
      const item = featureMarker(feature, this.layer, 'city');
      item.colour = '#9cc9dc';
      item.severity = 0.65;
      item.source = feature.properties?.country || 'CITY';
      return item;
    });
    this.map.setEvents(countries, 'global');
    this.map.setEvents(cities, 'local');
    this.map.setClustersVisible(true);
  }

  update(payload) {
    this.overview = payload || null;
    this.#render();
  }

  setLayer(layer) {
    this.layer = layer || 'COMPOSITE';
    this.#render();
  }

  focus(entity) {
    if (!this.map || !entity) return;
    const lon = entity.lon ?? entity.capitalLon;
    const lat = entity.lat ?? entity.capitalLat;
    if (Number.isFinite(Number(lon)) && Number.isFinite(Number(lat))) this.map.flyTo({ lon: Number(lon), lat: Number(lat) }, { zoom: entity.kind ? 8 : 6, duration: 450 });
  }

  resize() {
    this.map?.resize();
  }
}

return Object.freeze({IntelligenceMap});
})();

// MODULE: intelligence/format.js
__modules['intelligence/format.js'] = (() => {

function metric(value, digits = 0, suffix = '') { return Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits })}${suffix}` : 'N/A'; }
function riskBand(value) { if (!Number.isFinite(Number(value))) return 'na'; if (value >= 80) return 'severe'; if (value >= 60) return 'high'; if (value >= 40) return 'elevated'; if (value >= 20) return 'guarded'; return 'low'; }
function sourceRatio(sources = {}) { const rows = Object.values(sources); return `${rows.filter(item => ['ONLINE', 'DEGRADED'].includes(item.state)).length}/${rows.length}`; }
function dateValue(value) { if (!value) return 'N/A'; const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : 'N/A'; }

return Object.freeze({metric, riskBand, sourceRatio, dateValue});
})();

// MODULE: intelligence/table.js
__modules['intelligence/table.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];
const { metric, riskBand } = __modules['intelligence/format.js'];


function renderCountryRows(root, records, selectedId) {
  if (!root) return;
  root.innerHTML = records.length ? records.map(item => {
    const score = item.metrics?.composite?.score;
    const confidence = item.metrics?.composite?.confidence;
    const selected = item.country.iso2 === selectedId ? ' selected' : '';
    return `<button class="intelligence-row${selected}" data-country-id="${escapeHtml(item.country.iso2)}" type="button"><span class="intelligence-risk band-${riskBand(score)}">${metric(score, 0)}</span><span class="intelligence-name"><strong>${escapeHtml(item.country.name)}</strong><small>${escapeHtml(item.country.capital || 'N/A')} / ${escapeHtml(item.country.iso2)}</small></span><span>${metric(item.metrics?.conflict?.score, 0)}</span><span>${metric(item.metrics?.disaster?.score, 0)}</span><span>${metric(confidence, 0)}</span></button>`;
  }).join('') : '<div class="intelligence-empty">0 RECORDS</div>';
}

function renderCityRows(root, records, selectedId) {
  if (!root) return;
  root.innerHTML = records.length ? records.map(item => `<button class="intelligence-row${item.id === selectedId ? ' selected' : ''}" data-city-id="${escapeHtml(item.id)}" type="button"><span class="intelligence-risk band-na">N/A</span><span class="intelligence-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} / ${escapeHtml(item.countryCode)}</small></span><span>${item.kind === 'capital' ? '1' : '0'}</span><span>${metric(item.lat, 1)}</span><span>${metric(item.lon, 1)}</span></button>`).join('') : '<div class="intelligence-empty">0 RECORDS</div>';
}

return Object.freeze({renderCountryRows, renderCityRows});
})();

// MODULE: intelligence/detail.js
__modules['intelligence/detail.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];
const { metric, riskBand, dateValue } = __modules['intelligence/format.js'];


function sourceRows(sources = {}) {
  return Object.values(sources).map(source => `<div><span>${escapeHtml(source.name || source.id)}</span><b>${escapeHtml(source.state)}</b><small>${source.recordCount ?? 0}</small></div>`).join('');
}
function indicatorRows(indicators = {}) {
  return Object.entries(indicators).filter(([, item]) => item).map(([key, item]) => `<div><span>${escapeHtml(key.replace(/[A-Z]/g, value => ` ${value}`).toUpperCase())}</span><b>${metric(item.value, 2)}</b><small>${item.year || 'N/A'}</small></div>`).join('');
}
function eventRows(events = []) { return events.slice(0, 12).map(event => `<div class="intelligence-evidence"><span class="band-${riskBand(Number(event.severity || 0) * 20)}">${metric(Number(event.severity || 0) * 20, 0)}</span><p><b>${escapeHtml(event.title)}</b><small>${escapeHtml(event.category.toUpperCase())} / ${dateValue(event.time)}</small></p></div>`).join(''); }
function storyRows(stories = []) { return stories.slice(0, 10).map(story => `<div class="intelligence-evidence"><span>${metric(story.verification?.score, 0)}</span><p><b>${escapeHtml(story.title)}</b><small>${story.sourceCount || story.articleIds?.length || 0} SRC / ${metric(story.velocity?.score, 0)}</small></p></div>`).join(''); }
function crimeRows(crime) { return (crime?.categories || []).slice(0, 10).map(item => `<div><span>${escapeHtml(item.id.toUpperCase())}</span><b>${item.count}</b><small>${metric(item.sharePct, 1, '%')}</small></div>`).join(''); }

function renderIntelligenceDetail(root, payload) {
  if (!root) return;
  if (!payload) { root.innerHTML = '<div class="intelligence-detail-empty"><strong>N/A</strong><small>COUNTRY / CITY</small></div>'; return; }
  const entity = payload.country && payload.city ? payload.city : payload.city || payload.country || payload.nearestCity || {};
  const country = payload.country || {};
  const metrics = payload.metrics || {};
  const score = metrics.composite?.score;
  const indicators = payload.indicators?.indicators || metrics.economic?.indicators || {};
  const nextElection = metrics.elections?.next;
  root.innerHTML = `<header class="intelligence-detail-header"><div><small>${escapeHtml(entity.countryCode || country.iso2 || '')}</small><h1>${escapeHtml(entity.name || country.name || 'N/A')}</h1><p>${escapeHtml(country.capital || entity.country || '')}</p></div><span class="intelligence-score band-${riskBand(score)}">${metric(score, 0)}</span></header>
  <section class="intelligence-detail-metrics">
    <article><span>CONFLICT</span><strong>${metric(metrics.conflict?.score, 0)}</strong><small>${metrics.conflict?.count ?? 0} N</small></article>
    <article><span>DISASTER</span><strong>${metric(metrics.disaster?.score, 0)}</strong><small>${metrics.disaster?.count ?? 0} N</small></article>
    <article><span>CRIME</span><strong>${metric(metrics.crime?.score, 0)}</strong><small>${metrics.crime?.count ?? 'N/A'} N</small></article>
    <article><span>ELECTION</span><strong>${metric(metrics.elections?.proximityScore, 0)}</strong><small>${nextElection?.daysUntil ?? 'N/A'} D</small></article>
    <article><span>ECON STRESS</span><strong>${metric(metrics.economic?.stressScore, 0)}</strong><small>0–100</small></article>
    <article><span>CONFIDENCE</span><strong>${metric(metrics.composite?.confidence, 0)}</strong><small>${metric(metrics.composite?.coveragePct, 0, '%')}</small></article>
  </section>
  <section class="intelligence-detail-section"><header><span>INDICATORS</span><b>VALUE / YEAR</b></header><div class="intelligence-key-values">${indicatorRows(indicators) || '<div><span>N/A</span><b>N/A</b><small>N/A</small></div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>CRIME</span><b>COUNT / SHARE</b></header><div class="intelligence-key-values">${crimeRows(metrics.crime) || '<div><span>N/A</span><b>N/A</b><small>N/A</small></div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>EVENT EVIDENCE</span><b>SCORE / DATE</b></header><div class="intelligence-evidence-list">${eventRows(payload.events) || '<div class="intelligence-empty">0 RECORDS</div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>NEWS EVIDENCE</span><b>VERIFY / VELOCITY</b></header><div class="intelligence-evidence-list">${storyRows(payload.stories) || '<div class="intelligence-empty">0 RECORDS</div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>SOURCE STATE</span><b>STATE / N</b></header><div class="intelligence-key-values">${sourceRows(payload.sources?.intelligence) || '<div><span>N/A</span><b>N/A</b><small>0</small></div>'}</div></section>`;
}

return Object.freeze({renderIntelligenceDetail});
})();

// MODULE: intelligence/source-strip.js
__modules['intelligence/source-strip.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];

function renderIntelligenceSources(root, sources = {}) {
  if (!root) return;
  const rows = Object.values(sources);
  root.innerHTML = rows.length ? rows.map(source => `<span class="intelligence-source state-${String(source.state).toLowerCase()}"><i></i><b>${escapeHtml(source.name || source.id)}</b><small>${escapeHtml(source.state)} / ${source.recordCount ?? 0}</small></span>`).join('') : '<span class="intelligence-source state-offline"><i></i><b>SOURCES</b><small>0/0</small></span>';
}

return Object.freeze({renderIntelligenceSources});
})();

// MODULE: intelligence/controller.js
__modules['intelligence/controller.js'] = (() => {
const { $, $$, text } = __modules['ui/dom.js'];
const { number, age } = __modules['ui/format.js'];
const { IntelligenceMap } = __modules['intelligence/map.js'];
const { renderCountryRows, renderCityRows } = __modules['intelligence/table.js'];
const { renderIntelligenceDetail } = __modules['intelligence/detail.js'];
const { renderIntelligenceSources } = __modules['intelligence/source-strip.js'];
const { metric, sourceRatio } = __modules['intelligence/format.js'];







function errorText(error) { return `${error.code || 'INTELLIGENCE_ERROR'} / ${error.message}`; }
function download(payload) { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `merlin-intelligence-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

class IntelligenceController {
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

return Object.freeze({IntelligenceController});
})();

// MODULE: replay/equity-chart.js
__modules['replay/equity-chart.js'] = (() => {
const { escapeHtml } = __modules['ui/dom.js'];

function points(values, width, height, padding, accessor) {
  const data = values.map(accessor).filter(Number.isFinite);
  if (!data.length) return '';
  const minimum = Math.min(...data);
  const maximum = Math.max(...data);
  const range = maximum - minimum || 1;
  return values.map((value, index) => {
    const numeric = accessor(value);
    const x = padding + index / Math.max(1, values.length - 1) * (width - padding * 2);
    const y = padding + (maximum - numeric) / range * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function renderEquityChart(root, equity = []) {
  if (!root) return;
  if (!equity.length) { root.innerHTML = '<div class="chart-empty">NO EQUITY SERIES</div>'; return; }
  const width = 900;
  const height = 300;
  const padding = 28;
  const equityPoints = points(equity, width, height, padding, item => Number(item[1]));
  const drawdownPoints = points(equity, width, height, padding, item => Number(item[2]));
  const start = Number(equity[0]?.[1]);
  const end = Number(equity.at(-1)?.[1]);
  root.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Equity curve">
    <defs><linearGradient id="equity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".28"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
    <g class="chart-grid"><line x1="${padding}" x2="${width-padding}" y1="${padding}" y2="${padding}"/><line x1="${padding}" x2="${width-padding}" y1="${height/2}" y2="${height/2}"/><line x1="${padding}" x2="${width-padding}" y1="${height-padding}" y2="${height-padding}"/></g>
    <polyline class="drawdown-line" points="${escapeHtml(drawdownPoints)}" fill="none"/>
    <polyline class="equity-line" points="${escapeHtml(equityPoints)}" fill="none"/>
    <text x="${padding}" y="18">${Number.isFinite(start) ? start.toFixed(0) : 'N/A'}</text><text x="${width-padding}" y="18" text-anchor="end">${Number.isFinite(end) ? end.toFixed(0) : 'N/A'}</text>
  </svg>`;
}

return Object.freeze({renderEquityChart});
})();

// MODULE: replay/controller.js
__modules['replay/controller.js'] = (() => {
const { $, escapeHtml, text } = __modules['ui/dom.js'];
const { age, number, percent } = __modules['ui/format.js'];
const { exportCsv, exportJson } = __modules['export/download.js'];
const { renderEquityChart } = __modules['replay/equity-chart.js'];




function ratio(value, digits = 2) { return Number.isFinite(value) ? number(value, digits) : 'N/A'; }
function pct(value, digits = 1) { return Number.isFinite(value) ? percent(value * 100, { digits, sign: value !== 0 }) : 'N/A'; }
function money(value) { return Number.isFinite(value) ? Number(value).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }) : 'N/A'; }

class ReplayController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.initialized = false;
    this.loading = false;
    this.abortController = null;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
      this.bind();
      await this.loadCatalog();
      this.restoreControls();
    }
  }

  bind() {
    $('#replay-run')?.addEventListener('click', () => this.run());
    $('#replay-export-json')?.addEventListener('click', () => exportJson('merlin-replay', this.store.getState().replayResult || {}));
    $('#replay-export-csv')?.addEventListener('click', () => exportCsv('merlin-replay-trades', this.store.getState().replayResult?.trades || [], [
      'id', 'direction', 'signalStrength', 'entryAt', 'entryPrice', 'stopPrice', 'targetPrice', 'exitAt', 'exitPrice', 'exitReason', 'barsHeld', 'quantity', 'grossPnl', 'fees', 'pnl', 'returnOnCapital', 'rMultiple'
    ]));
    const inputs = ['replay-asset', 'replay-timeframe', 'replay-strategy', 'replay-capital', 'replay-risk', 'replay-fee', 'replay-slippage', 'replay-stop', 'replay-target', 'replay-holding', 'replay-fold-count', 'replay-short'];
    for (const id of inputs) $(`#${id}`)?.addEventListener('change', () => this.saveSettings());
    window.addEventListener('merlin:workspace-restored', () => this.restoreControls());
  }

  async loadCatalog() {
    try {
      const payload = await this.api.marketCatalog({});
      const assets = payload.assets || [];
      this.store.setState({ marketCatalog: assets }, 'replay.catalog_loaded');
      const select = $('#replay-asset');
      if (select) select.innerHTML = assets.map(asset => `<option value="${escapeHtml(asset.id)}">${escapeHtml(asset.symbol)} / ${escapeHtml(asset.name)}</option>`).join('');
    } catch (error) { text('#replay-error', `${error.code || 'CATALOG_ERROR'} / ${error.message}`); }
  }

  settings() {
    return {
      asset: 'btc-usd', timeframe: '1h', strategy: 'TREND_PULLBACK', capital: 10000,
      risk: 1, fee: 0.1, slippage: 0.05, stopAtr: 1.8, targetAtr: 3,
      holdingBars: 48, folds: 4, allowShort: true,
      ...(this.store.getState().replaySettings || {})
    };
  }

  saveSettings() {
    const replaySettings = {
      asset: $('#replay-asset')?.value || 'btc-usd',
      timeframe: $('#replay-timeframe')?.value || '1h',
      strategy: $('#replay-strategy')?.value || 'TREND_PULLBACK',
      capital: Number($('#replay-capital')?.value) || 10000,
      risk: Number($('#replay-risk')?.value) || 1,
      fee: Number($('#replay-fee')?.value) || 0.1,
      slippage: Number($('#replay-slippage')?.value) || 0.05,
      stopAtr: Number($('#replay-stop')?.value) || 1.8,
      targetAtr: Number($('#replay-target')?.value) || 3,
      holdingBars: Number($('#replay-holding')?.value) || 48,
      folds: Number($('#replay-fold-count')?.value) || 4,
      allowShort: $('#replay-short')?.checked !== false
    };
    this.store.setState({ replaySettings }, 'replay.settings_changed');
    return replaySettings;
  }

  restoreControls() {
    const settings = this.settings();
    const values = {
      'replay-asset': settings.asset, 'replay-timeframe': settings.timeframe, 'replay-strategy': settings.strategy,
      'replay-capital': settings.capital, 'replay-risk': settings.risk, 'replay-fee': settings.fee,
      'replay-slippage': settings.slippage, 'replay-stop': settings.stopAtr, 'replay-target': settings.targetAtr,
      'replay-holding': settings.holdingBars, 'replay-fold-count': settings.folds
    };
    for (const [id, value] of Object.entries(values)) if ($(`#${id}`)) $(`#${id}`).value = String(value);
    if ($('#replay-short')) $('#replay-short').checked = settings.allowShort;
  }

  async run() {
    if (this.loading) this.abortController?.abort();
    this.abortController = new AbortController();
    const settings = this.saveSettings();
    this.loading = true;
    this.setLoading(true);
    try {
      const result = await this.api.marketReplay({
        asset: settings.asset,
        timeframe: settings.timeframe,
        strategy: settings.strategy,
        capital: settings.capital,
        risk: settings.risk / 100,
        fee: settings.fee / 100,
        slippage: settings.slippage / 100,
        stopAtr: settings.stopAtr,
        targetAtr: settings.targetAtr,
        holdingBars: settings.holdingBars,
        folds: settings.folds,
        allowShort: settings.allowShort,
        limit: 1000
      }, { signal: this.abortController.signal, timeoutMs: 45_000 });
      this.store.setState({ replayResult: result }, 'replay.completed');
      this.render(result);
    } catch (error) {
      text('#replay-error', `${error.code || 'REPLAY_ERROR'} / ${error.message}`);
      $('#replay-error')?.classList.remove('hidden');
    } finally { this.loading = false; this.setLoading(false); }
  }

  setLoading(value) {
    const button = $('#replay-run');
    if (button) { button.disabled = value; button.textContent = value ? '...' : 'RUN'; }
  }

  render(result) {
    $('#replay-error')?.classList.add('hidden');
    if (!result?.available) {
      text('#replay-error', `${result?.reason || 'N/A'} / ${result?.candleCount || 0}`);
      $('#replay-error')?.classList.remove('hidden');
      return;
    }
    const metrics = result.metrics || {};
    text('#replay-title', `${result.asset?.symbol || 'N/A'} / ${result.timeframe.toUpperCase()} / ${result.config.strategyId}`);
    text('#replay-updated', `${age(result.generatedAt)} AGO`);
    text('#replay-total-return', pct(metrics.totalReturn));
    text('#replay-ending-capital', money(metrics.endingCapital));
    text('#replay-max-drawdown', pct(metrics.maximumDrawdown));
    text('#replay-win-rate', pct(metrics.winRate));
    text('#replay-profit-factor', ratio(metrics.profitFactor, 2));
    text('#replay-expectancy', money(metrics.expectancy));
    text('#replay-sharpe', ratio(metrics.sharpe, 2));
    text('#replay-sortino', ratio(metrics.sortino, 2));
    text('#replay-trade-count', number(metrics.tradeCount || 0));
    text('#replay-fees', money(metrics.feesPaid));
    text('#replay-recovery', ratio(metrics.recoveryFactor, 2));
    text('#replay-streak', `${metrics.longestWinStreak || 0} / ${metrics.longestLossStreak || 0}`);
    text('#replay-walk-consistency', pct(result.walkForward?.consistency));
    text('#replay-profitable-folds', `${result.walkForward?.profitableFolds || 0}/${result.walkForward?.foldCount || 0}`);
    renderEquityChart($('#replay-equity-chart'), result.equity || []);
    this.renderTrades(result.trades || []);
    this.renderFolds(result.walkForward?.folds || []);
  }

  renderTrades(trades) {
    const root = $('#replay-trades');
    if (!root) return;
    root.innerHTML = trades.length ? [...trades].reverse().slice(0, 100).map(trade => `<div class="replay-trade-row ${trade.pnl >= 0 ? 'win' : 'loss'}"><span>${escapeHtml(trade.direction)}</span><span>${escapeHtml(trade.entryAt.slice(0, 16).replace('T', ' '))}</span><span>${escapeHtml(trade.exitReason)}</span><strong>${money(trade.pnl)}</strong><b>${ratio(trade.rMultiple, 2)}R</b></div>`).join('') : '<div class="empty-state">0 TRADES</div>';
  }

  renderFolds(folds) {
    const root = $('#replay-folds');
    if (!root) return;
    root.innerHTML = folds.length ? folds.map(fold => `<div class="replay-fold-row"><span>F${fold.fold}</span><span>${fold.startAt?.slice(0, 10) || 'N/A'}</span><strong>${pct(fold.metrics?.totalReturn)}</strong><b>${pct(fold.metrics?.maximumDrawdown)}</b><em>${pct(fold.metrics?.winRate)}</em></div>`).join('') : '<div class="empty-state">0 FOLDS</div>';
  }
}

return Object.freeze({ReplayController});
})();

// MODULE: alerts/repository.js
__modules['alerts/repository.js'] = (() => {

const RULES_KEY = 'merlin.alert-rules.v1';
const HISTORY_KEY = 'merlin.alert-history.v1';
const MAX_HISTORY = 250;

function parse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
function read(key, fallback = []) { const value = parse(localStorage.getItem(key), fallback); return Array.isArray(value) ? value : fallback; }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function id() { return globalThis.crypto?.randomUUID?.() || `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

class AlertRepository {
  rules() { return read(RULES_KEY); }
  saveRule(input) {
    const now = new Date().toISOString();
    const rule = { ...input, id: input.id || id(), createdAt: input.createdAt || now, updatedAt: now };
    write(RULES_KEY, [rule, ...this.rules().filter(item => item.id !== rule.id)].slice(0, 100));
    return rule;
  }
  removeRule(ruleId) { write(RULES_KEY, this.rules().filter(item => item.id !== ruleId)); }
  toggleRule(ruleId) { write(RULES_KEY, this.rules().map(item => item.id === ruleId ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() } : item)); }
  history() { return read(HISTORY_KEY); }
  addMatches(matches) {
    const current = this.history();
    const keyed = new Map([...matches, ...current].map(item => [item.id || `${item.rule?.id}:${item.targetId}:${item.triggeredAt}`, item]));
    write(HISTORY_KEY, [...keyed.values()].slice(0, MAX_HISTORY));
  }
  clearHistory() { localStorage.removeItem(HISTORY_KEY); }
}

return Object.freeze({AlertRepository});
})();

// MODULE: alerts/controller.js
__modules['alerts/controller.js'] = (() => {
const { $, escapeHtml, text } = __modules['ui/dom.js'];
const { age, number, percent } = __modules['ui/format.js'];
const { exportJson } = __modules['export/download.js'];
const { AlertRepository } = __modules['alerts/repository.js'];




const FIELD_OPTIONS = Object.freeze({
  OPPORTUNITY: [
    ['score', 'SCORE'], ['confidence', 'CONFIDENCE'], ['risk', 'RISK'], ['probability', 'PROBABILITY'],
    ['expectedMove', 'EXPECTED MOVE'], ['liquidity', 'LIQUIDITY'], ['kind', 'KIND'], ['direction', 'DIRECTION'], ['evidenceGrade', 'EVIDENCE GRADE'], ['symbol', 'SYMBOL'], ['category', 'CATEGORY']
  ],
  NEWS: [
    ['urgencyScore', 'URGENCY'], ['verification.score', 'VERIFICATION'], ['verification.independentSources', 'SOURCE COUNT'],
    ['verification.averageReliability', 'SOURCE PRIOR'], ['burst.score', 'BURST'], ['burst.rateRatio', 'RATE RATIO'],
    ['claimAgreement.agreementPct', 'CLAIM AGREEMENT'], ['claimAgreement.conflictCount', 'CLAIM CONFLICTS'],
    ['articleCount', 'ARTICLE COUNT'], ['category', 'CATEGORY'], ['countries', 'COUNTRIES'], ['tickers', 'ASSETS']
  ]
});
const OPERATORS = Object.freeze(['GTE', 'GT', 'LTE', 'LT', 'EQ', 'NEQ', 'CONTAINS']);

function expectedValue(field, raw) {
  if (['score', 'confidence', 'risk', 'probability', 'expectedMove', 'liquidity', 'urgencyScore', 'verification.score', 'verification.independentSources', 'verification.averageReliability', 'burst.score', 'burst.rateRatio', 'claimAgreement.agreementPct', 'claimAgreement.conflictCount', 'articleCount'].includes(field)) return Number(raw);
  return String(raw || '').trim().toUpperCase();
}

function formatActual(value, field) {
  if (!Number.isFinite(value)) return String(value ?? 'N/A').toUpperCase();
  if (field === 'probability') return percent(value * 100, { digits: 0 });
  if (field === 'expectedMove') return percent(value * 100, { digits: 2, sign: true });
  return number(value, 1);
}

function defaultRules() {
  return [
    { name: 'EDGE 70+', scope: 'OPPORTUNITY', enabled: true, combinator: 'ALL', cooldownMinutes: 60, conditions: [{ field: 'score', operator: 'GTE', expected: 70 }], delivery: { browser: true, inApp: true, sound: false } },
    { name: 'CONFIDENCE 75+', scope: 'OPPORTUNITY', enabled: true, combinator: 'ALL', cooldownMinutes: 120, conditions: [{ field: 'confidence', operator: 'GTE', expected: 75 }, { field: 'score', operator: 'GTE', expected: 60 }], delivery: { browser: true, inApp: true, sound: false } },
    { name: 'NEWS VERIFY 75+', scope: 'NEWS', enabled: true, combinator: 'ALL', cooldownMinutes: 60, conditions: [{ field: 'verification.score', operator: 'GTE', expected: 75 }, { field: 'verification.independentSources', operator: 'GTE', expected: 2 }], delivery: { browser: true, inApp: true, sound: false } }
  ];
}

class AlertController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.repository = new AlertRepository();
    this.initialized = false;
    this.evaluating = false;
  }

  bind() {
    this.populateOptions();
    $('#alert-scope')?.addEventListener('change', () => this.populateOptions());
    $('#alert-add')?.addEventListener('click', () => this.addRule());
    $('#alert-permission')?.addEventListener('click', () => this.requestPermission());
    $('#alert-clear-history')?.addEventListener('click', () => { this.repository.clearHistory(); this.renderHistory(); });
    $('#alert-export')?.addEventListener('click', () => exportJson('merlin-alerts', { rules: this.repository.rules(), history: this.repository.history(), exportedAt: new Date().toISOString() }));
    $('#alert-rule-list')?.addEventListener('click', event => this.handleRuleAction(event));
    window.addEventListener('merlin:opportunities-updated', event => this.evaluate(event.detail?.opportunities || [], 'OPPORTUNITY'));
    window.addEventListener('merlin:news-updated', event => this.evaluate(event.detail?.stories || [], 'NEWS'));
    if (!this.repository.rules().length) defaultRules().forEach(rule => this.repository.saveRule(rule));
    this.render();
  }

  async ensureInitialized() {
    if (!this.initialized) { this.initialized = true; this.bind(); }
    this.render();
  }

  populateOptions() {
    const field = $('#alert-field');
    const operator = $('#alert-operator');
    const scope = $('#alert-scope')?.value || 'OPPORTUNITY';
    if (field) field.innerHTML = (FIELD_OPTIONS[scope] || FIELD_OPTIONS.OPPORTUNITY).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    if (operator) operator.innerHTML = OPERATORS.map(value => `<option value="${value}">${value}</option>`).join('');
  }

  addRule() {
    const scope = $('#alert-scope')?.value || 'OPPORTUNITY';
    const field = $('#alert-field')?.value || (scope === 'NEWS' ? 'verification.score' : 'score');
    const operator = $('#alert-operator')?.value || 'GTE';
    const raw = $('#alert-value')?.value;
    const expected = expectedValue(field, raw);
    if ((typeof expected === 'number' && !Number.isFinite(expected)) || expected === '') { text('#alert-status', 'INVALID VALUE'); return; }
    const name = String($('#alert-name')?.value || `${field} ${operator} ${raw}`).trim().slice(0, 80);
    this.repository.saveRule({
      name,
      scope,
      enabled: true,
      combinator: 'ALL',
      cooldownMinutes: Number($('#alert-cooldown')?.value) || 60,
      conditions: [{ field, operator, expected }],
      delivery: { browser: true, inApp: true, sound: false }
    });
    if ($('#alert-name')) $('#alert-name').value = '';
    if ($('#alert-value')) $('#alert-value').value = '';
    text('#alert-status', 'RULE ADDED');
    this.renderRules();
  }

  handleRuleAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'toggle') this.repository.toggleRule(button.dataset.id);
    if (button.dataset.action === 'delete') this.repository.removeRule(button.dataset.id);
    this.renderRules();
  }

  async requestPermission() {
    if (!('Notification' in window)) { text('#alert-permission-state', 'UNSUPPORTED'); return; }
    const result = await Notification.requestPermission();
    text('#alert-permission-state', result.toUpperCase());
  }

  async evaluate(targets, scope = 'OPPORTUNITY') {
    if (this.evaluating || !targets.length) return;
    const rules = this.repository.rules().filter(rule => rule.enabled && rule.scope === scope);
    if (!rules.length) return;
    this.evaluating = true;
    try {
      const result = await this.api.evaluateAlerts({ rules, targets }, { timeoutMs: 15_000 });
      const matches = (result.matches || []).map(match => ({ ...match, id: `${match.rule.id}:${match.targetId}:${match.triggeredAt}` }));
      if (matches.length) {
        this.repository.addMatches(matches);
        this.deliver(matches);
        this.renderHistory();
      }
      text('#alert-last-check', `${result.evaluatedTargets || 0} / ${matches.length}`);
    } catch (error) { text('#alert-last-check', `${error.code || 'ERROR'}`); }
    finally { this.evaluating = false; }
  }

  deliver(matches) {
    const browserAllowed = 'Notification' in window && Notification.permission === 'granted';
    for (const match of matches.slice(0, 5)) {
      if (browserAllowed && match.rule?.delivery?.browser !== false) {
        const target = match.target || {};
        new Notification(match.rule.name, { body: `${target.title || target.symbol || match.targetId} / ${Number.isFinite(target.score) ? target.score.toFixed(1) : Number.isFinite(target.urgencyScore) ? target.urgencyScore.toFixed(1) : 'N/A'}`, tag: `${match.rule.id}:${match.targetId}` });
      }
    }
  }

  render() {
    text('#alert-permission-state', 'Notification' in window ? Notification.permission.toUpperCase() : 'UNSUPPORTED');
    this.renderRules();
    this.renderHistory();
  }

  renderRules() {
    const root = $('#alert-rule-list');
    if (!root) return;
    const rules = this.repository.rules();
    text('#alert-rule-count', String(rules.length));
    text('#alert-enabled-count', String(rules.filter(rule => rule.enabled).length));
    root.innerHTML = rules.length ? rules.map(rule => `
      <article class="alert-rule ${rule.enabled ? 'enabled' : 'disabled'}">
        <button type="button" data-action="toggle" data-id="${escapeHtml(rule.id)}"><i></i><span><strong>${escapeHtml(rule.name)}</strong><small>${escapeHtml(rule.scope)} / ${rule.conditions.map(condition => `${condition.field.toUpperCase()} ${condition.operator} ${condition.expected}`).join(' + ')} / ${rule.cooldownMinutes}M</small></span></button>
        <button type="button" data-action="delete" data-id="${escapeHtml(rule.id)}">×</button>
      </article>`).join('') : '<div class="empty-state">0 RULES</div>';
  }

  renderHistory() {
    const root = $('#alert-history');
    if (!root) return;
    const history = this.repository.history();
    text('#alert-history-count', String(history.length));
    root.innerHTML = history.length ? history.slice(0, 100).map(item => {
      const target = item.target || {};
      const condition = item.conditions?.[0] || {};
      return `<article class="alert-history-row"><span><strong>${escapeHtml(item.rule?.name || 'ALERT')}</strong><small>${escapeHtml(target.title || target.symbol || item.targetId)}</small></span><b>${escapeHtml(formatActual(condition.actual, condition.field))}</b><time>${age(item.triggeredAt)}</time></article>`;
    }).join('') : '<div class="empty-state">0 TRIGGERS</div>';
  }
}

return Object.freeze({AlertController});
})();

// MODULE: workspaces/repository.js
__modules['workspaces/repository.js'] = (() => {

const STORAGE_KEY = 'merlin.workspaces.v1';
const ACTIVE_KEY = 'merlin.workspace.active.v1';
const MAX_WORKSPACES = 30;

function parse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function readAll() {
  const value = parse(localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(value) ? value : [];
}

function writeAll(workspaces) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces.slice(0, MAX_WORKSPACES)));
}

function id() {
  return globalThis.crypto?.randomUUID?.() || `workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

class WorkspaceRepository {
  list() { return readAll().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)); }

  get(workspaceId) { return readAll().find(item => item.id === workspaceId) || null; }

  save(input) {
    const now = new Date().toISOString();
    const all = readAll();
    const workspace = {
      id: input.id || id(),
      name: String(input.name || 'WORKSPACE').trim().slice(0, 60),
      state: input.state || {},
      createdAt: input.createdAt || now,
      updatedAt: now
    };
    const next = [workspace, ...all.filter(item => item.id !== workspace.id)];
    writeAll(next);
    localStorage.setItem(ACTIVE_KEY, workspace.id);
    return workspace;
  }

  remove(workspaceId) {
    writeAll(readAll().filter(item => item.id !== workspaceId));
    if (localStorage.getItem(ACTIVE_KEY) === workspaceId) localStorage.removeItem(ACTIVE_KEY);
  }

  activeId() { return localStorage.getItem(ACTIVE_KEY); }
  setActive(workspaceId) { workspaceId ? localStorage.setItem(ACTIVE_KEY, workspaceId) : localStorage.removeItem(ACTIVE_KEY); }

  import(value) {
    const items = Array.isArray(value) ? value : Array.isArray(value?.workspaces) ? value.workspaces : [];
    const existing = readAll();
    const merged = [...items, ...existing].filter(item => item && item.id && item.name && item.state);
    const unique = [...new Map(merged.map(item => [item.id, item])).values()];
    writeAll(unique);
    return unique.length;
  }

  export() { return { version: 1, exportedAt: new Date().toISOString(), workspaces: this.list() }; }
}

return Object.freeze({WorkspaceRepository});
})();

// MODULE: workspaces/controller.js
__modules['workspaces/controller.js'] = (() => {
const { $, text, escapeHtml } = __modules['ui/dom.js'];
const { exportJson } = __modules['export/download.js'];
const { WorkspaceRepository } = __modules['workspaces/repository.js'];



function stateSnapshot(state) {
  return {
    activeView: state.activeView,
    point: state.point,
    radiusKm: state.radiusKm,
    windowDays: state.windowDays,
    categories: [...(state.categories || [])],
    routesVisible: state.routesVisible,
    clustersVisible: state.clustersVisible,
    marketTimeframe: state.marketTimeframe,
    marketAssetClass: state.marketAssetClass,
    selectedMarketAsset: state.selectedMarketAsset,
    opportunityFilters: state.opportunityFilters || {},
    replaySettings: state.replaySettings || {}
  };
}

class WorkspaceController {
  constructor(options) {
    this.store = options.store;
    this.switchView = options.switchView;
    this.repository = new WorkspaceRepository();
    this.drawer = null;
  }

  bind() {
    this.drawer = $('#workspace-drawer');
    $('#workspace-toggle')?.addEventListener('click', () => this.open());
    $('#workspace-close')?.addEventListener('click', () => this.close());
    $('#workspace-save')?.addEventListener('click', () => this.save());
    $('#workspace-export')?.addEventListener('click', () => exportJson('merlin-workspaces', this.repository.export()));
    $('#workspace-import')?.addEventListener('change', event => this.importFile(event.target.files?.[0]));
    $('#workspace-list')?.addEventListener('click', event => this.handleListClick(event));
    this.render();
  }

  open() { this.drawer?.setAttribute('aria-hidden', 'false'); this.drawer?.classList.add('open'); this.render(); }
  close() { this.drawer?.setAttribute('aria-hidden', 'true'); this.drawer?.classList.remove('open'); }

  save() {
    const input = $('#workspace-name');
    const name = String(input?.value || '').trim() || `WORKSPACE ${this.repository.list().length + 1}`;
    const workspace = this.repository.save({ name, state: stateSnapshot(this.store.getState()) });
    if (input) input.value = '';
    text('#workspace-status', `SAVED ${workspace.updatedAt.slice(11, 19)} UTC`);
    this.render();
  }

  async restore(workspace) {
    const state = workspace.state || {};
    this.store.setState({
      point: state.point || this.store.getState().point,
      radiusKm: state.radiusKm || this.store.getState().radiusKm,
      windowDays: state.windowDays || this.store.getState().windowDays,
      categories: new Set(state.categories || []),
      routesVisible: Boolean(state.routesVisible),
      clustersVisible: state.clustersVisible !== false,
      marketTimeframe: state.marketTimeframe || '1h',
      marketAssetClass: state.marketAssetClass || '',
      selectedMarketAsset: state.selectedMarketAsset || 'btc-usd',
      opportunityFilters: state.opportunityFilters || {},
      replaySettings: state.replaySettings || {}
    }, 'workspace.restored');
    this.repository.setActive(workspace.id);
    await this.switchView(state.activeView || 'map');
    window.dispatchEvent(new CustomEvent('merlin:workspace-restored', { detail: workspace }));
    text('#workspace-status', `LOADED ${workspace.name.toUpperCase()}`);
    this.render();
  }

  handleListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const workspace = this.repository.get(button.dataset.id);
    if (button.dataset.action === 'load' && workspace) this.restore(workspace);
    if (button.dataset.action === 'delete') { this.repository.remove(button.dataset.id); this.render(); }
  }

  async importFile(file) {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      const count = this.repository.import(value);
      text('#workspace-status', `IMPORTED ${count}`);
      this.render();
    } catch { text('#workspace-status', 'IMPORT ERROR'); }
  }

  render() {
    const root = $('#workspace-list');
    if (!root) return;
    const active = this.repository.activeId();
    const items = this.repository.list();
    root.innerHTML = items.length ? items.map(item => `
      <article class="workspace-row ${item.id === active ? 'active' : ''}">
        <button type="button" data-action="load" data-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.state?.activeView || 'map')} / ${item.updatedAt.slice(0, 16).replace('T', ' ')}</small></button>
        <button type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete">×</button>
      </article>`).join('') : '<div class="empty-state">0 WORKSPACES</div>';
    text('#workspace-count', String(items.length));
  }
}

return Object.freeze({WorkspaceController});
})();

// MODULE: account/cloud-sync.js
__modules['account/cloud-sync.js'] = (() => {

const BUCKETS = Object.freeze({
  watchlists: { key: 'merlin.market.watchlist.v1', fallback: [] },
  workspaces: { key: 'merlin.workspaces.v1', fallback: [] },
  alerts: { key: 'merlin.alert-rules.v1', fallback: [] },
  savedSearches: { key: 'merlin.news-searches.v1', fallback: [] },
  preferences: { key: 'merlin.preferences.v1', fallback: {} }
});

function parse(value, fallback) { try { return value ? JSON.parse(value) : structuredClone(fallback); } catch { return structuredClone(fallback); } }
function identifier(item) { return typeof item === 'string' ? item : item?.id || item?.name || JSON.stringify(item); }
function mergeArrays(local, remote) {
  const values = [...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])];
  return [...new Map(values.map(item => [identifier(item), item])).values()];
}

class CloudSync {
  constructor(api) { this.api = api; }
  buckets() { return Object.keys(BUCKETS); }
  local(bucket) { const definition = BUCKETS[bucket]; return parse(localStorage.getItem(definition.key), definition.fallback); }
  saveLocal(bucket, value) { localStorage.setItem(BUCKETS[bucket].key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('merlin:cloud-data-updated', { detail: { bucket } })); }
  count(value) { return Array.isArray(value) ? value.length : Object.keys(value || {}).length; }
  async status(bucket) { const local = this.local(bucket); const remote = (await this.api.userData(bucket)).value; return { bucket, local: this.count(local), remote: this.count(remote), localValue: local, remoteValue: remote }; }
  async push(bucket) { const value = this.local(bucket); const result = await this.api.saveUserData(bucket, value); return { bucket, value: result.value, direction: 'PUSH' }; }
  async pull(bucket) { const result = await this.api.userData(bucket); this.saveLocal(bucket, result.value); return { bucket, value: result.value, direction: 'PULL' }; }
  async merge(bucket) {
    const local = this.local(bucket); const remote = (await this.api.userData(bucket)).value;
    const value = bucket === 'preferences' ? { ...(remote || {}), ...(local || {}) } : mergeArrays(local, remote);
    this.saveLocal(bucket, value); await this.api.saveUserData(bucket, value); return { bucket, value, direction: 'MERGE' };
  }
}

return Object.freeze({CloudSync});
})();

// MODULE: admin/controller.js
__modules['admin/controller.js'] = (() => {
const { $, text } = __modules['ui/dom.js'];
const { number } = __modules['ui/format.js'];


function date(value) { return value ? new Date(value).toISOString().slice(0, 10) : 'N/A'; }
function escape(value) { const node = document.createElement('span'); node.textContent = String(value ?? ''); return node.innerHTML; }

class AdminController {
  constructor(options) { this.api = options.api; this.bound = false; this.users = []; }
  bind() {
    if (this.bound) return; this.bound = true;
    $('#admin-refresh')?.addEventListener('click', () => this.load());
    $('#admin-user-search')?.addEventListener('input', event => this.loadUsers(event.target.value));
    $('#admin-users')?.addEventListener('click', event => this.handleUserAction(event));
  }
  async load() {
    this.bind();
    const [metrics, users, audit] = await Promise.all([this.api.adminMetrics(), this.api.adminUsers(), this.api.adminAudit({ limit: 100 })]);
    this.renderMetrics(metrics); this.users = users.users || []; this.renderUsers(); this.renderAudit(audit.events || []);
  }
  async loadUsers(query = '') { const result = await this.api.adminUsers({ q: query }); this.users = result.users || []; this.renderUsers(); }
  renderMetrics(value) {
    text('#admin-user-count', number(value.users || 0)); text('#admin-active-count', number(value.active30d || 0)); text('#admin-subscription-count', number(value.subscriptions || 0)); text('#admin-audit-count', number(value.auditEvents || 0));
    text('#admin-plan-mix', Object.entries(value.byPlan || {}).map(([key, count]) => `${key} ${count}`).join(' / ') || 'N/A');
    text('#admin-provider-state', Object.entries(value.billingProviders || {}).map(([key, provider]) => `${key.toUpperCase()} ${provider.state}`).join(' / ') || 'N/A');
  }
  renderUsers() {
    const target = $('#admin-users'); if (!target) return;
    target.innerHTML = this.users.map(user => `<div class="admin-user-row" data-user-id="${escape(user.id)}"><span><strong>${escape(user.displayName || user.email)}</strong><small>${escape(user.email)}</small></span><b>${escape(user.role)}</b><b>${escape(user.status)}</b><b>${escape(user.subscription?.planId || 'FREE')}</b><b>${escape(date(user.lastLoginAt))}</b><select data-admin-role><option>USER</option><option>ANALYST</option><option>ADMIN</option></select><select data-admin-plan><option>FREE</option><option>PRO</option><option>TEAM</option></select><button data-admin-action="role">ROLE</button><button data-admin-action="plan">PLAN</button><button data-admin-action="status">${user.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'}</button></div>`).join('') || '<div class="empty-state">0 USERS</div>';
    for (const row of target.querySelectorAll('.admin-user-row')) {
      const user = this.users.find(item => item.id === row.dataset.userId); if (!user) continue;
      row.querySelector('[data-admin-role]').value = user.role;
      row.querySelector('[data-admin-plan]').value = user.subscription?.planId || 'FREE';
    }
  }
  renderAudit(events) {
    const target = $('#admin-audit'); if (!target) return;
    target.innerHTML = events.map(event => `<div class="admin-audit-row"><time>${escape(new Date(event.at).toISOString().replace('T',' ').slice(0,19))}</time><b>${escape(event.action)}</b><span>${escape(event.targetType || 'N/A')}</span><span>${escape(event.outcome)}</span></div>`).join('') || '<div class="empty-state">0 EVENTS</div>';
  }
  async handleUserAction(event) {
    const button = event.target.closest('[data-admin-action]'); if (!button) return;
    const row = button.closest('.admin-user-row'); const userId = row.dataset.userId; button.disabled = true;
    try {
      if (button.dataset.adminAction === 'role') await this.api.adminSetRole(userId, row.querySelector('[data-admin-role]').value);
      if (button.dataset.adminAction === 'plan') await this.api.adminGrantPlan(userId, { planId: row.querySelector('[data-admin-plan]').value, days: 31 });
      if (button.dataset.adminAction === 'status') { const user = this.users.find(item => item.id === userId); await this.api.adminSetStatus(userId, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'); }
      await this.load();
    } finally { button.disabled = false; }
  }
}

return Object.freeze({AdminController});
})();

// MODULE: account/controller.js
__modules['account/controller.js'] = (() => {
const { $, $$, text } = __modules['ui/dom.js'];
const { CloudSync } = __modules['account/cloud-sync.js'];
const { AdminController } = __modules['admin/controller.js'];



function date(value) { return value ? new Date(value).toISOString().slice(0, 10) : 'N/A'; }
function money(plan) { return plan.amountMinor === 0 ? '£0' : `£${(plan.amountMinor / 100).toFixed(0)}`; }
function roleLevel(role) { return ['USER','ANALYST','ADMIN','OWNER'].indexOf(role || 'USER'); }

class AccountController {
  constructor(options) { this.api = options.api; this.store = options.store; this.sync = new CloudSync(this.api); this.admin = new AdminController({ api: this.api }); this.initialized = false; this.bound = false; this.session = null; this.plans = []; }
  bind() {
    if (this.bound) return; this.bound = true;
    $('#auth-login')?.addEventListener('submit', event => this.login(event));
    $('#auth-register')?.addEventListener('submit', event => this.register(event));
    $('#account-logout')?.addEventListener('click', () => this.logout());
    $('#profile-form')?.addEventListener('submit', event => this.profile(event));
    $('#password-form')?.addEventListener('submit', event => this.password(event));
    $('#billing-provider')?.addEventListener('change', () => this.renderPlans());
    $('#billing-plans')?.addEventListener('click', event => this.checkout(event));
    $('#cloud-sync-rows')?.addEventListener('click', event => this.syncAction(event));
    $('#cloud-refresh')?.addEventListener('click', () => this.renderSync());
  }
  async ensureInitialized(force = false) {
    this.bind(); if (this.initialized && !force) return;
    const [session, plans] = await Promise.all([this.api.authSession(), this.api.billingPlans()]);
    this.session = session; this.plans = plans.plans || []; this.providers = plans.providers || {};
    this.api.setCsrfToken(session.csrfToken || null); this.store.setState({ account: session }, 'account.session'); this.render(); this.initialized = true;
  }
  setStatus(value, bad = false) { const node = $('#account-message'); if (!node) return; node.textContent = value; node.classList.toggle('error', bad); }
  async login(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); this.setStatus('AUTHENTICATING');
    try { this.session = await this.api.login({ email: form.get('email'), password: form.get('password') }); this.api.setCsrfToken(this.session.csrfToken); this.initialized = true; this.render(); this.setStatus('AUTHENTICATED'); }
    catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); }
  }
  async register(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); this.setStatus('CREATING');
    try { this.session = await this.api.register({ email: form.get('email'), password: form.get('password'), displayName: form.get('displayName') }); this.api.setCsrfToken(this.session.csrfToken); this.initialized = true; this.render(); this.setStatus('ACTIVE'); }
    catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); }
  }
  async logout() { try { await this.api.logout(); } finally { this.api.setCsrfToken(null); this.session = { authenticated: false }; this.render(); } }
  async profile(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await this.api.updateProfile({ displayName: form.get('displayName') }); this.session.user = result.user; this.renderIdentity(); this.setStatus('PROFILE SAVED'); }
  async password(event) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await this.api.changePassword({ currentPassword: form.get('currentPassword'), nextPassword: form.get('nextPassword') }); this.setStatus('PASSWORD CHANGED / LOGIN REQUIRED'); await this.logout().catch(() => {}); } catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); } }
  render() {
    const authenticated = Boolean(this.session?.authenticated);
    $('#account-anonymous')?.classList.toggle('hidden', authenticated); $('#account-authenticated')?.classList.toggle('hidden', !authenticated);
    text('#account-nav-state', authenticated ? this.session.entitlements?.planId || 'FREE' : 'SIGN IN');
    if (!authenticated) return;
    this.renderIdentity(); this.renderPlans(); this.renderSync();
    const admin = roleLevel(this.session.user.role) >= roleLevel('ADMIN'); $('#account-admin')?.classList.toggle('hidden', !admin); if (admin) this.admin.load();
  }
  renderIdentity() {
    const { user, subscription, entitlements } = this.session;
    text('#account-name', user.displayName || user.email); text('#account-email', user.email); text('#account-role', user.role); text('#account-plan', entitlements.planId); text('#account-sub-state', subscription?.state || 'NONE'); text('#account-renewal', date(subscription?.currentPeriodEnd));
    text('#account-api-limit', entitlements.limits.apiRequestsPerDay?.toLocaleString() || 'N/A'); text('#account-alert-limit', entitlements.limits.alertRules?.toLocaleString() || 'N/A'); text('#account-workspace-limit', entitlements.limits.workspaces?.toLocaleString() || 'N/A');
    const field = $('#profile-display-name'); if (field) field.value = user.displayName || '';
  }
  renderPlans() {
    const target = $('#billing-plans'); if (!target) return; const providerId = $('#billing-provider')?.value || 'stripe'; const provider = this.providers?.[providerId];
    target.innerHTML = this.plans.map(plan => `<article class="billing-plan ${this.session?.entitlements?.planId === plan.id ? 'current' : ''}"><header><span>${plan.id}</span><strong>${money(plan)}</strong><small>/${plan.interval.toUpperCase()}</small></header><div><b>${plan.limits.alertRules}</b><span>ALERTS</span><b>${plan.limits.workspaces}</b><span>WORKSPACES</span><b>${plan.limits.exportsPerDay}</b><span>EXPORTS/D</span></div><button type="button" data-plan-id="${plan.id}" ${plan.id === 'FREE' || !provider?.configured ? 'disabled' : ''}>${this.session?.entitlements?.planId === plan.id ? 'CURRENT' : 'SELECT'}</button></article>`).join('');
    text('#billing-provider-state', provider ? provider.state : 'N/A');
  }
  async checkout(event) { const button = event.target.closest('[data-plan-id]'); if (!button || button.disabled) return; button.disabled = true; try { const result = await this.api.createCheckout({ planId: button.dataset.planId, provider: $('#billing-provider').value }); if (result.url) location.assign(result.url); } catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); button.disabled = false; } }
  async renderSync() {
    if (!this.session?.authenticated) return; const target = $('#cloud-sync-rows'); if (!target) return; target.innerHTML = '<div class="empty-state">LOADING</div>';
    const rows = await Promise.all(this.sync.buckets().map(bucket => this.sync.status(bucket).catch(() => ({ bucket, local: this.sync.count(this.sync.local(bucket)), remote: 'N/A' }))));
    target.innerHTML = rows.map(row => `<div class="cloud-sync-row" data-bucket="${row.bucket}"><b>${row.bucket.toUpperCase()}</b><span>${row.local}</span><span>${row.remote}</span><button data-sync="push">PUSH</button><button data-sync="pull">PULL</button><button data-sync="merge">MERGE</button></div>`).join('');
  }
  async syncAction(event) { const button = event.target.closest('[data-sync]'); if (!button) return; const row = button.closest('[data-bucket]'); button.disabled = true; try { await this.sync[button.dataset.sync](row.dataset.bucket); await this.renderSync(); this.setStatus(`${row.dataset.bucket.toUpperCase()} ${button.dataset.sync.toUpperCase()} OK`); } catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); } finally { button.disabled = false; } }
}

return Object.freeze({AccountController});
})();

// MODULE: ops/controller.js
__modules['ops/controller.js'] = (() => {
const { $, text } = __modules['ui/dom.js'];

function value(selector, input, suffix = '') {
  const element = $(selector);
  if (!element) return;
  element.textContent = input === null || input === undefined || Number.isNaN(input) ? 'N/A' : `${input}${suffix}`;
}

function statusClass(value) {
  const normalized = String(value || '').toUpperCase();
  if (['HEALTHY', 'GOOD', 'PASS', 'LIVE', 'READY'].includes(normalized)) return 'good';
  if (['DEGRADED', 'WARN', 'STALE', 'PARTIAL'].includes(normalized)) return 'warn';
  if (['UNHEALTHY', 'POOR', 'FAIL', 'ERROR', 'OFF'].includes(normalized)) return 'bad';
  return 'neutral';
}

function rows(container, records, render) {
  const target = $(container);
  if (!target) return;
  target.replaceChildren(...records.map(render));
}

function cell(label, number, unit = '') {
  const article = document.createElement('article');
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  span.textContent = label;
  strong.textContent = number === null || number === undefined ? 'N/A' : `${number}${unit}`;
  article.append(span, strong);
  return article;
}

class OpsController {
  constructor(options) {
    this.api = options.api;
    this.initialized = false;
    this.loading = false;
    this.timer = null;
  }

  bind() {
    $('#ops-refresh')?.addEventListener('click', () => this.refresh());
    $('#ops-auto')?.addEventListener('click', event => {
      const active = event.currentTarget.dataset.active !== 'true';
      event.currentTarget.dataset.active = String(active);
      event.currentTarget.textContent = `AUTO ${active ? 'ON' : 'OFF'}`;
      if (active) this.startAuto();
      else this.stopAuto();
    });
    $('#ops-export')?.addEventListener('click', () => this.exportSnapshot());
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    await this.refresh();
  }

  startAuto() {
    this.stopAuto();
    this.timer = setInterval(() => this.refresh({ quiet: true }), 15_000);
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async refresh(options = {}) {
    if (this.loading) return;
    this.loading = true;
    const button = $('#ops-refresh');
    if (button && !options.quiet) { button.disabled = true; button.textContent = '...'; }
    try {
      const [health, quality, build, metrics, clients] = await Promise.all([
        this.api.opsHealth(), this.api.opsQuality(), this.api.opsBuild(), this.api.opsMetrics(), this.api.opsClientReports()
      ]);
      this.last = { health, quality, build, metrics, clients, capturedAt: new Date().toISOString() };
      this.renderHealth(health);
      this.renderQuality(quality);
      this.renderBuild(build);
      this.renderMetrics(metrics);
      this.renderClients(clients);
      text('#ops-updated', new Date().toISOString().slice(11, 19));
      text('#ops-error', '');
      $('#ops-error')?.classList.add('hidden');
    } catch (error) {
      const element = $('#ops-error');
      if (element) { element.textContent = `${error.code || 'OPS_ERROR'} / ${error.message}`; element.classList.remove('hidden'); }
    } finally {
      this.loading = false;
      if (button && !options.quiet) { button.disabled = false; button.textContent = 'REFRESH'; }
    }
  }

  renderHealth(health) {
    for (const state of [$('#ops-health-state'), $('#ops-health-detail-state')].filter(Boolean)) { state.textContent = health.status || 'N/A'; state.className = statusClass(health.status); }
    value('#ops-ready', health.ready ? 'YES' : 'NO');
    value('#ops-uptime', health.runtime?.uptimeSeconds, 'S');
    value('#ops-memory', health.runtime?.memoryMb?.rss, ' MB');
    value('#ops-heap', health.runtime?.memoryMb?.heapUsed, ' MB');
    value('#ops-loop-p95', health.runtime?.eventLoopMs?.p95, ' MS');
    value('#ops-source-live', health.sourceSummary ? `${health.sourceSummary.configured - health.sourceSummary.failed}/${health.sourceSummary.configured}` : null);
    value('#ops-source-degraded', health.sourceSummary?.degraded);
    rows('#ops-health-checks', health.checks || [], check => {
      const row = document.createElement('div');
      row.className = `ops-row ${statusClass(check.status)}`;
      row.innerHTML = `<span>${check.id.toUpperCase()}</span><b>${check.status}</b><strong>${check.value ?? 'N/A'}${check.unit || ''}${check.total ? `/${check.total}` : ''}</strong>`;
      return row;
    });
  }

  renderQuality(quality) {
    const state = $('#ops-quality-state');
    if (state) { state.textContent = quality.status || 'N/A'; state.className = statusClass(quality.status); }
    value('#ops-quality-score', quality.score, '%');
    value('#ops-source-quality', quality.sources?.score, '%');
    value('#ops-catalog-quality', quality.catalogs?.score, '%');
    value('#ops-cache-entries', quality.cache?.entries);
    value('#ops-cache-hits', quality.cache?.hits);
    const groups = Object.entries(quality.sources?.groups || {});
    rows('#ops-source-quality-rows', groups, ([name, group]) => {
      const row = document.createElement('div');
      row.className = `ops-row ${statusClass(group.meanScore >= 80 ? 'GOOD' : group.meanScore >= 50 ? 'WARN' : 'FAIL')}`;
      row.innerHTML = `<span>${name.toUpperCase()}</span><b>${group.meanScore ?? 'N/A'}%</b><strong>${group.live}/${group.configured}</strong>`;
      return row;
    });
    rows('#ops-catalog-checks', quality.catalogs?.checks || [], check => {
      const row = document.createElement('div');
      row.className = `ops-row ${statusClass(check.status)}`;
      row.innerHTML = `<span>${check.id.toUpperCase()}</span><b>${check.status}</b><strong>${check.value ?? check.duplicates ?? check.invalid ?? 'N/A'}</strong>`;
      return row;
    });
  }

  renderBuild(build) {
    value('#ops-version', build.version);
    value('#ops-node', build.node);
    value('#ops-environment', String(build.environment || '').toUpperCase());
    value('#ops-commit', build.commitSha ? build.commitSha.slice(0, 12) : 'N/A');
    value('#ops-region', build.region || 'N/A');
    value('#ops-deployment', build.deploymentId ? String(build.deploymentId).slice(0, 18) : 'N/A');
    const target = $('#ops-capabilities');
    if (target) target.replaceChildren(...(build.capabilities || []).map(name => {
      const span = document.createElement('span'); span.textContent = name; return span;
    }));
  }

  renderMetrics(metrics) {
    const requestCounter = (metrics.counters || []).filter(item => item.name === 'merlin_http_requests_total').reduce((sum, item) => sum + item.value, 0);
    const errorCounter = (metrics.counters || []).filter(item => item.name === 'merlin_http_errors_total' && item.labels.class === '5xx').reduce((sum, item) => sum + item.value, 0);
    const slowCounter = (metrics.counters || []).filter(item => item.name === 'merlin_http_slow_requests_total').reduce((sum, item) => sum + item.value, 0);
    const latency = (metrics.histograms || []).filter(item => item.name === 'merlin_http_request_duration_ms');
    const totalLatency = latency.reduce((sum, item) => sum + item.sum, 0);
    const totalCount = latency.reduce((sum, item) => sum + item.count, 0);
    value('#ops-requests', requestCounter);
    value('#ops-errors', errorCounter);
    value('#ops-error-rate', requestCounter ? Math.round((errorCounter / requestCounter) * 10000) / 100 : 0, '%');
    value('#ops-slow', slowCounter);
    value('#ops-latency-mean', totalCount ? Math.round(totalLatency / totalCount) : null, ' MS');
    const routes = latency.map(item => ({ route: item.labels.route, method: item.labels.method, count: item.count, mean: item.mean, maximum: item.maximum })).sort((a, b) => b.mean - a.mean).slice(0, 20);
    rows('#ops-route-metrics', routes, route => {
      const row = document.createElement('div');
      row.className = 'ops-route-row';
      row.innerHTML = `<b>${route.method}</b><span>${route.route}</span><strong>${Math.round(route.mean || 0)} MS</strong><small>N=${route.count} / MAX ${Math.round(route.maximum || 0)}</small>`;
      return row;
    });
  }

  renderClients(clients) {
    value('#ops-client-reports', clients.count);
    value('#ops-client-errors', clients.byType?.ERROR || 0);
    const vitals = Object.entries(clients.vitals || {}).map(([name, item]) => ({ name, ...item }));
    rows('#ops-vitals', vitals, vital => cell(vital.name, vital.mean === null ? null : Math.round(vital.mean * 100) / 100, vital.name === 'CLS' ? '' : ' MS'));
  }

  exportSnapshot() {
    if (!this.last) return;
    const blob = new Blob([JSON.stringify(this.last, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `merlin-system-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}

return Object.freeze({OpsController});
})();

// MODULE: pwa/register.js
__modules['pwa/register.js'] = (() => {

class PwaController {
  constructor(options = {}) {
    this.onState = options.onState || (() => {});
    this.registration = null;
    this.deferredPrompt = null;
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      this.onState({ supported: false, state: 'UNSUPPORTED' });
      return null;
    }
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      this.bindRegistration(this.registration);
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        this.deferredPrompt = event;
        this.onState({ supported: true, installable: true, state: 'INSTALLABLE' });
      });
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.onState({ supported: true, installed: true, state: 'INSTALLED' });
      });
      this.onState({ supported: true, state: this.registration.active ? 'ACTIVE' : 'REGISTERED' });
      return this.registration;
    } catch (error) {
      this.onState({ supported: true, state: 'ERROR', error });
      return null;
    }
  }

  bindRegistration(registration) {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) this.onState({ supported: true, updateAvailable: true, state: 'UPDATE_READY' });
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => this.onState({ supported: true, state: 'UPDATED' }));
  }

  async install() {
    if (!this.deferredPrompt) return { outcome: 'unavailable' };
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return choice;
  }

  async applyUpdate() {
    const waiting = this.registration?.waiting;
    if (!waiting) return false;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }
}

return Object.freeze({PwaController});
})();

// MODULE: pwa/connectivity.js
__modules['pwa/connectivity.js'] = (() => {

class ConnectivityController {
  constructor(options = {}) {
    this.onChange = options.onChange || (() => {});
    this.state = { online: navigator.onLine, effectiveType: navigator.connection?.effectiveType || 'N/A', downlink: navigator.connection?.downlink || null, rtt: navigator.connection?.rtt || null };
  }

  bind() {
    const update = () => {
      this.state = { online: navigator.onLine, effectiveType: navigator.connection?.effectiveType || 'N/A', downlink: navigator.connection?.downlink || null, rtt: navigator.connection?.rtt || null };
      document.documentElement.dataset.connectivity = this.state.online ? 'online' : 'offline';
      this.onChange({ ...this.state });
      window.dispatchEvent(new CustomEvent('merlin:connectivity', { detail: this.state }));
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    navigator.connection?.addEventListener?.('change', update);
    update();
  }
}

return Object.freeze({ConnectivityController});
})();

// MODULE: performance/client-metrics.js
__modules['performance/client-metrics.js'] = (() => {

const THRESHOLDS = Object.freeze({
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800]
});

function rating(name, value) {
  const threshold = THRESHOLDS[name];
  if (!threshold || !Number.isFinite(value)) return 'N/A';
  return value <= threshold[0] ? 'GOOD' : value <= threshold[1] ? 'NEEDS_IMPROVEMENT' : 'POOR';
}

function supported(type) { return typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes(type); }

class ClientMetrics {
  constructor(options = {}) {
    this.report = options.report || (() => Promise.resolve());
    this.version = options.version || 'N/A';
    this.sent = new Set();
    this.cls = 0;
    this.lcp = null;
    this.inp = null;
  }

  send(name, value, extra = {}) {
    const key = `${name}:${Math.round(Number(value) * 100)}`;
    if (this.sent.has(key)) return;
    this.sent.add(key);
    this.report({ type: 'WEB_VITAL', name, value, rating: rating(name, value), route: location.pathname, clientVersion: this.version, ...extra }).catch(() => {});
  }

  start() {
    this.observeNavigation();
    this.observePaint();
    this.observeLcp();
    this.observeCls();
    this.observeInp();
    this.observeErrors();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
    window.addEventListener('pagehide', () => this.flush());
  }

  observeNavigation() {
    const entry = performance.getEntriesByType('navigation')[0];
    if (!entry) return;
    const ttfb = Math.max(0, entry.responseStart - entry.requestStart);
    queueMicrotask(() => this.send('TTFB', ttfb));
  }

  observePaint() {
    if (!supported('paint')) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (entry.name === 'first-contentful-paint') this.send('FCP', entry.startTime);
    });
    observer.observe({ type: 'paint', buffered: true });
  }

  observeLcp() {
    if (!supported('largest-contentful-paint')) return;
    const observer = new PerformanceObserver(list => { const entries = list.getEntries(); this.lcp = entries.at(-1)?.startTime ?? this.lcp; });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  observeCls() {
    if (!supported('layout-shift')) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) this.cls += entry.value;
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  }

  observeInp() {
    if (!supported('event')) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) this.inp = Math.max(this.inp || 0, entry.duration || 0);
    });
    try { observer.observe({ type: 'event', buffered: true, durationThreshold: 40 }); } catch {}
  }

  observeErrors() {
    window.addEventListener('error', event => this.report({ type: 'ERROR', name: 'WINDOW_ERROR', message: event.message, stack: event.error?.stack || '', route: location.pathname, clientVersion: this.version }).catch(() => {}));
    window.addEventListener('unhandledrejection', event => this.report({ type: 'ERROR', name: 'UNHANDLED_REJECTION', message: String(event.reason?.message || event.reason || 'Unknown rejection'), stack: event.reason?.stack || '', route: location.pathname, clientVersion: this.version }).catch(() => {}));
    window.addEventListener('merlin:connectivity', event => this.report({ type: 'CONNECTIVITY', name: event.detail.online ? 'ONLINE' : 'OFFLINE', online: event.detail.online, effectiveType: event.detail.effectiveType, route: location.pathname, clientVersion: this.version }).catch(() => {}));
  }

  flush() {
    if (this.lcp !== null) this.send('LCP', this.lcp);
    this.send('CLS', this.cls);
    if (this.inp !== null) this.send('INP', this.inp);
  }
}

return Object.freeze({ClientMetrics});
})();

// MODULE: experience/command-registry.js
__modules['experience/command-registry.js'] = (() => {

const VIEW_COMMANDS = Object.freeze([
  ['map', 'Open map', 'Global event radius analysis', '1'],
  ['news', 'Open news', 'Verified news and social intelligence', '2'],
  ['shipping', 'Open shipping', 'Ports, routes and trade disruption', '3'],
  ['intelligence', 'Open places', 'Country and city intelligence', '4'],
  ['opportunities', 'Open opportunities', 'Ranked cross-signal opportunities', '5'],
  ['markets', 'Open markets', 'Market scanner and probability models', '6'],
  ['replay', 'Open replay', 'Historical strategy replay', '7'],
  ['predictions', 'Open predictions', 'Prediction market intelligence', '8'],
  ['alerts', 'Open alerts', 'Alert rules and trigger history', '9'],
  ['ops', 'Open system', 'Health, quality and deployment status', '0'],
  ['account', 'Open account', 'Account, plan and cloud data', 'A']
].map(([view, label, detail, shortcut]) => ({ id: `view:${view}`, type: 'view', view, label, detail, shortcut })));

const ACTION_COMMANDS = Object.freeze([
  { id: 'action:refresh', type: 'action', label: 'Refresh current view', detail: 'Request the latest available data', shortcut: 'R' },
  { id: 'action:search', type: 'action', label: 'Focus place search', detail: 'Search a place or coordinates', shortcut: '/' },
  { id: 'action:workspaces', type: 'action', label: 'Open workspaces', detail: 'Save or restore a complete workspace', shortcut: 'W' },
  { id: 'action:diagnostics', type: 'action', label: 'Open diagnostics', detail: 'Inspect source health and failures', shortcut: 'D' },
  { id: 'action:sound', type: 'action', label: 'Cycle sound mode', detail: 'Off, alert-only or full interface audio', shortcut: 'M' },
  { id: 'action:density', type: 'action', label: 'Toggle interface density', detail: 'Comfortable or compact data layout', shortcut: 'C' },
  { id: 'action:motion', type: 'action', label: 'Toggle motion', detail: 'Full or reduced interface motion', shortcut: 'G' }
]);

function createCommandRegistry(extra = []) {
  return [...VIEW_COMMANDS, ...ACTION_COMMANDS, ...extra];
}

function tokenize(value) {
  return String(value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function scoreField(field, query) {
  const value = String(field || '').toLowerCase();
  if (!value) return 0;
  if (value === query) return 100;
  if (value.startsWith(query)) return 72;
  if (value.includes(query)) return 48;
  return 0;
}

function rankCommands(commands, query, limit = 12) {
  const clean = String(query || '').toLowerCase().trim();
  if (!clean) return commands.slice(0, limit);
  const tokens = tokenize(clean);
  return commands
    .map(command => {
      const haystack = `${command.label} ${command.detail} ${command.view || ''} ${command.shortcut || ''}`.toLowerCase();
      const tokenScore = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 20 : -40), 0);
      const score = scoreField(command.label, clean) + scoreField(command.view, clean) + scoreField(command.id, clean) + tokenScore;
      return { command, score };
    })
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.command.label.localeCompare(right.command.label))
    .slice(0, limit)
    .map(item => item.command);
}

return Object.freeze({VIEW_COMMANDS, ACTION_COMMANDS, createCommandRegistry, rankCommands});
})();

// MODULE: experience/command-palette.js
__modules['experience/command-palette.js'] = (() => {
const { createCommandRegistry, rankCommands } = __modules['experience/command-registry.js'];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

class CommandPalette {
  constructor({ onExecute, commands = createCommandRegistry(), sound } = {}) {
    this.onExecute = onExecute;
    this.commands = commands;
    this.sound = sound;
    this.opened = false;
    this.activeIndex = 0;
    this.results = commands.slice(0, 12);
  }

  bind() {
    this.root = document.querySelector('#command-palette');
    this.input = document.querySelector('#command-input');
    this.list = document.querySelector('#command-results');
    this.backdrop = document.querySelector('#command-backdrop');
    document.querySelector('#command-toggle')?.addEventListener('click', () => this.open());
    document.querySelector('#command-close')?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    this.input?.addEventListener('input', event => this.search(event.target.value));
    this.input?.addEventListener('keydown', event => this.#onKeydown(event));
    this.list?.addEventListener('mousemove', event => {
      const row = event.target.closest('[data-command-index]');
      if (!row) return;
      this.activeIndex = Number(row.dataset.commandIndex);
      this.#paintActive();
    });
    this.list?.addEventListener('click', event => {
      const row = event.target.closest('[data-command-index]');
      if (row) this.execute(Number(row.dataset.commandIndex));
    });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        this.opened ? this.close() : this.open();
      }
      if (event.key === 'Escape' && this.opened) this.close();
    });
    this.render();
  }

  setCommands(commands) {
    this.commands = commands;
    this.search(this.input?.value || '');
  }

  open(query = '') {
    if (!this.root) return;
    this.opened = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('command-open');
    this.search(query);
    requestAnimationFrame(() => this.input?.focus());
    this.sound?.play('OPEN');
  }

  close() {
    if (!this.root || !this.opened) return;
    this.opened = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('command-open');
    this.sound?.play('CLOSE');
  }

  search(query) {
    if (this.input && this.input.value !== query) this.input.value = query;
    this.results = rankCommands(this.commands, query, 14);
    this.activeIndex = 0;
    this.render();
  }

  execute(index = this.activeIndex) {
    const command = this.results[index];
    if (!command) return;
    this.onExecute?.(command);
    this.sound?.play('NAVIGATE');
    this.close();
  }

  render() {
    if (!this.list) return;
    if (!this.results.length) {
      this.list.innerHTML = '<div class="command-empty"><strong>NO MATCH</strong><span>Try a view, action or shortcut.</span></div>';
      return;
    }
    this.list.innerHTML = this.results.map((command, index) => `
      <button class="command-row${index === this.activeIndex ? ' active' : ''}" type="button" data-command-index="${index}" role="option" aria-selected="${index === this.activeIndex}">
        <span class="command-icon">${command.type === 'view' ? 'VIEW' : 'ACT'}</span>
        <span class="command-copy"><strong>${escapeHtml(command.label)}</strong><small>${escapeHtml(command.detail || '')}</small></span>
        ${command.shortcut ? `<kbd>${escapeHtml(command.shortcut)}</kbd>` : ''}
      </button>`).join('');
  }

  #paintActive() {
    this.list?.querySelectorAll('[data-command-index]').forEach((row, index) => {
      row.classList.toggle('active', index === this.activeIndex);
      row.setAttribute('aria-selected', String(index === this.activeIndex));
    });
    this.list?.querySelector(`[data-command-index="${this.activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  #onKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.results.length - 1, this.activeIndex + 1);
      this.#paintActive();
      this.sound?.play('INTERACT', { level: 0.4 });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(0, this.activeIndex - 1);
      this.#paintActive();
      this.sound?.play('INTERACT', { level: 0.4 });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.execute();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}

return Object.freeze({CommandPalette});
})();

// MODULE: experience/preferences.js
__modules['experience/preferences.js'] = (() => {

const STORAGE_KEY = 'merlin.experience.preferences.v4';

const SOUND_MODES = Object.freeze(['OFF']);
const DENSITY_MODES = Object.freeze(['COMFORTABLE', 'COMPACT']);
const MOTION_MODES = Object.freeze(['SYSTEM', 'FULL', 'REDUCED']);

const DEFAULT_PREFERENCES = Object.freeze({
  soundMode: 'OFF',
  volume: 0,
  motionMode: 'SYSTEM',
  density: 'COMFORTABLE',
  ambientGlow: true,
  cursorLight: true,
  metricAnimation: true
});

function clamp(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function oneOf(value, choices, fallback) {
  return choices.includes(String(value).toUpperCase()) ? String(value).toUpperCase() : fallback;
}

function normalizePreferences(input = {}) {
  return {
    soundMode: oneOf(input.soundMode, SOUND_MODES, DEFAULT_PREFERENCES.soundMode),
    volume: clamp(input.volume ?? DEFAULT_PREFERENCES.volume, 0, 1),
    motionMode: oneOf(input.motionMode, MOTION_MODES, DEFAULT_PREFERENCES.motionMode),
    density: oneOf(input.density, DENSITY_MODES, DEFAULT_PREFERENCES.density),
    ambientGlow: input.ambientGlow !== false,
    cursorLight: input.cursorLight !== false,
    metricAnimation: input.metricAnimation !== false
  };
}

function loadPreferences(storage = globalThis.localStorage) {
  if (!storage?.getItem) return { ...DEFAULT_PREFERENCES };
  try {
    const value = storage.getItem(STORAGE_KEY);
    return value ? normalizePreferences(JSON.parse(value)) : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(preferences, storage = globalThis.localStorage) {
  const normalized = normalizePreferences(preferences);
  if (storage?.setItem) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  }
  return normalized;
}

function cycleSoundMode(mode) {
  return 'OFF';
}

function effectiveMotionMode(preferences, media = globalThis.matchMedia) {
  const normalized = normalizePreferences(preferences);
  if (normalized.motionMode !== 'SYSTEM') return normalized.motionMode;
  try { return media?.('(prefers-reduced-motion: reduce)')?.matches ? 'REDUCED' : 'FULL'; }
  catch { return 'FULL'; }
}

function preferenceStorageKey() { return STORAGE_KEY; }

return Object.freeze({SOUND_MODES, DENSITY_MODES, MOTION_MODES, DEFAULT_PREFERENCES, normalizePreferences, loadPreferences, savePreferences, cycleSoundMode, effectiveMotionMode, preferenceStorageKey});
})();

// MODULE: experience/experience-controller.js
__modules['experience/experience-controller.js'] = (() => {
const { CommandPalette } = __modules['experience/command-palette.js'];
const { createCommandRegistry } = __modules['experience/command-registry.js'];
const { DEFAULT_PREFERENCES, cycleSoundMode, effectiveMotionMode, loadPreferences, savePreferences } = __modules['experience/preferences.js'];



const VIEW_SHORTCUTS = Object.freeze({
  '1': 'map', '2': 'news', '3': 'shipping', '4': 'intelligence', '5': 'opportunities',
  '6': 'markets', '7': 'replay', '8': 'predictions', '9': 'alerts', '0': 'ops'
});

function interactiveTarget(target) {
  return target?.closest?.('input, textarea, select, [contenteditable="true"]');
}

function percentValue(text) {
  const match = String(text || '').match(/(-?\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function numericValue(text) {
  const match = String(text || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function semanticClass(element) {
  const id = element.id.toLowerCase();
  const text = element.textContent.trim().toUpperCase();
  if (!text || text === 'N/A' || text === '--' || text === 'OFF' || text === 'NOT_CONFIGURED') return 'value-neutral';
  if (/ERROR|OFFLINE|FAILED|SEVERE|CRITICAL|SUSPENDED/.test(text)) return 'value-bad';
  if (/DEGRADED|WARNING|ELEVATED|PENDING/.test(text)) return 'value-warn';
  if (/ONLINE|READY|HEALTHY|ACTIVE|SUCCESS|LIVE/.test(text)) return 'value-good';
  const percent = percentValue(text);
  const value = numericValue(text);
  if (id.includes('error-rate') || id.includes('downside') || id.includes('risk') || id.includes('drawdown')) {
    if (value === null) return 'value-neutral';
    if (value >= 70) return 'value-bad';
    if (value >= 40) return 'value-warn';
    return 'value-good';
  }
  if (id.includes('confidence') || id.includes('coverage') || id.includes('quality') || id.includes('verify') || id.includes('probability')) {
    const compared = percent ?? value;
    if (compared === null) return 'value-neutral';
    if (compared >= 70) return 'value-good';
    if (compared >= 40) return 'value-warn';
    return 'value-bad';
  }
  return 'value-neutral';
}

class ExperienceController {
  constructor({ switchView } = {}) {
    this.switchView = switchView;
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.activeRequests = 0;
    this.fetchPatched = false;
    this.toastTimer = null;
    this.lastMetricSoundAt = 0;
  }

  bind() {
    this.preferences = loadPreferences();
    this.preferences.soundMode = 'OFF';
    this.preferences.volume = 0;
    this.sound = Object.freeze({ play: () => false, preview: () => false, unlock: () => false, setMode: () => {}, setVolume: () => {} });
    this.palette = new CommandPalette({
      commands: createCommandRegistry(),
      sound: this.sound,
      onExecute: command => this.#executeCommand(command)
    });
    this.palette.bind();
    this.#applyPreferences();
    this.#bindPreferenceControls();
    this.#bindAudioUnlock();
    // Interaction/navigation sounds are intentionally disabled.
    this.#bindShortcuts();
    this.#bindCursorLight();
    this.#bindApplicationEvents();
    // Metric-change tones are intentionally disabled.
    this.#bindAlertObserver();
    this.#patchFetch();
    this.#decorateExistingValues();
    document.documentElement.classList.add('experience-ready');
  }

  play(name, options) { return this.sound?.play(name, options); }

  toast(message, { tone = 'neutral', duration = 3200 } = {}) {
    const root = document.querySelector('#experience-toast');
    if (!root) return;
    root.className = `experience-toast tone-${tone}`;
    root.querySelector('strong').textContent = String(message);
    root.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => root.classList.remove('visible'), duration);
  }

  setSoundMode(_mode, { preview = false } = {}) {
    this.preferences.soundMode = 'OFF';
    this.preferences.volume = 0;
    this.#saveAndApply();
    if (preview) this.toast('AUDIO MUTED');
  }

  cycleSound() { this.setSoundMode('OFF', { preview: false }); }

  toggleDensity() {
    this.preferences.density = this.preferences.density === 'COMPACT' ? 'COMFORTABLE' : 'COMPACT';
    this.#saveAndApply();
    this.sound.play('INTERACT');
    this.toast(`${this.preferences.density} DENSITY`);
  }

  toggleMotion() {
    this.preferences.motionMode = effectiveMotionMode(this.preferences) === 'REDUCED' ? 'FULL' : 'REDUCED';
    this.#saveAndApply();
    this.sound.play('INTERACT');
    this.toast(`${this.preferences.motionMode} MOTION`);
  }

  openPreferences() {
    const panel = document.querySelector('#experience-panel');
    panel?.classList.add('open');
    panel?.setAttribute('aria-hidden', 'false');
    document.querySelector('#experience-backdrop')?.classList.add('visible');
    this.sound.play('OPEN');
  }

  closePreferences() {
    const panel = document.querySelector('#experience-panel');
    panel?.classList.remove('open');
    panel?.setAttribute('aria-hidden', 'true');
    document.querySelector('#experience-backdrop')?.classList.remove('visible');
    this.sound.play('CLOSE');
  }

  #saveAndApply() {
    this.preferences = savePreferences(this.preferences);
    this.sound.setMode(this.preferences.soundMode);
    this.sound.setVolume(this.preferences.volume);
    this.#applyPreferences();
  }

  #applyPreferences() {
    const root = document.documentElement;
    root.dataset.sound = this.preferences.soundMode.toLowerCase();
    root.dataset.motion = effectiveMotionMode(this.preferences).toLowerCase();
    root.dataset.density = this.preferences.density.toLowerCase();
    root.dataset.ambient = this.preferences.ambientGlow ? 'on' : 'off';
    root.dataset.cursorLight = this.preferences.cursorLight ? 'on' : 'off';
    root.dataset.metricAnimation = this.preferences.metricAnimation ? 'on' : 'off';
    document.querySelector('#sound-toggle')?.setAttribute('data-mode', this.preferences.soundMode);
    const soundLabel = document.querySelector('#sound-mode-label');
    if (soundLabel) soundLabel.textContent = this.preferences.soundMode;
    const soundButton = document.querySelector('#sound-toggle');
    if (soundButton) {
      soundButton.disabled = true;
      soundButton.dataset.mode = 'OFF';
      soundButton.title = 'Audio muted';
      soundButton.setAttribute('aria-label', 'Audio muted');
    }
    document.querySelectorAll('[data-sound-mode]').forEach(button => button.classList.toggle('active', button.dataset.soundMode === this.preferences.soundMode));
    const volume = document.querySelector('#experience-volume');
    if (volume) volume.value = String(Math.round(this.preferences.volume * 100));
    const volumeValue = document.querySelector('#experience-volume-value');
    if (volumeValue) volumeValue.textContent = `${Math.round(this.preferences.volume * 100)}%`;
    const density = document.querySelector('#experience-density');
    if (density) density.textContent = this.preferences.density;
    const motion = document.querySelector('#experience-motion');
    if (motion) motion.textContent = effectiveMotionMode(this.preferences);
    for (const [id, key] of [['experience-ambient', 'ambientGlow'], ['experience-cursor', 'cursorLight'], ['experience-metrics', 'metricAnimation']]) {
      const button = document.querySelector(`#${id}`);
      if (button) {
        button.dataset.active = String(this.preferences[key]);
        button.textContent = this.preferences[key] ? 'ON' : 'OFF';
      }
    }
  }

  #bindPreferenceControls() {
    document.querySelector('#sound-toggle')?.addEventListener('click', () => this.cycleSound());
    document.querySelector('#experience-toggle')?.addEventListener('click', () => this.openPreferences());
    document.querySelector('#experience-close')?.addEventListener('click', () => this.closePreferences());
    document.querySelector('#experience-backdrop')?.addEventListener('click', () => this.closePreferences());
    document.querySelectorAll('[data-sound-mode]').forEach(button => button.addEventListener('click', () => this.setSoundMode(button.dataset.soundMode)));
    document.querySelector('#experience-volume')?.addEventListener('input', event => {
      this.preferences.volume = Number(event.target.value) / 100;
      this.#saveAndApply();
    });
    document.querySelector('#experience-volume')?.addEventListener('change', () => this.sound.preview());
    document.querySelector('#experience-density')?.addEventListener('click', () => this.toggleDensity());
    document.querySelector('#experience-motion')?.addEventListener('click', () => this.toggleMotion());
    for (const [id, key] of [['experience-ambient', 'ambientGlow'], ['experience-cursor', 'cursorLight'], ['experience-metrics', 'metricAnimation']]) {
      document.querySelector(`#${id}`)?.addEventListener('click', () => {
        this.preferences[key] = !this.preferences[key];
        this.#saveAndApply();
        this.sound.play('INTERACT');
      });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.querySelector('#experience-panel')?.classList.contains('open')) this.closePreferences();
    });
  }

  #bindAudioUnlock() {
    const unlock = () => this.sound.unlock();
    document.addEventListener('pointerdown', unlock, { once: true, passive: true });
    document.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  #bindInteractionAudio() {
    document.addEventListener('click', event => {
      const target = event.target.closest('button, [role="button"], .event-row, .market-row, .news-story-row, .shipping-row, .intelligence-row, .opportunity-row');
      if (!target || target.disabled || target.closest('#command-palette')) return;
      if (target.matches('.nav-item')) this.sound.play('NAVIGATE');
      else if (!target.matches('#sound-toggle, #experience-toggle, #experience-close')) this.sound.play('INTERACT', { level: 0.45 });
    }, { capture: true });
  }

  #bindShortcuts() {
    document.addEventListener('keydown', event => {
      if (interactiveTarget(event.target) || this.palette.opened) return;
      if (event.altKey && VIEW_SHORTCUTS[event.key]) {
        event.preventDefault();
        this.switchView?.(VIEW_SHORTCUTS[event.key]);
      } else if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault(); this.switchView?.('account');
      } else if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.metaKey) {
        this.cycleSound();
      }
    });
  }

  #bindCursorLight() {
    let scheduled = false;
    let latest = { x: innerWidth / 2, y: innerHeight / 2 };
    document.addEventListener('pointermove', event => {
      latest = { x: event.clientX, y: event.clientY };
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.documentElement.style.setProperty('--cursor-x', `${latest.x}px`);
        document.documentElement.style.setProperty('--cursor-y', `${latest.y}px`);
      });
    }, { passive: true });
  }

  #bindApplicationEvents() {
    // Keep the product silent during normal navigation, loading and refreshes.
    // Only explicit alert-history notifications may produce audio when a user
    // manually enables ALERTS mode.
  }

  #bindMetricObserver() {
    const observer = new MutationObserver(records => {
      const targets = new Set(records.map(record => record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target));
      for (const target of targets) {
        const value = target?.matches?.('strong, b') ? target : target?.closest?.('strong, b');
        if (!value || !value.closest('.metric, .market-summary, .news-metrics, .shipping-metrics, .intelligence-metrics, .opportunity-summary, .ops-summary, .account-identity')) continue;
        this.#decorateValue(value, true);
      }
    });
    observer.observe(document.body, { subtree: true, characterData: true, childList: true });
    this.metricObserver = observer;
  }

  #decorateExistingValues() {
    document.querySelectorAll('.metric strong, .market-summary strong, .news-metrics strong, .shipping-metrics strong, .intelligence-metrics strong, .opportunity-summary strong, .ops-summary strong, .account-identity strong').forEach(value => this.#decorateValue(value, false));
  }

  #decorateValue(value, animate) {
    value.classList.remove('value-good', 'value-warn', 'value-bad', 'value-neutral');
    value.classList.add(semanticClass(value));
    if (animate && this.preferences.metricAnimation) {
      value.classList.remove('metric-flash');
      void value.offsetWidth;
      value.classList.add('metric-flash');
    }
  }

  #bindAlertObserver() {
    const history = document.querySelector('#alert-history');
    if (!history) return;
    let previousCount = history.children.length;
    const observer = new MutationObserver(() => {
      const count = history.children.length;
      if (count <= previousCount) { previousCount = count; return; }
      previousCount = count;
      const newest = history.firstElementChild?.textContent?.toUpperCase() || '';
      this.sound.play(/CRITICAL|SEVERE|90|100/.test(newest) ? 'CRITICAL' : 'WARNING');
      document.body.classList.add('alert-pulse');
      setTimeout(() => document.body.classList.remove('alert-pulse'), 900);
    });
    observer.observe(history, { childList: true });
    this.alertObserver = observer;
  }

  #patchFetch() {
    if (this.fetchPatched || typeof window.fetch !== 'function') return;
    this.fetchPatched = true;
    const original = window.fetch.bind(window);
    window.fetch = async (...args) => {
      this.activeRequests += 1;
      this.#renderNetworkProgress();
      try { return await original(...args); }
      finally {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.#renderNetworkProgress();
      }
    };
  }

  #renderNetworkProgress() {
    const bar = document.querySelector('#network-progress');
    if (!bar) return;
    bar.classList.toggle('active', this.activeRequests > 0);
    bar.style.setProperty('--request-count', String(Math.min(6, this.activeRequests)));
  }

  #executeCommand(command) {
    if (command.type === 'view') {
      this.switchView?.(command.view);
      return;
    }
    if (command.id === 'action:refresh') {
      const active = document.querySelector('[data-app-view]:not(.hidden)');
      const refresh = active?.querySelector('.action-button[id*="refresh"], #refresh-button, #opportunity-refresh, #market-refresh, #news-refresh, #shipping-refresh, #intelligence-refresh, #ops-refresh');
      refresh?.click();
    } else if (command.id === 'action:search') {
      this.switchView?.('map');
      setTimeout(() => document.querySelector('#place-search')?.focus(), 0);
    } else if (command.id === 'action:workspaces') document.querySelector('#workspace-toggle')?.click();
    else if (command.id === 'action:diagnostics') document.querySelector('#diagnostics-toggle')?.click();
    else if (command.id === 'action:sound') this.cycleSound();
    else if (command.id === 'action:density') this.toggleDensity();
    else if (command.id === 'action:motion') this.toggleMotion();
  }
}

return Object.freeze({ExperienceController});
})();

// ENTRY: app.js
(() => {
const { createStore } = __modules['state/store.js'];
const { createApiClient } = __modules['api/client.js'];
const { MapController } = __modules['map/map-controller.js'];
const { EventList } = __modules['scan/event-list.js'];
const { CategoryFilters } = __modules['scan/category-filters.js'];
const { ScanController } = __modules['scan/scan-controller.js'];
const { SearchController } = __modules['search/search-controller.js'];
const { SourcePanel } = __modules['sources/source-panel.js'];
const { DiagnosticsDrawer } = __modules['sources/diagnostics-drawer.js'];
const { MarketController } = __modules['markets/market-controller.js'];
const { PredictionController } = __modules['markets/prediction-controller.js'];
const { OpportunityController } = __modules['opportunities/controller.js'];
const { NewsController } = __modules['news/controller.js'];
const { ShippingController } = __modules['shipping/controller.js'];
const { IntelligenceController } = __modules['intelligence/controller.js'];
const { ReplayController } = __modules['replay/controller.js'];
const { AlertController } = __modules['alerts/controller.js'];
const { WorkspaceController } = __modules['workspaces/controller.js'];
const { AccountController } = __modules['account/controller.js'];
const { OpsController } = __modules['ops/controller.js'];
const { PwaController } = __modules['pwa/register.js'];
const { ConnectivityController } = __modules['pwa/connectivity.js'];
const { ClientMetrics } = __modules['performance/client-metrics.js'];
const { ExperienceController } = __modules['experience/experience-controller.js'];
const { $, $$, text } = __modules['ui/dom.js'];
const { number } = __modules['ui/format.js'];
const { showMapMessage } = __modules['ui/message.js'];



























const store = createStore();
const api = createApiClient();
const mapController = new MapController({ store, api });
const eventList = new EventList({ store, mapController });
const categoryFilters = new CategoryFilters({ store });
const scanController = new ScanController({ store, api, mapController, eventList, categoryFilters });
const searchController = new SearchController({ store, api, mapController });
const sourcePanel = new SourcePanel({ store });
const diagnosticsDrawer = new DiagnosticsDrawer({ api });
const marketController = new MarketController({ store, api });
const predictionController = new PredictionController({ api });
const opportunityController = new OpportunityController({ store, api });
const newsController = new NewsController({ store, api });
const shippingController = new ShippingController({ store, api });
const intelligenceController = new IntelligenceController({ store, api });
const replayController = new ReplayController({ store, api });
const alertController = new AlertController({ store, api });
const accountController = new AccountController({ store, api });
const opsController = new OpsController({ api });
let workspaceController;
let experience;
let pwa;
let connectivity;

function bootState(state, detail = '') {
  document.documentElement.dataset.bootState = state.toLowerCase();
  globalThis.__MERLIN_BOOT__ = { state, detail, at: new Date().toISOString(), version: '17.1.0-merlin' };
}

function bootFailure(stage, error, { visible = true } = {}) {
  const code = error?.code || error?.name || 'ERROR';
  const message = error?.message || String(error || 'Unknown error');
  console.error(`[MERLIN:${stage}]`, error);
  globalThis.__MERLIN_BOOT_ERRORS__ ||= [];
  globalThis.__MERLIN_BOOT_ERRORS__.push({ stage, code, message, at: new Date().toISOString() });
  if (visible) showMapMessage(`${stage} / ${code} / ${message}`, { duration: 12_000 });
}

async function safeStage(stage, operation, options = {}) {
  try { return await operation(); }
  catch (error) { bootFailure(stage, error, options); return null; }
}

function updateClock() { text('#utc-clock', `${new Date().toISOString().slice(11, 19)} UTC`); }

async function switchView(view) {
  if (view === 'sources') { diagnosticsDrawer.open(); return; }
  store.setState({ activeView: view }, 'view.changed');
  document.documentElement.dataset.activeView = view;
  window.dispatchEvent(new CustomEvent('merlin:view-changed', { detail: { view } }));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  $$('[data-app-view]').forEach(element => {
    const active = element.dataset.appView === view;
    element.classList.toggle('hidden', !active);
    element.classList.toggle('active', active);
  });
  const initializers = {
    news: () => newsController.ensureInitialized(),
    shipping: () => shippingController.ensureInitialized(),
    intelligence: () => intelligenceController.ensureInitialized(),
    markets: () => marketController.ensureInitialized(),
    predictions: () => predictionController.ensureInitialized(),
    opportunities: () => opportunityController.ensureInitialized(),
    replay: () => replayController.ensureInitialized(),
    alerts: () => alertController.ensureInitialized(),
    account: () => accountController.ensureInitialized(),
    ops: () => opsController.ensureInitialized()
  };
  if (initializers[view]) await safeStage(`VIEW_${view.toUpperCase()}`, initializers[view], { visible: false });
  if (view === 'map') setTimeout(() => store.getState().map?.resize?.(), 0);
}

function bindControls() {
  $('#radius-select')?.addEventListener('change', event => {
    store.setState({ radiusKm: Number(event.target.value) }, 'controls.radius_changed');
    mapController.updateGeometry();
    scanController.scan();
  });
  $('#window-select')?.addEventListener('change', event => {
    store.setState({ windowDays: Number(event.target.value) }, 'controls.window_changed');
    scanController.applyFilters();
  });
  $('#routes-toggle')?.addEventListener('click', async event => {
    const visible = !store.getState().routesVisible;
    store.setState({ routesVisible: visible }, 'controls.routes_toggled');
    event.currentTarget.classList.toggle('active', visible);
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = `ROUTES ${visible ? 'ON' : 'OFF'}`;
    await safeStage('ROUTES', () => mapController.setRoutesVisible(visible));
  });
  $('#clusters-toggle')?.addEventListener('click', event => {
    const visible = !store.getState().clustersVisible;
    store.setState({ clustersVisible: visible }, 'controls.clusters_toggled');
    event.currentTarget.classList.toggle('active', visible);
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = `CLUSTERS ${visible ? 'ON' : 'OFF'}`;
    try { mapController.setClustersVisible(visible); } catch (error) { bootFailure('CLUSTERS', error); }
  });
  $('#refresh-button')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '...';
    try { await Promise.allSettled([loadGlobalEvents(), scanController.scan()]); }
    finally { event.currentTarget.disabled = false; event.currentTarget.textContent = 'REFRESH'; }
  });
  $$('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
  $('#brand-home')?.addEventListener('click', event => {
    event.preventDefault();
    switchView('map');
    requestAnimationFrame(() => store.getState().map?.resize?.());
  });
  $('#pwa-action')?.addEventListener('click', async event => {
    if (!pwa) return;
    if (event.currentTarget.dataset.mode === 'update') await pwa.applyUpdate();
    else await pwa.install();
  });
  window.addEventListener('merlin:scan-requested', () => scanController.scan());
  window.addEventListener('merlin:filters-changed', () => scanController.applyFilters());
  window.addEventListener('merlin:sources-updated', () => sourcePanel.render());
  window.addEventListener('merlin:workspace-restored', async () => {
    const state = store.getState();
    if ($('#radius-select')) $('#radius-select').value = String(state.radiusKm);
    if ($('#window-select')) $('#window-select').value = String(state.windowDays);
    if ($('#routes-toggle')) {
      $('#routes-toggle').classList.toggle('active', state.routesVisible);
      $('#routes-toggle').setAttribute('aria-pressed', String(state.routesVisible));
      $('#routes-toggle').textContent = `ROUTES ${state.routesVisible ? 'ON' : 'OFF'}`;
    }
    if ($('#clusters-toggle')) {
      $('#clusters-toggle').classList.toggle('active', state.clustersVisible);
      $('#clusters-toggle').setAttribute('aria-pressed', String(state.clustersVisible));
      $('#clusters-toggle').textContent = `CLUSTERS ${state.clustersVisible ? 'ON' : 'OFF'}`;
    }
    mapController.updateGeometry();
    mapController.flyTo(state.point, { zoom: 1.5, duration: 350 });
    mapController.setClustersVisible(state.clustersVisible);
    await safeStage('WORKSPACE_ROUTES', () => mapController.setRoutesVisible(state.routesVisible), { visible: false });
    window.dispatchEvent(new CustomEvent('merlin:filters-changed'));
    window.dispatchEvent(new CustomEvent('merlin:scan-requested'));
  });
}

async function loadGlobalEvents() {
  const payload = await api.events({ days: 30, limit: 5000 });
  store.setState({ globalEvents: payload.events || [], sourceStatus: payload.sources || {} }, 'events.global_loaded');
  mapController.setGlobalEvents(payload.events || []);
  sourcePanel.render();
  text('#global-event-count', `${number(payload.filteredCount || 0)} EVENTS`);
  const sourceCount = Object.keys(payload.sources || {}).length;
  const onlineCount = Object.values(payload.sources || {}).filter(source => ['ONLINE', 'DEGRADED', 'STALE'].includes(source.state)).length;
  text('#global-source-count', `${onlineCount}/${sourceCount} SOURCES`);
  return payload;
}

function bindCoreSynchronously() {
  updateClock();
  setInterval(updateClock, 1_000);
  bindControls();
  searchController.bind();
  diagnosticsDrawer.bind();
  accountController.bind();
  workspaceController = new WorkspaceController({ store, switchView });
  safeStage('WORKSPACES', () => workspaceController.bind(), { visible: false });
}

async function startOptionalSystems(config) {
  await safeStage('ALERTS', () => alertController.ensureInitialized(), { visible: false });
  await safeStage('ACCOUNT', () => accountController.ensureInitialized(), { visible: false });
  await safeStage('EXPERIENCE', async () => {
    experience = new ExperienceController({ switchView });
    experience.bind();
  }, { visible: false });
  await safeStage('CONNECTIVITY', async () => {
    connectivity = new ConnectivityController({ onChange: state => {
      const el = $('#connectivity-indicator');
      if (el) el.classList.toggle('hidden', state.online);
    } });
    connectivity.bind();
  }, { visible: false });
  // Service-worker registration is intentionally disabled in 17.1.0. The
  // product must always use the current API and client bundle; installability
  // can return after the live application is stable.
  await safeStage('PWA_RESET', async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    const button = $('#pwa-action');
    if (button) button.classList.add('hidden');
  }, { visible: false });
  await safeStage('METRICS', async () => {
    new ClientMetrics({ report: payload => api.reportClientMetric(payload), version: config.version }).start();
  }, { visible: false });
}

function prewarmCriticalViews() {
  const tasks = [
    ['NEWS', () => newsController.ensureInitialized()],
    ['SHIPPING', () => shippingController.ensureInitialized()],
    ['PLACES', () => intelligenceController.ensureInitialized()],
    ['MARKETS', () => marketController.ensureInitialized()],
    ['OPPORTUNITIES', () => opportunityController.ensureInitialized()]
  ];
  for (const [stage, operation] of tasks) {
    setTimeout(() => safeStage(`PREWARM_${stage}`, operation, { visible: false }), 0);
  }
}

async function bootstrap() {
  await globalThis.__MERLIN_PREBOOT__;
  bootState('STARTING');
  window.addEventListener('error', event => bootFailure('WINDOW', event.error || new Error(event.message), { visible: false }));
  window.addEventListener('unhandledrejection', event => bootFailure('PROMISE', event.reason, { visible: false }));
  bindCoreSynchronously();

  // Render the map immediately. Configuration and live sources load in parallel.
  const mapPromise = safeStage('MAP', () => mapController.initialize({}));
  const configPromise = safeStage('CONFIG', () => api.config());
  const map = await mapPromise;
  if (!map) bootState('DEGRADED', 'MAP');
  requestAnimationFrame(() => map?.resize?.());

  const config = await configPromise;
  if (!config) { bootState('FAILED', 'CONFIG'); return; }
  store.setState({ config, point: config.defaultPoint, radiusKm: config.defaultRadiusKm, marketTimeframe: config.defaultMarketTimeframe || '1h' }, 'config.loaded');
  if ($('#radius-select')) $('#radius-select').value = String(config.defaultRadiusKm);
  if ($('#market-timeframe')) $('#market-timeframe').value = config.defaultMarketTimeframe || '1h';
  mapController.updateGeometry();

  // Preload every high-use view so tab changes are immediate.
  prewarmCriticalViews();
  await Promise.allSettled([
    safeStage('EVENTS', () => loadGlobalEvents()),
    safeStage('SCAN', () => scanController.scan())
  ]);

  const requestedView = new URLSearchParams(location.search).get('view');
  if (requestedView && $(`[data-app-view="${requestedView}"]`)) await switchView(requestedView);
  await startOptionalSystems(config);
  requestAnimationFrame(() => store.getState().map?.resize?.());
  bootState(map ? 'READY' : 'DEGRADED', store.getState().mapMode || 'DETAILED_RASTER_VECTOR');
}

bootstrap().catch(error => {
  bootFailure('BOOT', error);
  bootState('FAILED', error?.message || 'BOOT');
});

})();
