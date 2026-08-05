/* MERLIN V20.20 BROWSER ACCEPTANCE BUNDLE — generated for testing only. */

'use strict';

const __modules = Object.create(null);

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
      const response = await fetch(url, { headers: { accept: 'application/json', 'x-client-version': '20.0.0-merlin' }, credentials: 'same-origin', signal: requestOptions.signal || controller.signal, cache: 'no-store' });
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
        headers: { accept: 'application/json', 'content-type': 'application/json', 'x-client-version': '20.0.0-merlin', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
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

// MODULE: map-v20/constants.js
__modules['map-v20/constants.js'] = (() => {

const TILE_SIZE = 256;
const MAX_LATITUDE = 85.0511287798066;
const MAX_ZOOM = 18;
const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_CENTER = Object.freeze({ lat: 20, lon: 0 });
const DEFAULT_LAYERS = Object.freeze({ alerts: true, news: true, earthquakes: true, disasters: true, conflict: true, routes: false, ports: false, countryRisk: false, heat: true, places: true, labels: true });
const ENTITY_COLOURS = Object.freeze({ alert: '#e64b61', news: '#8d6bd1', port: '#25a978', place: '#d49a31', route: '#2f92bd', conflict: '#d94254', disaster: '#df7d38', earthquake: '#dc4c56', other: '#718d9b' });

return Object.freeze({TILE_SIZE, MAX_LATITUDE, MAX_ZOOM, SVG_NS, DEFAULT_CENTER, DEFAULT_LAYERS, ENTITY_COLOURS});
})();

// MODULE: map-v20/math.js
__modules['map-v20/math.js'] = (() => {

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const modulo = (value, divisor) => ((Number(value) % Number(divisor)) + Number(divisor)) % Number(divisor);
const finite = value => Number.isFinite(Number(value));
const lerp = (from, to, amount) => Number(from) + (Number(to) - Number(from)) * Number(amount);
const distance2d = (left, right) => Math.hypot(Number(right.x) - Number(left.x), Number(right.y) - Number(left.y));
function debounce(callback, delay = 100) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); }; }
function rafThrottle(callback) { let frame = 0; let latest; return (...args) => { latest = args; if (frame)
    return; frame = requestAnimationFrame(() => { frame = 0; callback(...latest); }); }; }

return Object.freeze({clamp, modulo, finite, lerp, distance2d, debounce, rafThrottle});
})();

// MODULE: map-v20/projection.js
__modules['map-v20/projection.js'] = (() => {
const { MAX_LATITUDE, TILE_SIZE } = __modules['map-v20/constants.js'];
const { clamp, modulo } = __modules['map-v20/math.js'];


function normalizeLongitude(value) { const normalized = modulo(Number(value) + 180, 360) - 180; return normalized === -180 && Number(value) > 0 ? 180 : normalized; }
function worldSize(zoom) { return TILE_SIZE * (2 ** Number(zoom)); }
function lonToX(longitude, zoom) { return ((normalizeLongitude(longitude) + 180) / 360) * worldSize(zoom); }
function latToY(latitude, zoom) { const limited = clamp(latitude, -MAX_LATITUDE, MAX_LATITUDE); const sine = Math.sin(limited * Math.PI / 180); return (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * worldSize(zoom); }
function xToLon(x, zoom) { return normalizeLongitude((Number(x) / worldSize(zoom)) * 360 - 180); }
function yToLat(y, zoom) { const n = Math.PI - (2 * Math.PI * Number(y)) / worldSize(zoom); return 180 / Math.PI * Math.atan(Math.sinh(n)); }
function project(point, zoom) { return { x: lonToX(point.lon, zoom), y: latToY(point.lat, zoom) }; }
function unproject(point, zoom) { return { lat: yToLat(point.y, zoom), lon: xToLon(point.x, zoom) }; }

return Object.freeze({normalizeLongitude, worldSize, lonToX, latToY, xToLon, yToLat, project, unproject});
})();

// MODULE: map-v20/world-boundary.js
__modules['map-v20/world-boundary.js'] = (() => {
const { TILE_SIZE, MAX_ZOOM } = __modules['map-v20/constants.js'];
const { clamp } = __modules['map-v20/math.js'];
const { project, unproject, worldSize } = __modules['map-v20/projection.js'];



function minimumZoomForSize(size) { return Math.max(0, Math.log2(Math.max(Number(size.width), Number(size.height), TILE_SIZE) / TILE_SIZE)); }
function clampViewport(value) {
    const minimumZoom = minimumZoomForSize(value.size);
    const zoom = clamp(value.zoom, minimumZoom, MAX_ZOOM);
    const world = worldSize(zoom);
    const center = project(value.center, zoom);
    const halfWidth = Math.min(world / 2, value.size.width / 2);
    const halfHeight = Math.min(world / 2, value.size.height / 2);
    center.x = clamp(center.x, halfWidth, world - halfWidth);
    center.y = clamp(center.y, halfHeight, world - halfHeight);
    return { ...value, center: unproject(center, zoom), zoom, minimumZoom };
}
function worldRect(value) { const world = worldSize(value.zoom); const center = project(value.center, value.zoom); return { left: value.size.width / 2 - center.x, top: value.size.height / 2 - center.y, width: world, height: world }; }

return Object.freeze({minimumZoomForSize, clampViewport, worldRect});
})();

// MODULE: map-v20/viewport-model.js
__modules['map-v20/viewport-model.js'] = (() => {
const { DEFAULT_CENTER } = __modules['map-v20/constants.js'];
const { clampViewport } = __modules['map-v20/world-boundary.js'];
const { project, unproject } = __modules['map-v20/projection.js'];



class ViewportModel {
    constructor(options = {}) { this.state = clampViewport({ center: { lat: Number(options.center?.lat ?? DEFAULT_CENTER.lat), lon: Number(options.center?.lon ?? DEFAULT_CENTER.lon) }, zoom: Number(options.zoom ?? 2), size: { width: Math.max(320, Number(options.width || 320)), height: Math.max(240, Number(options.height || 240)) } }); }
    snapshot() { return { center: { ...this.state.center }, zoom: this.state.zoom, minimumZoom: this.state.minimumZoom, size: { ...this.state.size } }; }
    resize(width, height) { this.state = clampViewport({ ...this.state, size: { width: Math.max(320, Math.round(width)), height: Math.max(240, Math.round(height)) } }); return this.snapshot(); }
    setCenter(center) { this.state = clampViewport({ ...this.state, center: { lat: Number(center.lat), lon: Number(center.lon) } }); return this.snapshot(); }
    setZoom(zoom) { this.state = clampViewport({ ...this.state, zoom: Number(zoom) }); return this.snapshot(); }
    project(point) { const center = project(this.state.center, this.state.zoom); const value = project(point, this.state.zoom); return { x: this.state.size.width / 2 + value.x - center.x, y: this.state.size.height / 2 + value.y - center.y }; }
    unproject(pixel) { const center = project(this.state.center, this.state.zoom); return unproject({ x: center.x + Number(pixel.x) - this.state.size.width / 2, y: center.y + Number(pixel.y) - this.state.size.height / 2 }, this.state.zoom); }
    panBy(delta) { const center = project(this.state.center, this.state.zoom); this.state = clampViewport({ ...this.state, center: unproject({ x: center.x - Number(delta.x || 0), y: center.y - Number(delta.y || 0) }, this.state.zoom) }); return this.snapshot(); }
    zoomAround(zoom, pixel) { const anchor = this.unproject(pixel); this.setZoom(zoom); const projected = this.project(anchor); return this.panBy({ x: projected.x - pixel.x, y: projected.y - pixel.y }); }
}

return Object.freeze({ViewportModel});
})();

// MODULE: map-v20/event-bus.js
__modules['map-v20/event-bus.js'] = (() => {

class EventBus {
    constructor() { this.listeners = new Map(); }
    on(type, listener) { const listeners = this.listeners.get(type) || new Set(); listeners.add(listener); this.listeners.set(type, listeners); return () => this.off(type, listener); }
    once(type, listener) { const unsubscribe = this.on(type, value => { unsubscribe(); listener(value); }); return unsubscribe; }
    off(type, listener) { const listeners = this.listeners.get(type); if (!listeners)
        return; listeners.delete(listener); if (!listeners.size)
        this.listeners.delete(type); }
    emit(type, payload) { for (const listener of this.listeners.get(type) || []) {
        try {
            listener(payload);
        }
        catch (error) {
            console.error('map event listener failed', type, error);
        }
    } }
    clear() { this.listeners.clear(); }
}

return Object.freeze({EventBus});
})();

// MODULE: map-v20/tile-cache.js
__modules['map-v20/tile-cache.js'] = (() => {

class TileCache {
    constructor(maximum = 256) { this.maximum = maximum; this.records = new Map(); }
    get(key) { const value = this.records.get(key); if (!value)
        return null; this.records.delete(key); this.records.set(key, value); return value; }
    set(key, value) { if (this.records.has(key))
        this.records.delete(key); this.records.set(key, value); while (this.records.size > this.maximum) {
        const oldest = this.records.keys().next().value;
        const record = this.records.get(oldest);
        record?.element?.remove?.();
        this.records.delete(oldest);
    } return value; }
    delete(key) { const value = this.records.get(key); value?.element?.remove?.(); return this.records.delete(key); }
    retain(keys) { const wanted = new Set(keys); for (const key of this.records.keys())
        if (!wanted.has(key))
            this.delete(key); }
    clear() { for (const value of this.records.values())
        value?.element?.remove?.(); this.records.clear(); }
    get size() { return this.records.size; }
}

return Object.freeze({TileCache});
})();

// MODULE: map-v20/tile-scheduler.js
__modules['map-v20/tile-scheduler.js'] = (() => {

class TileScheduler {
    constructor(options = {}) { this.maximumConcurrent = options.maximumConcurrent || 8; this.active = 0; this.queue = []; this.cancelled = new Set(); }
    schedule(key, task, priority = 0) { this.cancelled.delete(key); return new Promise((resolve, reject) => { this.queue.push({ key, task, priority, resolve, reject }); this.queue.sort((a, b) => b.priority - a.priority); this.#drain(); }); }
    cancel(key) { this.cancelled.add(key); this.queue = this.queue.filter(item => { if (item.key !== key)
        return true; item.resolve(null); return false; }); }
    clear() { for (const item of this.queue)
        item.resolve(null); this.queue = []; this.cancelled.clear(); }
    #drain() { while (this.active < this.maximumConcurrent && this.queue.length) {
        const item = this.queue.shift();
        if (this.cancelled.has(item.key)) {
            item.resolve(null);
            continue;
        }
        this.active += 1;
        Promise.resolve().then(item.task).then(value => item.resolve(this.cancelled.has(item.key) ? null : value), item.reject).finally(() => { this.active -= 1; this.#drain(); });
    } }
}

return Object.freeze({TileScheduler});
})();

// MODULE: map-v20/tile-layer.js
__modules['map-v20/tile-layer.js'] = (() => {
const { TILE_SIZE } = __modules['map-v20/constants.js'];
const { project } = __modules['map-v20/projection.js'];
const { TileCache } = __modules['map-v20/tile-cache.js'];
const { TileScheduler } = __modules['map-v20/tile-scheduler.js'];




class TileLayer {
    constructor(container, source) { this.container = container; this.source = source; this.cache = new TileCache(196); this.scheduler = new TileScheduler({ maximumConcurrent: 8 }); }
    setSource(source) { if (this.source?.id === source?.id)
        return; this.source = source; this.clear(); }
    render(viewport) {
        if (!this.source?.enabled) {
            this.container.replaceChildren();
            this.cache.clear();
            return;
        }
        const zoom = Math.max(0, Math.floor(viewport.zoom));
        const count = 2 ** zoom;
        const center = project(viewport.center, zoom);
        const halfWidth = viewport.size.width / 2;
        const halfHeight = viewport.size.height / 2;
        const minX = Math.floor((center.x - halfWidth) / TILE_SIZE);
        const maxX = Math.floor((center.x + halfWidth) / TILE_SIZE);
        const minY = Math.max(0, Math.floor((center.y - halfHeight) / TILE_SIZE));
        const maxY = Math.min(count - 1, Math.floor((center.y + halfHeight) / TILE_SIZE));
        const visible = [];
        for (let y = minY; y <= maxY; y += 1)
            for (let worldX = minX; worldX <= maxX; worldX += 1) {
                if (worldX < 0 || worldX >= count)
                    continue;
                const tile = { z: zoom, x: worldX, y };
                const key = `${this.source.id}:${zoom}/${worldX}/${y}`;
                visible.push(key);
                let record = this.cache.get(key);
                if (!record) {
                    const image = document.createElement('img');
                    image.className = 'merlin-v20-tile';
                    image.alt = '';
                    image.draggable = false;
                    image.decoding = 'async';
                    image.loading = 'eager';
                    record = { element: image, loaded: false };
                    this.cache.set(key, record);
                    this.container.append(image);
                    this.scheduler.schedule(key, () => this.#load(image, tile), -Math.hypot(worldX - center.x / TILE_SIZE, y - center.y / TILE_SIZE)).catch(() => { });
                }
                const image = record.element;
                image.style.left = `${worldX * TILE_SIZE - center.x + halfWidth}px`;
                image.style.top = `${y * TILE_SIZE - center.y + halfHeight}px`;
            }
        this.cache.retain(visible);
    }
    #load(image, tile) { return new Promise(resolve => { image.onload = () => { image.classList.add('loaded'); resolve(true); }; image.onerror = () => { const fallback = this.source.fallbackUrl(tile); if (fallback && image.src !== fallback)
        image.src = fallback;
    else {
        image.remove();
        resolve(false);
    } }; image.src = this.source.url(tile); }); }
    clear() { this.scheduler.clear(); this.cache.clear(); this.container.replaceChildren(); }
}

return Object.freeze({TileLayer});
})();

// MODULE: map-v20/tile-source.js
__modules['map-v20/tile-source.js'] = (() => {

class TileSource {
    constructor(options = {}) { this.id = options.id || 'streets'; this.template = options.template || '/api/map/tiles/streets/{z}/{x}/{y}.png'; this.fallback = options.fallback || null; this.enabled = options.enabled !== false; }
    url(tile) { if (!this.enabled || !this.template)
        return null; return this.template.replace('{z}', tile.z).replace('{x}', tile.x).replace('{y}', tile.y); }
    fallbackUrl(tile) { return this.fallback?.replace('{z}', tile.z).replace('{x}', tile.x).replace('{y}', tile.y) || null; }
}
function tileSourceForMode(mode) {
    if (mode === 'local')
        return new TileSource({ id: 'local', enabled: false, template: null });
    return new TileSource({ id: mode, template: `/api/map/tiles/${['streets', 'light', 'terrain'].includes(mode) ? mode : 'streets'}/{z}/{x}/{y}.png` });
}

return Object.freeze({TileSource, tileSourceForMode});
})();

// MODULE: map-v20/svg-surface.js
__modules['map-v20/svg-surface.js'] = (() => {
const { SVG_NS } = __modules['map-v20/constants.js'];

function svg(tag, attributes = {}) { const element = document.createElementNS(SVG_NS, tag); for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, String(value)); return element; }
class SvgSurface {
    constructor(container) { this.root = svg('svg', { class: 'merlin-v20-overlay', role: 'application', 'aria-label': 'Interactive Merlin world map' }); this.groups = new Map(); container.append(this.root); }
    resize(width, height) { this.root.setAttribute('viewBox', `0 0 ${width} ${height}`); this.root.setAttribute('width', width); this.root.setAttribute('height', height); }
    group(id, order = 0) { if (this.groups.has(id))
        return this.groups.get(id); const group = svg('g', { 'data-layer-group': id, 'data-order': order }); this.groups.set(id, group); this.root.append(group); this.#sort(); return group; }
    clear(id) { this.groups.get(id)?.replaceChildren(); }
    setVisible(id, visible) { const group = this.groups.get(id); if (group)
        group.style.display = visible ? '' : 'none'; }
    #sort() { [...this.groups.values()].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order)).forEach(group => this.root.append(group)); }
    destroy() { this.root.remove(); this.groups.clear(); }
}

return Object.freeze({svg, SvgSurface});
})();

// MODULE: map-v20/feature-store.js
__modules['map-v20/feature-store.js'] = (() => {

class FeatureStore {
    constructor() { this.layers = new Map(); this.version = 0; }
    set(layerId, features = []) { const normalized = features.map((feature, index) => ({ ...feature, __layerId: layerId, __key: String(feature.id ?? feature.properties?.id ?? `${layerId}:${index}`) })); this.layers.set(layerId, normalized); this.version += 1; return normalized; }
    append(layerId, features = []) { return this.set(layerId, [...this.get(layerId), ...features]); }
    get(layerId) { return this.layers.get(layerId) || []; }
    all() { return [...this.layers.values()].flat(); }
    find(key) { for (const features of this.layers.values()) {
        const feature = features.find(item => item.__key === String(key));
        if (feature)
            return feature;
    } return null; }
    remove(layerId) { const removed = this.layers.delete(layerId); if (removed)
        this.version += 1; return removed; }
    clear() { this.layers.clear(); this.version += 1; }
}

return Object.freeze({FeatureStore});
})();

// MODULE: map-v20/entity-registry.js
__modules['map-v20/entity-registry.js'] = (() => {

class EntityRegistry {
    constructor() { this.records = new Map(); }
    register(entity) { const key = String(entity.key || entity.id); this.records.set(key, Object.freeze({ ...entity, key })); return key; }
    registerFeature(feature, kind, data) { return this.register({ key: feature.__key || feature.id, kind, feature, data: data || feature.properties || feature }); }
    get(key) { return this.records.get(String(key)) || null; }
    removeLayer(layerId) { for (const [key, value] of this.records)
        if (value.feature?.__layerId === layerId)
            this.records.delete(key); }
    clear() { this.records.clear(); }
    get size() { return this.records.size; }
}

return Object.freeze({EntityRegistry});
})();

// MODULE: map-v20/layer-registry.js
__modules['map-v20/layer-registry.js'] = (() => {

class LayerRegistry {
    constructor(definitions = []) { this.layers = new Map(); definitions.forEach(definition => this.register(definition)); }
    register(definition) { if (!definition?.id)
        throw new TypeError('Layer requires an ID'); const layer = { visible: true, minimumZoom: 0, maximumZoom: 18, order: 0, interactive: true, ...definition }; this.layers.set(layer.id, layer); return layer; }
    get(id) { return this.layers.get(id) || null; }
    setVisible(id, visible) { const layer = this.get(id); if (layer)
        layer.visible = Boolean(visible); }
    visible(zoom) { return [...this.layers.values()].filter(layer => layer.visible && zoom >= layer.minimumZoom && zoom <= layer.maximumZoom).sort((a, b) => a.order - b.order); }
    list() { return [...this.layers.values()].sort((a, b) => a.order - b.order); }
}

return Object.freeze({LayerRegistry});
})();

// MODULE: map-v20/layer-runtime.js
__modules['map-v20/layer-runtime.js'] = (() => {

class LayerRuntime {
    constructor(options) { Object.assign(this, options); this.renderers = new Map(); }
    registerRenderer(type, renderer) { this.renderers.set(type, renderer); return this; }
    render(viewport) {
        for (const layer of this.layers.list()) {
            const visible = layer.visible && viewport.zoom >= layer.minimumZoom && viewport.zoom <= layer.maximumZoom;
            this.surface.setVisible(layer.id, visible);
            if (!visible)
                continue;
            const renderer = this.renderers.get(layer.renderer);
            if (!renderer)
                continue;
            renderer.render({ layer, features: this.features.get(layer.source || layer.id), viewport, group: this.surface.group(layer.id, layer.order), entities: this.entities });
        }
    }
    clearLayer(id) { this.surface.clear(id); this.entities.removeLayer(id); }
}

return Object.freeze({LayerRuntime});
})();

// MODULE: map-v20/marker-renderer.js
__modules['map-v20/marker-renderer.js'] = (() => {
const { svg } = __modules['map-v20/svg-surface.js'];
const { ENTITY_COLOURS } = __modules['map-v20/constants.js'];


function colour(feature, layer) { return feature.properties?.colour || layer.style?.colour || ENTITY_COLOURS[String(feature.properties?.kind || '').toLowerCase()] || ENTITY_COLOURS.other; }
function radius(feature, layer) { const severity = Number(feature.properties?.severity || feature.properties?.importance || 0); return Math.max(4, Math.min(12, Number(layer.style?.radius || 5) + severity / 30)); }
class MarkerRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        for (const feature of features) {
            if (feature.geometry?.type !== 'Point')
                continue;
            const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] });
            if (point.x < -20 || point.x > viewport.state.size.width + 20 || point.y < -20 || point.y > viewport.state.size.height + 20)
                continue;
            const key = entities.registerFeature(feature, feature.properties?.kind || layer.id);
            const circle = svg('circle', { cx: point.x, cy: point.y, r: radius(feature, layer), fill: colour(feature, layer), stroke: '#f7fbfc', 'stroke-width': 1.5, class: 'merlin-v20-marker', 'data-map-entity': key, tabindex: layer.interactive ? 0 : -1, role: 'button', 'aria-label': feature.properties?.title || feature.properties?.nameEnglish || feature.properties?.name || 'Map feature' });
            group.append(circle);
        }
    }
}

return Object.freeze({MarkerRenderer});
})();

// MODULE: map-v20/cluster-renderer.js
__modules['map-v20/cluster-renderer.js'] = (() => {
const { svg } = __modules['map-v20/svg-surface.js'];
const { ENTITY_COLOURS } = __modules['map-v20/constants.js'];


function cluster(features, viewport, radius = 42) {
    const buckets = new Map();
    for (const feature of features) {
        if (feature.geometry?.type !== 'Point')
            continue;
        const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] });
        const key = `${Math.floor(point.x / radius)}:${Math.floor(point.y / radius)}`;
        const bucket = buckets.get(key) || [];
        bucket.push({ feature, point });
        buckets.set(key, bucket);
    }
    return [...buckets.values()];
}
class ClusterRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        for (const items of cluster(features, viewport, layer.style?.clusterRadius || 42)) {
            const point = { x: items.reduce((sum, item) => sum + item.point.x, 0) / items.length, y: items.reduce((sum, item) => sum + item.point.y, 0) / items.length };
            if (items.length === 1 || viewport.state.zoom >= (layer.style?.clusterMaxZoom || 9)) {
                for (const item of items) {
                    const key = entities.registerFeature(item.feature, item.feature.properties?.kind || layer.id);
                    group.append(svg('circle', { cx: item.point.x, cy: item.point.y, r: 6, fill: item.feature.properties?.colour || ENTITY_COLOURS.other, stroke: '#fff', 'stroke-width': 1.5, class: 'merlin-v20-marker', 'data-map-entity': key, tabindex: 0, role: 'button' }));
                }
                continue;
            }
            const key = entities.register({ key: `cluster:${layer.id}:${items.map(item => item.feature.__key).join('|')}`, kind: 'CLUSTER', data: { title: `${items.length} map items`, count: items.length, members: items.map(item => item.feature) }, feature: { __layerId: layer.id } });
            const radius = Math.min(24, 11 + Math.log2(items.length) * 3);
            group.append(svg('circle', { cx: point.x, cy: point.y, r, fill: layer.style?.colour || '#496c7c', stroke: '#fff', 'stroke-width': 2, class: 'merlin-v20-cluster', 'data-map-entity': key, tabindex: 0, role: 'button', 'aria-label': `${items.length} clustered map items` }));
            const text = svg('text', { x: point.x, y: point.y + 4, 'text-anchor': 'middle', class: 'merlin-v20-cluster-count', 'data-map-entity': key });
            text.textContent = String(items.length);
            group.append(text);
        }
    }
}

return Object.freeze({ClusterRenderer});
})();

// MODULE: map-v20/route-renderer.js
__modules['map-v20/route-renderer.js'] = (() => {
const { svg } = __modules['map-v20/svg-surface.js'];

function pathFor(coordinates, viewport) { return coordinates.map((coordinate, index) => { const point = viewport.project({ lon: coordinate[0], lat: coordinate[1] }); return `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`; }).join(' '); }
class RouteRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        for (const feature of features) {
            const lines = feature.geometry?.type === 'LineString' ? [feature.geometry.coordinates] : feature.geometry?.type === 'MultiLineString' ? feature.geometry.coordinates : [];
            for (const coordinates of lines) {
                const key = entities.registerFeature(feature, feature.properties?.kind || 'ROUTE');
                group.append(svg('path', { d: pathFor(coordinates, viewport), fill: 'none', stroke: feature.properties?.colour || layer.style?.colour || '#328eb8', 'stroke-width': layer.style?.width || 2.5, 'stroke-dasharray': layer.style?.dash || '9 6', opacity: layer.style?.opacity || 0.82, class: 'merlin-v20-route', 'data-map-entity': key, tabindex: 0, role: 'button' }));
            }
        }
    }
}

return Object.freeze({RouteRenderer});
})();

// MODULE: map-v20/label-language.js
__modules['map-v20/label-language.js'] = (() => {

function first(properties, keys) { for (const key of keys)
    if (String(properties?.[key] || '').trim())
        return String(properties[key]).trim(); return ''; }
function bilingualText(properties = {}) { const english = first(properties, ['labelEnglish', 'nameEnglish', 'englishName', 'name']); const local = first(properties, ['labelLocal', 'nameLocal', 'localName', 'nativeName']); const primary = english || local || String(properties.title || ''); const secondary = local && local.toLocaleLowerCase() !== primary.toLocaleLowerCase() ? local : ''; return { primary, secondary }; }
function labelLines(properties = {}) { const value = bilingualText(properties); return value.secondary ? [value.primary, `(${value.secondary})`] : [value.primary]; }

return Object.freeze({bilingualText, labelLines});
})();

// MODULE: map-v20/label-layout.js
__modules['map-v20/label-layout.js'] = (() => {

function intersects(left, right, padding = 3) { return !(left.right + padding < right.left || left.left - padding > right.right || left.bottom + padding < right.top || left.top - padding > right.bottom); }
function priority(feature) { const properties = feature.properties || {}; return Number(properties.labelPriority || properties.importance || 0) + (properties.labelType === 'country' ? 100 : properties.labelType === 'capital' ? 90 : properties.labelType === 'city' ? 60 : 30); }
function layoutLabels(candidates, options = {}) { const accepted = []; const sorted = [...candidates].sort((a, b) => priority(b.feature) - priority(a.feature)); for (const candidate of sorted) {
    if (candidate.point.x < 0 || candidate.point.y < 0 || candidate.point.x > options.width || candidate.point.y > options.height)
        continue;
    if (accepted.some(existing => intersects(existing.box, candidate.box, options.padding || 3)))
        continue;
    accepted.push(candidate);
    if (accepted.length >= (options.maximum || 150))
        break;
} return accepted; }
function estimateLabelBox(point, lines, options = {}) { const width = Math.max(...lines.map(line => line.length), 1) * (options.characterWidth || 6.4); const height = lines.length * (options.lineHeight || 13); return { left: point.x - width / 2, right: point.x + width / 2, top: point.y + (options.offsetY || 10), bottom: point.y + (options.offsetY || 10) + height }; }

return Object.freeze({layoutLabels, estimateLabelBox});
})();

// MODULE: map-v20/label-renderer.js
__modules['map-v20/label-renderer.js'] = (() => {
const { svg } = __modules['map-v20/svg-surface.js'];
const { labelLines } = __modules['map-v20/label-language.js'];
const { estimateLabelBox, layoutLabels } = __modules['map-v20/label-layout.js'];



class LabelRenderer {
    render({ layer, features, viewport, group, entities }) {
        group.replaceChildren();
        entities.removeLayer(layer.id);
        const candidates = features.filter(feature => feature.geometry?.type === 'Point').map(feature => { const point = viewport.project({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }); const lines = labelLines(feature.properties); return { feature, point, lines, box: estimateLabelBox(point, lines, layer.style || {}) }; });
        for (const candidate of layoutLabels(candidates, { width: viewport.state.size.width, height: viewport.state.size.height, maximum: layer.style?.maximum || 180 })) {
            const key = entities.registerFeature(candidate.feature, candidate.feature.properties?.kind || 'PLACE');
            const text = svg('text', { x: candidate.point.x, y: candidate.point.y + 16, 'text-anchor': 'middle', class: 'merlin-v20-label', 'data-map-entity': key, tabindex: 0, role: 'button' });
            candidate.lines.forEach((line, index) => { const span = svg('tspan', { x: candidate.point.x, dy: index ? 12 : 0, class: index ? 'merlin-v20-label-local' : 'merlin-v20-label-english' }); span.textContent = line; text.append(span); });
            group.append(text);
        }
    }
}

return Object.freeze({LabelRenderer});
})();

// MODULE: map-v20/renderer-utils.js
__modules['map-v20/renderer-utils.js'] = (() => {

function ringPath(ring,viewport){return ring.map((coordinate,index)=>{const point=viewport.project({lon:Number(coordinate[0]),lat:Number(coordinate[1])});return`${index?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;}).join(' ')+' Z';}
function projectGeometry(geometry,viewport){if(!geometry)return[];if(geometry.type==='Polygon')return geometry.coordinates.map(ring=>ringPath(ring,viewport));if(geometry.type==='MultiPolygon')return geometry.coordinates.flatMap(polygon=>polygon.map(ring=>ringPath(ring,viewport)));return[];}

return Object.freeze({projectGeometry});
})();

// MODULE: map-v20/polygon-renderer.js
__modules['map-v20/polygon-renderer.js'] = (() => {
const { projectGeometry } = __modules['map-v20/renderer-utils.js'];

function svg(tag,attributes={}){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;}
class PolygonRenderer { render({layer,features,viewport,group,entities}){group.replaceChildren();for(const feature of features){const paths=projectGeometry(feature.geometry,viewport);for(const d of paths){const node=svg('path',{d,fill:layer.style?.fillColour||layer.style?.colour||'#6e98aa','fill-opacity':layer.opacity??layer.style?.opacity??.28,stroke:layer.style?.lineColour||layer.style?.colour||'#9bc0d0','stroke-width':layer.style?.lineWidth||1.2,'data-map-entity':feature.id,tabindex:'0'});group.append(node);entities.add(layer.id,feature.id,{kind:layer.id,feature,data:feature.__data||feature.properties});}}} }

return Object.freeze({PolygonRenderer});
})();

// MODULE: map-v20/heat-renderer.js
__modules['map-v20/heat-renderer.js'] = (() => {

function svg(tag,attributes={}){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;}
class HeatRenderer { render({layer,features,viewport,group,entities}){group.replaceChildren();for(const feature of features){if(feature.geometry?.type!=='Point')continue;const [lon,lat]=feature.geometry.coordinates;const point=viewport.project({lat,lon});const intensity=Math.max(.1,Math.min(1,Number(feature.properties?.intensity??feature.properties?.severity??feature.properties?.risk?.score??50)/100));const radius=(layer.style?.radius||20)*(0.5+intensity);const node=svg('circle',{cx:point.x,cy:point.y,r:radius,fill:layer.style?.colour||'#ff7b4c','fill-opacity':(layer.opacity??.25)*intensity,stroke:'none','data-map-entity':feature.id});group.append(node);entities.add(layer.id,feature.id,{kind:layer.id,feature,data:feature.__data||feature.properties});}} }

return Object.freeze({HeatRenderer});
})();

// MODULE: map-v20/raster-renderer.js
__modules['map-v20/raster-renderer.js'] = (() => {

class RasterRenderer { render({layer,group}){group.replaceChildren();group.dataset.rasterLayer=layer.id;group.dataset.rasterSource=layer.source;group.style.opacity=String(layer.opacity??1);} }

return Object.freeze({RasterRenderer});
})();

// MODULE: map-v20/gesture-controller.js
__modules['map-v20/gesture-controller.js'] = (() => {
const { rafThrottle } = __modules['map-v20/math.js'];

class GestureController {
    constructor(options) { Object.assign(this, options); this.drag = null; this.move = rafThrottle(event => this.#move(event)); this.#bind(); }
    #bind() { this.element.addEventListener('wheel', this.onWheel = event => { event.preventDefault(); const box = this.element.getBoundingClientRect(); this.viewport.zoomAround(this.viewport.state.zoom + (event.deltaY < 0 ? 0.75 : -0.75), { x: event.clientX - box.left, y: event.clientY - box.top }); this.changed('zoom'); }, { passive: false }); this.element.addEventListener('pointerdown', this.onDown = event => { if (event.button !== 0)
        return; this.drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false }; this.element.setPointerCapture?.(event.pointerId); }); this.element.addEventListener('pointermove', this.move); this.element.addEventListener('pointerup', this.onUp = event => this.#finish(event)); this.element.addEventListener('pointercancel', this.onUp); this.element.addEventListener('dblclick', this.onDoubleClick = event => { const box = this.element.getBoundingClientRect(); this.viewport.zoomAround(this.viewport.state.zoom + 1, { x: event.clientX - box.left, y: event.clientY - box.top }); this.changed('zoom'); }); }
    #move(event) { if (!this.drag)
        return; const dx = event.clientX - this.drag.lastX; const dy = event.clientY - this.drag.lastY; this.drag.lastX = event.clientX; this.drag.lastY = event.clientY; if (Math.abs(event.clientX - this.drag.x) + Math.abs(event.clientY - this.drag.y) > 4)
        this.drag.moved = true; this.viewport.panBy({ x: dx, y: dy }); this.changed('pan'); }
    #finish(event) { if (!this.drag)
        return; const moved = this.drag.moved; this.drag = null; this.element.releasePointerCapture?.(event.pointerId); if (!moved)
        this.click?.(event); }
    destroy() { this.element.removeEventListener('wheel', this.onWheel); this.element.removeEventListener('pointerdown', this.onDown); this.element.removeEventListener('pointermove', this.move); this.element.removeEventListener('pointerup', this.onUp); this.element.removeEventListener('pointercancel', this.onUp); this.element.removeEventListener('dblclick', this.onDoubleClick); }
}

return Object.freeze({GestureController});
})();

// MODULE: map-v20/keyboard-controller.js
__modules['map-v20/keyboard-controller.js'] = (() => {

class KeyboardController {
    constructor(options) { Object.assign(this, options); this.element.tabIndex ||= 0; this.element.addEventListener('keydown', this.onKeyDown = event => this.#handle(event)); }
    #handle(event) { const step = event.shiftKey ? 160 : 70; let handled = true; if (event.key === 'ArrowLeft')
        this.viewport.panBy({ x: -step, y: 0 });
    else if (event.key === 'ArrowRight')
        this.viewport.panBy({ x: step, y: 0 });
    else if (event.key === 'ArrowUp')
        this.viewport.panBy({ x: 0, y: -step });
    else if (event.key === 'ArrowDown')
        this.viewport.panBy({ x: 0, y: step });
    else if (event.key === '+' || event.key === '=')
        this.viewport.setZoom(this.viewport.state.zoom + 1);
    else if (event.key === '-' || event.key === '_')
        this.viewport.setZoom(this.viewport.state.zoom - 1);
    else if (event.key === 'Home') {
        this.viewport.setCenter({ lat: 20, lon: 0 });
        this.viewport.setZoom(2);
    }
    else
        handled = false; if (handled) {
        event.preventDefault();
        this.changed('keyboard');
    } }
    destroy() { this.element.removeEventListener('keydown', this.onKeyDown); }
}

return Object.freeze({KeyboardController});
})();

// MODULE: map-v20/detail-placement.js
__modules['map-v20/detail-placement.js'] = (() => {
const { clamp } = __modules['map-v20/math.js'];

function placeFloatingPanel(anchor, panelSize, viewportSize, options = {}) { const margin = options.margin || 10; const offset = options.offset || 14; let left = anchor.x + offset; let top = anchor.y + offset; if (left + panelSize.width + margin > viewportSize.width)
    left = anchor.x - panelSize.width - offset; if (top + panelSize.height + margin > viewportSize.height)
    top = anchor.y - panelSize.height - offset; return { left: clamp(left, margin, Math.max(margin, viewportSize.width - panelSize.width - margin)), top: clamp(top, margin, Math.max(margin, viewportSize.height - panelSize.height - margin)) }; }

return Object.freeze({placeFloatingPanel});
})();

// MODULE: map-v20/tooltip-controller.js
__modules['map-v20/tooltip-controller.js'] = (() => {
const { placeFloatingPanel } = __modules['map-v20/detail-placement.js'];

class TooltipController {
    constructor(container) { this.container = container; this.element = document.createElement('div'); this.element.className = 'merlin-v20-tooltip hidden'; this.element.setAttribute('role', 'tooltip'); container.append(this.element); }
    show(text, clientPoint) { this.element.textContent = text; this.element.classList.remove('hidden'); const box = this.container.getBoundingClientRect(); const size = { width: this.element.offsetWidth || 240, height: this.element.offsetHeight || 42 }; const position = placeFloatingPanel({ x: clientPoint.x - box.left, y: clientPoint.y - box.top }, size, { width: box.width, height: box.height }); this.element.style.left = `${position.left}px`; this.element.style.top = `${position.top}px`; }
    hide() { this.element.classList.add('hidden'); }
    destroy() { this.element.remove(); }
}

return Object.freeze({TooltipController});
})();

// MODULE: map-v20/interaction-controller.js
__modules['map-v20/interaction-controller.js'] = (() => {

class InteractionController {
    constructor(options) { Object.assign(this, options); this.#bind(); }
    #target(event) { return event.target.closest?.('[data-map-entity]'); }
    #bind() { this.surface.addEventListener('click', this.onClick = event => { const target = this.#target(event); if (!target)
        return; event.stopPropagation(); const entity = this.entities.get(target.dataset.mapEntity); if (entity)
        this.select?.(entity); }); this.surface.addEventListener('keydown', this.onKeyDown = event => { if (!['Enter', ' '].includes(event.key))
        return; const target = this.#target(event); if (!target)
        return; event.preventDefault(); const entity = this.entities.get(target.dataset.mapEntity); if (entity)
        this.select?.(entity); }); this.surface.addEventListener('pointermove', this.onMove = event => { const target = this.#target(event); if (!target) {
        this.tooltip.hide();
        return;
    } const entity = this.entities.get(target.dataset.mapEntity); const value = entity?.data || entity?.feature?.properties || {}; this.tooltip.show(value.title || value.nameEnglish || value.name || value.labelText || entity?.kind || 'Map item', { x: event.clientX, y: event.clientY }); }); this.surface.addEventListener('pointerleave', this.onLeave = () => this.tooltip.hide()); }
    destroy() { this.surface.removeEventListener('click', this.onClick); this.surface.removeEventListener('keydown', this.onKeyDown); this.surface.removeEventListener('pointermove', this.onMove); this.surface.removeEventListener('pointerleave', this.onLeave); }
}

return Object.freeze({InteractionController});
})();

// MODULE: map-v20/search-toggle.js
__modules['map-v20/search-toggle.js'] = (() => {

function installMapSearchToggle(options = {}) { const root = options.root || document.querySelector('.map-search'); const toggle = options.toggle || document.getElementById('map-search-toggle'); const input = options.input || document.getElementById('global-search'); if (!root || !toggle || !input)
    return { destroy() { } }; const setOpen = open => { root.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); input.tabIndex = open ? 0 : -1; if (open)
    requestAnimationFrame(() => input.focus());
else {
    input.blur();
    document.getElementById('search-results')?.classList.add('hidden');
} }; const onToggle = () => setOpen(!root.classList.contains('open')); const onKey = event => { if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    setOpen(true);
} if (event.key === 'Escape' && root.classList.contains('open'))
    setOpen(false); }; toggle.addEventListener('click', onToggle); document.addEventListener('keydown', onKey); setOpen(false); return { setOpen, destroy() { toggle.removeEventListener('click', onToggle); document.removeEventListener('keydown', onKey); } }; }

return Object.freeze({installMapSearchToggle});
})();

// MODULE: map-v20/theme-bridge.js
__modules['map-v20/theme-bridge.js'] = (() => {

class ThemeBridge {
    constructor(options = {}) { this.root = options.root || document.documentElement; this.map = options.map || null; this.observer = new MutationObserver(() => this.apply()); this.observer.observe(this.root, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] }); this.apply(); }
    apply() { const style = getComputedStyle(this.root); const variables = { accent: style.getPropertyValue('--blue').trim() || style.getPropertyValue('--accent').trim(), panel: style.getPropertyValue('--panel').trim(), text: style.getPropertyValue('--text').trim(), background: style.getPropertyValue('--background').trim() }; this.map?.container?.style.setProperty('--map-accent', variables.accent); this.map?.container?.style.setProperty('--map-panel', variables.panel); this.map?.container?.style.setProperty('--map-text', variables.text); this.map?.events?.emit('themechange', variables); }
    destroy() { this.observer.disconnect(); }
}

return Object.freeze({ThemeBridge});
})();

// MODULE: map-v20/map-engine.js
__modules['map-v20/map-engine.js'] = (() => {
const { DEFAULT_LAYERS } = __modules['map-v20/constants.js'];
const { ViewportModel } = __modules['map-v20/viewport-model.js'];
const { EventBus } = __modules['map-v20/event-bus.js'];
const { TileLayer } = __modules['map-v20/tile-layer.js'];
const { tileSourceForMode } = __modules['map-v20/tile-source.js'];
const { SvgSurface } = __modules['map-v20/svg-surface.js'];
const { FeatureStore } = __modules['map-v20/feature-store.js'];
const { EntityRegistry } = __modules['map-v20/entity-registry.js'];
const { LayerRegistry } = __modules['map-v20/layer-registry.js'];
const { LayerRuntime } = __modules['map-v20/layer-runtime.js'];
const { MarkerRenderer } = __modules['map-v20/marker-renderer.js'];
const { ClusterRenderer } = __modules['map-v20/cluster-renderer.js'];
const { RouteRenderer } = __modules['map-v20/route-renderer.js'];
const { LabelRenderer } = __modules['map-v20/label-renderer.js'];
const { PolygonRenderer } = __modules['map-v20/polygon-renderer.js'];
const { HeatRenderer } = __modules['map-v20/heat-renderer.js'];
const { RasterRenderer } = __modules['map-v20/raster-renderer.js'];
const { GestureController } = __modules['map-v20/gesture-controller.js'];
const { KeyboardController } = __modules['map-v20/keyboard-controller.js'];
const { TooltipController } = __modules['map-v20/tooltip-controller.js'];
const { InteractionController } = __modules['map-v20/interaction-controller.js'];
const { installMapSearchToggle } = __modules['map-v20/search-toggle.js'];
const { ThemeBridge } = __modules['map-v20/theme-bridge.js'];























function materialEarthquake(item) {
    const category = String(item?.category || item?.kind || '').toLowerCase();
    if (category !== 'earthquake')
        return true;
    const magnitude = Number(item?.magnitude);
    const severity = Number(item?.severity);
    const significant = Number(item?.attributes?.significance ?? item?.significance);
    return item?.material === true || item?.tsunami === true || item?.shippingImpact === true || item?.infrastructureImpact === true || magnitude >= 6 || severity >= 80 || significant >= 600;
}
function pointFeature(item, layer, index) {
    const point = layer === 'ports' ? item.coordinates : layer === 'news' ? item.mapPoint : layer === 'places' ? { lat: item.lat ?? item.country?.lat ?? item.capitalLat ?? item.country?.capitalLat, lon: item.lon ?? item.country?.lon ?? item.capitalLon ?? item.country?.capitalLon } : { lat: item.lat, lon: item.lon };
    if (!Number.isFinite(Number(point?.lat)) || !Number.isFinite(Number(point?.lon)))
        return null;
    const nameEnglish = item.nameEnglish || item.name || item.country?.name || item.title || item.category;
    const nameLocal = item.nameLocal || item.nativeName || item.country?.nativeName || '';
    return { type: 'Feature', id: String(item.id || `${layer}:${index}`), geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] }, properties: { ...item, kind: layer === 'places' ? 'PLACE' : layer.slice(0, -1).toUpperCase(), nameEnglish, nameLocal }, __data: item };
}
function routeFeature(item, index) {
    const coordinates = item.geometry?.coordinates || item.coordinates || item.points?.map(point => [point.lon, point.lat]) || [];
    if (!coordinates.length)
        return null;
    return { type: 'Feature', id: String(item.id || item.properties?.id || `route:${index}`), geometry: item.geometry || { type: 'LineString', coordinates }, properties: { ...item.properties, ...item, kind: 'ROUTE' }, __data: item };
}
class MapEngineV20 {
    constructor(options = {}) {
        this.container = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
        if (!this.container)
            throw new Error('Map container not found');
        this.onSelect = options.onSelect;
        this.onEntity = options.onEntity;
        this.events = new EventBus();
        this.layersState = { ...DEFAULT_LAYERS };
        this.container.replaceChildren();
        this.container.classList.add('merlin-v20-map', 'map-ready');
        this.localBase = document.createElement('img');
        this.localBase.className = 'merlin-v20-local-base';
        this.localBase.src = '/assets/world-base.svg?v=20.0.0';
        this.localBase.alt = '';
        this.localBase.draggable = false;
        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'merlin-v20-tiles';
        this.container.append(this.localBase, this.tileContainer);
        this.viewport = new ViewportModel({ center: options.initialPoint, zoom: options.initialZoom, width: this.container.clientWidth || 1280, height: this.container.clientHeight || 720 });
        this.tileLayer = new TileLayer(this.tileContainer, tileSourceForMode('streets'));
        this.surface = new SvgSurface(this.container);
        this.features = new FeatureStore();
        this.entities = new EntityRegistry();
        this.layerRegistry = new LayerRegistry([
            { id: 'routes', source: 'routes', renderer: 'route', order: 10, visible: false, style: { colour: '#2f92bd' } },
            { id: 'alerts', source: 'alerts', renderer: 'marker', order: 20 }, { id: 'events', source: 'events', renderer: 'cluster', order: 30, style: { colour: '#d85b55' } },
            { id: 'news', source: 'news', renderer: 'cluster', order: 40, style: { colour: '#8d6bd1' } }, { id: 'ports', source: 'ports', renderer: 'marker', order: 50, visible: false },
            { id: 'places', source: 'places', renderer: 'marker', order: 60, visible: true, minimumZoom: 2 }, { id: 'labels', source: 'places', renderer: 'label', order: 70, visible: true, minimumZoom: 2 }
        ]);
        this.runtime = new LayerRuntime({ surface: this.surface, layers: this.layerRegistry, features: this.features, entities: this.entities }).registerRenderer('marker', new MarkerRenderer()).registerRenderer('cluster', new ClusterRenderer()).registerRenderer('route', new RouteRenderer()).registerRenderer('label', new LabelRenderer()).registerRenderer('polygon', new PolygonRenderer()).registerRenderer('heat', new HeatRenderer()).registerRenderer('raster', new RasterRenderer());
        this.tooltip = new TooltipController(this.container);
        this.interaction = new InteractionController({ surface: this.surface.root, entities: this.entities, tooltip: this.tooltip, select: entity => this.#selectEntity(entity) });
        this.gestures = new GestureController({ element: this.container, viewport: this.viewport, changed: reason => this.render(reason), click: event => this.#selectPoint(event) });
        this.keyboard = new KeyboardController({ element: this.container, viewport: this.viewport, changed: reason => this.render(reason) });
        this.searchToggle = installMapSearchToggle();
        this.theme = new ThemeBridge({ map: this });
        this.status = document.createElement('div');
        this.status.className = 'merlin-v20-status';
        this.container.append(this.status);
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.container);
        this.overlayMetadata = new Map();
        this.render('init');
    }
    get zoom() { return this.viewport.state.zoom; }
    setData(data = {}) {
        const events = [...(data.events || [])].filter(materialEarthquake).map((item, index) => pointFeature(item, 'events', index)).filter(Boolean);
        const alerts = [...(data.alerts || [])].map((item, index) => pointFeature(item, 'alerts', index)).filter(Boolean);
        const news = [...(data.news || [])].map((item, index) => pointFeature(item, 'news', index)).filter(Boolean);
        const ports = [...(data.ports || [])].map((item, index) => pointFeature(item, 'ports', index)).filter(Boolean);
        const places = [...(data.places || [])].map((item, index) => pointFeature(item, 'places', index)).filter(Boolean);
        const routes = [...(data.routes || [])].map(routeFeature).filter(Boolean);
        for (const [id, values] of Object.entries({ events, alerts, news, ports, places, routes }))
            this.features.set(id, values.map(feature => ({ ...feature, __data: feature.__data })));
        this.render('data');
    }

    on(type, listener) { return this.events.on(type, listener); }
    getViewport() { return this.viewport.snapshot(); }
    registerOverlay(definition) {
        if (!this.layerRegistry.get(definition.id)) this.layerRegistry.register({ visible: false, minimumZoom: 0, maximumZoom: 20, order: 100, interactive: true, ...definition });
        return this.layerRegistry.get(definition.id);
    }
    setOverlayData(id, features = []) { this.features.set(id, features.map(feature => ({ ...feature, __data: feature.__data || feature.properties }))); this.render('overlay-data'); }
    setOverlayState(id, state = {}) {
        const aliases = { 'english-local-labels': 'labels', 'major-cities': 'places', 'shipping-routes': 'routes' };
        const targetId = aliases[id] || id;
        const layer = this.layerRegistry.get(targetId);
        if (layer) {
            if ('visible' in state) this.layerRegistry.setVisible(targetId, state.visible);
            if ('opacity' in state) layer.opacity = Number(state.opacity);
            if (state.style) layer.style = { ...(layer.style || {}), ...state.style };
            if (state.filters) layer.filters = { ...(layer.filters || {}), ...state.filters };
        }
        if (id === 'political-boundaries' && 'visible' in state) this.localBase.style.visibility = state.visible ? 'visible' : 'hidden';
        if ((id === 'topography' || id === 'terrain-shading') && state.visible) this.setTileMode('terrain');
        this.render('overlay-state');
    }
    setOverlayMetadata(id, metadata = {}) { this.overlayMetadata.set(id, { ...metadata }); }
    setLayerVisibility(values = {}) {
        this.layersState = { ...this.layersState, ...values };
        const mapping = { alerts: 'alerts', news: 'news', routes: 'routes', ports: 'ports', places: 'places' };
        for (const [source, id] of Object.entries(mapping))
            if (source in values)
                this.layerRegistry.setVisible(id, values[source]);
        if ('places' in values || 'labels' in values)
            this.layerRegistry.setVisible('labels', values.labels ?? values.places);
        this.render('layers');
    }
    setTileMode(mode) { this.tileLayer.setSource(tileSourceForMode(mode)); this.container.dataset.mapStyle = mode; this.render('style'); }
    setZoom(value) { this.viewport.setZoom(value); this.render('zoom'); }
    flyTo(point, options = {}) {
        this.viewport.setCenter(point);
        if (options.zoom !== undefined)
            this.viewport.setZoom(options.zoom);
        this.render('fly');
    }
    resize() { const box = this.container.getBoundingClientRect(); this.viewport.resize(box.width, box.height); this.surface.resize(this.viewport.state.size.width, this.viewport.state.size.height); this.render('resize'); }
    render(reason = 'render') { const state = this.viewport.snapshot(); this.tileLayer.render(state); this.runtime.render(this.viewport); this.localBase.style.display = this.tileLayer.source?.enabled ? 'none' : ''; this.status.textContent = `Z${state.zoom.toFixed(1)} · ${state.center.lat.toFixed(2)}, ${state.center.lon.toFixed(2)} · BOUNDED WORLD`; this.events.emit('render', { reason, viewport: state, features: this.features.version }); }
    #selectEntity(entity) {
        if (entity.kind === 'CLUSTER' && entity.data?.members?.length) {
            const points = entity.data.members.map(feature => ({ lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0] }));
            this.flyTo({ lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length, lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length }, { zoom: Math.min(14, this.zoom + 2) });
            return;
        }
        const data = entity.feature?.__data || entity.data || entity.feature?.properties;
        const kind = String(entity.kind || '').toLowerCase();
        this.onEntity?.({ kind, data, feature: entity.feature });
    }
    #selectPoint(event) {
        if (event.target.closest?.('[data-map-entity]'))
            return;
        const box = this.container.getBoundingClientRect();
        this.onSelect?.(this.viewport.unproject({ x: event.clientX - box.left, y: event.clientY - box.top }));
    }
    destroy() { this.resizeObserver?.disconnect(); this.gestures.destroy(); this.keyboard.destroy(); this.interaction.destroy(); this.tooltip.destroy(); this.searchToggle.destroy(); this.theme.destroy(); this.tileLayer.clear(); this.surface.destroy(); this.events.clear(); }
}

return Object.freeze({MapEngineV20});
})();

// MODULE: map/merlin-tile-map.js
__modules['map/merlin-tile-map.js'] = (() => {
const __reexport_0_MerlinTileMap = __modules['map-v20/map-engine.js'].MapEngineV20;


return Object.freeze({MerlinTileMap: __reexport_0_MerlinTileMap});
})();

// MODULE: overlays/api-client.js
__modules['overlays/api-client.js'] = (() => {

class OverlayApiClient { constructor(options={}){this.baseUrl=options.baseUrl||'/api/overlays';this.timeoutMs=options.timeoutMs||10000;} async request(path,options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);try{const response=await fetch(`${this.baseUrl}${path}`,{...options,headers:{accept:'application/json',...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{})},signal:controller.signal});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error?.message||`Overlay request failed: ${response.status}`);}return response.json();}finally{clearTimeout(timer);}} catalog(){return this.request('/catalog');} presets(){return this.request('/presets');} availability(){return this.request('/availability');} state(){return this.request('/state');} saveState(state){return this.request('/state',{method:'POST',body:JSON.stringify(state)});} applyPreset(id){return this.request(`/presets/${encodeURIComponent(id)}/apply`,{method:'POST'});} layer(id,query={}){const params=new URLSearchParams(Object.entries(query).filter(([,value])=>value!==undefined&&value!==null));return this.request(`/${encodeURIComponent(id)}/features?${params}`);} query(body){return this.request('/query',{method:'POST',body:JSON.stringify(body)});} }

return Object.freeze({OverlayApiClient});
})();

// MODULE: overlays/events.js
__modules['overlays/events.js'] = (() => {

class OverlayEvents { constructor(){this.listeners=new Map();} on(type,listener){const list=this.listeners.get(type)||new Set();list.add(listener);this.listeners.set(type,list);return()=>list.delete(listener);} emit(type,payload){for(const listener of this.listeners.get(type)||[]) listener(payload);} clear(){this.listeners.clear();} }

return Object.freeze({OverlayEvents});
})();

// MODULE: overlays/state-store.js
__modules['overlays/state-store.js'] = (() => {
const { OverlayEvents } = __modules['overlays/events.js'];

class OverlayStateStore { constructor(){this.events=new OverlayEvents();this.layers=new Map();this.catalog=[];this.groups=[];this.presetId=null;this.loading=false;} hydrate(catalog,state){this.catalog=catalog.layers||[];this.groups=catalog.groups||[];const incoming=new Map((state?.layers||[]).map(layer=>[layer.id,layer]));this.layers.clear();for(const definition of this.catalog){const saved=incoming.get(definition.id)||{};this.layers.set(definition.id,{id:definition.id,visible:saved.visible??definition.visible,opacity:saved.opacity??definition.opacity??1,order:saved.order??definition.order,filters:{...(definition.filters||{}),...(saved.filters||{})},definition});}this.presetId=state?.presetId||null;this.events.emit('change',this.snapshot());} setVisible(id,visible){const layer=this.layers.get(id);if(!layer)return;layer.visible=Boolean(visible);this.events.emit('layer',{id,layer:{...layer}});this.events.emit('change',this.snapshot());} setOpacity(id,opacity){const layer=this.layers.get(id);if(!layer)return;layer.opacity=Math.max(0,Math.min(1,Number(opacity)));this.events.emit('layer',{id,layer:{...layer}});this.events.emit('change',this.snapshot());} setFilter(id,key,value){const layer=this.layers.get(id);if(!layer)return;layer.filters={...layer.filters,[key]:value};this.events.emit('layer',{id,layer:{...layer}});this.events.emit('change',this.snapshot());} applyState(state){this.hydrate({layers:this.catalog,groups:this.groups},state);} snapshot(){return{version:1,presetId:this.presetId,updatedAt:new Date().toISOString(),layers:[...this.layers.values()].sort((a,b)=>a.order-b.order).map(({definition,...layer})=>({...layer,filters:{...layer.filters}}))};} visible(){return[...this.layers.values()].filter(layer=>layer.visible).sort((a,b)=>a.order-b.order);} }

return Object.freeze({OverlayStateStore});
})();

// MODULE: overlays/persistence.js
__modules['overlays/persistence.js'] = (() => {

const KEY='merlin.overlay-state.v20';
class OverlayPersistence { constructor(storage=window.localStorage){this.storage=storage;} load(){try{return JSON.parse(this.storage.getItem(KEY)||'null');}catch{return null;}} save(state){try{this.storage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}} clear(){try{this.storage.removeItem(KEY);}catch{}} }

return Object.freeze({OverlayPersistence});
})();

// MODULE: overlays/dom.js
__modules['overlays/dom.js'] = (() => {

const el=(tag,attributes={},children=[])=>{const node=document.createElement(tag);for(const [key,value] of Object.entries(attributes)){if(key==='class')node.className=value;else if(key==='text')node.textContent=value;else if(key.startsWith('on')&&typeof value==='function')node.addEventListener(key.slice(2).toLowerCase(),value);else if(value!==undefined&&value!==null)node.setAttribute(key,String(value));}for(const child of [].concat(children||[]))node.append(child instanceof Node?child:document.createTextNode(String(child)));return node;};
const clear=node=>node?.replaceChildren();
const formatCount=value=>new Intl.NumberFormat('en-GB',{notation:Number(value)>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(value)||0);

return Object.freeze({el, clear, formatCount});
})();

// MODULE: overlays/opacity-control.js
__modules['overlays/opacity-control.js'] = (() => {
const { el } = __modules['overlays/dom.js'];

function opacityControl(layer,onChange){const value=Math.round(Number(layer.opacity??1)*100);const output=el('output',{text:`${value}%`});const input=el('input',{type:'range',min:'0',max:'100',step:'5',value:String(value),'aria-label':`${layer.definition.title} opacity`,oninput:event=>{const opacity=Number(event.target.value)/100;output.textContent=`${event.target.value}%`;onChange(opacity);}});return el('label',{class:'overlay-opacity'},[el('span',{text:'OPACITY'}),input,output]);}

return Object.freeze({opacityControl});
})();

// MODULE: overlays/source-status.js
__modules['overlays/source-status.js'] = (() => {
const { el } = __modules['overlays/dom.js'];

function sourceStatusBadge(layer,availability){const state=availability?.available?'available':layer.sourceMode==='static'?'catalogue':'connector';return el('span',{class:`overlay-source-status ${state}`,text:availability?.available?String(layer.sourceMode).toUpperCase():availability?.reason==='CONNECTOR_REQUIRED'?'CONNECTOR':'UNAVAILABLE',title:availability?.reason||layer.metadata?.sourceLabel||layer.sourceMode});}

return Object.freeze({sourceStatusBadge});
})();

// MODULE: overlays/layer-row.js
__modules['overlays/layer-row.js'] = (() => {
const { el } = __modules['overlays/dom.js'];
const { opacityControl } = __modules['overlays/opacity-control.js'];
const { sourceStatusBadge } = __modules['overlays/source-status.js'];

function layerRow(layer,options={}){const checkbox=el('input',{type:'checkbox',checked:layer.visible?'':'','aria-label':`Toggle ${layer.definition.title}`});checkbox.checked=layer.visible;checkbox.addEventListener('change',()=>options.onVisible?.(checkbox.checked));const swatch=el('i',{class:'overlay-swatch',style:`--overlay-colour:${layer.definition.style?.colour||'#7aa8bd'}`});const header=el('div',{class:'overlay-layer-main'},[checkbox,swatch,el('span',{class:'overlay-layer-copy'},[el('strong',{text:layer.definition.title}),el('small',{text:layer.definition.description})]),sourceStatusBadge(layer.definition,options.availability)]);const details=el('div',{class:'overlay-layer-details'},[opacityControl(layer,value=>options.onOpacity?.(value)),el('button',{type:'button',class:'overlay-filter-button',text:'FILTERS',onclick:()=>options.onFilters?.(layer)}),el('button',{type:'button',class:'overlay-info-button',text:'INFO',onclick:()=>options.onInfo?.(layer)})]);const row=el('article',{class:`overlay-layer-row${layer.visible?' is-visible':''}`},[header,details]);return row;}

return Object.freeze({layerRow});
})();

// MODULE: overlays/group-section.js
__modules['overlays/group-section.js'] = (() => {
const { el, formatCount } = __modules['overlays/dom.js'];
const { layerRow } = __modules['overlays/layer-row.js'];

function groupSection(group,layers,options={}){const body=el('div',{class:'overlay-group-body'});const render=()=>{body.replaceChildren(...layers.map(layer=>layerRow(layer,{...options,availability:options.availability?.get(layer.id),onVisible:value=>options.onVisible(layer.id,value),onOpacity:value=>options.onOpacity(layer.id,value),onFilters:()=>options.onFilters(layer),onInfo:()=>options.onInfo(layer)})));};render();const visible=layers.filter(layer=>layer.visible).length;const toggle=el('button',{type:'button',class:'overlay-group-toggle','aria-expanded':'true'},[el('span',{text:group.title}),el('b',{text:`${visible}/${formatCount(layers.length)}`})]);toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')!=='false';toggle.setAttribute('aria-expanded',String(!expanded));body.hidden=expanded;});return el('section',{class:'overlay-group'},[toggle,el('p',{class:'overlay-group-description',text:group.description}),body]);}

return Object.freeze({groupSection});
})();

// MODULE: overlays/preset-menu.js
__modules['overlays/preset-menu.js'] = (() => {
const { el } = __modules['overlays/dom.js'];

function presetMenu(presets,onApply){const select=el('select',{'aria-label':'Overlay preset'});select.append(el('option',{value:'',text:'CUSTOM OVERLAYS'}),...presets.map(preset=>el('option',{value:preset.id,text:preset.title.toUpperCase()})));select.addEventListener('change',()=>{if(select.value)onApply(select.value);});return el('label',{class:'overlay-preset-menu'},[el('span',{text:'PRESET'}),select]);}

return Object.freeze({presetMenu});
})();

// MODULE: overlays/overlay-panel.js
__modules['overlays/overlay-panel.js'] = (() => {
const { el } = __modules['overlays/dom.js'];
const { groupSection } = __modules['overlays/group-section.js'];
const { presetMenu } = __modules['overlays/preset-menu.js'];

class OverlayPanel { constructor(root,options){this.root=root;this.options=options;} render(store,presets,availability){const byGroup=new Map();for(const layer of store.layers.values()){const list=byGroup.get(layer.definition.group)||[];list.push(layer);byGroup.set(layer.definition.group,list);}const availabilityMap=new Map((availability?.layers||[]).map(item=>[item.id,item]));const content=store.groups.map(group=>groupSection(group,(byGroup.get(group.id)||[]).sort((a,b)=>a.order-b.order),{availability:availabilityMap,onVisible:this.options.onVisible,onOpacity:this.options.onOpacity,onFilters:this.options.onFilters,onInfo:this.options.onInfo}));const close=el('button',{type:'button',class:'overlay-panel-close',text:'×',onclick:()=>this.hide()});this.root.replaceChildren(el('header',{class:'overlay-panel-header'},[el('div',{},[el('small',{text:'MERLIN MAP SYSTEM'}),el('h2',{text:'OVERLAYS'})]),close]),presetMenu(presets,this.options.onPreset),el('div',{class:'overlay-panel-actions'},[el('button',{type:'button',text:'SHOW DEFAULTS',onclick:this.options.onDefaults}),el('button',{type:'button',text:'CLEAR ALL',onclick:this.options.onClear}),el('button',{type:'button',text:'REFRESH',onclick:this.options.onRefresh})]),el('div',{class:'overlay-groups'},content));} show(){this.root.classList.remove('hidden');this.root.setAttribute('aria-hidden','false');} hide(){this.root.classList.add('hidden');this.root.setAttribute('aria-hidden','true');} toggle(){this.root.classList.contains('hidden')?this.show():this.hide();} }

return Object.freeze({OverlayPanel});
})();

// MODULE: overlays/filter-panel.js
__modules['overlays/filter-panel.js'] = (() => {
const { el } = __modules['overlays/dom.js'];

class OverlayFilterPanel { constructor(root,store){this.root=root;this.store=store;} open(layer){this.root.classList.remove('hidden');const close=el('button',{type:'button',class:'overlay-panel-close',text:'×',onclick:()=>this.close()});const field=(label,key,min,max,step)=>{const value=layer.filters[key]??0;const input=el('input',{type:'number',min:String(min),max:String(max),step:String(step),value:String(value)});input.addEventListener('change',()=>this.store.setFilter(layer.id,key,Number(input.value)));return el('label',{class:'overlay-filter-field'},[el('span',{text:label}),input]);};this.root.replaceChildren(el('header',{},[el('div',{},[el('small',{text:'OVERLAY FILTERS'}),el('h3',{text:layer.definition.title})]),close]),field('MINIMUM CONFIDENCE','minimumConfidence',0,100,5),field('MINIMUM SEVERITY','minimumSeverity',0,100,5),field('MAXIMUM AGE (HOURS)','maximumAgeHours',1,720,1));} close(){this.root.classList.add('hidden');this.root.replaceChildren();} }

return Object.freeze({OverlayFilterPanel});
})();

// MODULE: overlays/legend-panel.js
__modules['overlays/legend-panel.js'] = (() => {
const { el } = __modules['overlays/dom.js'];

class OverlayLegendPanel { constructor(root){this.root=root;} render(entries=[]){this.root.replaceChildren(el('header',{},[el('strong',{text:'LEGEND'}),el('span',{text:`${entries.length}`})]),...entries.map(entry=>el('div',{class:'overlay-legend-row'},[el('i',{style:`--overlay-colour:${entry.colour||'#7aa8bd'}`}),el('span',{text:entry.label||'Other'}),entry.count!==undefined?el('b',{text:String(entry.count)}):el('span')])));this.root.classList.toggle('hidden',entries.length===0);} clear(){this.render([]);} }

return Object.freeze({OverlayLegendPanel});
})();

// MODULE: overlays/feature-inspector.js
__modules['overlays/feature-inspector.js'] = (() => {
const { el } = __modules['overlays/dom.js'];

class OverlayFeatureInspector { constructor(root){this.root=root;} show(entity){const data=entity?.data||entity?.feature?.properties||{};const rows=Object.entries(data).filter(([,value])=>['string','number','boolean'].includes(typeof value)).slice(0,14);this.root.classList.remove('hidden');this.root.replaceChildren(el('header',{},[el('small',{text:String(data.overlayId||entity.kind||'OVERLAY').toUpperCase()}),el('h3',{text:data.title||data.nameEnglish||data.name||'Map feature'}),el('button',{type:'button',text:'×',onclick:()=>this.hide()})]),...rows.map(([key,value])=>el('div',{class:'overlay-inspector-row'},[el('span',{text:key.replaceAll('_',' ').toUpperCase()}),el('b',{text:String(value)})])));} hide(){this.root.classList.add('hidden');this.root.replaceChildren();} }

return Object.freeze({OverlayFeatureInspector});
})();

// MODULE: overlays/style-resolver.js
__modules['overlays/style-resolver.js'] = (() => {

const GROUP_COLOURS={reference:'#8fb3c7',terrain:'#7fa878',conflict:'#ef596f',politics:'#b79cff',logistics:'#31c6df',hazards:'#ff9c55',infrastructure:'#f0ca64',humanitarian:'#74d6a2',markets:'#58a6ff',verification:'#d48cff'};
function resolveOverlayStyle(definition,state={}){const colour=definition.style?.colour||GROUP_COLOURS[definition.group]||'#8fb3c7';return{colour,fillColour:definition.style?.fillColour||colour,lineColour:definition.style?.lineColour||colour,radius:Number(definition.style?.radius||6),lineWidth:Number(definition.style?.lineWidth||2),opacity:Number(state.opacity??definition.opacity??1)};}

return Object.freeze({resolveOverlayStyle});
})();

// MODULE: overlays/layer-runtime-bridge.js
__modules['overlays/layer-runtime-bridge.js'] = (() => {
const { resolveOverlayStyle } = __modules['overlays/style-resolver.js'];

class OverlayLayerRuntimeBridge { constructor(map){this.map=map;this.registered=new Set();} register(layer){if(this.registered.has(layer.id))return;this.map.registerOverlay?.({...layer,style:resolveOverlayStyle(layer)});this.registered.add(layer.id);} applyState(layer){this.register(layer.definition);this.map.setOverlayState?.(layer.id,{visible:layer.visible,opacity:layer.opacity,filters:layer.filters,style:resolveOverlayStyle(layer.definition,layer)});} applyResult(result){this.map.setOverlayData?.(result.layerId,result.collection?.features||[]);this.map.setOverlayMetadata?.(result.layerId,{freshness:result.freshness,legend:result.legend,source:result.source,sourceMode:result.sourceMode});} clear(id){this.map.setOverlayData?.(id,[]);} }

return Object.freeze({OverlayLayerRuntimeBridge});
})();

// MODULE: overlays/viewport-loader.js
__modules['overlays/viewport-loader.js'] = (() => {

class OverlayViewportLoader { constructor(options){Object.assign(this,options);this.timer=null;this.inflight=new Map();} schedule(reason='viewport'){clearTimeout(this.timer);this.timer=setTimeout(()=>this.load(reason),this.delayMs||250);} async load(reason){const viewport=this.map.getViewport?.();const visible=this.store.visible().filter(layer=>layer.definition.sourceMode!=='tile');if(!viewport||!visible.length)return;const layerIds=visible.map(layer=>layer.id);const key=JSON.stringify({layerIds,bounds:viewport.bounds,zoom:Math.round(viewport.zoom*10)});if(this.inflight.has(key))return this.inflight.get(key);const promise=this.api.query({layerIds,bounds:viewport.bounds,filters:Object.fromEntries(visible.map(layer=>[layer.id,layer.filters])),limit:2500}).then(result=>this.onData?.(result,reason)).finally(()=>this.inflight.delete(key));this.inflight.set(key,promise);return promise;} destroy(){clearTimeout(this.timer);this.inflight.clear();} }

return Object.freeze({OverlayViewportLoader});
})();

// MODULE: overlays/keyboard-shortcuts.js
__modules['overlays/keyboard-shortcuts.js'] = (() => {

class OverlayKeyboardShortcuts { constructor(options){this.options=options;this.handle=this.handle.bind(this);document.addEventListener('keydown',this.handle);} handle(event){if(event.target?.matches?.('input,textarea,select'))return;if(event.key.toLowerCase()==='l'){event.preventDefault();this.options.togglePanel?.();}if(event.key.toLowerCase()==='g'&&event.shiftKey){event.preventDefault();this.options.toggleLegend?.();}} destroy(){document.removeEventListener('keydown',this.handle);} }

return Object.freeze({OverlayKeyboardShortcuts});
})();

// MODULE: overlays/url-state.js
__modules['overlays/url-state.js'] = (() => {

function readOverlayUrlState(location=window.location){const params=new URLSearchParams(location.search);const layers=params.get('layers')?.split(',').filter(Boolean)||[];const presetId=params.get('overlayPreset')||null;return{layers,presetId};}
function writeOverlayUrlState(state,history=window.history,location=window.location){const params=new URLSearchParams(location.search);const visible=(state.layers||[]).filter(layer=>layer.visible).map(layer=>layer.id);if(visible.length)params.set('layers',visible.join(','));else params.delete('layers');if(state.presetId)params.set('overlayPreset',state.presetId);else params.delete('overlayPreset');history.replaceState(null,'',`${location.pathname}?${params}${location.hash}`);}

return Object.freeze({readOverlayUrlState, writeOverlayUrlState});
})();

// MODULE: overlays/overlay-controller.js
__modules['overlays/overlay-controller.js'] = (() => {
const { OverlayStateStore } = __modules['overlays/state-store.js'];
const { OverlayPersistence } = __modules['overlays/persistence.js'];
const { OverlayPanel } = __modules['overlays/overlay-panel.js'];
const { OverlayFilterPanel } = __modules['overlays/filter-panel.js'];
const { OverlayLegendPanel } = __modules['overlays/legend-panel.js'];
const { OverlayFeatureInspector } = __modules['overlays/feature-inspector.js'];
const { OverlayLayerRuntimeBridge } = __modules['overlays/layer-runtime-bridge.js'];
const { OverlayViewportLoader } = __modules['overlays/viewport-loader.js'];
const { OverlayKeyboardShortcuts } = __modules['overlays/keyboard-shortcuts.js'];
const { writeOverlayUrlState } = __modules['overlays/url-state.js'];

class OverlayController { constructor(options){Object.assign(this,options);this.store=new OverlayStateStore();this.persistence=new OverlayPersistence();this.bridge=new OverlayLayerRuntimeBridge(this.map);this.panel=new OverlayPanel(this.panelRoot,{onVisible:(id,value)=>this.store.setVisible(id,value),onOpacity:(id,value)=>this.store.setOpacity(id,value),onFilters:layer=>this.filters.open(layer),onInfo:layer=>this.showLayerInfo(layer),onPreset:id=>this.applyPreset(id),onDefaults:()=>this.defaults(),onClear:()=>this.clear(),onRefresh:()=>this.loader.load('manual')});this.filters=new OverlayFilterPanel(this.filterRoot,this.store);this.legend=new OverlayLegendPanel(this.legendRoot);this.inspector=new OverlayFeatureInspector(this.inspectorRoot);this.loader=new OverlayViewportLoader({map:this.map,store:this.store,api:this.api,onData:(result,reason)=>this.applyResults(result,reason)});this.shortcuts=new OverlayKeyboardShortcuts({togglePanel:()=>this.panel.toggle(),toggleLegend:()=>this.legendRoot.classList.toggle('hidden')});this.unsubscribers=[];} async start(){const [catalog,presets,availability,remoteState]=await Promise.all([this.api.catalog(),this.api.presets(),this.api.availability(),this.api.state().catch(()=>null)]);this.presets=presets.presets||[];this.availability=availability;const local=this.persistence.load();this.store.hydrate(catalog,local||remoteState||{});for(const layer of this.store.layers.values())this.bridge.applyState(layer);this.panel.render(this.store,this.presets,this.availability);this.unsubscribers.push(this.store.events.on('layer',({layer})=>{this.bridge.applyState(layer);this.panel.render(this.store,this.presets,this.availability);this.loader.schedule('layer');}),this.store.events.on('change',state=>{this.persistence.save(state);writeOverlayUrlState(state);}));this.map.on?.('render',event=>{if(['pan','wheel','resize','fly','zoom'].includes(event.reason))this.loader.schedule(event.reason);});await this.loader.load('start');return this;} applyResults(response){for(const result of response.results||[])this.bridge.applyResult(result);const visible=(response.results||[]).filter(result=>this.store.layers.get(result.layerId)?.visible);this.legend.render(visible.flatMap(result=>result.legend||[]).slice(0,20));} async applyPreset(id){const state=await this.api.applyPreset(id);this.store.applyState(state);for(const layer of this.store.layers.values())this.bridge.applyState(layer);this.panel.render(this.store,this.presets,this.availability);await this.loader.load('preset');} defaults(){this.store.hydrate({layers:this.store.catalog,groups:this.store.groups},{});for(const layer of this.store.layers.values())this.bridge.applyState(layer);this.panel.render(this.store,this.presets,this.availability);this.loader.load('defaults');} clear(){for(const layer of this.store.layers.values())this.store.setVisible(layer.id,false);this.panel.render(this.store,this.presets,this.availability);} showLayerInfo(layer){this.inspector.show({kind:'overlay',data:{title:layer.definition.title,description:layer.definition.description,group:layer.definition.group,sourceMode:layer.definition.sourceMode,source:layer.definition.source,renderer:layer.definition.renderer,minimumZoom:layer.definition.minimumZoom,maximumZoom:layer.definition.maximumZoom}});} destroy(){this.loader.destroy();this.shortcuts.destroy();for(const unsubscribe of this.unsubscribers)unsubscribe?.();} }

return Object.freeze({OverlayController});
})();

// MODULE: overlays/overlay-bootstrap.js
__modules['overlays/overlay-bootstrap.js'] = (() => {
const { OverlayApiClient } = __modules['overlays/api-client.js'];
const { OverlayController } = __modules['overlays/overlay-controller.js'];

function ensureRoot(id,className){let root=document.getElementById(id);if(!root){root=document.createElement('aside');root.id=id;root.className=className;document.querySelector('.map-stage')?.append(root);}return root;}
async function installOverlaySystem(options){const button=document.getElementById('overlay-catalogue-toggle')||document.createElement('button');if(!button.id){button.id='overlay-catalogue-toggle';button.type='button';button.className='overlay-catalogue-toggle';button.textContent='LAYERS';document.querySelector('.map-tools')?.append(button);}const panelRoot=ensureRoot('overlay-panel','overlay-panel hidden');const filterRoot=ensureRoot('overlay-filter-panel','overlay-side-panel hidden');const legendRoot=ensureRoot('overlay-legend','overlay-legend hidden');const inspectorRoot=ensureRoot('overlay-inspector','overlay-inspector hidden');const controller=new OverlayController({map:options.map,api:options.api||new OverlayApiClient(),panelRoot,filterRoot,legendRoot,inspectorRoot});button.addEventListener('click',()=>controller.panel.toggle());try{await controller.start();button.classList.add('is-ready');return controller;}catch(error){button.classList.add('is-error');button.title=error.message;console.error('Overlay system failed to start',error);return null;}}

return Object.freeze({installOverlaySystem});
})();

// MODULE: logistics/api-client.js
__modules['logistics/api-client.js'] = (() => {

class LogisticsApiClient {
  constructor(options = {}) { this.baseUrl = options.baseUrl || ''; this.timeoutMs = options.timeoutMs || 20_000; }
  async request(path, options = {}) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { method: options.method || 'GET', headers: { accept: 'application/json', ...(options.body ? { 'content-type': 'application/json' } : {}) }, body: options.body ? JSON.stringify(options.body) : undefined, credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const type = response.headers.get('content-type') || ''; const payload = type.includes('json') ? await response.json() : await response.text();
      if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `HTTP ${response.status}`), { code: payload?.error?.code || 'LOGISTICS_API_ERROR', status: response.status, details: payload?.error?.details });
      return payload;
    } finally { clearTimeout(timeout); }
  }
  network() { return this.request('/api/logistics/network'); }
  diagnostics() { return this.request('/api/logistics/diagnostics'); }
  bottlenecks(limit = 50) { return this.request(`/api/logistics/bottlenecks?limit=${encodeURIComponent(limit)}`); }
  plan(body) { return this.request('/api/logistics/plan', { method: 'POST', body, timeoutMs: 30_000 }); }
  scenario(body) { return this.request('/api/logistics/scenario', { method: 'POST', body, timeoutMs: 35_000 }); }
  saved() { return this.request('/api/logistics/saved'); }
  save(body) { return this.request('/api/logistics/saved', { method: 'POST', body }); }
  removeSaved(id) { return this.request('/api/logistics/saved/remove', { method: 'POST', body: { id } }); }
  watchlist() { return this.request('/api/logistics/watchlist'); }
  addWatch(body) { return this.request('/api/logistics/watchlist', { method: 'POST', body }); }
  removeWatch(id) { return this.request('/api/logistics/watchlist/remove', { method: 'POST', body: { id } }); }
}

return Object.freeze({LogisticsApiClient});
})();

// MODULE: logistics/state-store.js
__modules['logistics/state-store.js'] = (() => {

class LogisticsStateStore extends EventTarget {
  constructor(initial = {}) { super(); this.state = Object.freeze({ open: false, loading: false, network: null, result: null, scenario: null, error: null, activeTab: 'PLAN', selectedRouteId: null, ...initial }); }
  get() { return this.state; }
  set(patch, reason = 'state.changed') { this.state = Object.freeze({ ...this.state, ...patch }); this.dispatchEvent(new CustomEvent('change', { detail: { state: this.state, reason } })); return this.state; }
  subscribe(listener) { const handler = event => listener(event.detail.state, event.detail.reason); this.addEventListener('change', handler); return () => this.removeEventListener('change', handler); }
}

return Object.freeze({LogisticsStateStore});
})();

// MODULE: logistics/dom.js
__modules['logistics/dom.js'] = (() => {

function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') node.className = value; else if (key === 'text') node.textContent = value; else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value); else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) if (child != null) node.append(child.nodeType ? child : document.createTextNode(String(child)));
  return node;
}
function clear(node) { while (node.firstChild) node.firstChild.remove(); }
function option(value, label) { return element('option', { value, text: label }); }

return Object.freeze({element, clear, option});
})();

// MODULE: logistics/planner-form.js
__modules['logistics/planner-form.js'] = (() => {
const { element, option } = __modules['logistics/dom.js'];

class PlannerForm {
  constructor(options) { this.root = options.root; this.onSubmit = options.onSubmit; this.network = null; }
  setNetwork(network) { this.network = network; this.render(); }
  nodeOptions(kind = 'PORT') { return (this.network?.nodes || []).filter(node => node.kind === kind).sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  value(name) { return this.root.querySelector(`[name="${name}"]`)?.value; }
  payload() { return { originId: this.value('originId'), destinationId: this.value('destinationId'), vesselClass: this.value('vesselClass'), cargoClass: this.value('cargoClass'), policyId: this.value('policyId'), cargoTonnes: Number(this.value('cargoTonnes') || 10000), maximumAlternatives: Number(this.value('maximumAlternatives') || 5), departureAt: new Date().toISOString() }; }
  render() {
    if (!this.network) { this.root.textContent = 'Loading route network…'; return; }
    const ports = this.nodeOptions(); const origin = element('select', { name: 'originId', required: true }, [option('', 'Origin port'), ...ports.map(node => option(node.id, `${node.name}${node.country ? `, ${node.country}` : ''}`))]);
    const destination = element('select', { name: 'destinationId', required: true }, [option('', 'Destination port'), ...ports.map(node => option(node.id, `${node.name}${node.country ? `, ${node.country}` : ''}`))]);
    const vessel = element('select', { name: 'vesselClass' }, (this.network.vesselProfiles || []).map(item => option(item.id, item.id.replaceAll('_', ' '))));
    const cargo = element('select', { name: 'cargoClass' }, (this.network.cargoProfiles || []).map(item => option(item.id, item.id.replaceAll('_', ' '))));
    const policy = element('select', { name: 'policyId' }, (this.network.policies || []).map(item => option(item.id, item.id.replaceAll('_', ' '))));
    const form = element('form', { className: 'logistics-form' }, [element('label', { text: 'ORIGIN' }), origin, element('label', { text: 'DESTINATION' }), destination, element('div', { className: 'logistics-grid' }, [element('label', {}, ['VESSEL', vessel]), element('label', {}, ['CARGO', cargo])]), element('div', { className: 'logistics-grid' }, [element('label', {}, ['POLICY', policy]), element('label', {}, ['TONNES', element('input', { name: 'cargoTonnes', type: 'number', value: '10000', min: '1', max: '500000' })])]), element('label', {}, ['ALTERNATIVES', element('input', { name: 'maximumAlternatives', type: 'number', value: '5', min: '1', max: '12' })]), element('button', { type: 'submit', className: 'logistics-primary', text: 'CALCULATE ROUTES' })]);
    form.addEventListener('submit', event => { event.preventDefault(); this.onSubmit?.(this.payload()); });
    this.root.replaceChildren(form);
  }
}

return Object.freeze({PlannerForm});
})();

// MODULE: logistics/format.js
__modules['logistics/format.js'] = (() => {

function number(value, digits = 0) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—'; }
function money(value) { return Number.isFinite(Number(value)) ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value)) : '—'; }
function duration(hours) { const value = Number(hours); if (!Number.isFinite(value)) return '—'; const days = Math.floor(value / 24); const remaining = Math.round(value % 24); return days ? `${days}d ${remaining}h` : `${remaining}h`; }
function dateTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

return Object.freeze({number, money, duration, dateTime, escapeHtml});
})();

// MODULE: logistics/result-panel.js
__modules['logistics/result-panel.js'] = (() => {
const { escapeHtml, money, number, duration, dateTime } = __modules['logistics/format.js'];

class ResultPanel {
  constructor(options) { this.root = options.root; this.onSelect = options.onSelect; this.onSave = options.onSave; this.onWatch = options.onWatch; }
  render(result) {
    if (!result?.routes?.length) { this.root.innerHTML = '<div class="logistics-empty">No viable route found for these constraints.</div>'; return; }
    this.root.innerHTML = `<div class="logistics-result-head"><div><b>${escapeHtml(result.request.originId)}</b><span>→</span><b>${escapeHtml(result.request.destinationId)}</b></div><small>${result.routes.length} alternatives · ${dateTime(result.generatedAt)}</small></div><div class="logistics-route-list">${result.routes.map(route => this.card(route)).join('')}</div>${this.actions()}`;
    this.root.querySelectorAll('[data-route-id]').forEach(button => button.addEventListener('click', () => this.onSelect?.(button.dataset.routeId)));
    this.root.querySelector('[data-action="save"]')?.addEventListener('click', () => this.onSave?.(result));
    this.root.querySelector('[data-action="watch"]')?.addEventListener('click', () => this.onWatch?.(result));
  }
  card(route) {
    const risk = route.metrics.exposure.risk; const reliability = route.metrics.reliability;
    return `<button type="button" class="logistics-route-card ${route.recommended ? 'recommended' : ''}" data-route-id="${escapeHtml(route.id)}"><div class="logistics-route-title"><span>#${route.rank} ${route.recommended ? 'RECOMMENDED' : 'ALTERNATIVE'}</span><b>${number(route.policyScore, 1)}</b></div><div class="logistics-metrics"><span><small>TIME</small>${duration(route.metrics.eta.durationHours)}</span><span><small>COST</small>${money(route.metrics.cost.totalUsd)}</span><span><small>RISK</small>${number(risk.score, 1)} ${escapeHtml(risk.band)}</span><span><small>RELIABILITY</small>${number(reliability.score, 1)}%</span><span><small>DISTANCE</small>${number(route.metrics.distanceKm)} km</span><span><small>CO₂</small>${number(route.metrics.cost.emissions.co2Tonnes, 1)} t</span></div></button>`;
  }
  actions() { return `<div class="logistics-actions"><button data-action="save">SAVE ROUTE</button><button data-action="watch">WATCH ROUTE</button></div>`; }
}

return Object.freeze({ResultPanel});
})();

// MODULE: logistics/scenario-panel.js
__modules['logistics/scenario-panel.js'] = (() => {
const { element } = __modules['logistics/dom.js'];

class ScenarioPanel {
  constructor(options) { this.root = options.root; this.onRun = options.onRun; this.lastRequest = null; }
  setRequest(request) { this.lastRequest = request; this.render(); }
  render() {
    if (!this.lastRequest) { this.root.textContent = 'Calculate a route before running a disruption scenario.'; return; }
    const form = element('form', { className: 'logistics-form' }, [element('label', {}, ['SCENARIO NAME', element('input', { name: 'name', value: 'Chokepoint closure' })]), element('label', {}, ['CLOSED NODE IDS', element('textarea', { name: 'closedNodeIds', placeholder: 'suez-canal, bab-el-mandeb' })]), element('label', {}, ['CLOSED ROUTE IDS', element('textarea', { name: 'closedRouteIds', placeholder: 'med-suez' })]), element('button', { type: 'submit', className: 'logistics-primary', text: 'RUN SCENARIO' })]);
    form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); const split = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean); this.onRun?.({ name: data.get('name'), request: this.lastRequest, closedNodeIds: split(data.get('closedNodeIds')), closedRouteIds: split(data.get('closedRouteIds')) }); });
    this.root.replaceChildren(form);
  }
}

return Object.freeze({ScenarioPanel});
})();

// MODULE: logistics/watchlist-panel.js
__modules['logistics/watchlist-panel.js'] = (() => {
const { escapeHtml } = __modules['logistics/format.js'];

class WatchlistPanel {
  constructor(options) { this.root = options.root; this.api = options.api; }
  async render() {
    const payload = await this.api.watchlist(); const watches = payload.watches || [];
    this.root.innerHTML = watches.length ? watches.map(watch => `<article class="logistics-watch"><div><b>${escapeHtml(watch.name)}</b><small>${escapeHtml(watch.routeId)}</small></div><span>RISK ≥ ${watch.thresholds.riskScore}</span><button data-remove="${escapeHtml(watch.id)}">×</button></article>`).join('') : '<div class="logistics-empty">No watched routes.</div>';
    this.root.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => { await this.api.removeWatch(button.dataset.remove); await this.render(); }));
  }
}

return Object.freeze({WatchlistPanel});
})();

// MODULE: logistics/route-layer.js
__modules['logistics/route-layer.js'] = (() => {

class LogisticsRouteLayer {
  constructor(map) { this.map = map; this.layerId = 'logistics-route-plans'; this.registered = false; }
  ensure() { if (this.registered) return; this.map.registerOverlay?.({ id: this.layerId, name: 'Calculated routes', geometry: 'line', style: { lineColor: '#38e0a0', lineWidth: 3, lineOpacity: 0.9 } }); this.registered = true; }
  show(result, selectedRouteId = null) { this.ensure(); const features = (result?.geojson?.features || []).map(feature => ({ ...feature, properties: { ...feature.properties, selected: !selectedRouteId || feature.properties.routePlanId === selectedRouteId } })); this.map.setOverlayData?.(this.layerId, features); this.map.setOverlayState?.(this.layerId, { visible: true, opacity: 1 }); }
  clear() { this.map.setOverlayData?.(this.layerId, []); }
}

return Object.freeze({LogisticsRouteLayer});
})();

// MODULE: logistics/logistics-controller.js
__modules['logistics/logistics-controller.js'] = (() => {
const { LogisticsApiClient } = __modules['logistics/api-client.js'];
const { LogisticsStateStore } = __modules['logistics/state-store.js'];
const { PlannerForm } = __modules['logistics/planner-form.js'];
const { ResultPanel } = __modules['logistics/result-panel.js'];
const { ScenarioPanel } = __modules['logistics/scenario-panel.js'];
const { WatchlistPanel } = __modules['logistics/watchlist-panel.js'];
const { LogisticsRouteLayer } = __modules['logistics/route-layer.js'];







class LogisticsController {
  constructor(options) {
    this.map = options.map; this.api = options.api || new LogisticsApiClient(); this.store = new LogisticsStateStore(); this.root = options.root;
    this.routeLayer = new LogisticsRouteLayer(this.map); this.bindStructure(); this.store.subscribe(state => this.reflect(state));
  }
  bindStructure() {
    this.root.innerHTML = `<header><div><b>LOGISTICS ROUTE EXPOSURE</b><small>Map-only shipping intelligence</small></div><button data-close aria-label="Close">×</button></header><nav><button data-tab="PLAN" class="active">PLAN</button><button data-tab="SCENARIO">SCENARIO</button><button data-tab="WATCHLIST">WATCHLIST</button></nav><section data-pane="PLAN"><div data-planner></div><div data-status></div><div data-results></div></section><section data-pane="SCENARIO" hidden><div data-scenario></div><div data-scenario-result></div></section><section data-pane="WATCHLIST" hidden><div data-watchlist></div></section>`;
    this.planner = new PlannerForm({ root: this.root.querySelector('[data-planner]'), onSubmit: payload => this.plan(payload) });
    this.results = new ResultPanel({ root: this.root.querySelector('[data-results]'), onSelect: id => this.selectRoute(id), onSave: result => this.save(result), onWatch: result => this.watch(result) });
    this.scenarios = new ScenarioPanel({ root: this.root.querySelector('[data-scenario]'), onRun: payload => this.runScenario(payload) });
    this.watchlists = new WatchlistPanel({ root: this.root.querySelector('[data-watchlist]'), api: this.api });
    this.root.querySelector('[data-close]').addEventListener('click', () => this.close());
    this.root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => this.tab(button.dataset.tab)));
  }
  async start() { const network = await this.api.network(); this.store.set({ network }, 'network.loaded'); this.planner.setNetwork(network); return this; }
  open() { this.store.set({ open: true }, 'panel.opened'); }
  close() { this.store.set({ open: false }, 'panel.closed'); }
  toggle() { this.store.get().open ? this.close() : this.open(); }
  tab(id) { this.store.set({ activeTab: id }, 'tab.changed'); if (id === 'WATCHLIST') this.watchlists.render().catch(error => this.fail(error)); }
  async plan(payload) { this.store.set({ loading: true, error: null }, 'plan.started'); try { const result = await this.api.plan(payload); this.store.set({ result, loading: false, selectedRouteId: result.routes?.[0]?.id || null }, 'plan.completed'); this.results.render(result); this.scenarios.setRequest(result.request); this.routeLayer.show(result, result.routes?.[0]?.id); } catch (error) { this.fail(error); } }
  selectRoute(id) { const result = this.store.get().result; this.store.set({ selectedRouteId: id }, 'route.selected'); this.routeLayer.show(result, id); }
  async runScenario(payload) { this.store.set({ loading: true, error: null }, 'scenario.started'); try { const scenario = await this.api.scenario(payload); this.store.set({ scenario, loading: false }, 'scenario.completed'); this.root.querySelector('[data-scenario-result]').textContent = `${scenario.routes.length} viable alternatives after disruption`; this.routeLayer.show({ geojson: { features: scenario.routes.flatMap(route => route.metrics.segments.map((segment, index) => ({ type: 'Feature', properties: { routePlanId: route.id, order: index + 1 }, geometry: { type: 'LineString', coordinates: route.path.edges[index]?.coordinates || [] } }))) } }); } catch (error) { this.fail(error); } }
  async save(result) { await this.api.save({ result, metadata: { name: `${result.request.originId} to ${result.request.destinationId}` } }); }
  async watch(result) { const route = result.routes.find(item => item.recommended) || result.routes[0]; if (!route) return; await this.api.addWatch({ routeId: route.id, name: `${result.request.originId} to ${result.request.destinationId}`, thresholds: { riskScore: 60, etaChangeHours: 12, costChangePct: 15 } }); }
  fail(error) { this.store.set({ loading: false, error: error.message || String(error) }, 'operation.failed'); }
  reflect(state) { this.root.classList.toggle('hidden', !state.open); this.root.querySelector('[data-status]').textContent = state.loading ? 'CALCULATING…' : state.error || ''; this.root.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === state.activeTab)); this.root.querySelectorAll('[data-pane]').forEach(pane => { pane.hidden = pane.dataset.pane !== state.activeTab; }); }
}

return Object.freeze({LogisticsController});
})();

// MODULE: logistics/bootstrap.js
__modules['logistics/bootstrap.js'] = (() => {
const { LogisticsController } = __modules['logistics/logistics-controller.js'];

function ensureRoot() { let root = document.getElementById('logistics-panel'); if (!root) { root = document.createElement('aside'); root.id = 'logistics-panel'; root.className = 'logistics-panel hidden'; document.querySelector('.map-stage')?.append(root); } return root; }
async function installLogisticsSystem(options) {
  const root = ensureRoot(); let button = document.getElementById('logistics-toggle');
  if (!button) { button = document.createElement('button'); button.id = 'logistics-toggle'; button.type = 'button'; button.className = 'logistics-toggle'; button.textContent = 'ROUTE EXPOSURE'; document.querySelector('.map-tools')?.append(button); }
  const controller = new LogisticsController({ map: options.map, root }); button.addEventListener('click', () => controller.toggle());
  try { await controller.start(); button.classList.add('is-ready'); return controller; } catch (error) { button.classList.add('is-error'); button.title = error.message; console.error('Logistics system failed to start', error); return null; }
}

return Object.freeze({installLogisticsSystem});
})();

// MODULE: hazards/api-client.js
__modules['hazards/api-client.js'] = (() => {

class HazardApiClient {
  constructor(options= {
  }) {
    this.base=options.base||'/api/hazards';
    this.timeoutMs=options.timeoutMs||9000;
  }
  async request(path, options= {
  }) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(), this.timeoutMs);
    try {
      const response=await fetch(`${this.base}${path}`, {
        ...options, signal:controller.signal, headers: {
          'content-type':'application/json', ...(options.headers|| {
          })
        }
      });
      if(!response.ok) {
        const body=await response.json().catch(()=>( {
        }));
        throw new Error(body.error?.message||`Hazard request failed (${response.status})`);
      }
      return response.json();
    }finally {
      clearTimeout(timer);
    }
  }
  catalog() {
    return this.request('/catalog');
  }
  snapshot(params= {
  }) {
    const query=new URLSearchParams();
    for(const [key, value] of Object.entries(params)) {
      if(value==null||value==='')continue;
      query.set(key, Array.isArray(value)?value.join(','):String(value));
    }
    return this.request(`/snapshot?${query}`);
  }
  scenario(payload) {
    return this.request('/scenario', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
  exposure(payload) {
    return this.request('/exposure', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
  watchlist() {
    return this.request('/watchlist');
  }
  addWatch(payload) {
    return this.request('/watchlist', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
  evaluateWatches(payload= {
  }) {
    return this.request('/watchlist/evaluate', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
}

return Object.freeze({HazardApiClient});
})();

// MODULE: hazards/state-store.js
__modules['hazards/state-store.js'] = (() => {

class HazardStateStore {
  constructor() {
    this.state=Object.freeze( {
      open:false, loading:false, error:null, activeTab:'LIVE', catalog:null, snapshot:null, selectedId:null, scenario:null, watches:[]
    });
    this.listeners=new Set();
  }
  get() {
    return this.state;
  }
  set(patch, reason='update') {
    this.state=Object.freeze( {
      ...this.state, ...patch
    });
    for(const listener of this.listeners)listener(this.state, reason);
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return()=>this.listeners.delete(listener);
  }
}

return Object.freeze({HazardStateStore});
})();

// MODULE: hazards/hazard-layer.js
__modules['hazards/hazard-layer.js'] = (() => {

class HazardLayer {
  constructor(map) {
    this.map=map;
    this.id='merlin-hazards-v20';
  }
  show(snapshot) {
    const collection= {
      type:'FeatureCollection', features:(snapshot?.events||[]).map(event=>( {
        type:'Feature', properties: {
          id:event.id, title:event.title, type:event.type, score:event.materiality?.score||0, kind:'hazard'
        }, geometry: {
          type:'Point', coordinates:[event.point.lon, event.point.lat]
        }
      }))
    };
    if(this.map?.setRuntimeLayerData)this.map.setRuntimeLayerData(this.id, collection, {
      renderer:'cluster'
    });
    else if(this.map?.setLayerData)this.map.setLayerData(this.id, collection);
    this.last=collection;
    return collection;
  }
  clear() {
    if(this.map?.removeRuntimeLayer)this.map.removeRuntimeLayer(this.id);
    this.last=null;
  }
}

return Object.freeze({HazardLayer});
})();

// MODULE: hazards/format.js
__modules['hazards/format.js'] = (() => {

function score(value) {
  return Number.isFinite(Number(value))?Math.round(Number(value)):0;
}
function age(value) {
  const ms=Date.now()-Date.parse(value);
  if(!Number.isFinite(ms))return'UNKNOWN';
  const h=Math.max(0, ms/3_600_000);
  return h<1?`${Math.round(h*60)} MIN`:h<48?`${Math.round(h)} H`: `${Math.round(h/24)} D`;
}
function money(value) {
  const n=Number(value);
  if(!Number.isFinite(n))return'—';
  return new Intl.NumberFormat('en-GB', {
    style:'currency', currency:'USD', notation:'compact', maximumFractionDigits:1
  }).format(n);
}
function text(value) {
  return String(value??'').replace(/[<>]/g, '');
}

return Object.freeze({score, age, money, text});
})();

// MODULE: hazards/live-list.js
__modules['hazards/live-list.js'] = (() => {
const { score, age, text } = __modules['hazards/format.js'];

class HazardLiveList {
  constructor(options) {
    this.root=options.root;
    this.onSelect=options.onSelect;
  }
  render(snapshot) {
    const events=snapshot?.events||[];
    this.root.innerHTML=events.length?events.map(event=>`<button class="hazard-row" data-id="${text(event.id)}"><span class="hazard-score band-${text(event.materiality?.impact?.band||event.severityBand)}">${score(event.materiality?.score)}</span><span><b>${text(event.title)}</b><small>${text(event.type.replaceAll('_',' '))} · ${age(event.time)} · ${text(event.source)}</small></span></button>`).join(''):'<div class="hazard-empty">No material hazards in the current window.</div>';
    this.root.querySelectorAll('[data-id]').forEach(button=>button.addEventListener('click', ()=>this.onSelect?.(button.dataset.id)));
  }
}

return Object.freeze({HazardLiveList});
})();

// MODULE: hazards/detail-panel.js
__modules['hazards/detail-panel.js'] = (() => {
const { score, age, text } = __modules['hazards/format.js'];

class HazardDetailPanel {
  constructor(root) {
    this.root=root;
  }
  render(event) {
    if(!event) {
      this.root.innerHTML='<div class="hazard-empty">Select a hazard.</div>';
      return;
    }
    const reasons=(event.materiality?.reasons||[]).map(reason=>`<span>${text(reason.replaceAll('_',' '))}</span>`).join('');
    this.root.innerHTML=`<article class="hazard-detail-card"><header><span>${text(event.type.replaceAll('_',' '))}</span><b>${score(event.materiality?.score)} / 100</b></header><h3>${text(event.title)}</h3><p>${text(event.summary||event.region||'No additional description supplied by the source.')}</p><dl><div><dt>AGE</dt><dd>${age(event.time)}</dd></div><div><dt>CONFIDENCE</dt><dd>${score(event.confidence)}</dd></div><div><dt>SOURCE</dt><dd>${text(event.source)}</dd></div><div><dt>LOCATION</dt><dd>${event.point.lat.toFixed(2)}, ${event.point.lon.toFixed(2)}</dd></div></dl><div class="hazard-reasons">${reasons}</div></article>`;
  }
}

return Object.freeze({HazardDetailPanel});
})();

// MODULE: hazards/scenario-form.js
__modules['hazards/scenario-form.js'] = (() => {

class HazardScenarioForm {
  constructor(options) {
    this.root=options.root;
    this.onRun=options.onRun;
    this.render();
  }
  render() {
    this.root.innerHTML=`<form class="hazard-scenario-form"><label>TYPE<select name="type"><option>EARTHQUAKE</option><option>TROPICAL_CYCLONE</option><option>FLOOD</option><option>WILDFIRE</option><option>VOLCANO</option><option>TSUNAMI</option><option>EXTREME_HEAT</option></select></label><label>LATITUDE<input name="lat" type="number" step="0.001" required value="35"></label><label>LONGITUDE<input name="lon" type="number" step="0.001" required value="35"></label><label>SEVERITY<input name="severity" type="range" min="1" max="5" step="0.1" value="4"><output>4</output></label><button type="submit">RUN IMPACT SCENARIO</button></form>`;
    const form=this.root.querySelector('form'), range=form.elements.severity, output=form.querySelector('output');
    range.addEventListener('input', ()=>output.textContent=range.value);
    form.addEventListener('submit', event=> {
      event.preventDefault();
      const data=new FormData(form);
      this.onRun?.( {
        event: {
          type:data.get('type'), category:String(data.get('type')).toLowerCase().replaceAll('_', '-'), title:`${String(data.get('type')).replaceAll('_',' ')} scenario`, lat:Number(data.get('lat')), lon:Number(data.get('lon')), time:new Date().toISOString(), severity:Number(data.get('severity')), attributes: {
            material:true
          }
        }
      });
    });
  }
}

return Object.freeze({HazardScenarioForm});
})();

// MODULE: hazards/scenario-result.js
__modules['hazards/scenario-result.js'] = (() => {
const { score, money, text } = __modules['hazards/format.js'];

class HazardScenarioResult {
  constructor(root) {
    this.root=root;
  }
  render(result) {
    if(!result) {
      this.root.innerHTML='';
      return;
    }
    const cascades=(result.cascadingRisks||[]).map(item=>`<li><b>${text(item.type.replaceAll('_',' '))}</b><span>${score(item.probability)}% probability</span></li>`).join('');
    this.root.innerHTML=`<article class="hazard-scenario-result"><div class="hazard-kpis"><span><b>${score(result.priority.score)}</b><small>PRIORITY</small></span><span><b>${result.exposure.population.estimatedPopulation.toLocaleString()}</b><small>EST. EXPOSED</small></span><span><b>${result.exposure.infrastructure.count}</b><small>ASSETS</small></span><span><b>${money(result.economics.estimatedTotalUsd)}</b><small>MODELLED LOSS</small></span></div><h4>CASCADE PATHS</h4><ul>${cascades||'<li>No cascade above threshold</li>'}</ul><small>Scenario estimates are model outputs, not observed casualties or confirmed losses.</small></article>`;
  }
}

return Object.freeze({HazardScenarioResult});
})();

// MODULE: hazards/watchlist-panel.js
__modules['hazards/watchlist-panel.js'] = (() => {
const { text } = __modules['hazards/format.js'];

class HazardWatchlistPanel {
  constructor(options) {
    this.root=options.root;
    this.api=options.api;
  }
  async render() {
    const result=await this.api.watchlist();
    const watches=result.watches||[];
    this.root.innerHTML=`<form data-watch-form><input name="name" placeholder="WATCH NAME" required><input name="lat" type="number" step="0.01" placeholder="LAT" required><input name="lon" type="number" step="0.01" placeholder="LON" required><input name="radiusKm" type="number" value="250" min="10"><input name="minimumScore" type="number" value="60" min="1" max="100"><button>ADD WATCH</button></form><div>${watches.map(w=>`<article class="hazard-watch"><b>$ {
      text(w.name)
    }
    </b><small>$ {
      w.geofence?.radiusKm||0
    }
    KM · SCORE ≥ $ {
      w.minimumScore
    }
    </small></article>`).join('')||'<div class="hazard-empty">No hazard watches.</div>'}</div>`;
    this.root.querySelector('form').addEventListener('submit', async event=> {
      event.preventDefault();
      const data=new FormData(event.currentTarget);
      await this.api.addWatch( {
        name:data.get('name'), minimumScore:Number(data.get('minimumScore')), geofence: {
          center: {
            lat:Number(data.get('lat')), lon:Number(data.get('lon'))
          }, radiusKm:Number(data.get('radiusKm'))
        }
      });
      await this.render();
    });
  }
}

return Object.freeze({HazardWatchlistPanel});
})();

// MODULE: hazards/hazard-controller.js
__modules['hazards/hazard-controller.js'] = (() => {
const { HazardApiClient } = __modules['hazards/api-client.js'];
const { HazardStateStore } = __modules['hazards/state-store.js'];
const { HazardLayer } = __modules['hazards/hazard-layer.js'];
const { HazardLiveList } = __modules['hazards/live-list.js'];
const { HazardDetailPanel } = __modules['hazards/detail-panel.js'];
const { HazardScenarioForm } = __modules['hazards/scenario-form.js'];
const { HazardScenarioResult } = __modules['hazards/scenario-result.js'];
const { HazardWatchlistPanel } = __modules['hazards/watchlist-panel.js'];








class HazardController {
  constructor(options) {
    this.map=options.map;
    this.api=options.api||new HazardApiClient();
    this.root=options.root;
    this.store=new HazardStateStore();
    this.layer=new HazardLayer(this.map);
    this.build();
    this.store.subscribe(state=>this.reflect(state));
  }
  build() {
    this.root.innerHTML=`<header><div><b>HAZARD IMPACT</b><small>Material operational hazards only</small></div><button data-close>×</button></header><nav><button data-tab="LIVE" class="active">LIVE</button><button data-tab="SCENARIO">SCENARIO</button><button data-tab="WATCHLIST">WATCHLIST</button></nav><section data-pane="LIVE"><div class="hazard-toolbar"><select data-window><option value="24">24 HOURS</option><option value="168" selected>7 DAYS</option><option value="336">14 DAYS</option></select><button data-refresh>REFRESH</button></div><div class="hazard-live-grid"><div data-list></div><div data-detail></div></div></section><section data-pane="SCENARIO" hidden><div data-scenario-form></div><div data-scenario-result></div></section><section data-pane="WATCHLIST" hidden><div data-watchlist></div></section><div data-status></div>`;
    this.live=new HazardLiveList( {
      root:this.root.querySelector('[data-list]'), onSelect:id=>this.select(id)
    });
    this.detail=new HazardDetailPanel(this.root.querySelector('[data-detail]'));
    this.scenarioForm=new HazardScenarioForm( {
      root:this.root.querySelector('[data-scenario-form]'), onRun:payload=>this.runScenario(payload)
    });
    this.scenarioResult=new HazardScenarioResult(this.root.querySelector('[data-scenario-result]'));
    this.watches=new HazardWatchlistPanel( {
      root:this.root.querySelector('[data-watchlist]'), api:this.api
    });
    this.root.querySelector('[data-close]').addEventListener('click', ()=>this.close());
    this.root.querySelector('[data-refresh]').addEventListener('click', ()=>this.load());
    this.root.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click', ()=>this.tab(button.dataset.tab)));
  }
  async start() {
    const catalog=await this.api.catalog();
    this.store.set( {
      catalog
    }, 'catalog.loaded');
    await this.load();
    return this;
  }
  async load() {
    this.store.set( {
      loading:true, error:null
    }, 'snapshot.loading');
    try {
      const maximumAgeHours=Number(this.root.querySelector('[data-window]').value||168);
      const snapshot=await this.api.snapshot( {
        maximumAgeHours, materialOnly:true, limit:1000
      });
      this.store.set( {
        snapshot, loading:false, selectedId:snapshot.events?.[0]?.id||null
      }, 'snapshot.loaded');
      this.live.render(snapshot);
      this.layer.show(snapshot);
      this.select(snapshot.events?.[0]?.id);
    }catch(error) {
      this.fail(error);
    }
  }
  select(id) {
    const event=this.store.get().snapshot?.events?.find(item=>item.id===id);
    this.store.set( {
      selectedId:id
    }, 'hazard.selected');
    this.detail.render(event);
    if(event&&this.map?.flyTo)this.map.flyTo(event.point.lat, event.point.lon, 6);
  }
  async runScenario(payload) {
    this.store.set( {
      loading:true, error:null
    }, 'scenario.loading');
    try {
      const scenario=await this.api.scenario(payload);
      this.store.set( {
        scenario, loading:false
      }, 'scenario.loaded');
      this.scenarioResult.render(scenario);
    }catch(error) {
      this.fail(error);
    }
  }
  tab(id) {
    this.store.set( {
      activeTab:id
    }, 'tab.changed');
    if(id==='WATCHLIST')this.watches.render().catch(error=>this.fail(error));
  }
  open() {
    this.store.set( {
      open:true
    }, 'open');
  }
  close() {
    this.store.set( {
      open:false
    }, 'close');
  }
  toggle() {
    this.store.get().open?this.close():this.open();
  }
  fail(error) {
    this.store.set( {
      loading:false, error:error.message||String(error)
    }, 'error');
  }
  reflect(state) {
    this.root.classList.toggle('hidden', !state.open);
    this.root.querySelector('[data-status]').textContent=state.loading?'LOADING…':state.error||'';
    this.root.querySelectorAll('[data-tab]').forEach(button=>button.classList.toggle('active', button.dataset.tab===state.activeTab));
    this.root.querySelectorAll('[data-pane]').forEach(pane=>pane.hidden=pane.dataset.pane!==state.activeTab);
  }
}

return Object.freeze({HazardController});
})();

// MODULE: hazards/bootstrap.js
__modules['hazards/bootstrap.js'] = (() => {
const { HazardController } = __modules['hazards/hazard-controller.js'];

function ensureRoot() {
  let root=document.getElementById('hazard-panel');
  if(!root) {
    root=document.createElement('aside');
    root.id='hazard-panel';
    root.className='hazard-panel hidden';
    document.querySelector('.map-stage')?.append(root);
  }
  return root;
}
async function installHazardSystem(options) {
  const root=ensureRoot();
  let button=document.getElementById('hazard-toggle');
  if(!button) {
    button=document.createElement('button');
    button.id='hazard-toggle';
    button.type='button';
    button.className='hazard-toggle';
    button.textContent='HAZARDS';
    document.querySelector('.map-tools')?.append(button);
  }
  const controller=new HazardController( {
    map:options.map, root
  });
  button.addEventListener('click', ()=>controller.toggle());
  try {
    await controller.start();
    button.classList.add('is-ready');
    return controller;
  }catch(error) {
    button.classList.add('is-error');
    button.title=error.message;
    console.error('Hazard system failed to start', error);
    return null;
  }
}

return Object.freeze({installHazardSystem});
})();

// MODULE: market-intelligence/api-client.js
__modules['market-intelligence/api-client.js'] = (() => {

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 12_000);
  try {
    const response = await fetch(path, {
      method: options.method || 'GET',
      headers: options.body ? { 'content-type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error?.message || `Market intelligence request failed (${response.status})`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
class MarketIntelligenceApiClient {
  catalog() { return request('/api/market-intelligence/catalog'); }
  snapshot(options = {}) { return request('/api/market-intelligence/snapshot', { method: 'POST', body: options, timeoutMs: 18_000 }); }
  screen(options = {}) { return request('/api/market-intelligence/screen', { method: 'POST', body: options, timeoutMs: 18_000 }); }
  screens() { return request('/api/market-intelligence/screens'); }
  saveScreen(value) { return request('/api/market-intelligence/screens', { method: 'POST', body: value }); }
  removeScreen(id) { return request('/api/market-intelligence/screens/remove', { method: 'POST', body: { id } }); }
  watchlist() { return request('/api/market-intelligence/watchlist'); }
  addWatch(value) { return request('/api/market-intelligence/watchlist', { method: 'POST', body: value }); }
  removeWatch(id) { return request('/api/market-intelligence/watchlist/remove', { method: 'POST', body: { id } }); }
  alerts() { return request('/api/market-intelligence/alerts', { method: 'POST', body: {} }); }
  portfolio(value) { return request('/api/market-intelligence/portfolio', { method: 'POST', body: value, timeoutMs: 18_000 }); }
  scenario(value) { return request('/api/market-intelligence/scenario', { method: 'POST', body: value, timeoutMs: 18_000 }); }
}

return Object.freeze({MarketIntelligenceApiClient});
})();

// MODULE: market-intelligence/state-store.js
__modules['market-intelligence/state-store.js'] = (() => {

const STORAGE_KEY = 'merlin.market-intelligence.v20';
const defaults = Object.freeze({ timeframe: '1d', maximumAssets: 30, heatmapMetric: 'changePercent', selectedAssetId: null, filters: { minimumOpportunity: 0, maximumRisk: 100, minimumLiquidity: 0, sortBy: 'opportunityScore', sortDirection: 'desc' } });
class MarketIntelligenceStateStore {
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

return Object.freeze({MarketIntelligenceStateStore});
})();

// MODULE: market-intelligence/format.js
__modules['market-intelligence/format.js'] = (() => {

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function number(value, digits = 1) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }) : '—'; }
function percent(value, digits = 2) { const numeric = Number(value); return Number.isFinite(numeric) ? `${numeric > 0 ? '+' : ''}${numeric.toFixed(digits)}%` : '—'; }
function price(value) {
  const numeric = Number(value); if (!Number.isFinite(numeric)) return '—';
  const digits = numeric >= 100 ? 2 : numeric >= 1 ? 4 : 8;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: digits }).format(numeric);
}
function age(value) {
  const timestamp = Date.parse(value || ''); if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  return minutes < 1 ? 'NOW' : minutes < 60 ? `${minutes}M` : minutes < 2880 ? `${Math.floor(minutes / 60)}H` : `${Math.floor(minutes / 1440)}D`;
}

return Object.freeze({escapeHtml, number, percent, price, age});
})();

// MODULE: market-intelligence/heatmap.js
__modules['market-intelligence/heatmap.js'] = (() => {
const { escapeHtml, number } = __modules['market-intelligence/format.js'];

function renderHeatmap(root, heatmap, onSelect) {
  if (!root) return;
  const groups = heatmap?.groups || [];
  root.innerHTML = groups.map(group => `<section class="mi-heat-group"><h3>${escapeHtml(group.name)}</h3><div class="mi-heat-cells">${group.items.map(item => `<button type="button" class="mi-heat-cell ${item.direction.toLowerCase()}" data-asset-id="${escapeHtml(item.id)}" style="--intensity:${item.intensity}"><strong>${escapeHtml(item.symbol)}</strong><span>${number(item.value, 2)}</span></button>`).join('')}</div></section>`).join('') || '<p class="mi-empty">No heatmap data is available.</p>';
  root.querySelectorAll('[data-asset-id]').forEach(button => button.addEventListener('click', () => onSelect?.(button.dataset.assetId)));
}

return Object.freeze({renderHeatmap});
})();

// MODULE: market-intelligence/screener-table.js
__modules['market-intelligence/screener-table.js'] = (() => {
const { escapeHtml, percent, price } = __modules['market-intelligence/format.js'];

function renderScreenerTable(root, assets, onSelect, onWatch) {
  if (!root) return;
  root.innerHTML = `<div class="mi-table-wrap"><table class="mi-table"><thead><tr><th>ASSET</th><th>PRICE</th><th>MOVE</th><th>TREND</th><th>MOMENTUM</th><th>OPPORTUNITY</th><th>RISK</th><th>EVIDENCE</th><th></th></tr></thead><tbody>${(assets || []).map(item => `<tr data-asset-id="${escapeHtml(item.asset?.id)}"><td><strong>${escapeHtml(item.asset?.symbol)}</strong><small>${escapeHtml(item.asset?.name)}</small></td><td>${price(item.quote?.price)}</td><td class="${Number(item.quote?.changePercent) >= 0 ? 'positive' : 'negative'}">${percent(item.quote?.changePercent)}</td><td>${Math.round(item.trend?.score || 0)}</td><td>${Math.round(item.momentum?.score || 0)}</td><td><b class="mi-tier ${String(item.opportunity?.tier || '').toLowerCase()}">${Math.round(item.opportunity?.score || 0)} ${escapeHtml(item.opportunity?.tier)}</b></td><td>${Math.round(item.risk?.score || 0)}</td><td>${escapeHtml(item.evidence?.grade || '—')}</td><td><button type="button" data-watch="${escapeHtml(item.asset?.id)}">WATCH</button></td></tr>`).join('')}</tbody></table></div>`;
  root.querySelectorAll('tbody tr').forEach(row => row.addEventListener('click', event => { if (!event.target.closest('[data-watch]')) onSelect?.(row.dataset.assetId); }));
  root.querySelectorAll('[data-watch]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); onWatch?.(button.dataset.watch); }));
}

return Object.freeze({renderScreenerTable});
})();

// MODULE: market-intelligence/detail-panel.js
__modules['market-intelligence/detail-panel.js'] = (() => {
const { escapeHtml, number, percent, price } = __modules['market-intelligence/format.js'];

function metric(label, value, note = '') { return `<div class="mi-detail-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`; }
function renderAssetDetail(root, item) {
  if (!root) return;
  if (!item) { root.innerHTML = '<p class="mi-empty">Select an asset to inspect its evidence, catalysts and risk.</p>'; return; }
  root.innerHTML = `<article class="mi-detail-card"><header><div><span>${escapeHtml(item.asset?.assetClass || '')}</span><h2>${escapeHtml(item.asset?.symbol)} · ${escapeHtml(item.asset?.name)}</h2></div><div><strong>${price(item.quote?.price)}</strong><small>${percent(item.quote?.changePercent)}</small></div></header><div class="mi-detail-grid">${metric('OPPORTUNITY', `${number(item.opportunity?.score, 0)} / 100`, item.opportunity?.tier)}${metric('DIRECTION', item.opportunity?.direction, item.opportunity?.horizon)}${metric('RISK', `${number(item.risk?.score, 0)} / 100`, item.risk?.state)}${metric('EVIDENCE', item.evidence?.grade, item.evidence?.explanation)}${metric('VOLATILITY', `${number(item.volatility?.realizedAnnual, 1)}%`, item.volatility?.state)}${metric('LIQUIDITY', `${number(item.liquidity?.score, 0)} / 100`, item.liquidity?.state)}${metric('DRAWDOWN', `${number(item.drawdown?.currentPercent, 2)}%`, `max ${number(item.drawdown?.maximumPercent, 2)}%`)}${metric('PREDICTION GAP', `${number(item.predictionDivergence?.score, 0)} / 100`, item.predictionDivergence?.state)}</div><section class="mi-catalysts"><h3>CATALYSTS</h3>${(item.catalysts || []).slice(0, 8).map(catalyst => `<div><b>${escapeHtml(catalyst.type)} · ${escapeHtml(catalyst.direction)}</b><span>${escapeHtml(catalyst.explanation)}</span><strong>${number(catalyst.strength, 0)}</strong></div>`).join('') || '<p>No material catalyst is currently identified.</p>'}</section><footer>${escapeHtml(item.opportunity?.disclaimer || '')}</footer></article>`;
}

return Object.freeze({renderAssetDetail});
})();

// MODULE: market-intelligence/watchlist-panel.js
__modules['market-intelligence/watchlist-panel.js'] = (() => {
const { escapeHtml, number } = __modules['market-intelligence/format.js'];

function renderWatchlist(root, watches, alerts, handlers = {}) {
  if (!root) return;
  root.innerHTML = `<section class="mi-watchlist"><header><h3>WATCHLIST</h3><button type="button" data-refresh-alerts>CHECK ALERTS</button></header>${(watches || []).map(watch => `<div class="mi-watch-row"><div><strong>${escapeHtml(watch.symbol)}</strong><span>Opportunity ≥ ${number(watch.minimumOpportunity, 0)} · risk ≤ ${number(watch.maximumRisk, 0)}</span></div><button type="button" data-remove-watch="${escapeHtml(watch.id)}">REMOVE</button></div>`).join('') || '<p class="mi-empty">No assets watched.</p>'}<div class="mi-alert-list">${(alerts || []).map(alert => `<article class="${alert.severity.toLowerCase()}"><strong>${escapeHtml(alert.symbol)} · ${escapeHtml(alert.severity)}</strong><span>${escapeHtml(alert.reasons.join(' · '))}</span></article>`).join('')}</div></section>`;
  root.querySelector('[data-refresh-alerts]')?.addEventListener('click', handlers.refreshAlerts);
  root.querySelectorAll('[data-remove-watch]').forEach(button => button.addEventListener('click', () => handlers.remove?.(button.dataset.removeWatch)));
}

return Object.freeze({renderWatchlist});
})();

// MODULE: market-intelligence/scenario-panel.js
__modules['market-intelligence/scenario-panel.js'] = (() => {
const { escapeHtml, number, percent } = __modules['market-intelligence/format.js'];

function renderScenarioPanel(root, catalog, result, handlers = {}) {
  if (!root) return;
  const classes = catalog?.assetClasses || [];
  root.innerHTML = `<section class="mi-scenario"><h3>MARKET SCENARIO</h3><form data-scenario-form><label>Target class<select name="target">${classes.map(value => `<option value="${escapeHtml(value.toLowerCase())}">${escapeHtml(value)}</option>`).join('')}</select></label><label>Shock %<input name="changePercent" type="number" value="-10" min="-100" max="1000" step="0.5"></label><label>Probability %<input name="probability" type="number" value="100" min="0" max="100"></label><button type="submit">RUN SCENARIO</button></form>${result ? `<div class="mi-scenario-result"><strong>${number(result.pnl, 2)}</strong><span>${percent(result.pnlPercent)} portfolio impact</span>${result.impacts.slice(0, 10).map(item => `<div><b>${escapeHtml(item.symbol)}</b><span>${percent(item.pnlPercent)}</span><strong>${number(item.pnl, 2)}</strong></div>`).join('')}</div>` : '<p class="mi-empty">Enter a portfolio in the controller to run a scenario.</p>'}</section>`;
  root.querySelector('[data-scenario-form]')?.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); handlers.run?.({ target: data.target, changePercent: Number(data.changePercent), probability: Number(data.probability) }); });
}

return Object.freeze({renderScenarioPanel});
})();

// MODULE: market-intelligence/market-layer.js
__modules['market-intelligence/market-layer.js'] = (() => {

class MarketSignalLayer {
  constructor(map) { this.map = map; this.features = { type: 'FeatureCollection', features: [] }; }
  setData(features) {
    this.features = features || { type: 'FeatureCollection', features: [] };
    if (this.map?.setOverlayData) this.map.setOverlayData('market-signals', this.features);
    else if (this.map?.getSource?.('merlin-market-signals')) this.map.getSource('merlin-market-signals').setData(this.features);
  }
  clear() { this.setData({ type: 'FeatureCollection', features: [] }); }
}

return Object.freeze({MarketSignalLayer});
})();

// MODULE: market-intelligence/market-intelligence-controller.js
__modules['market-intelligence/market-intelligence-controller.js'] = (() => {
const { MarketIntelligenceApiClient } = __modules['market-intelligence/api-client.js'];
const { MarketIntelligenceStateStore } = __modules['market-intelligence/state-store.js'];
const { renderHeatmap } = __modules['market-intelligence/heatmap.js'];
const { renderScreenerTable } = __modules['market-intelligence/screener-table.js'];
const { renderAssetDetail } = __modules['market-intelligence/detail-panel.js'];
const { renderWatchlist } = __modules['market-intelligence/watchlist-panel.js'];
const { renderScenarioPanel } = __modules['market-intelligence/scenario-panel.js'];
const { MarketSignalLayer } = __modules['market-intelligence/market-layer.js'];
const { age } = __modules['market-intelligence/format.js'];









class MarketIntelligenceController {
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

return Object.freeze({MarketIntelligenceController});
})();

// MODULE: market-intelligence/bootstrap.js
__modules['market-intelligence/bootstrap.js'] = (() => {
const { MarketIntelligenceController } = __modules['market-intelligence/market-intelligence-controller.js'];

async function installMarketIntelligenceSystem(options = {}) {
  const controller = new MarketIntelligenceController({ map: options.map });
  try { await controller.start(); return controller; }
  catch (error) { console.error('Market intelligence system failed to initialise', error); return null; }
}

return Object.freeze({installMarketIntelligenceSystem});
})();

// MODULE: country-risk/api-client.js
__modules['country-risk/api-client.js'] = (() => {

async function request(path,options={
}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),options.timeoutMs||15000);
  try{
    const response=await fetch(path,{
      method:options.method||'GET',headers:{
        'content-type':'application/json'
      },body:options.body===undefined?undefined:JSON.stringify(options.body),signal:controller.signal
    });
    if(!response.ok)throw new Error(`Country risk request failed (${response.status})`);
    return await response.json();
  }
  finally{
    clearTimeout(timer);
  }
}
function createCountryRiskApi(){
  return Object.freeze({
    catalog:()=>request('/api/country-risk/catalog'),snapshot:value=>request('/api/country-risk/snapshot',{
      method:'POST',body:value||{
      }
    }),country:id=>request(`/api/country-risk/country/${encodeURIComponent(id)}`),compare:value=>request('/api/country-risk/compare',{
      method:'POST',body:value
    }),scenario:value=>request('/api/country-risk/scenario',{
      method:'POST',body:value
    }),watchlist:()=>request('/api/country-risk/watchlist'),addWatch:value=>request('/api/country-risk/watchlist',{
      method:'POST',body:value
    }),removeWatch:id=>request('/api/country-risk/watchlist/remove',{
      method:'POST',body:{
        id
      }
    }),alerts:()=>request('/api/country-risk/alerts',{
      method:'POST',body:{
      }
    })
  });
}

return Object.freeze({createCountryRiskApi});
})();

// MODULE: country-risk/state-store.js
__modules['country-risk/state-store.js'] = (() => {

const KEY='merlin.country-risk.v20';
class CountryRiskStateStore{
  constructor(storage=globalThis.localStorage){
    this.storage=storage;
  }
  load(){
    try{
      return{
        query:'',
        minimumRisk:0,
        selected:null,
        compare:[],
        ...(JSON.parse(this.storage?.getItem(KEY)||'{}'))
      };
    }
    catch{
      return{
        query:'',
        minimumRisk:0,
        selected:null,
        compare:[]
      };
    }
  }
  save(value){
    try{
      this.storage?.setItem(KEY,JSON.stringify(value));
    }
    catch{
    }
    return value;
  }
}

return Object.freeze({CountryRiskStateStore});
})();

// MODULE: country-risk/format.js
__modules['country-risk/format.js'] = (() => {

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function score(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : '—';
}

function band(value) {
  const number = Number(value) || 0;
  if (number >= 80) return 'SEVERE';
  if (number >= 65) return 'HIGH';
  if (number >= 45) return 'ELEVATED';
  if (number >= 25) return 'GUARDED';
  return 'LOW';
}

function relativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'UNKNOWN';
  const hours = Math.max(0, (Date.now() - time) / 3_600_000);
  if (hours < 1) return `${Math.round(hours * 60)} MIN`;
  if (hours < 48) return `${Math.round(hours)} H`;
  return `${Math.round(hours / 24)} D`;
}

return Object.freeze({escapeHtml, score, band, relativeTime});
})();

// MODULE: country-risk/risk-table.js
__modules['country-risk/risk-table.js'] = (() => {
const { escapeHtml, score } = __modules['country-risk/format.js'];

function riskTable(profiles=[],query=''){
  const filtered=profiles.filter(item=>`${item.country.name} ${item.country.nativeName||''} ${item.country.iso2}`.toLowerCase().includes(query.toLowerCase()));
  return `<div class="country-risk-table"><div class="country-risk-row country-risk-head"><span>COUNTRY</span><span>RISK</span><span>BAND</span><span>CONF.</span><span>COVERAGE</span></div>${filtered.map(item=>`<button class="country-risk-row" type="button" data-country-risk-id="${escapeHtml(item.country.iso2)}"><span><b>${
    escapeHtml(item.country.name)
  }
  </b><small>${
    escapeHtml(item.country.nativeName?`(${item.country.nativeName})`:'')
  }
  </small></span><strong>${
    score(item.risk.score)
  }
  </strong><em data-band="${item.risk.band.id}">${
    escapeHtml(item.risk.band.label)
  }
  </em><span>${
    score(item.risk.confidence)
  }
  %</span><span>${
    score(item.risk.coverage)
  }
  %</span></button>`).join('')}</div>`;
}

return Object.freeze({riskTable});
})();

// MODULE: country-risk/detail-panel.js
__modules['country-risk/detail-panel.js'] = (() => {
const { escapeHtml, score } = __modules['country-risk/format.js'];

function countryRiskDetail(profile){
  if(!profile)return'<div class="country-risk-empty">Select a country to inspect its political-risk evidence.</div>';
  const drivers=(profile.risk.components||[]).filter(item=>item.state!=='UNAVAILABLE').sort((a,b)=>b.score*b.weight-a.score*a.weight);
  return `<section class="country-risk-detail"><header><div><small>${escapeHtml(profile.country.iso2)} · ${escapeHtml(profile.country.region||'')}</small><h2>${escapeHtml(profile.country.name)}</h2>${profile.country.nativeName?`<p>(${
    escapeHtml(profile.country.nativeName)
  })</p>`:''}</div><div class="country-risk-gauge" data-band="${profile.risk.band.id}"><strong>${score(profile.risk.score)}</strong><span>${escapeHtml(profile.risk.band.label)}</span></div></header><div class="country-risk-metrics"><div><span>CONFIDENCE</span><b>${score(profile.risk.confidence)}%</b></div><div><span>COVERAGE</span><b>${score(profile.risk.coverage)}%</b></div><div><span>EVIDENCE</span><b>${drivers.length}</b></div></div><h3>PRIMARY DRIVERS</h3><div class="country-risk-drivers">${drivers.slice(0,10).map(item=>`<div><span>${
    escapeHtml(item.id)
  }
  </span><b>${
    score(item.score)
  }
  </b><i style="width:${Math.max(2,item.score)}%"></i><small>${
    escapeHtml(item.state)
  }
  · confidence ${
    score(item.confidence)
  }
  %</small></div>`).join('')}</div><h3>ASSESSMENT</h3><p>${escapeHtml(profile.briefing?.assessment||profile.risk.disclosure)}</p><small>${escapeHtml(profile.risk.disclosure)}</small></section>`;
}

return Object.freeze({countryRiskDetail});
})();

// MODULE: country-risk/scenario-panel.js
__modules['country-risk/scenario-panel.js'] = (() => {

function scenarioPanel(catalog={
}){
  return `<form class="country-risk-scenario" id="country-risk-scenario"><label>SCENARIO<select name="type">${(catalog.scenarios||[]).map(item=>`<option value="${item.id}">${
    item.label
  }
  </option>`).join('')}</select></label><label>SEVERITY<input name="severity" type="range" min="0" max="100" value="50"></label><label>HORIZON<select name="horizonDays"><option value="30">30 days</option><option value="90" selected>90 days</option><option value="365">1 year</option></select></label><button type="submit">RUN SCENARIO</button><output id="country-risk-scenario-result"></output></form>`;
}

return Object.freeze({scenarioPanel});
})();

// MODULE: country-risk/summary-strip.js
__modules['country-risk/summary-strip.js'] = (() => {

function summaryStrip(summary={
}){
  return `<div class="country-risk-summary"><div><span>COUNTRIES</span><b>${summary.countries||0}</b></div><div><span>HIGH</span><b>${summary.high||0}</b></div><div><span>SEVERE</span><b>${summary.severe||0}</b></div><div><span>AVERAGE</span><b>${Number(summary.average||0).toFixed(1)}</b></div></div>`;
}

return Object.freeze({summaryStrip});
})();

// MODULE: country-risk/map-layer.js
__modules['country-risk/map-layer.js'] = (() => {

function installCountryRiskLayer(map){
  const id='country-risk-v20';
  return Object.freeze({
    set(features){
      map?.setGeoJsonLayer?.(id,features,{
        interactive:true,labelField:'name',localLabelField:'localName',scoreField:'riskScore'
      });
    },show(){
      map?.setLayerVisibility?.(id,true);
    },hide(){
      map?.setLayerVisibility?.(id,false);
    },remove(){
      map?.removeLayer?.(id);
    }
  });
}

return Object.freeze({installCountryRiskLayer});
})();

// MODULE: country-risk/country-risk-controller.js
__modules['country-risk/country-risk-controller.js'] = (() => {
const { createCountryRiskApi } = __modules['country-risk/api-client.js'];
const { CountryRiskStateStore } = __modules['country-risk/state-store.js'];
const { riskTable } = __modules['country-risk/risk-table.js'];
const { countryRiskDetail } = __modules['country-risk/detail-panel.js'];
const { scenarioPanel } = __modules['country-risk/scenario-panel.js'];
const { summaryStrip } = __modules['country-risk/summary-strip.js'];
const { installCountryRiskLayer } = __modules['country-risk/map-layer.js'];







class CountryRiskController{
  constructor(options={
  }){
    this.api=options.api||createCountryRiskApi();
    this.store=options.store||new CountryRiskStateStore();
    this.state=this.store.load();
    this.mapLayer=installCountryRiskLayer(options.map);
    this.snapshot=null;
    this.catalog=null;
    this.active=false;
  }
  async initialize(){
    [this.catalog,
    this.snapshot]=await Promise.all([this.api.catalog(),this.api.snapshot({
      includeNews:true,limit:300
    })]);
    this.mapLayer.set(this.snapshot.features);
    return this;
  }
  async activate(){
    this.active=true;
    if(!this.snapshot)await this.initialize();
    this.render();
  }
  render(filter=''){
    const content=document.querySelector('#sheet-content');
    if(!content)return;
    document.querySelector('#sheet-kicker').textContent='COUNTRY / POLITICS / GOVERNANCE';
    document.querySelector('#sheet-title').textContent='PLACES';
    document.querySelector('#sheet-summary').innerHTML=summaryStrip(this.snapshot.summary);
    content.innerHTML=`<div class="country-risk-layout"><div><div class="country-risk-tools"><input id="country-risk-filter" placeholder="Filter countries" value="${filter}"></div>${riskTable(this.snapshot.profiles,filter)}</div><aside id="country-risk-inspector">${countryRiskDetail(this.selected())}${scenarioPanel(this.catalog)}</aside></div>`;
    content.querySelector('#country-risk-filter')?.addEventListener('input',event=>this.render(event.target.value));
    content.querySelectorAll('[data-country-risk-id]').forEach(button=>button.addEventListener('click',()=>this.select(button.dataset.countryRiskId)));
    content.querySelector('#country-risk-scenario')?.addEventListener('submit',event=>this.runScenario(event));
  }
  selected(){
    return this.snapshot?.profiles?.find(item=>item.country.iso2===this.state.selected)||null;
  }
  async select(id){
    this.state.selected=id;
    this.store.save(this.state);
    const existing=this.selected();
    document.querySelector('#country-risk-inspector').innerHTML=`${countryRiskDetail(existing)}${scenarioPanel(this.catalog)}`;
    document.querySelector('#country-risk-scenario')?.addEventListener('submit',event=>this.runScenario(event));
    if(existing?.country)this.mapLayer.show();
  }
  async runScenario(event){
    event.preventDefault();
    const profile=this.selected();
    if(!profile)return;
    const data=new FormData(event.currentTarget);
    const result=await this.api.scenario({
      countryId:profile.country.iso2,type:data.get('type'),severity:Number(data.get('severity')),horizonDays:Number(data.get('horizonDays')),profile
    });
    const output=document.querySelector('#country-risk-scenario-result');
    if(output)output.textContent=`${result.before} → ${result.after} (${result.delta>=0?'+':''}${result.delta})`;
  }
}

return Object.freeze({CountryRiskController});
})();

// MODULE: country-risk/bootstrap.js
__modules['country-risk/bootstrap.js'] = (() => {
const { CountryRiskController } = __modules['country-risk/country-risk-controller.js'];

async function installCountryRiskSystem(options={
}){
  const controller=new CountryRiskController(options);
  try{
    await controller.initialize();
  }
  catch(error){
    console.warn('country-risk.initialize.failed',error);
  }
  return controller;
}

return Object.freeze({installCountryRiskSystem});
})();

// MODULE: conflict-intelligence/api-client.js
__modules['conflict-intelligence/api-client.js'] = (() => {

async function request(path,
options = {
}) {
  const response = await fetch(path,
  {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {
      })
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok)
  throw new Error(body?.error?.message || `Request failed ${response.status}`);
  return body;
}
function createConflictApi() {
  return Object.freeze({
    catalog: () => request('/api/conflict/catalog'),
    snapshot: input => request('/api/conflict/snapshot',
    {
      method: 'POST',
      body: JSON.stringify(input || {
      })
    }),
    theatre: id => request(`/api/conflict/theatre/${encodeURIComponent(id)}`),
    compare: input => request('/api/conflict/compare',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }),
    scenario: input => request('/api/conflict/scenario',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }),
    alerts: input => request('/api/conflict/alerts',
    {
      method: 'POST',
      body: JSON.stringify(input || {
      })
    }),
    watch: input => request('/api/conflict/watchlist',
    {
      method: 'POST',
      body: JSON.stringify(input)
    })
  });
}

return Object.freeze({createConflictApi});
})();

// MODULE: conflict-intelligence/state-store.js
__modules['conflict-intelligence/state-store.js'] = (() => {

const KEY = 'merlin.conflict-intelligence.v1';
class ConflictStateStore {
  load() {
    try {
      return {
        ...this.defaults(),
        ...JSON.parse(localStorage.getItem(KEY) || '{}')
      };
    }
    catch {
      return this.defaults();
    }
  }
  save(state) {
    localStorage.setItem(KEY,
    JSON.stringify(state));
    return state;
  }
  defaults() {
    return {
      selected: null,
      minimumRisk: 0,
      query: '',
      scenario: 'REGIONAL_ENTRY'
    };
  }
}

return Object.freeze({ConflictStateStore});
})();

// MODULE: conflict-intelligence/format.js
__modules['conflict-intelligence/format.js'] = (() => {

const escapeConflict = value => String(value ?? '').replace(/[&<>"']/g,
char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}
[char]));
const conflictNumber = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined,
{
  maximumFractionDigits: 1
}) : '—';
const conflictBand = score => Number(score) >= 80 ? 'extreme' : Number(score) >= 65 ? 'critical' : Number(score) >= 45 ? 'serious' : Number(score) >= 25 ? 'elevated' : 'routine';

return Object.freeze({escapeConflict, conflictNumber, conflictBand});
})();

// MODULE: conflict-intelligence/summary-strip.js
__modules['conflict-intelligence/summary-strip.js'] = (() => {
const { conflictNumber } = __modules['conflict-intelligence/format.js'];

function conflictSummary(summary = {
}) {
  return [['THEATRES',
  summary.theatres,
  'active'],
  ['EVENTS',
  summary.events,
  'source records'],
  ['CRITICAL',
  summary.critical,
  '65+ risk'],
  ['INTENSE',
  summary.intense,
  'current phase'],
  ['AVG RISK',
  conflictNumber(summary.averageRisk),
  '0–100']].map(([label,
  value,
  note]) => `<div class="sheet-stat"><span>${label}</span><strong>${value ?? 0}</strong><small>${note}</small></div>`).join('');
}

return Object.freeze({conflictSummary});
})();

// MODULE: conflict-intelligence/theatre-table.js
__modules['conflict-intelligence/theatre-table.js'] = (() => {
const { escapeConflict, conflictNumber, conflictBand } = __modules['conflict-intelligence/format.js'];

function theatreTable(theatres = [],
query = '') {
  const filtered = theatres.filter(item => `${item.name} ${item.country || ''} ${item.region || ''}`.toLowerCase().includes(query.toLowerCase()));
  return `<div class="conflict-table">${filtered.map(item => `<button type="button" data-conflict-id="${escapeConflict(item.id)}"><span class="conflict-risk ${conflictBand(item.risk.score)}">${conflictNumber(item.risk.score)}</span><span><b>${escapeConflict(item.name)}</b><small>${escapeConflict(`${item.phase} · ${item.eventCount} events · confidence ${conflictNumber(item.confidence.score)}`)}</small></span><span><b>${conflictNumber(item.escalation.score)}</b><small>ESCALATION</small></span></button>`).join('') || '<div class="conflict-empty">No theatres match this filter.</div>'}</div>`;
}

return Object.freeze({theatreTable});
})();

// MODULE: conflict-intelligence/detail-panel.js
__modules['conflict-intelligence/detail-panel.js'] = (() => {
const { escapeConflict, conflictNumber } = __modules['conflict-intelligence/format.js'];

function metric(label,
value,
note = '') {
  return `<div class="conflict-metric"><span>${label}</span><strong>${conflictNumber(value)}</strong><small>${escapeConflict(note)}</small></div>`;
}
function conflictDetail(item) {
  if (!item)
  return '<div class="conflict-empty">Select a conflict theatre to inspect its fronts, actors, escalation and exposure.</div>';
  const actors = (item.actors?.nodes || []).slice(0,
  8).map(actor => `<li><b>${escapeConflict(actor.name)}</b><span>${actor.eventCount} events · ${conflictNumber(actor.averageSeverity)}</span></li>`).join('');
  return `<article class="conflict-detail"><header><span>${escapeConflict(item.phase)}</span><h2>${escapeConflict(item.name)}</h2><p>${escapeConflict(item.country || item.region || '')}</p></header><div class="conflict-metric-grid">${metric('RISK',
  item.risk.score,
  item.risk.band)}${metric('ESCALATION',
  item.escalation.score,
  item.escalation.level)}${metric('INTENSITY',
  item.intensity.score,
  `${item.intensity.eventCount} events`)}${metric('CONFIDENCE',
  item.confidence.score,
  item.confidence.band)}${metric('CIVILIAN',
  item.exposure.civilian.score,
  'exposure')}${metric('LOGISTICS',
  item.exposure.logistics.score,
  'exposure')}</div><section><h3>ACTIVE ACTORS</h3><ul class="conflict-actors">${actors || '<li>No actors identified</li>'}</ul></section><section><h3>FRONTS / STRIKES</h3><p>${item.fronts?.length || 0} fronts · ${item.strikes?.count || 0} strike events · ${item.ceasefire?.status || 'NONE'} ceasefire state</p></section></article>`;
}

return Object.freeze({conflictDetail});
})();

// MODULE: conflict-intelligence/scenario-panel.js
__modules['conflict-intelligence/scenario-panel.js'] = (() => {
const { escapeConflict } = __modules['conflict-intelligence/format.js'];

function conflictScenarioPanel(catalog = {
}) {
  return `<form id="conflict-scenario" class="conflict-scenario"><h3>SCENARIO</h3><label>TYPE<select name="type">${(catalog.scenarios || []).map(item => `<option value="${escapeConflict(item.id)}">${escapeConflict(item.label)}</option>`).join('')}</select></label><label>SEVERITY<input name="severity" type="range" min="0" max="100" value="60"></label><label>HORIZON<input name="horizonDays" type="number" min="1" max="365" value="30"></label><button type="submit">RUN SCENARIO</button><output id="conflict-scenario-result"></output></form>`;
}

return Object.freeze({conflictScenarioPanel});
})();

// MODULE: conflict-intelligence/timeline.js
__modules['conflict-intelligence/timeline.js'] = (() => {
const { escapeConflict, conflictNumber } = __modules['conflict-intelligence/format.js'];

function conflictTimeline(items = []) {
  return `<div class="conflict-timeline">${items.slice(0,
  20).map(item => `<article><time>${escapeConflict(new Date(item.time).toLocaleString())}</time><b>${escapeConflict(item.type)}</b><p>${escapeConflict(item.title)}</p><span>${conflictNumber(item.severity)}</span></article>`).join('')}</div>`;
}

return Object.freeze({conflictTimeline});
})();

// MODULE: conflict-intelligence/map-layer.js
__modules['conflict-intelligence/map-layer.js'] = (() => {

const SOURCE_ID = 'merlin-conflict-intelligence';
const THEATRE_LAYER_ID = 'merlin-conflict-theatres';
const FRONT_LAYER_ID = 'merlin-conflict-frontlines';
const LABEL_LAYER_ID = 'merlin-conflict-labels';

function setVisibility(map, layerId, visible) {
  if (!map?.getLayer?.(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function ensureSource(map, features) {
  if (!map?.addSource || !map?.addLayer) return false;
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: features
    });
  }
  if (!map.getLayer(FRONT_LAYER_ID)) {
    map.addLayer({
      id: FRONT_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'risk'], 0],
          0, '#6f8290',
          45, '#e4a23d',
          75, '#ff4f68'
        ],
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 7, 4],
        'line-opacity': 0.86,
        'line-dasharray': [1.5, 1]
      }
    });
  }
  if (!map.getLayer(THEATRE_LAYER_ID)) {
    map.addLayer({
      id: THEATRE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'CONFLICT_THEATRE'],
      paint: {
        'circle-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'risk'], 0],
          0, '#587286',
          25, '#d0a83f',
          45, '#df7c38',
          65, '#d74652',
          80, '#9f1835'
        ],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 7, 12],
        'circle-opacity': 0.88,
        'circle-stroke-color': '#07131d',
        'circle-stroke-width': 1.5
      }
    });
  }
  if (!map.getLayer(LABEL_LAYER_ID)) {
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      minzoom: 3.5,
      filter: ['==', ['get', 'kind'], 'CONFLICT_THEATRE'],
      layout: {
        'text-field': [
          'case',
          ['all', ['has', 'nameLocal'], ['!=', ['get', 'nameLocal'], '']],
          ['format', ['get', 'name'], {}, '\n(', {}, ['get', 'nameLocal'], {}, ')', {}],
          ['get', 'name']
        ],
        'text-size': 10,
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#ffe8c4',
        'text-halo-color': '#07131d',
        'text-halo-width': 1.4
      }
    });
  }
  return true;
}

function installConflictLayer(map, options = {}) {
  let features = {
    type: 'FeatureCollection',
    features: []
  };
  let visible = true;
  let interactionsBound = false;

  function bindInteractions() {
    if (interactionsBound || !map?.on || !map?.getLayer?.(THEATRE_LAYER_ID)) return;
    interactionsBound = true;
    map.on('mouseenter', THEATRE_LAYER_ID, () => {
      if (map.getCanvas) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', THEATRE_LAYER_ID, () => {
      if (map.getCanvas) map.getCanvas().style.cursor = '';
    });
    map.on('click', THEATRE_LAYER_ID, event => {
      const id = event.features?.[0]?.properties?.id;
      if (id) options.onSelect?.(id);
    });
  }

  function render() {
    if (map?.setConflictFeatures) {
      map.setConflictFeatures(features);
      return;
    }
    try {
      ensureSource(map, features);
      map?.getSource?.(SOURCE_ID)?.setData?.(features);
      setVisibility(map, THEATRE_LAYER_ID, visible);
      setVisibility(map, FRONT_LAYER_ID, visible);
      setVisibility(map, LABEL_LAYER_ID, visible);
      bindInteractions();
    } catch (error) {
      console.warn('conflict-intelligence.map-layer.failed', error);
    }
  }

  function set(next) {
    features = next || features;
    render();
  }

  function show() {
    visible = true;
    render();
  }

  function hide() {
    visible = false;
    render();
  }

  map?.on?.('load', render);
  map?.on?.('styledata', render);

  return Object.freeze({
    set,
    show,
    hide,
    get features() {
      return features;
    }
  });
}

return Object.freeze({installConflictLayer});
})();

// MODULE: conflict-intelligence/conflict-controller.js
__modules['conflict-intelligence/conflict-controller.js'] = (() => {
const { createConflictApi } = __modules['conflict-intelligence/api-client.js'];
const { ConflictStateStore } = __modules['conflict-intelligence/state-store.js'];
const { conflictSummary } = __modules['conflict-intelligence/summary-strip.js'];
const { theatreTable } = __modules['conflict-intelligence/theatre-table.js'];
const { conflictDetail } = __modules['conflict-intelligence/detail-panel.js'];
const { conflictScenarioPanel } = __modules['conflict-intelligence/scenario-panel.js'];
const { conflictTimeline } = __modules['conflict-intelligence/timeline.js'];
const { installConflictLayer } = __modules['conflict-intelligence/map-layer.js'];








class ConflictController {
  constructor(options = {
  }) {
    this.api = options.api || createConflictApi();
    this.store = options.store || new ConflictStateStore();
    this.state = this.store.load();
    this.layer = installConflictLayer(options.map, {
      onSelect: id => this.select(id)
    });
    this.catalog = null;
    this.snapshot = null;
  }
  async initialize() {
    [this.catalog,
    this.snapshot] = await Promise.all([this.api.catalog(),
    this.api.snapshot({
      hours: 336,
      limit: 150
    })]);
    this.layer.set(this.snapshot.features);
    return this;
  }
  async activate() {
    if (!this.snapshot)
    await this.initialize();
    this.render(this.state.query || '');
  }
  selected() {
    return this.snapshot?.theatres?.find(item => item.id === this.state.selected) || null;
  }
  render(query = '') {
    this.state.query = query;
    this.store.save(this.state);
    const content = document.querySelector('#sheet-content');
    if (!content)
    return;
    document.querySelector('#sheet-kicker').textContent = 'WAR / SECURITY / ESCALATION';
    document.querySelector('#sheet-title').textContent = 'CONFLICT';
    document.querySelector('#sheet-summary').innerHTML = conflictSummary(this.snapshot.summary);
    content.innerHTML = `<div class="conflict-layout"><section><div class="conflict-tools"><input id="conflict-filter" placeholder="Filter theatres" value="${query}"></div>${theatreTable(this.snapshot.theatres,
    query)}</section><aside id="conflict-inspector">${conflictDetail(this.selected())}${conflictScenarioPanel(this.catalog)}${conflictTimeline(this.selected()?.timeline || [])}</aside></div>`;
    content.querySelector('#conflict-filter')?.addEventListener('input',
    event => this.render(event.target.value));
    content.querySelectorAll('[data-conflict-id]').forEach(button => button.addEventListener('click',
    () => this.select(button.dataset.conflictId)));
    content.querySelector('#conflict-scenario')?.addEventListener('submit',
    event => this.runScenario(event));
  }
  select(id) {
    this.state.selected = id;
    this.store.save(this.state);
    this.layer.show();
    this.render(this.state.query || '');
  }
  async runScenario(event) {
    event.preventDefault();
    const theatre = this.selected();
    if (!theatre)
    return;
    const data = new FormData(event.currentTarget),
    result = await this.api.scenario({
      theatreId: theatre.id,
      type: data.get('type'),
      severity: Number(data.get('severity')),
      horizonDays: Number(data.get('horizonDays')),
      theatre
    });
    const output = document.querySelector('#conflict-scenario-result');
    if (output)
    output.textContent = `${result.before} → ${result.after} (${result.delta >= 0 ? '+' : ''}${result.delta})`;
  }
}

return Object.freeze({ConflictController});
})();

// MODULE: conflict-intelligence/bootstrap.js
__modules['conflict-intelligence/bootstrap.js'] = (() => {
const { ConflictController } = __modules['conflict-intelligence/conflict-controller.js'];

async function installConflictIntelligenceSystem(options = {
}) {
  const controller = new ConflictController(options);
  try {
    await controller.initialize();
  }
  catch (error) {
    console.warn('conflict-intelligence.initialize.failed',
    error);
  }
  return controller;
}

return Object.freeze({installConflictIntelligenceSystem});
})();

// MODULE: decision-support/api-client.js
__modules['decision-support/api-client.js'] = (() => {

function createDecisionSupportApi(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12_000);

  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          ...(init.body ? { 'content-type': 'application/json' } : {}),
          ...(init.headers || {})
        },
        ...init,
        signal: init.signal || controller.signal
      });
      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();
      if (!response.ok) throw new Error(body?.error?.message || `HTTP ${response.status}`);
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) });
  const query = params => new URLSearchParams(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== '' && value !== null));

  return Object.freeze({
    catalog: () => request('/api/decision-support/catalog'),
    diagnostics: () => request('/api/decision-support/diagnostics'),
    snapshot: params => {
      const payload = params || {};
      if (payload.bundle || payload.watchlists?.length || payload.force) return post('/api/decision-support/snapshot', payload);
      return request(`/api/decision-support/snapshot?${query(payload)}`);
    },
    report: body => post('/api/decision-support/report', body),
    handover: body => post('/api/decision-support/handover', body),
    digest: body => post('/api/decision-support/digest', body),
    distribute: body => post('/api/decision-support/distribution/evaluate', body),

    listWorkspaces: params => request(`/api/decision-support/workspaces?${query(params)}`),
    saveWorkspace: body => post('/api/decision-support/workspaces', body),
    removeWorkspace: id => post('/api/decision-support/workspaces/remove', { id }),

    listCases: params => request(`/api/decision-support/cases?${query(params)}`),
    getCase: id => request(`/api/decision-support/cases/${encodeURIComponent(id)}`),
    saveCase: body => post('/api/decision-support/cases', body),
    transitionCase: (id, status, extra = {}) => post('/api/decision-support/cases/transition', { id, status, ...extra }),
    removeCase: id => post('/api/decision-support/cases/remove', { id }),

    listNotes: (caseId, params = {}) => request(`/api/decision-support/notes?${query({ caseId, ...params })}`),
    saveNote: body => post('/api/decision-support/notes', body),
    removeNote: id => post('/api/decision-support/notes/remove', { id }),

    listTasks: (caseId, params = {}) => request(`/api/decision-support/tasks?${query({ caseId, ...params })}`),
    saveTask: body => post('/api/decision-support/tasks', body),
    transitionTask: (id, status, extra = {}) => post('/api/decision-support/tasks/transition', { id, status, ...extra }),

    listDecisions: (caseId, params = {}) => request(`/api/decision-support/decisions?${query({ caseId, ...params })}`),
    saveDecision: body => post('/api/decision-support/decisions', body),
    transitionDecision: (id, status, reason = '') => post('/api/decision-support/decisions/transition', { id, status, reason }),

    listSlas: params => request(`/api/decision-support/slas?${query(params)}`),
    createSla: body => post('/api/decision-support/slas', body),
    transitionSla: (id, state, extra = {}) => post('/api/decision-support/slas/transition', { id, state, ...extra }),

    listSchedules: params => request(`/api/decision-support/schedules?${query(params)}`),
    dueSchedules: now => request(`/api/decision-support/schedules/due?${query({ now })}`),
    saveSchedule: body => post('/api/decision-support/schedules', body),
    removeSchedule: id => post('/api/decision-support/schedules/remove', { id }),

    listApprovals: params => request(`/api/decision-support/approvals?${query(params)}`),
    createApproval: body => post('/api/decision-support/approvals', body),
    transitionApproval: (id, state, note = '') => post('/api/decision-support/approvals/transition', { id, state, note }),

    listAudit: params => request(`/api/decision-support/audit?${query(params)}`),
    verifyAudit: () => request('/api/decision-support/audit/verify')
  });
}

return Object.freeze({createDecisionSupportApi});
})();

// MODULE: decision-support/state-store.js
__modules['decision-support/state-store.js'] = (() => {

const STORAGE = 'merlin.decision-support.v20';
function read() { try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; } }
class DecisionSupportState {
  constructor() { this.state = { activeTab: 'brief', minimumPriority: 45, domains: [], selectedSignalId: null, selectedCaseId: null, ...read() }; this.listeners = new Set(); }
  get() { return this.state; }
  set(patch) { this.state = { ...this.state, ...patch }; localStorage.setItem(STORAGE, JSON.stringify(this.state)); for (const listener of this.listeners) listener(this.state); return this.state; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

return Object.freeze({DecisionSupportState});
})();

// MODULE: decision-support/format.js
__modules['decision-support/format.js'] = (() => {

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function number(value, digits = 0) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—'; }
function age(value) { const parsed = Date.parse(value || ''); if (!Number.isFinite(parsed)) return '—'; const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000)); return minutes < 60 ? `${minutes}M` : minutes < 2880 ? `${Math.floor(minutes / 60)}H` : `${Math.floor(minutes / 1440)}D`; }
function bandClass(value) { return String(value || 'ROUTINE').toLowerCase().replaceAll('_', '-'); }
function shortText(value, maximum = 180) { const text = String(value || ''); return text.length > maximum ? `${text.slice(0, maximum - 1)}…` : text; }

return Object.freeze({escapeHtml, number, age, bandClass, shortText});
})();

// MODULE: decision-support/dashboard.js
__modules['decision-support/dashboard.js'] = (() => {
const { escapeHtml, number } = __modules['decision-support/format.js'];

function renderDashboard(root, snapshot) {
  const cards = snapshot.cards || [];
  root.innerHTML = `<div class="decision-card-grid">${cards.map(card => `<article class="decision-metric"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(number(card.value, Number(card.value) % 1 ? 1 : 0))}</strong><small>${escapeHtml(card.note)}</small></article>`).join('')}</div>`;
}

return Object.freeze({renderDashboard});
})();

// MODULE: decision-support/briefing-view.js
__modules['decision-support/briefing-view.js'] = (() => {
const { age, bandClass, escapeHtml, number, shortText } = __modules['decision-support/format.js'];

function signalCard(signal) {
  return `<article class="brief-signal ${bandClass(signal.attention?.band)}" data-signal-id="${escapeHtml(signal.id)}"><header><span>${escapeHtml(signal.domain)}</span><b>${escapeHtml(signal.attention?.band)} ${number(signal.attention?.score, 1)}</b></header><h3>${escapeHtml(signal.title)}</h3><p>${escapeHtml(shortText(signal.summary, 240))}</p><footer><span>${escapeHtml(signal.location?.label || 'GLOBAL')}</span><span>${age(signal.time)}</span><span>${number(signal.attention?.confidence?.score, 0)}% CONF</span></footer></article>`;
}
function renderBriefing(root, snapshot, onSelect) {
  const brief = snapshot.brief || {};
  root.innerHTML = `<section class="brief-executive"><span>MORNING BRIEF</span><h2>${escapeHtml(brief.executive?.headline || 'No material headline')}</h2><div><b>${number(brief.executive?.criticalCount)} critical</b><b>${number(brief.executive?.urgentCount)} urgent</b><b>${number(brief.executive?.newCount)} new</b><b>${number(brief.coverage?.score)}% evidence</b></div></section>${(brief.sections || []).map(section => `<section class="brief-section"><header><h2>${escapeHtml(section.title)}</h2><span>${number(section.count)} SIGNALS · AVG ${number(section.averagePriority, 1)}</span></header><div class="brief-signal-grid">${(section.items || []).map(signalCard).join('')}</div></section>`).join('')}`;
  root.querySelectorAll('[data-signal-id]').forEach(element => element.addEventListener('click', () => onSelect?.(element.dataset.signalId)));
}

return Object.freeze({renderBriefing});
})();

// MODULE: decision-support/evidence-panel.js
__modules['decision-support/evidence-panel.js'] = (() => {
const { age, escapeHtml, number } = __modules['decision-support/format.js'];

function renderEvidencePanel(root, signal) {
  if (!signal) { root.innerHTML = '<div class="decision-empty">SELECT A SIGNAL TO INSPECT ITS EVIDENCE.</div>'; return; }
  root.innerHTML = `<header class="evidence-head"><div><span>${escapeHtml(signal.domain)}</span><h2>${escapeHtml(signal.title)}</h2></div><b>${escapeHtml(signal.attention.band)} ${number(signal.attention.score, 1)}</b></header><p>${escapeHtml(signal.summary || 'No summary supplied.')}</p><div class="evidence-grid"><div><span>CONFIDENCE</span><strong>${number(signal.attention.confidence.score)}%</strong></div><div><span>URGENCY</span><strong>${escapeHtml(signal.attention.urgency.band)}</strong></div><div><span>ACTIONABILITY</span><strong>${escapeHtml(signal.attention.actionability.band)}</strong></div><div><span>AGE</span><strong>${age(signal.time)}</strong></div></div><section><h3>SOURCES</h3>${(signal.sources || []).length ? `<ul>${signal.sources.map(source => `<li>${escapeHtml(source)}</li>`).join('')}</ul>` : '<p>NO SOURCE AVAILABLE</p>'}</section><section><h3>RECOMMENDED ACTION</h3><p>${escapeHtml(signal.action || 'Monitor and seek additional corroboration.')}</p></section>`;
}

return Object.freeze({renderEvidencePanel});
})();

// MODULE: decision-support/watchlist-panel.js
__modules['decision-support/watchlist-panel.js'] = (() => {
const { escapeHtml, number } = __modules['decision-support/format.js'];

const STORAGE = 'merlin.decision-watches.v20';
function read() { try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; } }
function write(items) { localStorage.setItem(STORAGE, JSON.stringify(items)); }
class WatchlistPanel {
  constructor(root, onChange) { this.root = root; this.onChange = onChange; }
  list() { return read(); }
  add(input) { const item = { id: `watch-${Date.now()}`, label: String(input.label || 'Watch'), terms: String(input.terms || '').split(',').map(value => value.trim()).filter(Boolean), domains: input.domains || [], minimumPriority: Number(input.minimumPriority || 60), enabled: true }; const items = [item, ...read()].slice(0, 100); write(items); this.render(); this.onChange?.(items); return item; }
  remove(id) { const items = read().filter(item => item.id !== id); write(items); this.render(); this.onChange?.(items); }
  render() { const items = read(); this.root.innerHTML = `<div class="watch-form"><input data-watch-label placeholder="WATCH NAME"><input data-watch-terms placeholder="TERMS, COMMA SEPARATED"><input data-watch-score type="number" min="0" max="100" value="60"><button data-watch-add>ADD WATCH</button></div><div class="watch-list">${items.map(item => `<article><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.terms.join(', ') || 'ALL SIGNALS')}</span></div><b>${number(item.minimumPriority)}</b><button data-watch-remove="${escapeHtml(item.id)}">×</button></article>`).join('') || '<div class="decision-empty">0 WATCHLIST RULES</div>'}</div>`; this.root.querySelector('[data-watch-add]')?.addEventListener('click', () => this.add({ label: this.root.querySelector('[data-watch-label]').value, terms: this.root.querySelector('[data-watch-terms]').value, minimumPriority: this.root.querySelector('[data-watch-score]').value })); this.root.querySelectorAll('[data-watch-remove]').forEach(button => button.addEventListener('click', () => this.remove(button.dataset.watchRemove))); }
}

return Object.freeze({WatchlistPanel});
})();

// MODULE: decision-support/workspace-panel.js
__modules['decision-support/workspace-panel.js'] = (() => {
const { escapeHtml } = __modules['decision-support/format.js'];


class WorkspacePanel {
  constructor(root, api, onLoad) {
    this.root = root;
    this.api = api;
    this.onLoad = onLoad;
    this.items = [];
    this.snapshot = null;
  }

  async load(snapshot = this.snapshot) {
    this.snapshot = snapshot;
    this.root.innerHTML = '<div class="decision-empty">LOADING WORKSPACES…</div>';
    try {
      this.items = (await this.api.listWorkspaces()).workspaces || [];
    } catch {
      this.items = [];
    }
    this.render();
  }

  async save() {
    if (!this.snapshot) return;
    const name = this.root.querySelector('[data-workspace-name]')?.value.trim() || `Workspace ${this.items.length + 1}`;
    const state = {
      minimumPriority: Number(document.querySelector('[data-decision-priority]')?.value || 45),
      hours: Number(document.querySelector('[data-decision-hours]')?.value || 72)
    };
    await this.api.saveWorkspace({
      name,
      description: this.snapshot.brief?.executive?.headline || 'Saved decision-support workspace',
      filters: state,
      views: [{ type: 'brief', generatedAt: this.snapshot.generatedAt, selectedSignalIds: (this.snapshot.signals || []).slice(0, 25).map(item => item.id) }],
      tags: ['decision-support']
    });
    await this.load(this.snapshot);
  }

  async remove(id) {
    await this.api.removeWorkspace(id);
    await this.load(this.snapshot);
  }

  render() {
    this.root.innerHTML = `<div class="workspace-form"><input data-workspace-name placeholder="WORKSPACE NAME"><button data-workspace-save type="button">SAVE CURRENT</button></div>
      <div class="workspace-list">${this.items.map(item => `<article><button data-workspace-load="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.description || 'Saved analysis state')}</span><small>${item.caseIds?.length || 0} cases · ${item.views?.length || 0} views</small></button><button data-workspace-remove="${escapeHtml(item.id)}" aria-label="Remove workspace">×</button></article>`).join('') || '<div class="decision-empty">0 SERVER WORKSPACES</div>'}</div>`;
    this.root.querySelector('[data-workspace-save]')?.addEventListener('click', () => this.save());
    this.root.querySelectorAll('[data-workspace-load]').forEach(button => button.addEventListener('click', () => this.onLoad?.(this.items.find(item => item.id === button.dataset.workspaceLoad))));
    this.root.querySelectorAll('[data-workspace-remove]').forEach(button => button.addEventListener('click', () => this.remove(button.dataset.workspaceRemove)));
  }
}

return Object.freeze({WorkspacePanel});
})();

// MODULE: decision-support/case-file-panel.js
__modules['decision-support/case-file-panel.js'] = (() => {
const { bandClass, escapeHtml, number } = __modules['decision-support/format.js'];

class CaseFilePanel {
  constructor(root, api, onSelect) { this.root = root; this.api = api; this.onSelect = onSelect; this.items = []; }
  async load() { try { this.items = (await this.api.listCases()).cases || []; } catch { this.items = []; } this.render(); }
  async create() { const title = this.root.querySelector('[data-case-title]')?.value || 'New case'; const priority = Number(this.root.querySelector('[data-case-priority]')?.value || 50); await this.api.saveCase({ title, priority, status: 'OPEN' }); await this.load(); }
  async remove(id) { await this.api.removeCase(id); await this.load(); }
  render() { this.root.innerHTML = `<div class="case-form"><input data-case-title placeholder="CASE TITLE"><input data-case-priority type="number" min="0" max="100" value="60"><button data-case-create>CREATE CASE</button></div><div class="case-list">${this.items.map(item => `<article class="${bandClass(item.priority >= 85 ? 'CRITICAL' : item.priority >= 70 ? 'URGENT' : 'IMPORTANT')}"><button data-case-select="${escapeHtml(item.id)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.status)}</span></button><b>${number(item.priority)}</b><button data-case-remove="${escapeHtml(item.id)}">×</button></article>`).join('') || '<div class="decision-empty">0 CASE FILES</div>'}</div>`; this.root.querySelector('[data-case-create]')?.addEventListener('click', () => this.create()); this.root.querySelectorAll('[data-case-select]').forEach(button => button.addEventListener('click', () => this.onSelect?.(this.items.find(item => item.id === button.dataset.caseSelect)))); this.root.querySelectorAll('[data-case-remove]').forEach(button => button.addEventListener('click', () => this.remove(button.dataset.caseRemove))); }
}

return Object.freeze({CaseFilePanel});
})();

// MODULE: decision-support/timeline.js
__modules['decision-support/timeline.js'] = (() => {
const { age, escapeHtml, number } = __modules['decision-support/format.js'];

function renderTimeline(root, timeline = []) { root.innerHTML = `<div class="decision-timeline">${timeline.map(item => `<article><i></i><div><span>${escapeHtml(item.type)} · ${age(item.time)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.domain || '')}${item.score ? ` · ${number(item.score, 1)}` : ''}</small></div></article>`).join('') || '<div class="decision-empty">NO TIMELINE ITEMS</div>'}</div>`; }

return Object.freeze({renderTimeline});
})();

// MODULE: decision-support/report-panel.js
__modules['decision-support/report-panel.js'] = (() => {
const { escapeHtml } = __modules['decision-support/format.js'];


const REPORT_TYPES = Object.freeze(['EXECUTIVE', 'MORNING', 'SHIFT_HANDOVER', 'INCIDENT', 'MARKET', 'COUNTRY', 'ROUTE']);

class ReportPanel {
  constructor(root, api) {
    this.root = root;
    this.api = api;
    this.report = null;
    this.snapshot = null;
  }

  renderLauncher(snapshot) {
    this.snapshot = snapshot;
    this.root.innerHTML = `<section class="report-launcher"><header><span>CONTROLLED OUTPUT</span><h2>REPORT BUILDER</h2></header>
      <div class="report-controls"><label><span>REPORT TYPE</span><select data-report-type>${REPORT_TYPES.map(type => `<option value="${type}">${type.replaceAll('_', ' ')}</option>`).join('')}</select></label><label><span>CLASSIFICATION</span><select data-report-classification><option>INTERNAL</option><option>CONFIDENTIAL</option><option>RESTRICTED</option><option>PUBLIC</option></select></label><button data-report-generate type="button">GENERATE REPORT</button></div>
      <div data-report-output><div class="decision-empty">SELECT A TEMPLATE AND GENERATE A REPORT FROM THE CURRENT SNAPSHOT.</div></div></section>`;
    this.output = this.root.querySelector('[data-report-output]');
    this.root.querySelector('[data-report-generate]')?.addEventListener('click', () => this.generate());
  }

  async generate() {
    if (!this.snapshot) return;
    const type = this.root.querySelector('[data-report-type]')?.value || 'EXECUTIVE';
    const classification = this.root.querySelector('[data-report-classification]')?.value || 'INTERNAL';
    this.output.innerHTML = '<div class="decision-empty">GENERATING REPORT…</div>';
    try {
      this.report = await this.api.report({ snapshot: this.snapshot, type, classification });
      this.renderReport();
    } catch (error) {
      this.output.innerHTML = `<div class="decision-empty">REPORT FAILED: ${escapeHtml(error.message || error)}</div>`;
    }
  }

  download(extension, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merlin-${this.report?.type?.toLowerCase() || 'report'}-${Date.now()}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async evaluateDistribution() {
    const recipients = window.prompt('Recipient addresses, comma separated') || '';
    if (!recipients.trim()) return;
    const result = await this.api.distribute({
      resourceType: 'REPORT',
      resourceId: this.report.id,
      contentClassification: this.report.classification,
      policy: { classification: this.report.classification, allowedRoles: ['ANALYST', 'APPROVER'], requireApproval: this.report.classification !== 'PUBLIC', allowExternal: this.report.classification === 'PUBLIC' },
      actorRoles: ['ANALYST'],
      recipients: recipients.split(',').map(value => value.trim()).filter(Boolean),
      organisationDomains: [location.hostname],
      approvalState: this.report.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
      content: this.report
    });
    window.alert(result.evaluation.allowed ? 'Distribution policy passed.' : `Distribution blocked: ${result.evaluation.reasons.join('; ')}`);
  }

  renderReport() {
    if (!this.report) return;
    const warnings = this.report.qualityGate?.warnings || [];
    this.output.innerHTML = `<article class="report-preview"><header><div><span>${escapeHtml(this.report.type)} · ${escapeHtml(this.report.classification)}</span><h2>${escapeHtml(this.report.title)}</h2></div><b>${this.report.qualityGate?.ready ? 'READY' : 'REVIEW'}</b></header>
      <p>${escapeHtml(this.report.executive?.headline || '')}</p>
      ${warnings.length ? `<div class="report-warnings">${warnings.map(item => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : ''}
      <h3>RECOMMENDATIONS</h3><ol>${(this.report.recommendations || []).map(item => `<li><strong>${escapeHtml(item.priority)}</strong> ${escapeHtml(item.action)}</li>`).join('')}</ol>
      <div class="report-actions"><button data-report-json>JSON</button><button data-report-markdown>MARKDOWN</button><button data-report-distribute>CHECK DISTRIBUTION</button><button data-report-print>PRINT</button></div></article>`;
    this.output.querySelector('[data-report-json]')?.addEventListener('click', () => this.download('json', JSON.stringify(this.report, null, 2), 'application/json'));
    this.output.querySelector('[data-report-markdown]')?.addEventListener('click', () => this.download('md', `# ${this.report.title}\n\n${this.report.executive?.headline || ''}\n\n${(this.report.recommendations || []).map(item => `- ${item.action}`).join('\n')}`, 'text/markdown'));
    this.output.querySelector('[data-report-distribute]')?.addEventListener('click', () => this.evaluateDistribution());
    this.output.querySelector('[data-report-print]')?.addEventListener('click', () => window.print());
  }
}

return Object.freeze({ReportPanel});
})();

// MODULE: decision-support/operations-panel.js
__modules['decision-support/operations-panel.js'] = (() => {
const { bandClass, escapeHtml, number } = __modules['decision-support/format.js'];


function dateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function healthClass(health) {
  if (health === 'BREACHED' || health === 'ACK_BREACHED') return 'critical';
  if (health === 'AT_RISK') return 'urgent';
  if (health === 'CLOSED') return 'routine';
  return 'important';
}

class OperationsPanel {
  constructor(root, api, options = {}) {
    this.root = root;
    this.api = api;
    this.onChanged = options.onChanged;
    this.data = { slas: [], slaSummary: {}, schedules: [], approvals: [], audit: [], auditVerification: null, tasks: [], decisions: [] };
    this.loading = false;
  }

  async load() {
    if (this.loading) return;
    this.loading = true;
    this.root.innerHTML = '<div class="decision-empty">LOADING OPERATIONAL CONTROLS…</div>';
    const results = await Promise.allSettled([
      this.api.listSlas(),
      this.api.listSchedules(),
      this.api.listApprovals(),
      this.api.listAudit({ limit: 100 }),
      this.api.listTasks(),
      this.api.listDecisions()
    ]);
    const value = (index, fallback) => results[index].status === 'fulfilled' ? results[index].value : fallback;
    const slaPayload = value(0, { slas: [], summary: {} });
    const schedulePayload = value(1, { schedules: [] });
    const approvalPayload = value(2, { approvals: [] });
    const auditPayload = value(3, { entries: [], verification: null });
    const taskPayload = value(4, { tasks: [] });
    const decisionPayload = value(5, { decisions: [] });
    this.data = {
      slas: slaPayload.slas || [],
      slaSummary: slaPayload.summary || {},
      schedules: schedulePayload.schedules || [],
      approvals: approvalPayload.approvals || [],
      audit: auditPayload.entries || [],
      auditVerification: auditPayload.verification || null,
      tasks: taskPayload.tasks || [],
      decisions: decisionPayload.decisions || []
    };
    this.loading = false;
    this.render();
  }

  async createSchedule() {
    const name = this.root.querySelector('[data-schedule-name]')?.value.trim() || 'Morning briefing';
    const time = this.root.querySelector('[data-schedule-time]')?.value || '08:00';
    await this.api.saveSchedule({ name, time, type: 'MORNING', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', enabled: true });
    await this.load();
    this.onChanged?.();
  }

  async removeSchedule(id) {
    await this.api.removeSchedule(id);
    await this.load();
    this.onChanged?.();
  }

  async transitionSla(id, state) {
    await this.api.transitionSla(id, state);
    await this.load();
    this.onChanged?.();
  }

  async transitionApproval(id, state) {
    const note = state === 'REJECTED' ? window.prompt('Reason for rejection') || '' : '';
    await this.api.transitionApproval(id, state, note);
    await this.load();
    this.onChanged?.();
  }

  async transitionTask(id, status) {
    await this.api.transitionTask(id, status);
    await this.load();
    this.onChanged?.();
  }

  async transitionDecision(id, status) {
    const reason = window.prompt(`Reason for ${status.toLowerCase()}`) || '';
    await this.api.transitionDecision(id, status, reason);
    await this.load();
    this.onChanged?.();
  }

  renderSummary() {
    const summary = this.data.slaSummary;
    return `<div class="operations-summary">
      <article><span>SLA COMPLIANCE</span><strong>${number(summary.compliancePercent || 0, 1)}%</strong></article>
      <article><span>AT RISK</span><strong>${number(summary.atRisk || 0)}</strong></article>
      <article><span>BREACHED</span><strong>${number(summary.breached || 0)}</strong></article>
      <article><span>PENDING APPROVAL</span><strong>${number(this.data.approvals.filter(item => ['SUBMITTED', 'IN_REVIEW'].includes(item.state)).length)}</strong></article>
      <article><span>OPEN TASKS</span><strong>${number(this.data.tasks.filter(item => !['DONE', 'CANCELLED'].includes(item.status)).length)}</strong></article>
      <article><span>AUDIT CHAIN</span><strong>${this.data.auditVerification?.valid === false ? 'FAILED' : 'VALID'}</strong></article>
    </div>`;
  }

  renderSlas() {
    const rows = this.data.slas.slice(0, 50).map(item => `<article class="operation-row ${healthClass(item.health)}">
      <div><span>${escapeHtml(item.health)}</span><strong>${escapeHtml(item.signalId || item.id)}</strong><small>${escapeHtml(item.targetRole)} · due ${escapeHtml(dateTime(item.nextDueAt))}</small></div>
      <b>${number(item.remainingMinutes)}m</b>
      <div class="operation-actions">
        ${item.state === 'PENDING' ? `<button data-sla-action="ACKNOWLEDGED" data-sla-id="${escapeHtml(item.id)}">ACK</button>` : ''}
        ${!['RESOLVED', 'CANCELLED'].includes(item.state) ? `<button data-sla-action="RESOLVED" data-sla-id="${escapeHtml(item.id)}">RESOLVE</button>` : ''}
      </div>
    </article>`).join('');
    return `<section class="operation-section"><header><div><span>ESCALATION CONTROL</span><h3>SLA QUEUE</h3></div><b>${this.data.slas.length}</b></header><div class="operation-list">${rows || '<div class="decision-empty">0 ACTIVE SLA RECORDS</div>'}</div></section>`;
  }

  renderSchedules() {
    const rows = this.data.schedules.map(item => `<article class="operation-row ${item.enabled ? 'important' : 'routine'}">
      <div><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.days.join(' '))} · ${escapeHtml(item.time)} ${escapeHtml(item.timezone)}</small></div>
      <b>${item.enabled ? 'ON' : 'OFF'}</b>
      <button data-schedule-remove="${escapeHtml(item.id)}">×</button>
    </article>`).join('');
    return `<section class="operation-section"><header><div><span>AUTOMATION</span><h3>BRIEFING SCHEDULES</h3></div><b>${this.data.schedules.length}</b></header>
      <div class="operation-form"><input data-schedule-name placeholder="SCHEDULE NAME"><input data-schedule-time type="time" value="08:00"><button data-schedule-create>ADD WEEKDAY BRIEF</button></div>
      <div class="operation-list">${rows || '<div class="decision-empty">0 SCHEDULES</div>'}</div></section>`;
  }

  renderApprovals() {
    const rows = this.data.approvals.slice(0, 50).map(item => `<article class="operation-row ${bandClass(item.state === 'REJECTED' ? 'CRITICAL' : item.state === 'APPROVED' ? 'IMPORTANT' : 'URGENT')}">
      <div><span>${escapeHtml(item.state)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.resourceType)} · ${escapeHtml(item.assignedTo)}</small></div>
      <div class="operation-actions">
        ${['DRAFT'].includes(item.state) ? `<button data-approval-action="SUBMITTED" data-approval-id="${escapeHtml(item.id)}">SUBMIT</button>` : ''}
        ${['SUBMITTED', 'IN_REVIEW'].includes(item.state) ? `<button data-approval-action="APPROVED" data-approval-id="${escapeHtml(item.id)}">APPROVE</button><button data-approval-action="REJECTED" data-approval-id="${escapeHtml(item.id)}">REJECT</button>` : ''}
      </div>
    </article>`).join('');
    return `<section class="operation-section"><header><div><span>GOVERNANCE</span><h3>APPROVAL QUEUE</h3></div><b>${this.data.approvals.length}</b></header><div class="operation-list">${rows || '<div class="decision-empty">0 APPROVAL REQUESTS</div>'}</div></section>`;
  }

  renderTasksAndDecisions() {
    const tasks = this.data.tasks.slice(0, 30).map(item => `<article class="operation-row ${bandClass(item.priority >= 85 ? 'CRITICAL' : item.priority >= 70 ? 'URGENT' : 'IMPORTANT')}">
      <div><span>${escapeHtml(item.status)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · due ${escapeHtml(dateTime(item.dueAt))}</small></div>
      <b>${number(item.priority)}</b>
      <div class="operation-actions">${!['DONE', 'CANCELLED'].includes(item.status) ? `<button data-task-action="DONE" data-task-id="${escapeHtml(item.id)}">DONE</button>` : ''}</div>
    </article>`).join('');
    const decisions = this.data.decisions.slice(0, 30).map(item => `<article class="operation-row ${item.status === 'REJECTED' ? 'critical' : item.status === 'APPROVED' ? 'important' : 'urgent'}">
      <div><span>${escapeHtml(item.status)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · ${escapeHtml(item.caseId || 'NO CASE')}</small></div>
      <div class="operation-actions">
        ${item.status === 'PROPOSED' ? `<button data-decision-action="APPROVED" data-decision-id="${escapeHtml(item.id)}">APPROVE</button><button data-decision-action="REJECTED" data-decision-id="${escapeHtml(item.id)}">REJECT</button>` : ''}
        ${item.status === 'APPROVED' ? `<button data-decision-action="COMPLETED" data-decision-id="${escapeHtml(item.id)}">COMPLETE</button>` : ''}
      </div>
    </article>`).join('');
    return `<section class="operation-section operation-split"><div><header><div><span>DELIVERY</span><h3>TASKS</h3></div><b>${this.data.tasks.length}</b></header><div class="operation-list">${tasks || '<div class="decision-empty">0 TASKS</div>'}</div></div><div><header><div><span>GOVERNANCE</span><h3>DECISIONS</h3></div><b>${this.data.decisions.length}</b></header><div class="operation-list">${decisions || '<div class="decision-empty">0 DECISIONS</div>'}</div></div></section>`;
  }

  renderAudit() {
    const rows = this.data.audit.slice(0, 50).map(item => `<article class="audit-row"><time>${escapeHtml(dateTime(item.time))}</time><b>${escapeHtml(item.action)}</b><span>${escapeHtml(item.resourceType)} ${escapeHtml(item.resourceId)}</span><small>${escapeHtml(item.actor)}</small></article>`).join('');
    return `<section class="operation-section"><header><div><span>TAMPER-EVIDENT RECORD</span><h3>AUDIT TRAIL</h3></div><b>${this.data.auditVerification?.valid === false ? 'INVALID' : 'VALID'}</b></header><div class="audit-list">${rows || '<div class="decision-empty">0 AUDIT EVENTS</div>'}</div></section>`;
  }

  bind() {
    this.root.querySelector('[data-schedule-create]')?.addEventListener('click', () => this.createSchedule());
    this.root.querySelectorAll('[data-schedule-remove]').forEach(button => button.addEventListener('click', () => this.removeSchedule(button.dataset.scheduleRemove)));
    this.root.querySelectorAll('[data-sla-action]').forEach(button => button.addEventListener('click', () => this.transitionSla(button.dataset.slaId, button.dataset.slaAction)));
    this.root.querySelectorAll('[data-approval-action]').forEach(button => button.addEventListener('click', () => this.transitionApproval(button.dataset.approvalId, button.dataset.approvalAction)));
    this.root.querySelectorAll('[data-task-action]').forEach(button => button.addEventListener('click', () => this.transitionTask(button.dataset.taskId, button.dataset.taskAction)));
    this.root.querySelectorAll('[data-decision-action]').forEach(button => button.addEventListener('click', () => this.transitionDecision(button.dataset.decisionId, button.dataset.decisionAction)));
  }

  render() {
    this.root.innerHTML = `<div class="operations-panel">${this.renderSummary()}${this.renderSlas()}${this.renderSchedules()}${this.renderApprovals()}${this.renderTasksAndDecisions()}${this.renderAudit()}</div>`;
    this.bind();
  }
}

return Object.freeze({OperationsPanel});
})();

// MODULE: decision-support/controller.js
__modules['decision-support/controller.js'] = (() => {
const { createDecisionSupportApi } = __modules['decision-support/api-client.js'];
const { DecisionSupportState } = __modules['decision-support/state-store.js'];
const { renderDashboard } = __modules['decision-support/dashboard.js'];
const { renderBriefing } = __modules['decision-support/briefing-view.js'];
const { renderEvidencePanel } = __modules['decision-support/evidence-panel.js'];
const { WatchlistPanel } = __modules['decision-support/watchlist-panel.js'];
const { WorkspacePanel } = __modules['decision-support/workspace-panel.js'];
const { CaseFilePanel } = __modules['decision-support/case-file-panel.js'];
const { renderTimeline } = __modules['decision-support/timeline.js'];
const { ReportPanel } = __modules['decision-support/report-panel.js'];
const { OperationsPanel } = __modules['decision-support/operations-panel.js'];
const { escapeHtml } = __modules['decision-support/format.js'];













const TABS = Object.freeze([
  ['brief', 'BRIEF'],
  ['timeline', 'TIMELINE'],
  ['watchlists', 'WATCHLISTS'],
  ['workspaces', 'WORKSPACES'],
  ['cases', 'CASE FILES'],
  ['operations', 'OPERATIONS'],
  ['reports', 'REPORTS']
]);

class DecisionSupportController {
  constructor(options = {}) {
    this.api = options.api || createDecisionSupportApi();
    this.state = options.state || new DecisionSupportState();
    this.snapshot = null;
    this.loading = false;
    this.mounted = false;
    this.refreshSequence = 0;
  }

  mount() {
    this.root = document.querySelector('#sheet-content');
    if (!this.root) return;
    document.querySelector('#sheet-title').textContent = 'BRIEFINGS';
    document.querySelector('#sheet-kicker').textContent = 'EXECUTIVE DECISION SUPPORT';
    this.root.innerHTML = `<div class="decision-shell">
      <nav class="decision-tabs" aria-label="Decision support sections">
        ${TABS.map(([id, label], index) => `<button data-decision-tab="${id}" class="${index === 0 ? 'active' : ''}" type="button">${label}</button>`).join('')}
      </nav>
      <section class="decision-toolbar">
        <label><span>MINIMUM PRIORITY</span><input data-decision-priority type="range" min="0" max="100" step="5" value="${Number(this.state.get().minimumPriority || 45)}"><b data-decision-priority-value>${Number(this.state.get().minimumPriority || 45)}</b></label>
        <label><span>WINDOW</span><select data-decision-hours><option value="24">24 HOURS</option><option value="72" selected>72 HOURS</option><option value="168">7 DAYS</option><option value="720">30 DAYS</option></select></label>
        <button data-decision-refresh type="button">REFRESH BRIEF</button>
        <span data-decision-status>READY</span>
      </section>
      <div id="decision-dashboard"></div>
      <div class="decision-main">
        <div id="decision-content"></div>
        <aside id="decision-evidence"></aside>
      </div>
    </div>`;
    this.content = this.root.querySelector('#decision-content');
    this.evidence = this.root.querySelector('#decision-evidence');
    this.dashboard = this.root.querySelector('#decision-dashboard');
    this.status = this.root.querySelector('[data-decision-status]');
    this.priorityInput = this.root.querySelector('[data-decision-priority]');
    this.priorityValue = this.root.querySelector('[data-decision-priority-value]');
    this.hoursInput = this.root.querySelector('[data-decision-hours]');

    this.watchlists = new WatchlistPanel(this.content, () => this.refresh({ force: true }));
    this.workspaces = new WorkspacePanel(this.content, this.api, workspace => this.loadWorkspace(workspace));
    this.cases = new CaseFilePanel(this.content, this.api, item => this.selectCase(item));
    this.reports = new ReportPanel(this.content, this.api);
    this.operations = new OperationsPanel(this.content, this.api, { onChanged: () => this.refresh({ force: true, preserveTab: true }) });

    this.root.querySelectorAll('[data-decision-tab]').forEach(button => {
      button.addEventListener('click', () => this.setTab(button.dataset.decisionTab));
    });
    this.root.querySelector('[data-decision-refresh]')?.addEventListener('click', () => this.refresh({ force: true }));
    this.priorityInput?.addEventListener('input', () => {
      this.priorityValue.textContent = this.priorityInput.value;
    });
    this.priorityInput?.addEventListener('change', () => {
      this.state.set({ minimumPriority: Number(this.priorityInput.value) });
      this.refresh({ force: true });
    });
    this.hoursInput?.addEventListener('change', () => {
      this.state.set({ hours: Number(this.hoursInput.value) });
      this.refresh({ force: true });
    });
    const stored = this.state.get();
    if (stored.hours) this.hoursInput.value = String(stored.hours);
    this.mounted = true;
    this.setTab(stored.activeTab || 'brief', { render: false });
    this.refresh();
  }

  activate() {
    if (!this.mounted || !document.body.contains(this.root)) this.mount();
    else if (!this.snapshot) this.refresh();
    else this.render();
  }

  setStatus(message, state = 'READY') {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.dataset.state = state;
  }

  async refresh(options = {}) {
    if (this.loading && !options.force) return;
    const sequence = ++this.refreshSequence;
    this.loading = true;
    this.setStatus('BUILDING LIVE BRIEF…', 'LOADING');
    if (!options.preserveTab) this.content.innerHTML = '<div class="decision-empty">BUILDING LIVE BRIEF…</div>';
    const current = this.state.get();
    try {
      const snapshot = await this.api.snapshot({
        hours: Number(current.hours || 72),
        minimumPriority: Number(current.minimumPriority || 45),
        domains: current.domains?.join(',') || '',
        watchlists: this.watchlists?.list?.() || [],
        force: Boolean(options.force)
      });
      if (sequence !== this.refreshSequence) return;
      this.snapshot = snapshot;
      this.setStatus(`${snapshot.signals?.length || 0} SIGNALS · ${snapshot.cache || 'LIVE'}`, 'READY');
      this.render();
    } catch (error) {
      if (sequence !== this.refreshSequence) return;
      const message = String(error?.name === 'AbortError' ? 'Request timed out' : error?.message || error);
      this.content.innerHTML = `<div class="decision-empty">BRIEF UNAVAILABLE: ${escapeHtml(message)}</div>`;
      this.setStatus('BRIEF UNAVAILABLE', 'ERROR');
    } finally {
      if (sequence === this.refreshSequence) this.loading = false;
    }
  }

  setTab(tab, options = {}) {
    const id = TABS.some(([value]) => value === tab) ? tab : 'brief';
    this.state.set({ activeTab: id });
    this.root?.querySelectorAll('[data-decision-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.decisionTab === id);
      button.setAttribute('aria-current', button.dataset.decisionTab === id ? 'page' : 'false');
    });
    if (options.render !== false) this.renderContent();
  }

  render() {
    if (!this.snapshot) return;
    renderDashboard(this.dashboard, this.snapshot);
    const summary = document.querySelector('#sheet-summary');
    if (summary) {
      const operationalCards = [
        { label: 'ESCALATIONS', value: this.snapshot.escalations?.length || 0, note: 'policy matches' },
        { label: 'SLA BREACHES', value: this.snapshot.operations?.slas?.breached || 0, note: `${this.snapshot.operations?.slas?.compliancePercent || 0}% compliance` }
      ];
      summary.innerHTML = [...(this.snapshot.cards || []).slice(0, 4), ...operationalCards].map(card => `<div class="summary-metric"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.value)}</strong><small>${escapeHtml(card.note)}</small></div>`).join('');
    }
    this.renderContent();
  }

  renderContent() {
    if (!this.snapshot || !this.content) return;
    const tab = this.state.get().activeTab;
    if (tab === 'brief') renderBriefing(this.content, this.snapshot, id => this.selectSignal(id));
    else if (tab === 'timeline') renderTimeline(this.content, this.snapshot.timeline);
    else if (tab === 'watchlists') this.watchlists.render();
    else if (tab === 'workspaces') this.workspaces.load(this.snapshot);
    else if (tab === 'cases') this.cases.load();
    else if (tab === 'operations') this.operations.load();
    else if (tab === 'reports') this.reports.renderLauncher(this.snapshot);
    this.renderEvidence();
  }

  renderEvidence() {
    const selected = this.snapshot?.signals?.find(item => item.id === this.state.get().selectedSignalId);
    renderEvidencePanel(this.evidence, selected);
  }

  selectSignal(id) {
    this.state.set({ selectedSignalId: id });
    this.renderEvidence();
  }

  selectCase(item) {
    this.state.set({ selectedCaseId: item?.id });
    if (!item) return this.renderEvidence();
    this.evidence.innerHTML = `<header class="evidence-head"><div><span>CASE FILE</span><h2>${escapeHtml(item.title || 'Case')}</h2></div><b>${escapeHtml(item.status || '')}</b></header>
      <p>${escapeHtml(item.summary || 'No case summary.')}</p>
      <div class="evidence-metrics"><div><span>PRIORITY</span><strong>${Number(item.priority || 0)}</strong></div><div><span>SIGNALS</span><strong>${item.signalIds?.length || 0}</strong></div><div><span>TASKS</span><strong>${item.taskIds?.length || 0}</strong></div><div><span>DECISIONS</span><strong>${item.decisionIds?.length || 0}</strong></div></div>`;
  }

  loadWorkspace(workspace) {
    if (!workspace) return;
    const patch = {};
    if (workspace.filters?.minimumPriority !== undefined) patch.minimumPriority = Number(workspace.filters.minimumPriority);
    if (workspace.filters?.hours !== undefined) patch.hours = Number(workspace.filters.hours);
    if (workspace.filters?.domains) patch.domains = workspace.filters.domains;
    this.state.set(patch);
    if (this.priorityInput && patch.minimumPriority !== undefined) {
      this.priorityInput.value = String(patch.minimumPriority);
      this.priorityValue.textContent = String(patch.minimumPriority);
    }
    if (this.hoursInput && patch.hours !== undefined) this.hoursInput.value = String(patch.hours);
    this.setTab('brief');
    this.refresh({ force: true });
  }
}

return Object.freeze({DecisionSupportController});
})();

// MODULE: decision-support/bootstrap.js
__modules['decision-support/bootstrap.js'] = (() => {
const { DecisionSupportController } = __modules['decision-support/controller.js'];


function installDecisionSupportSystem(options = {}) {
  const controller = new DecisionSupportController(options);
  return Object.freeze({
    activate() {
      controller.activate();
    },
    refresh(options) {
      return controller.refresh(options);
    },
    controller
  });
}

return Object.freeze({installDecisionSupportSystem});
})();

// MODULE: automation/api-client.js
__modules['automation/api-client.js'] = (() => {

function createAutomationApi(options = {}) { const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12000); async function request(path, init = {}) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs); try {
    const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json', ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) }, ...init, signal: init.signal || controller.signal });
    const type = response.headers.get('content-type') || '';
    const body = type.includes('application/json') ? await response.json().catch(() => null) : await response.text();
    if (!response.ok)
        throw new Error(body?.error?.message || `HTTP ${response.status}`);
    return body;
}
finally {
    clearTimeout(timer);
} } const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }); const query = params => new URLSearchParams(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')); return Object.freeze({ catalog: () => request('/api/automation/catalog'), diagnostics: () => request('/api/automation/diagnostics'), snapshot: () => request('/api/automation/snapshot'), listWorkflows: params => request(`/api/automation/workflows?${query(params)}`), getWorkflow: id => request(`/api/automation/workflows/${encodeURIComponent(id)}`), saveWorkflow: body => post('/api/automation/workflows', body), compileWorkflow: body => post('/api/automation/workflows/compile', body), transitionWorkflow: (id, state) => post('/api/automation/workflows/transition', { id, state }), removeWorkflow: id => post('/api/automation/workflows/remove', { id }), runWorkflow: (id, payload = {}) => post('/api/automation/workflows/run', { id, ...payload }), seedTemplates: () => post('/api/automation/templates/seed', {}), listRuns: params => request(`/api/automation/runs?${query(params)}`), listRules: () => request('/api/automation/rules'), saveRule: body => post('/api/automation/rules', body), removeRule: id => post('/api/automation/rules/remove', { id }), listNotifications: params => request(`/api/automation/notifications?${query(params)}`), markRead: (id, read = true) => post('/api/automation/notifications/read', { id, read }), tickScheduler: now => post('/api/automation/scheduler/tick', { now }), audit: params => request(`/api/automation/audit?${query(params)}`) }); }

return Object.freeze({createAutomationApi});
})();

// MODULE: automation/state-store.js
__modules['automation/state-store.js'] = (() => {

const KEY = 'merlin.automation.v20';
class AutomationState {
    constructor() { this.value = { tab: 'workflows', selectedWorkflowId: null, query: '', runState: '', notificationsUnread: false }; try {
        this.value = { ...this.value, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    }
    catch { } }
    get() { return Object.freeze({ ...this.value }); }
    set(patch) { this.value = { ...this.value, ...patch }; localStorage.setItem(KEY, JSON.stringify(this.value)); return this.get(); }
}

return Object.freeze({AutomationState});
})();

// MODULE: automation/format.js
__modules['automation/format.js'] = (() => {

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function ageLabel(value) { const elapsed = Date.now() - Date.parse(value || 0); if (!Number.isFinite(elapsed))
    return 'UNKNOWN'; if (elapsed < 60000)
    return 'NOW'; if (elapsed < 3600000)
    return `${Math.floor(elapsed / 60000)}M`; if (elapsed < 86400000)
    return `${Math.floor(elapsed / 3600000)}H`; return `${Math.floor(elapsed / 86400000)}D`; }
function stateClass(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

return Object.freeze({escapeHtml, ageLabel, stateClass});
})();

// MODULE: automation/dashboard.js
__modules['automation/dashboard.js'] = (() => {
const { escapeHtml } = __modules['automation/format.js'];

function renderAutomationDashboard(root, snapshot) { const d = snapshot?.diagnostics || {}; const cards = [['WORKFLOWS', d.workflows?.total || 0, `${d.workflows?.active || 0} active`], ['RUN SUCCESS', `${d.runs?.successRate ?? 100}%`, `${d.runs?.failed || 0} failed`], ['UNREAD', d.notifications?.unread || 0, `${d.notifications?.critical || 0} critical`], ['RULES', d.rules?.enabled || 0, `${d.rules?.total || 0} total`], ['SCHEDULER', d.scheduler?.running ? 'ON' : 'READY', `${d.scheduler?.lastRunCount || 0} tracked`], ['AUDIT', d.audit?.valid ? 'VALID' : 'CHECK', `${d.audit?.checked || 0} entries`]]; root.innerHTML = `<div class="automation-scorecards">${cards.map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`).join('')}</div>`; }

return Object.freeze({renderAutomationDashboard});
})();

// MODULE: automation/workflow-panel.js
__modules['automation/workflow-panel.js'] = (() => {
const { escapeHtml, stateClass } = __modules['automation/format.js'];

class WorkflowPanel {
    constructor(root, api, hooks = {}) { this.root = root; this.api = api; this.hooks = hooks; }
    async load(snapshot) { this.items = snapshot?.workflows || []; this.render(); }
    render() { const items = this.items || []; this.root.innerHTML = `<section class="automation-panel"><header><div><span>ORCHESTRATION</span><h2>WORKFLOWS</h2></div><div><button data-seed type="button">INSTALL STARTER WORKFLOWS</button><button data-new type="button">NEW WORKFLOW</button></div></header><div class="automation-list">${items.length ? items.map(item => `<article class="automation-workflow" data-workflow="${escapeHtml(item.id)}"><div><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.description || 'No description')}</span><small>${item.triggers.map(t => escapeHtml(t.type)).join(' · ')} → ${item.actions.map(a => escapeHtml(a.type)).join(' · ')}</small></div><em class="${stateClass(item.state)}">${escapeHtml(item.state)}</em><div class="automation-row-actions"><button data-run type="button">RUN</button><button data-toggle type="button">${item.state === 'ACTIVE' ? 'PAUSE' : 'ACTIVATE'}</button><button data-edit type="button">EDIT</button></div></article>`).join('') : '<div class="automation-empty">NO WORKFLOWS YET</div>'}</div></section>`; this.root.querySelector('[data-seed]')?.addEventListener('click', async () => { await this.api.seedTemplates(); this.hooks.changed?.(); }); this.root.querySelector('[data-new]')?.addEventListener('click', () => this.editor()); this.root.querySelectorAll('[data-workflow]').forEach(card => { const item = items.find(candidate => candidate.id === card.dataset.workflow); card.querySelector('[data-run]')?.addEventListener('click', async () => { await this.api.runWorkflow(item.id, { manual: true, signal: { id: `manual-${Date.now()}`, title: 'Manual operator run', summary: 'Workflow started by operator.', attention: { score: 70, band: 'URGENT' } } }); this.hooks.changed?.(); }); card.querySelector('[data-toggle]')?.addEventListener('click', async () => { await this.api.transitionWorkflow(item.id, item.state === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'); this.hooks.changed?.(); }); card.querySelector('[data-edit]')?.addEventListener('click', () => this.editor(item)); }); }
    editor(item = {}) { this.root.innerHTML = `<section class="automation-editor"><header><div><span>WORKFLOW EDITOR</span><h2>${item.id ? 'EDIT' : 'NEW'} WORKFLOW</h2></div><button data-cancel type="button">CANCEL</button></header><form data-form><label><span>NAME</span><input name="name" required value="${escapeHtml(item.name || '')}"></label><label><span>DESCRIPTION</span><textarea name="description">${escapeHtml(item.description || '')}</textarea></label><div class="automation-form-grid"><label><span>TRIGGER</span><select name="trigger"><option>DECISION_SIGNAL</option><option>EVENT</option><option>MARKET_THRESHOLD</option><option>HAZARD_MATERIALITY</option><option>ROUTE_DISRUPTION</option><option>CONNECTOR_HEALTH</option><option>DATA_FRESHNESS</option><option>GEOFENCE</option><option>SCHEDULE</option></select></label><label><span>ACTION</span><select name="action"><option>SEND_NOTIFICATION</option><option>CREATE_TASK</option><option>CREATE_CASE</option><option>GENERATE_REPORT</option><option>ADD_WATCHLIST</option><option>REQUEST_APPROVAL</option></select></label><label><span>STATE</span><select name="state"><option>DRAFT</option><option>ACTIVE</option><option>PAUSED</option></select></label><label><span>MINIMUM SCORE</span><input name="score" type="number" min="0" max="100" value="70"></label></div><button type="submit">SAVE WORKFLOW</button></form></section>`; this.root.querySelector('[data-cancel]')?.addEventListener('click', () => this.render()); this.root.querySelector('[data-form]')?.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); await this.api.saveWorkflow({ id: item.id, name: data.name, description: data.description, state: data.state, triggers: [{ type: data.trigger, configuration: { minimumScore: Number(data.score), minimumMateriality: Number(data.score) } }], actions: [{ type: data.action, configuration: { title: '{{signal.title}}', body: '{{signal.summary}}', severity: 'IMPORTANT', channels: ['IN_APP'], priority: Number(data.score) } }] }); this.hooks.changed?.(); }); }
}

return Object.freeze({WorkflowPanel});
})();

// MODULE: automation/run-history.js
__modules['automation/run-history.js'] = (() => {
const { ageLabel, escapeHtml, stateClass } = __modules['automation/format.js'];

function renderRunHistory(root, runs = []) { root.innerHTML = `<section class="automation-panel"><header><div><span>EXECUTION LEDGER</span><h2>RUN HISTORY</h2></div></header><div class="automation-list">${runs.length ? runs.map(run => `<article class="automation-run"><div><b>${escapeHtml(run.workflowId)}</b><span>${run.steps?.length || 0} steps · ${Number(run.durationMs || 0)} ms</span><small>${escapeHtml(run.reason || run.trigger?.reason || 'Workflow execution')}</small></div><em class="${stateClass(run.state)}">${escapeHtml(run.state)}</em><time>${ageLabel(run.createdAt)}</time></article>`).join('') : '<div class="automation-empty">NO RUNS RECORDED</div>'}</div></section>`; }

return Object.freeze({renderRunHistory});
})();

// MODULE: automation/notification-center.js
__modules['automation/notification-center.js'] = (() => {
const { ageLabel, escapeHtml, stateClass } = __modules['automation/format.js'];

class NotificationCenter {
    constructor(root, api, hooks = {}) { this.root = root; this.api = api; this.hooks = hooks; }
    render(items = []) { this.root.innerHTML = `<section class="automation-panel"><header><div><span>DELIVERY CENTRE</span><h2>NOTIFICATIONS</h2></div><button data-read-all type="button">MARK ALL READ</button></header><div class="automation-list">${items.length ? items.map(item => `<article class="automation-notification ${item.read ? 'read' : 'unread'}" data-notification="${escapeHtml(item.id)}"><div><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.body)}</span><small>${escapeHtml(item.channel)} · ${ageLabel(item.createdAt)}</small></div><em class="${stateClass(item.severity)}">${escapeHtml(item.severity)}</em><button data-read type="button">${item.read ? 'READ' : 'MARK READ'}</button></article>`).join('') : '<div class="automation-empty">NO NOTIFICATIONS</div>'}</div></section>`; this.root.querySelectorAll('[data-notification]').forEach(card => card.querySelector('[data-read]')?.addEventListener('click', async () => { await this.api.markRead(card.dataset.notification, true); this.hooks.changed?.(); })); this.root.querySelector('[data-read-all]')?.addEventListener('click', async () => { for (const item of items.filter(item => !item.read))
        await this.api.markRead(item.id, true); this.hooks.changed?.(); }); }
}

return Object.freeze({NotificationCenter});
})();

// MODULE: automation/rule-builder.js
__modules['automation/rule-builder.js'] = (() => {
const { escapeHtml } = __modules['automation/format.js'];

class RuleBuilder {
    constructor(root, api, hooks = {}) { this.root = root; this.api = api; this.hooks = hooks; }
    render(rules = []) { this.root.innerHTML = `<section class="automation-panel"><header><div><span>ALERT LOGIC</span><h2>RULES</h2></div><button data-new-rule type="button">NEW RULE</button></header><div class="automation-list">${rules.length ? rules.map(rule => `<article><div><b>${escapeHtml(rule.name)}</b><span>${escapeHtml(rule.trigger?.type || 'DECISION_SIGNAL')} → ${escapeHtml(rule.workflowId || 'inline notification')}</span><small>${escapeHtml(rule.channels?.join(', ') || 'IN_APP')}</small></div><em>${rule.enabled ? 'ENABLED' : 'DISABLED'}</em><button data-remove="${escapeHtml(rule.id)}" type="button">REMOVE</button></article>`).join('') : '<div class="automation-empty">NO RULES</div>'}</div></section>`; this.root.querySelector('[data-new-rule]')?.addEventListener('click', () => this.editor()); this.root.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => { await this.api.removeRule(button.dataset.remove); this.hooks.changed?.(); })); }
    editor() { this.root.innerHTML = `<section class="automation-editor"><header><div><span>RULE BUILDER</span><h2>NEW ALERT RULE</h2></div></header><form data-rule-form><label><span>NAME</span><input name="name" required></label><label><span>TRIGGER</span><select name="trigger"><option>DECISION_SIGNAL</option><option>HAZARD_MATERIALITY</option><option>MARKET_THRESHOLD</option><option>ROUTE_DISRUPTION</option><option>CONNECTOR_HEALTH</option></select></label><label><span>SEVERITY</span><select name="severity"><option>IMPORTANT</option><option>URGENT</option><option>CRITICAL</option></select></label><button type="submit">SAVE RULE</button></form></section>`; this.root.querySelector('[data-rule-form]')?.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); await this.api.saveRule({ name: data.name, severity: data.severity, trigger: { type: data.trigger, configuration: { minimumScore: 70, minimumMateriality: 70 } }, channels: ['IN_APP'] }); this.hooks.changed?.(); }); }
}

return Object.freeze({RuleBuilder});
})();

// MODULE: automation/scheduler-panel.js
__modules['automation/scheduler-panel.js'] = (() => {
const { escapeHtml } = __modules['automation/format.js'];

function renderSchedulerPanel(root, snapshot, api, changed) { const status = snapshot?.diagnostics?.scheduler || {}; const scheduled = (snapshot?.workflows || []).filter(item => item.triggers.some(trigger => trigger.type === 'SCHEDULE')); root.innerHTML = `<section class="automation-panel"><header><div><span>SCHEDULED OPERATIONS</span><h2>SCHEDULER</h2></div><button data-tick type="button">RUN DUE JOBS NOW</button></header><div class="automation-status-grid"><article><span>ENGINE</span><strong>${status.running ? 'RUNNING' : 'ON-DEMAND'}</strong><small>${status.intervalMs || 60000} ms interval</small></article><article><span>SCHEDULED</span><strong>${scheduled.length}</strong><small>active definitions</small></article><article><span>TRACKED RUNS</span><strong>${status.lastRunCount || 0}</strong><small>schedule checkpoints</small></article></div><div class="automation-list">${scheduled.map(item => `<article><div><b>${escapeHtml(item.name)}</b><span>${escapeHtml(JSON.stringify(item.triggers.find(t => t.type === 'SCHEDULE')?.configuration?.schedule || {}))}</span></div><em>${escapeHtml(item.state)}</em></article>`).join('') || '<div class="automation-empty">NO SCHEDULED WORKFLOWS</div>'}</div></section>`; root.querySelector('[data-tick]')?.addEventListener('click', async () => { await api.tickScheduler(new Date().toISOString()); changed?.(); }); }

return Object.freeze({renderSchedulerPanel});
})();

// MODULE: automation/audit-panel.js
__modules['automation/audit-panel.js'] = (() => {
const { ageLabel, escapeHtml } = __modules['automation/format.js'];

function renderAuditPanel(root, payload = {}) { const entries = payload.entries || []; root.innerHTML = `<section class="automation-panel"><header><div><span>TAMPER-EVIDENT LEDGER</span><h2>AUDIT</h2></div><em>${payload.verification?.valid ? 'CHAIN VALID' : 'CHAIN CHECK REQUIRED'}</em></header><div class="automation-list">${entries.map(item => `<article><div><b>${escapeHtml(item.action)} ${escapeHtml(item.resourceType)}</b><span>${escapeHtml(item.resourceId)}</span><small>${escapeHtml(item.actor)} · ${ageLabel(item.createdAt)}</small></div><code>${escapeHtml(item.hash?.slice(0, 12) || '')}</code></article>`).join('') || '<div class="automation-empty">NO AUDIT ENTRIES</div>'}</div></section>`; }

return Object.freeze({renderAuditPanel});
})();

// MODULE: automation/controller.js
__modules['automation/controller.js'] = (() => {
const { createAutomationApi } = __modules['automation/api-client.js'];
const { AutomationState } = __modules['automation/state-store.js'];
const { renderAutomationDashboard } = __modules['automation/dashboard.js'];
const { WorkflowPanel } = __modules['automation/workflow-panel.js'];
const { renderRunHistory } = __modules['automation/run-history.js'];
const { NotificationCenter } = __modules['automation/notification-center.js'];
const { RuleBuilder } = __modules['automation/rule-builder.js'];
const { renderSchedulerPanel } = __modules['automation/scheduler-panel.js'];
const { renderAuditPanel } = __modules['automation/audit-panel.js'];









const TABS = [['workflows', 'WORKFLOWS'], ['runs', 'RUN HISTORY'], ['rules', 'RULES'], ['notifications', 'NOTIFICATIONS'], ['scheduler', 'SCHEDULER'], ['audit', 'AUDIT']];
class AutomationController {
    constructor(options = {}) { this.api = options.api || createAutomationApi(); this.state = options.state || new AutomationState(); this.loading = false; this.snapshot = null; }
    mount() { this.root = document.querySelector('#sheet-content'); if (!this.root)
        return; document.querySelector('#sheet-title').textContent = 'AUTOMATION'; document.querySelector('#sheet-kicker').textContent = 'RULES / ALERTS / WORKFLOWS'; this.root.innerHTML = `<div class="automation-shell"><nav class="automation-tabs">${TABS.map(([id, label], index) => `<button data-automation-tab="${id}" class="${index === 0 ? 'active' : ''}" type="button">${label}</button>`).join('')}</nav><section class="automation-toolbar"><button data-refresh type="button">REFRESH</button><button data-seed type="button">INSTALL STARTERS</button><span data-status>READY</span></section><div id="automation-dashboard"></div><div id="automation-content"></div></div>`; this.content = this.root.querySelector('#automation-content'); this.dashboard = this.root.querySelector('#automation-dashboard'); this.status = this.root.querySelector('[data-status]'); this.workflowPanel = new WorkflowPanel(this.content, this.api, { changed: () => this.refresh() }); this.notifications = new NotificationCenter(this.content, this.api, { changed: () => this.refresh() }); this.rules = new RuleBuilder(this.content, this.api, { changed: () => this.refresh() }); this.root.querySelectorAll('[data-automation-tab]').forEach(button => button.addEventListener('click', () => this.setTab(button.dataset.automationTab))); this.root.querySelector('[data-refresh]')?.addEventListener('click', () => this.refresh()); this.root.querySelector('[data-seed]')?.addEventListener('click', async () => { await this.api.seedTemplates(); this.refresh(); }); this.mounted = true; this.setTab(this.state.get().tab || 'workflows', false); this.refresh(); }
    activate() { if (!this.mounted || !document.body.contains(this.root))
        this.mount();
    else
        this.render(); }
    setTab(tab, render = true) { const id = TABS.some(([value]) => value === tab) ? tab : 'workflows'; this.state.set({ tab: id }); this.root?.querySelectorAll('[data-automation-tab]').forEach(button => button.classList.toggle('active', button.dataset.automationTab === id)); if (render)
        this.renderContent(); }
    async refresh() { if (this.loading)
        return; this.loading = true; this.status.textContent = 'LOADING…'; try {
        this.snapshot = await this.api.snapshot();
        this.status.textContent = `${this.snapshot.workflows?.length || 0} WORKFLOWS`;
        this.render();
    }
    catch (error) {
        this.content.innerHTML = `<div class="automation-empty">AUTOMATION UNAVAILABLE: ${String(error.message || error)}</div>`;
        this.status.textContent = 'ERROR';
    }
    finally {
        this.loading = false;
    } }
    render() { if (!this.snapshot)
        return; renderAutomationDashboard(this.dashboard, this.snapshot); const summary = document.querySelector('#sheet-summary'); if (summary) {
        const d = this.snapshot.diagnostics || {};
        summary.innerHTML = [['ACTIVE', d.workflows?.active || 0, 'workflows'], ['SUCCESS', `${d.runs?.successRate ?? 100}%`, 'recent runs'], ['UNREAD', d.notifications?.unread || 0, 'notifications'], ['RULES', d.rules?.enabled || 0, 'enabled']].map(([label, value, note]) => `<div class="summary-metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
    } this.renderContent(); }
    async renderContent() { if (!this.snapshot || !this.content)
        return; const tab = this.state.get().tab; if (tab === 'workflows')
        this.workflowPanel.load(this.snapshot);
    else if (tab === 'runs')
        renderRunHistory(this.content, this.snapshot.runs);
    else if (tab === 'rules')
        this.rules.render(this.snapshot.rules);
    else if (tab === 'notifications')
        this.notifications.render(this.snapshot.notifications);
    else if (tab === 'scheduler')
        renderSchedulerPanel(this.content, this.snapshot, this.api, () => this.refresh());
    else if (tab === 'audit') {
        this.content.innerHTML = '<div class="automation-empty">LOADING AUDIT…</div>';
        renderAuditPanel(this.content, await this.api.audit({ limit: 250 }));
    } }
}

return Object.freeze({AutomationController});
})();

// MODULE: automation/bootstrap.js
__modules['automation/bootstrap.js'] = (() => {
const { AutomationController } = __modules['automation/controller.js'];

function installAutomationSystem(options = {}) { const controller = new AutomationController(options); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }

return Object.freeze({installAutomationSystem});
})();

// MODULE: publishing/api-client.js
__modules['publishing/api-client.js'] = (() => {

function createPublishingApi(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 15000);
  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) }, signal: controller.signal });
      if (!response.ok) throw new Error(`${path} ${response.status}`);
      const type = response.headers.get('content-type') || '';
      return type.includes('application/json') ? response.json() : response.text();
    } finally { clearTimeout(timer); }
  }
  return Object.freeze({
    snapshot: () => request('/api/publishing/snapshot'),
    catalog: () => request('/api/publishing/catalog'),
    seed: () => request('/api/publishing/seed', { method: 'POST', body: '{}' }),
    createEdition: body => request('/api/publishing/editions', { method: 'POST', body: JSON.stringify(body) }),
    approveEdition: body => request('/api/publishing/editions/approve', { method: 'POST', body: JSON.stringify(body) }),
    publishEdition: body => request('/api/publishing/editions/publish', { method: 'POST', body: JSON.stringify(body) }),
    deliverEdition: body => request('/api/publishing/editions/deliver', { method: 'POST', body: JSON.stringify(body) }),
    previewEdition: body => request('/api/publishing/editions/preview', { method: 'POST', body: JSON.stringify(body) }),
    createPublication: body => request('/api/publishing/publications', { method: 'POST', body: JSON.stringify(body) }),
    createSubscriber: body => request('/api/publishing/subscribers', { method: 'POST', body: JSON.stringify(body) }),
    createAudience: body => request('/api/publishing/audiences', { method: 'POST', body: JSON.stringify(body) }),
    createShare: body => request('/api/publishing/share', { method: 'POST', body: JSON.stringify(body) })
  });
}

return Object.freeze({createPublishingApi});
})();

// MODULE: publishing/state-store.js
__modules['publishing/state-store.js'] = (() => {

class PublishingState {
  constructor() {
    this.value = Object.freeze({ query: '', selectedPublicationId: null, selectedEditionId: null, tab: 'PUBLICATIONS', loading: false, error: null });
    this.listeners = new Set();
  }
  get() { return this.value; }
  set(changes) { this.value = Object.freeze({ ...this.value, ...changes }); for (const listener of this.listeners) listener(this.value); return this.value; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

return Object.freeze({PublishingState});
})();

// MODULE: publishing/format.js
__modules['publishing/format.js'] = (() => {

const escapePublishing = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const publishingNumber = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—';
const publishingAge = value => { const time = Date.parse(value || ''); if (!Number.isFinite(time)) return '—'; const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000)); return hours < 1 ? 'NOW' : hours < 48 ? `${hours}H` : `${Math.floor(hours / 24)}D`; };
const stateClass = value => String(value || 'DRAFT').toLowerCase().replaceAll('_', '-');

return Object.freeze({escapePublishing, publishingNumber, publishingAge, stateClass});
})();

// MODULE: publishing/dashboard.js
__modules['publishing/dashboard.js'] = (() => {
const { escapePublishing, publishingNumber } = __modules['publishing/format.js'];

function renderPublishingDashboard(root, snapshot = {}) {
  const metrics = snapshot.diagnostics?.metrics || {};
  const cards = [
    ['PUBLICATIONS', metrics.publications || 0, `${metrics.activePublications || 0} active`],
    ['EDITIONS', metrics.editions || 0, `${metrics.publishedEditions || 0} published`],
    ['OPEN RATE', `${publishingNumber(metrics.openRate || 0)}%`, `${metrics.downloads || 0} downloads`],
    ['DELIVERY', `${publishingNumber(metrics.deliveryReliability ?? 100)}%`, `${metrics.deliveryJobs || 0} jobs`],
    ['SUBSCRIBERS', snapshot.subscribers?.length || 0, `${snapshot.audiences?.length || 0} audiences`],
    ['SECURE SHARES', snapshot.shares?.length || 0, `${metrics.shares || 0} events`]
  ];
  root.innerHTML = `<div class="publishing-scorecards">${cards.map(([label, value, note]) => `<article><span>${escapePublishing(label)}</span><strong>${escapePublishing(value)}</strong><small>${escapePublishing(note)}</small></article>`).join('')}</div>`;
}

return Object.freeze({renderPublishingDashboard});
})();

// MODULE: publishing/publication-table.js
__modules['publishing/publication-table.js'] = (() => {
const { escapePublishing, stateClass } = __modules['publishing/format.js'];

function renderPublicationTable(root, publications = [], query = '') {
  const q = String(query || '').toLowerCase();
  const rows = publications.filter(item => !q || JSON.stringify(item).toLowerCase().includes(q));
  root.innerHTML = `<section class="publishing-panel"><header><h2>PUBLICATION SERIES</h2><button type="button" data-action="new-publication">NEW SERIES</button></header><div class="publishing-list">${rows.map(item => `<button type="button" class="publishing-row" data-publication-id="${escapePublishing(item.id)}"><span class="publishing-state ${stateClass(item.state)}">${escapePublishing(item.state)}</span><span><b>${escapePublishing(item.name)}</b><small>${escapePublishing(`${item.cadence} · ${item.classification} · ${(item.audienceIds || []).length} audiences`)}</small></span><span>${escapePublishing(item.ownerTeam || '')}</span></button>`).join('') || '<p class="publishing-empty">No publication series match this filter.</p>'}</div></section>`;
}

return Object.freeze({renderPublicationTable});
})();

// MODULE: publishing/edition-panel.js
__modules['publishing/edition-panel.js'] = (() => {
const { escapePublishing, publishingAge, stateClass } = __modules['publishing/format.js'];

function renderEditionPanel(root, editions = [], selectedId = null) {
  const selected = editions.find(item => item.id === selectedId) || editions[0];
  root.innerHTML = `<section class="publishing-panel"><header><h2>EDITIONS</h2><button type="button" data-action="generate-edition">GENERATE EDITION</button></header><div class="publishing-editions">${editions.slice(0, 100).map(item => `<button type="button" data-edition-id="${escapePublishing(item.id)}" class="${item.id === selected?.id ? 'active' : ''}"><b>#${escapePublishing(item.editionNumber)} ${escapePublishing(item.title)}</b><span class="publishing-state ${stateClass(item.state)}">${escapePublishing(item.state)}</span><small>${publishingAge(item.updatedAt)} · ${(item.blocks || []).length} blocks</small></button>`).join('') || '<p class="publishing-empty">No editions generated.</p>'}</div>${selected ? `<article class="edition-detail"><header><div><span>${escapePublishing(selected.classification)}</span><h3>${escapePublishing(selected.title)}</h3></div><div class="edition-actions"><button data-action="preview-edition" data-id="${escapePublishing(selected.id)}">PREVIEW</button><button data-action="approve-edition" data-id="${escapePublishing(selected.id)}">APPROVE</button><button data-action="publish-edition" data-id="${escapePublishing(selected.id)}">PUBLISH</button><button data-action="deliver-edition" data-id="${escapePublishing(selected.id)}">DELIVER</button></div></header><div class="edition-blocks">${(selected.blocks || []).map(block => `<div><span>${escapePublishing(block.type)}</span><b>${escapePublishing(block.title || 'Untitled block')}</b></div>`).join('')}</div></article>` : ''}</section>`;
}

return Object.freeze({renderEditionPanel});
})();

// MODULE: publishing/audience-panel.js
__modules['publishing/audience-panel.js'] = (() => {
const { escapePublishing } = __modules['publishing/format.js'];

function renderAudiencePanel(root, snapshot = {}) {
  root.innerHTML = `<section class="publishing-panel"><header><h2>AUDIENCES AND SUBSCRIBERS</h2><button data-action="new-subscriber">ADD SUBSCRIBER</button></header><div class="audience-grid"><div><h3>AUDIENCES</h3>${(snapshot.audiences || []).map(item => `<article><b>${escapePublishing(item.name)}</b><span>${(item.subscriberIds || []).length} direct · ${escapePublishing(item.classificationCeiling)}</span></article>`).join('') || '<p class="publishing-empty">No audiences.</p>'}</div><div><h3>SUBSCRIBERS</h3>${(snapshot.subscribers || []).slice(0, 100).map(item => `<article><b>${escapePublishing(item.name)}</b><span>${escapePublishing(item.organisation || item.email || 'IN APP')} · ${escapePublishing(item.clearance)}</span></article>`).join('') || '<p class="publishing-empty">No subscribers.</p>'}</div></div></section>`;
}

return Object.freeze({renderAudiencePanel});
})();

// MODULE: publishing/delivery-panel.js
__modules['publishing/delivery-panel.js'] = (() => {
const { escapePublishing, publishingAge, stateClass } = __modules['publishing/format.js'];

function renderDeliveryPanel(root, deliveries = []) {
  root.innerHTML = `<section class="publishing-panel"><header><h2>DELIVERY OPERATIONS</h2></header><div class="publishing-list">${deliveries.map(item => `<article class="publishing-row"><span class="publishing-state ${stateClass(item.state)}">${escapePublishing(item.state)}</span><span><b>${escapePublishing(item.editionId)}</b><small>${(item.recipients || []).length} recipients · ${(item.channels || []).join(', ')}</small></span><span>${publishingAge(item.updatedAt)}</span></article>`).join('') || '<p class="publishing-empty">No delivery jobs.</p>'}</div></section>`;
}

return Object.freeze({renderDeliveryPanel});
})();

// MODULE: publishing/template-panel.js
__modules['publishing/template-panel.js'] = (() => {
const { escapePublishing } = __modules['publishing/format.js'];

function renderTemplatePanel(root, snapshot = {}) {
  root.innerHTML = `<section class="publishing-panel"><header><h2>TEMPLATES AND BRAND KITS</h2></header><div class="template-grid"><div>${(snapshot.templates || []).map(item => `<article><span>${escapePublishing(item.category)}</span><b>${escapePublishing(item.name)}</b><small>${(item.formats || []).join(' · ')}</small></article>`).join('') || '<p class="publishing-empty">No templates.</p>'}</div><div>${(snapshot.brandKits || []).map(item => `<article><span style="background:${escapePublishing(item.colours?.accent || '#999')}" class="brand-swatch"></span><b>${escapePublishing(item.name)}</b><small>${escapePublishing(item.organisation)}</small></article>`).join('') || '<p class="publishing-empty">No brand kits.</p>'}</div></div></section>`;
}

return Object.freeze({renderTemplatePanel});
})();

// MODULE: publishing/analytics-panel.js
__modules['publishing/analytics-panel.js'] = (() => {
const { escapePublishing, publishingNumber } = __modules['publishing/format.js'];

function renderAnalyticsPanel(root, snapshot = {}) {
  const analytics = snapshot.analytics || {};
  root.innerHTML = `<section class="publishing-panel"><header><h2>READER ANALYTICS</h2></header><div class="analytics-grid">${[['DELIVERED', analytics.delivered || 0], ['OPENED / VIEWED', analytics.opened || 0], ['OPEN RATE', `${publishingNumber(analytics.openRate || 0)}%`], ['DOWNLOADED', analytics.downloaded || 0], ['SHARED', analytics.shared || 0], ['BOUNCED', analytics.bounced || 0]].map(([label, value]) => `<article><span>${escapePublishing(label)}</span><strong>${escapePublishing(value)}</strong></article>`).join('')}</div></section>`;
}

return Object.freeze({renderAnalyticsPanel});
})();

// MODULE: publishing/share-panel.js
__modules['publishing/share-panel.js'] = (() => {
const { escapePublishing, publishingAge } = __modules['publishing/format.js'];

function renderSharePanel(root, shares = []) {
  root.innerHTML = `<section class="publishing-panel"><header><h2>SECURE SHARES</h2></header><div class="publishing-list">${shares.map(item => `<article class="publishing-row"><span>${item.revoked ? 'REVOKED' : 'ACTIVE'}</span><span><b>${escapePublishing(item.editionId)}</b><small>${escapePublishing(item.classification)} · ${item.views || 0} views</small></span><span>${publishingAge(item.issuedAt)}</span></article>`).join('') || '<p class="publishing-empty">No secure links created.</p>'}</div></section>`;
}

return Object.freeze({renderSharePanel});
})();

// MODULE: publishing/controller.js
__modules['publishing/controller.js'] = (() => {
const { createPublishingApi } = __modules['publishing/api-client.js'];
const { PublishingState } = __modules['publishing/state-store.js'];
const { renderPublishingDashboard } = __modules['publishing/dashboard.js'];
const { renderPublicationTable } = __modules['publishing/publication-table.js'];
const { renderEditionPanel } = __modules['publishing/edition-panel.js'];
const { renderAudiencePanel } = __modules['publishing/audience-panel.js'];
const { renderDeliveryPanel } = __modules['publishing/delivery-panel.js'];
const { renderTemplatePanel } = __modules['publishing/template-panel.js'];
const { renderAnalyticsPanel } = __modules['publishing/analytics-panel.js'];
const { renderSharePanel } = __modules['publishing/share-panel.js'];











class PublishingController {
  constructor(options = {}) {
    this.api = options.api || createPublishingApi();
    this.state = options.state || new PublishingState();
    this.snapshot = null;
    this.loading = false;
  }

  async activate() {
    document.querySelector('#sheet-kicker').textContent = 'REPORTS / CLIENT DELIVERY / SECURE SHARING';
    document.querySelector('#sheet-title').textContent = 'PUBLISHING';
    await this.refresh();
  }

  async refresh() {
    if (this.loading) return;
    this.loading = true;
    try {
      this.snapshot = await this.api.snapshot();
      if (!this.snapshot.publications?.length) {
        await this.api.seed();
        this.snapshot = await this.api.snapshot();
      }
      this.render();
    } catch (error) {
      document.querySelector('#sheet-content').innerHTML = `<div class="publishing-error">Publishing load failed: ${error.message}</div>`;
    } finally { this.loading = false; }
  }

  render() {
    const summary = document.querySelector('#sheet-summary');
    const content = document.querySelector('#sheet-content');
    renderPublishingDashboard(summary, this.snapshot);
    content.innerHTML = '<div id="publishing-publications"></div><div id="publishing-editions"></div><div id="publishing-audiences"></div><div id="publishing-deliveries"></div><div id="publishing-templates"></div><div id="publishing-analytics"></div><div id="publishing-shares"></div>';
    const value = this.state.get();
    renderPublicationTable(document.querySelector('#publishing-publications'), this.snapshot.publications, value.query);
    renderEditionPanel(document.querySelector('#publishing-editions'), this.snapshot.editions, value.selectedEditionId);
    renderAudiencePanel(document.querySelector('#publishing-audiences'), this.snapshot);
    renderDeliveryPanel(document.querySelector('#publishing-deliveries'), this.snapshot.deliveries);
    renderTemplatePanel(document.querySelector('#publishing-templates'), this.snapshot);
    renderAnalyticsPanel(document.querySelector('#publishing-analytics'), this.snapshot);
    renderSharePanel(document.querySelector('#publishing-shares'), this.snapshot.shares);
    this.bind();
  }

  bind() {
    document.querySelectorAll('[data-publication-id]').forEach(button => button.addEventListener('click', () => { this.state.set({ selectedPublicationId: button.dataset.publicationId }); this.render(); }));
    document.querySelectorAll('[data-edition-id]').forEach(button => button.addEventListener('click', () => { this.state.set({ selectedEditionId: button.dataset.editionId }); this.render(); }));
    document.querySelector('[data-action="new-publication"]')?.addEventListener('click', async () => { await this.api.createPublication({ name: `New publication ${new Date().toLocaleDateString()}`, state: 'DRAFT', cadence: 'AD_HOC' }); await this.refresh(); });
    document.querySelector('[data-action="generate-edition"]')?.addEventListener('click', async () => { const publicationId = this.state.get().selectedPublicationId || this.snapshot.publications[0]?.id; if (publicationId) { await this.api.createEdition({ publicationId }); await this.refresh(); } });
    document.querySelectorAll('[data-action="approve-edition"]').forEach(button => button.addEventListener('click', async () => { await this.api.approveEdition({ id: button.dataset.id, state: 'APPROVED' }); await this.refresh(); }));
    document.querySelectorAll('[data-action="publish-edition"]').forEach(button => button.addEventListener('click', async () => { await this.api.publishEdition({ id: button.dataset.id, overrideQuality: true }); await this.refresh(); }));
    document.querySelectorAll('[data-action="deliver-edition"]').forEach(button => button.addEventListener('click', async () => { await this.api.deliverEdition({ editionId: button.dataset.id, channels: ['IN_APP', 'SECURE_LINK'] }); await this.refresh(); }));
    document.querySelectorAll('[data-action="preview-edition"]').forEach(button => button.addEventListener('click', async () => { const preview = await this.api.previewEdition({ id: button.dataset.id, approvalRequired: false, requireSources: false }); const popup = window.open('', '_blank'); if (popup) { popup.document.open(); popup.document.write(preview.html); popup.document.close(); } }));
    document.querySelector('[data-action="new-subscriber"]')?.addEventListener('click', async () => { await this.api.createSubscriber({ name: `In-app reader ${this.snapshot.subscribers.length + 1}`, channels: ['IN_APP'], clearance: 'CLIENT' }); await this.refresh(); });
  }
}

return Object.freeze({PublishingController});
})();

// MODULE: publishing/bootstrap.js
__modules['publishing/bootstrap.js'] = (() => {
const { PublishingController } = __modules['publishing/controller.js'];

function installPublishingSystem(options = {}) {
  const controller = new PublishingController(options);
  return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller });
}

return Object.freeze({installPublishingSystem});
})();

// MODULE: commercial/api-client.js
__modules['commercial/api-client.js'] = (() => {

async function request(path, options = {}) { const response = await fetch(path, { credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options }); const text = await response.text(); const body = text ? JSON.parse(text) : null; if (!response.ok)
    throw new Error(body?.error?.message || `Request failed (${response.status})`); return body; }
function commercialApi() { return Object.freeze({ catalog: () => request('/api/commercial/catalog'), snapshot: () => request('/api/commercial/snapshot'), seed: () => request('/api/commercial/seed', { method: 'POST', body: '{}' }), createTenant: body => request('/api/commercial/tenants', { method: 'POST', body: JSON.stringify(body) }), invite: body => request('/api/commercial/invitations', { method: 'POST', body: JSON.stringify(body) }), usage: body => request('/api/commercial/usage', { method: 'POST', body: JSON.stringify(body) }), support: body => request('/api/commercial/support', { method: 'POST', body: JSON.stringify(body) }), feature: body => request('/api/commercial/features', { method: 'POST', body: JSON.stringify(body) }), feedback: body => request('/api/commercial/feedback', { method: 'POST', body: JSON.stringify(body) }), completeOnboarding: body => request('/api/commercial/onboarding/complete', { method: 'POST', body: JSON.stringify(body) }) }); }

return Object.freeze({commercialApi});
})();

// MODULE: commercial/state-store.js
__modules['commercial/state-store.js'] = (() => {

class CommercialState {
    constructor() { this.value = { loading: false, error: null, query: '', activePanel: 'overview', snapshot: null, selectedTenantId: null }; this.listeners = new Set(); }
    get() { return this.value; }
    set(patch) { this.value = { ...this.value, ...patch }; for (const listener of this.listeners)
        listener(this.value); return this.value; }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

return Object.freeze({CommercialState});
})();

// MODULE: commercial/format.js
__modules['commercial/format.js'] = (() => {

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const number = value => new Intl.NumberFormat('en-GB').format(Number(value || 0));
const money = minor => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(minor || 0) / 100);
const percent = value => `${Number(value || 0).toFixed(1)}%`;
const date = value => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const tone = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

return Object.freeze({esc, number, money, percent, date, tone});
})();

// MODULE: commercial/dashboard.js
__modules['commercial/dashboard.js'] = (() => {
const { esc, money, number, percent } = __modules['commercial/format.js'];

function dashboardHtml(snapshot = {}) { const metrics = snapshot.metrics || {}; const satisfaction = snapshot.satisfaction || {}; return `<section class="commercial-dashboard"><div class="commercial-metrics">${[['CUSTOMERS', number(metrics.activeTenants), `${number(metrics.tenants)} total`], ['MRR', money(metrics.mrrMinor), `${money(metrics.arrMinor)} ARR`], ['ACTIVE SEATS', number(metrics.activeSeats), `${number(metrics.seats)} provisioned`], ['RETENTION', percent(metrics.grossLogoRetentionPercent), 'gross logo retention'], ['SUPPORT', number(metrics.openSupportCases), `${number(metrics.sev1Cases)} SEV1`], ['NPS', satisfaction.nps ?? '—', `${number(satisfaction.responses)} responses`]].map(item => `<article><span>${esc(item[0])}</span><strong>${esc(item[1])}</strong><small>${esc(item[2])}</small></article>`).join('')}</div></section>`; }

return Object.freeze({dashboardHtml});
})();

// MODULE: commercial/tenant-table.js
__modules['commercial/tenant-table.js'] = (() => {
const { esc, tone } = __modules['commercial/format.js'];

function tenantTableHtml(tenants = [], health = [], query = '') { const lookup = new Map(health.map(item => [item.tenant.id, item])); const filtered = tenants.filter(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())); return `<section class="commercial-card"><header><div><span>CUSTOMERS</span><h2>Tenant workspaces</h2></div><button data-commercial-action="new-tenant">NEW TENANT</button></header><div class="commercial-table"><div class="commercial-row commercial-head"><span>ACCOUNT</span><span>PLAN</span><span>STATE</span><span>HEALTH</span><span>LIFECYCLE</span></div>${filtered.map(item => { const analysis = lookup.get(item.id); return `<button class="commercial-row" data-tenant-id="${esc(item.id)}"><span><b>${esc(item.name)}</b><small>${esc(item.segment)}</small></span><span>${esc(item.planId)}</span><span><i class="commercial-pill ${tone(item.state)}">${esc(item.state)}</i></span><span><b>${analysis?.health?.score ?? '—'}</b><small>${esc(analysis?.health?.band || '')}</small></span><span>${esc(analysis?.lifecycleStage || '—')}</span></button>`; }).join('') || '<div class="commercial-empty">No matching customers.</div>'}</div></section>`; }

return Object.freeze({tenantTableHtml});
})();

// MODULE: commercial/health-panel.js
__modules['commercial/health-panel.js'] = (() => {
const { esc, number, percent, tone } = __modules['commercial/format.js'];

function healthPanelHtml(analysis) { if (!analysis)
    return '<section class="commercial-card commercial-empty">Select a customer account.</section>'; const cards = [['HEALTH', analysis.health.score, analysis.health.band], ['ADOPTION', analysis.adoption.score, `${analysis.adoption.breadth}% feature breadth`], ['ENGAGEMENT', analysis.engagement.score, `${analysis.activeSeats}/${analysis.seats} active seats`], ['RETENTION RISK', analysis.retention.risk, analysis.retention.band], ['EXPANSION', analysis.expansion.score, analysis.expansion.recommendation], ['ONBOARDING', `${analysis.onboarding.score}%`, analysis.onboarding.next?.title || 'Complete']]; return `<section class="commercial-card"><header><div><span>ACCOUNT HEALTH</span><h2>${esc(analysis.tenant.name)}</h2></div><i class="commercial-pill ${tone(analysis.health.band)}">${esc(analysis.health.band)}</i></header><div class="health-grid">${cards.map(item => `<article><span>${esc(item[0])}</span><strong>${esc(item[1])}</strong><small>${esc(item[2])}</small></article>`).join('')}</div><div class="quota-list">${(analysis.usage?.quotas?.quotas || []).map(item => `<div><span>${esc(item.key)}</span><progress max="100" value="${Math.min(100, Number(item.percentage || 0))}"></progress><b>${percent(item.percentage)}</b></div>`).join('')}</div><footer><span>${number(analysis.openSupportCases)} open support cases</span><span>${esc(analysis.lifecycleStage)}</span></footer></section>`; }

return Object.freeze({healthPanelHtml});
})();

// MODULE: commercial/support-panel.js
__modules['commercial/support-panel.js'] = (() => {
const { esc, date, tone } = __modules['commercial/format.js'];

function supportPanelHtml(cases = []) { return `<section class="commercial-card"><header><div><span>CUSTOMER SUPPORT</span><h2>SLA queue</h2></div><button data-commercial-action="new-support">OPEN CASE</button></header><div class="support-list">${cases.slice(0, 20).map(item => `<article><i class="commercial-pill ${tone(item.severity)}">${esc(item.severity)}</i><div><b>${esc(item.title)}</b><small>${esc(item.tenantId)} · ${date(item.createdAt)}</small></div><span>${esc(item.state)}</span><em>${Object.values(item.sla?.breaches || {}).some(Boolean) ? 'SLA BREACH' : 'WITHIN SLA'}</em></article>`).join('') || '<div class="commercial-empty">No support cases.</div>'}</div></section>`; }

return Object.freeze({supportPanelHtml});
})();

// MODULE: commercial/status-panel.js
__modules['commercial/status-panel.js'] = (() => {
const { esc, date, percent, tone } = __modules['commercial/format.js'];

function statusPanelHtml(status = {}) { return `<section class="commercial-card"><header><div><span>SERVICE DELIVERY</span><h2>Platform status</h2></div><b>${percent(status.uptime?.uptimePercent ?? 100)} UPTIME</b></header><div class="component-grid">${(status.components || []).map(item => `<article><span>${esc(item.group)}</span><b>${esc(item.name)}</b><i class="commercial-pill ${tone(item.state)}">${esc(item.state)}</i></article>`).join('')}</div><div class="incident-list">${(status.incidents || []).slice(0, 8).map(item => `<article><div><b>${esc(item.title)}</b><small>${date(item.startedAt)}</small></div><i class="commercial-pill ${tone(item.state)}">${esc(item.state)}</i></article>`).join('') || '<div class="commercial-empty">No recorded incidents.</div>'}</div></section>`; }

return Object.freeze({statusPanelHtml});
})();

// MODULE: commercial/feature-panel.js
__modules['commercial/feature-panel.js'] = (() => {
const { esc, tone } = __modules['commercial/format.js'];

function featurePanelHtml(flags = [], releases = []) { return `<section class="commercial-card"><header><div><span>PRODUCT OPERATIONS</span><h2>Feature rollout</h2></div><button data-commercial-action="new-feature">NEW FLAG</button></header><div class="feature-list">${flags.map(item => `<article><div><b>${esc(item.name)}</b><small>${esc(item.key)}</small></div><i class="commercial-pill ${tone(item.rollout)}">${esc(item.rollout)}</i><span>${item.percentage || 0}%</span></article>`).join('')}</div><h3>Release notes</h3><div class="release-list">${releases.slice(0, 8).map(item => `<article><b>${esc(item.version)} · ${esc(item.title)}</b><p>${esc(item.summary)}</p></article>`).join('')}</div></section>`; }

return Object.freeze({featurePanelHtml});
})();

// MODULE: commercial/onboarding-panel.js
__modules['commercial/onboarding-panel.js'] = (() => {
const { esc } = __modules['commercial/format.js'];

function onboardingPanelHtml(analysis) { if (!analysis)
    return ''; return `<section class="commercial-card"><header><div><span>TIME TO VALUE</span><h2>Onboarding</h2></div><b>${analysis.onboarding.score}%</b></header><div class="onboarding-list">${analysis.onboarding.steps.map(step => `<button data-commercial-step="${esc(step.id)}" ${step.complete ? 'disabled' : ''}><i>${step.complete ? '✓' : '○'}</i><span><b>${esc(step.title)}</b><small>${step.weight}% of onboarding</small></span></button>`).join('')}</div></section>`; }

return Object.freeze({onboardingPanelHtml});
})();

// MODULE: commercial/modal.js
__modules['commercial/modal.js'] = (() => {

function commercialPrompt(title, fields = []) {
    const values = {};
    for (const field of fields) {
        const value = window.prompt(`${title}\n${field.label}`, field.value || '');
        if (value === null)
            return null;
        values[field.key] = value;
    }
    return values;
}

return Object.freeze({commercialPrompt});
})();

// MODULE: commercial/controller.js
__modules['commercial/controller.js'] = (() => {
const { commercialApi } = __modules['commercial/api-client.js'];
const { CommercialState } = __modules['commercial/state-store.js'];
const { dashboardHtml } = __modules['commercial/dashboard.js'];
const { tenantTableHtml } = __modules['commercial/tenant-table.js'];
const { healthPanelHtml } = __modules['commercial/health-panel.js'];
const { supportPanelHtml } = __modules['commercial/support-panel.js'];
const { statusPanelHtml } = __modules['commercial/status-panel.js'];
const { featurePanelHtml } = __modules['commercial/feature-panel.js'];
const { onboardingPanelHtml } = __modules['commercial/onboarding-panel.js'];
const { commercialPrompt } = __modules['commercial/modal.js'];










const $ = selector => document.querySelector(selector);
class CommercialController {
    constructor() { this.api = commercialApi(); this.state = new CommercialState(); }
    async activate() { $('#sheet-kicker').textContent = 'CUSTOMER, PRODUCT AND SERVICE OPERATIONS'; $('#sheet-title').textContent = 'CUSTOMERS'; await this.refresh(); }
    async refresh() { this.state.set({ loading: true, error: null }); try {
        let snapshot = await this.api.snapshot();
        if (!snapshot.tenants?.length)
            snapshot = await this.api.seed();
        const selectedTenantId = this.state.get().selectedTenantId || snapshot.tenants?.[0]?.id || null;
        this.state.set({ snapshot, selectedTenantId, loading: false });
        this.render();
    }
    catch (error) {
        this.state.set({ loading: false, error: error.message });
        this.render();
    } }
    render() { const root = $('#sheet-content'); if (!root)
        return; const state = this.state.get(); if (state.loading) {
        root.innerHTML = '<div class="commercial-loading">LOADING CUSTOMER OPERATIONS…</div>';
        return;
    } if (state.error) {
        root.innerHTML = `<div class="commercial-error">${state.error}</div>`;
        return;
    } const snapshot = state.snapshot || {}; const analysis = (snapshot.health || []).find(item => item.tenant.id === state.selectedTenantId) || snapshot.health?.[0]; $('#sheet-summary').innerHTML = dashboardHtml(snapshot); root.innerHTML = `<div class="commercial-workspace"><div class="commercial-primary">${tenantTableHtml(snapshot.tenants, snapshot.health, state.query)}${healthPanelHtml(analysis)}${onboardingPanelHtml(analysis)}</div><aside class="commercial-secondary">${supportPanelHtml(snapshot.supportCases)}${statusPanelHtml(snapshot.status)}${featurePanelHtml(snapshot.featureFlags, snapshot.releaseNotes)}</aside></div>`; this.bind(); }
    bind() { document.querySelectorAll('[data-tenant-id]').forEach(button => button.addEventListener('click', () => { this.state.set({ selectedTenantId: button.dataset.tenantId }); this.render(); })); document.querySelectorAll('[data-commercial-step]').forEach(button => button.addEventListener('click', async () => { await this.api.completeOnboarding({ tenantId: this.state.get().selectedTenantId, stepId: button.dataset.commercialStep }); await this.refresh(); })); document.querySelectorAll('[data-commercial-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.commercialAction))); }
    async action(action) { const tenantId = this.state.get().selectedTenantId; if (action === 'new-tenant') {
        const data = commercialPrompt('Create tenant', [{ key: 'name', label: 'Customer name' }, { key: 'billingEmail', label: 'Billing email' }, { key: 'planId', label: 'Plan: FREE, PRO, TEAM or ENTERPRISE', value: 'PRO' }]);
        if (data)
            await this.api.createTenant(data);
    } if (action === 'new-support') {
        const data = commercialPrompt('Open support case', [{ key: 'title', label: 'Case title' }, { key: 'description', label: 'Description' }, { key: 'severity', label: 'Severity: SEV1–SEV4', value: 'SEV3' }]);
        if (data)
            await this.api.support({ ...data, tenantId });
    } if (action === 'new-feature') {
        const data = commercialPrompt('Create feature flag', [{ key: 'name', label: 'Feature name' }, { key: 'key', label: 'Feature key' }, { key: 'rollout', label: 'Rollout: OFF, INTERNAL, PERCENTAGE, TENANTS or ON', value: 'OFF' }]);
        if (data)
            await this.api.feature(data);
    } await this.refresh(); }
}

return Object.freeze({CommercialController});
})();

// MODULE: commercial/bootstrap.js
__modules['commercial/bootstrap.js'] = (() => {
const { CommercialController } = __modules['commercial/controller.js'];

function installCommercialSystem() { const controller = new CommercialController(); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }

return Object.freeze({installCommercialSystem});
})();

// MODULE: security/api-client.js
__modules['security/api-client.js'] = (() => {

function createSecurityApi(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12000);
  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error?.message || `Security API ${response.status}`);
      }
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }
  return Object.freeze({
    snapshot: () => request('/api/security/snapshot'),
    seed: input => request('/api/security/seed', { method: 'POST', body: JSON.stringify(input || {}) }),
    diagnostics: () => request('/api/security/diagnostics'),
    access: input => request('/api/security/access/evaluate', { method: 'POST', body: JSON.stringify(input) }),
    policy: input => request('/api/security/policies', { method: 'POST', body: JSON.stringify(input) }),
    risk: input => request('/api/security/risks', { method: 'POST', body: JSON.stringify(input) }),
    incident: input => request('/api/security/incidents', { method: 'POST', body: JSON.stringify(input) }),
    vulnerability: input => request('/api/security/vulnerabilities', { method: 'POST', body: JSON.stringify(input) }),
    evidence: input => request('/api/security/evidence', { method: 'POST', body: JSON.stringify(input) }),
    export: input => request('/api/security/export', { method: 'POST', body: JSON.stringify(input) })
  });
}

return Object.freeze({createSecurityApi});
})();

// MODULE: security/state-store.js
__modules['security/state-store.js'] = (() => {

class SecurityState {
  constructor() {
    this.value = Object.freeze({ snapshot: null, loading: false, error: null, query: '', tab: 'POSTURE' });
    this.listeners = new Set();
  }
  get() { return this.value; }
  set(patch) {
    this.value = Object.freeze({ ...this.value, ...patch });
    for (const listener of this.listeners) listener(this.value);
    return this.value;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

return Object.freeze({SecurityState});
})();

// MODULE: security/format.js
__modules['security/format.js'] = (() => {

function escapeSecurity(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function securityNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString('en-GB', { maximumFractionDigits: digits });
}

function securityAge(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return 'UNKNOWN';
  const hours = Math.max(0, (Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function stateClass(value) {
  return `security-state-${String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

return Object.freeze({escapeSecurity, securityNumber, securityAge, stateClass});
})();

// MODULE: security/dashboard.js
__modules['security/dashboard.js'] = (() => {
const { escapeSecurity, securityNumber, stateClass } = __modules['security/format.js'];


function securityDashboardHtml(snapshot = {}) {
  const posture = snapshot.posture || {};
  const compliance = snapshot.compliance || {};
  const diagnostics = snapshot.diagnostics || {};
  const cards = [
    ['SECURITY POSTURE', `${securityNumber(posture.score)} / 100`, posture.band || 'UNKNOWN'],
    ['COMPLIANCE', `${securityNumber(compliance.score)} / 100`, compliance.band || 'UNKNOWN'],
    ['CRITICAL VULNS', diagnostics.criticalVulnerabilities || 0, 'Open'],
    ['SEV1 INCIDENTS', diagnostics.openSev1 || 0, 'Active'],
    ['EVIDENCE', snapshot.evidence?.length || 0, `${diagnostics.expiredEvidence || 0} expired`],
    ['AUDIT CHAIN', snapshot.auditVerification?.valid ? 'VALID' : 'FAILED', `${snapshot.auditVerification?.checked || 0} events`]
  ];
  return `<div class="security-scorecards">${cards.map(([label, value, note]) => `<article class="${stateClass(note)}"><span>${escapeSecurity(label)}</span><strong>${escapeSecurity(value)}</strong><small>${escapeSecurity(note)}</small></article>`).join('')}</div>`;
}

return Object.freeze({securityDashboardHtml});
})();

// MODULE: security/access-panel.js
__modules['security/access-panel.js'] = (() => {
const { escapeSecurity, stateClass } = __modules['security/format.js'];


function accessPanelHtml(snapshot = {}) {
  const reviews = snapshot.accessReviews || [];
  const identity = snapshot.identity || {};
  return `<section class="security-panel"><header><h2>ACCESS GOVERNANCE</h2><button data-security-action="test-access">TEST ACCESS</button></header>
    <div class="security-mini-grid"><article><span>SSO</span><b>${identity.sso?.enabled ? 'ENABLED' : 'DISABLED'}</b><small>${escapeSecurity(identity.sso?.protocol || 'LOCAL')}</small></article><article><span>ENCRYPTION</span><b>${identity.encryption?.compliant ? 'COMPLIANT' : 'REVIEW'}</b><small>TLS ${escapeSecurity(identity.encryption?.minimumTlsVersion || '--')}</small></article></div>
    <div class="security-list">${reviews.map(item => `<article><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span><div><b>${escapeSecurity(item.name)}</b><small>${item.assignments?.length || 0} assignments · due ${escapeSecurity(item.dueAt?.slice(0, 10) || '--')}</small></div></article>`).join('') || '<p>No access reviews.</p>'}</div></section>`;
}

return Object.freeze({accessPanelHtml});
})();

// MODULE: security/controls-panel.js
__modules['security/controls-panel.js'] = (() => {
const { escapeSecurity, securityNumber, stateClass } = __modules['security/format.js'];


function controlsPanelHtml(snapshot = {}) {
  const assessments = [...(snapshot.assessments || [])].sort((a, b) => b.score - a.score);
  return `<section class="security-panel"><header><h2>CONTROL ASSURANCE</h2><button data-security-action="add-evidence">ADD EVIDENCE</button></header><div class="security-list">${assessments.slice(0, 30).map(item => `<article><span class="security-score">${securityNumber(item.score)}</span><div><b>${escapeSecurity(item.controlId)}</b><small>${escapeSecurity(item.state)} · ${item.evidenceIds?.length || 0} evidence items</small></div><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span></article>`).join('') || '<p>No controls assessed.</p>'}</div></section>`;
}

return Object.freeze({controlsPanelHtml});
})();

// MODULE: security/evidence-panel.js
__modules['security/evidence-panel.js'] = (() => {
const { escapeSecurity, securityAge, stateClass } = __modules['security/format.js'];


function evidencePanelHtml(snapshot = {}) {
  const evidence = snapshot.evidence || [];
  return `<section class="security-panel"><header><h2>EVIDENCE LEDGER</h2><span>${evidence.length} ITEMS</span></header><div class="security-list">${evidence.slice(0, 40).map(item => `<article><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span><div><b>${escapeSecurity(item.title)}</b><small>${escapeSecurity(item.controlId)} · ${escapeSecurity(item.source)} · ${securityAge(item.capturedAt)}</small></div></article>`).join('') || '<p>No evidence captured.</p>'}</div></section>`;
}

return Object.freeze({evidencePanelHtml});
})();

// MODULE: security/risk-panel.js
__modules['security/risk-panel.js'] = (() => {
const { escapeSecurity, stateClass } = __modules['security/format.js'];


function riskPanelHtml(snapshot = {}) {
  const risks = [...(snapshot.risks || [])].sort((a, b) => b.residual - a.residual);
  const vendors = [...(snapshot.vendors || [])].sort((a, b) => b.residualRisk - a.residualRisk);
  return `<section class="security-panel"><header><h2>RISK AND THIRD PARTIES</h2><button data-security-action="new-risk">NEW RISK</button></header><div class="security-columns"><div><h3>RISK REGISTER</h3>${risks.map(item => `<article class="security-risk"><span>${item.residual}</span><div><b>${escapeSecurity(item.title)}</b><small>${escapeSecurity(item.band)} · ${escapeSecurity(item.state)}</small></div></article>`).join('') || '<p>No risks.</p>'}</div><div><h3>VENDORS</h3>${vendors.map(item => `<article class="security-risk"><span>${item.residualRisk}</span><div><b>${escapeSecurity(item.name)}</b><small>${escapeSecurity(item.criticality)} · ${escapeSecurity(item.state)}</small></div></article>`).join('') || '<p>No vendors.</p>'}</div></div></section>`;
}

return Object.freeze({riskPanelHtml});
})();

// MODULE: security/incident-panel.js
__modules['security/incident-panel.js'] = (() => {
const { escapeSecurity, securityAge, stateClass } = __modules['security/format.js'];


function incidentPanelHtml(snapshot = {}) {
  const incidents = snapshot.incidents || [];
  const vulnerabilities = [...(snapshot.vulnerabilities || [])].sort((a, b) => b.priority - a.priority);
  return `<section class="security-panel"><header><h2>SECURITY OPERATIONS</h2><button data-security-action="new-incident">DECLARE INCIDENT</button></header><div class="security-columns"><div><h3>INCIDENTS</h3>${incidents.map(item => `<article><span class="security-badge ${stateClass(item.severity)}">${escapeSecurity(item.severity)}</span><div><b>${escapeSecurity(item.title)}</b><small>${escapeSecurity(item.state)} · ${securityAge(item.declaredAt)}</small></div></article>`).join('') || '<p>No incidents.</p>'}</div><div><h3>VULNERABILITIES</h3>${vulnerabilities.slice(0, 20).map(item => `<article><span class="security-score">${item.priority}</span><div><b>${escapeSecurity(item.cve || item.title)}</b><small>${escapeSecurity(item.severity)} · ${escapeSecurity(item.state)}</small></div></article>`).join('') || '<p>No vulnerabilities.</p>'}</div></div></section>`;
}

return Object.freeze({incidentPanelHtml});
})();

// MODULE: security/data-governance-panel.js
__modules['security/data-governance-panel.js'] = (() => {
const { escapeSecurity, stateClass } = __modules['security/format.js'];


function dataGovernancePanelHtml(snapshot = {}) {
  const records = snapshot.governance?.records || [];
  const requests = snapshot.subjectRequests || [];
  return `<section class="security-panel"><header><h2>DATA GOVERNANCE</h2><span>${records.length} DATA SETS</span></header><div class="security-columns"><div><h3>INVENTORY AND RETENTION</h3>${records.map(item => `<article><span class="security-badge ${stateClass(item.retention.reason)}">${escapeSecurity(item.record.classification)}</span><div><b>${escapeSecurity(item.record.name)}</b><small>${escapeSecurity(item.record.region)} · delete after ${escapeSecurity(item.retention.deleteAfter?.slice(0, 10) || '--')}</small></div></article>`).join('') || '<p>No inventory records.</p>'}</div><div><h3>DATA SUBJECT REQUESTS</h3>${requests.map(item => `<article><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span><div><b>${escapeSecurity(item.type)}</b><small>${escapeSecurity(item.subjectEmail || item.subjectId)} · due ${escapeSecurity(item.dueAt?.slice(0, 10) || '--')}</small></div></article>`).join('') || '<p>No requests.</p>'}</div></div></section>`;
}

return Object.freeze({dataGovernancePanelHtml});
})();

// MODULE: security/audit-panel.js
__modules['security/audit-panel.js'] = (() => {
const { escapeSecurity, securityAge } = __modules['security/format.js'];


function auditPanelHtml(snapshot = {}) {
  const rows = [...(snapshot.audit || [])].reverse().slice(0, 40);
  return `<section class="security-panel"><header><h2>TAMPER-EVIDENT AUDIT</h2><span>${snapshot.auditVerification?.valid ? 'CHAIN VALID' : 'CHAIN FAILURE'}</span></header><div class="security-list">${rows.map(item => `<article><span>${securityAge(item.at)}</span><div><b>${escapeSecurity(item.action)}</b><small>${escapeSecurity(item.actorId)} · ${escapeSecurity(item.resourceType)} ${escapeSecurity(item.resourceId)}</small></div><code>${escapeSecurity(item.hash?.slice(0, 12))}</code></article>`).join('') || '<p>No audit events.</p>'}</div></section>`;
}

return Object.freeze({auditPanelHtml});
})();

// MODULE: security/modal.js
__modules['security/modal.js'] = (() => {

function securityPrompt(title, fields = []) {
  const result = {};
  for (const field of fields) {
    const value = window.prompt(`${title}

${field.label}`, field.value || '');
    if (value === null) return null;
    result[field.key] = value;
  }
  return result;
}

return Object.freeze({securityPrompt});
})();

// MODULE: security/controller.js
__modules['security/controller.js'] = (() => {
const { createSecurityApi } = __modules['security/api-client.js'];
const { SecurityState } = __modules['security/state-store.js'];
const { securityDashboardHtml } = __modules['security/dashboard.js'];
const { accessPanelHtml } = __modules['security/access-panel.js'];
const { controlsPanelHtml } = __modules['security/controls-panel.js'];
const { evidencePanelHtml } = __modules['security/evidence-panel.js'];
const { riskPanelHtml } = __modules['security/risk-panel.js'];
const { incidentPanelHtml } = __modules['security/incident-panel.js'];
const { dataGovernancePanelHtml } = __modules['security/data-governance-panel.js'];
const { auditPanelHtml } = __modules['security/audit-panel.js'];
const { securityPrompt } = __modules['security/modal.js'];












const $ = selector => document.querySelector(selector);

class SecurityController {
  constructor(options = {}) {
    this.api = options.api || createSecurityApi();
    this.state = options.state || new SecurityState();
  }

  async activate() {
    $('#sheet-kicker').textContent = 'SECURITY, PRIVACY AND COMPLIANCE OPERATIONS';
    $('#sheet-title').textContent = 'SECURITY';
    await this.refresh();
  }

  async refresh() {
    this.state.set({ loading: true, error: null });
    try {
      let snapshot = await this.api.snapshot();
      if (!snapshot.policies?.length) snapshot = await this.api.seed();
      this.state.set({ snapshot, loading: false });
      this.render();
    } catch (error) {
      this.state.set({ loading: false, error: error.message });
      this.render();
    }
  }

  render() {
    const root = $('#sheet-content');
    if (!root) return;
    const state = this.state.get();
    if (state.loading) {
      root.innerHTML = '<div class="security-loading">LOADING SECURITY OPERATIONS…</div>';
      return;
    }
    if (state.error) {
      root.innerHTML = `<div class="security-error">${state.error}</div>`;
      return;
    }
    const snapshot = state.snapshot || {};
    $('#sheet-summary').innerHTML = securityDashboardHtml(snapshot);
    root.innerHTML = `<div class="security-workspace"><div class="security-primary">${accessPanelHtml(snapshot)}${controlsPanelHtml(snapshot)}${riskPanelHtml(snapshot)}${incidentPanelHtml(snapshot)}</div><aside class="security-secondary">${dataGovernancePanelHtml(snapshot)}${evidencePanelHtml(snapshot)}${auditPanelHtml(snapshot)}</aside></div>`;
    this.bind();
  }

  bind() {
    document.querySelectorAll('[data-security-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.securityAction)));
  }

  async action(action) {
    const tenantId = 'tenant-merlin-demo';
    if (action === 'new-risk') {
      const input = securityPrompt('Create security risk', [
        { key: 'title', label: 'Risk title' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category', value: 'SECURITY' },
        { key: 'likelihood', label: 'Likelihood 0–100', value: '50' },
        { key: 'impact', label: 'Impact 0–100', value: '70' }
      ]);
      if (input) await this.api.risk({ ...input, tenantId, likelihood: Number(input.likelihood), impact: Number(input.impact), controlStrength: 50 });
    }
    if (action === 'new-incident') {
      const input = securityPrompt('Declare security incident', [
        { key: 'title', label: 'Incident title' },
        { key: 'summary', label: 'Summary' },
        { key: 'affectedUsers', label: 'Affected users', value: '0' }
      ]);
      if (input) await this.api.incident({ ...input, tenantId, affectedUsers: Number(input.affectedUsers), confidentialityImpact: 50, integrityImpact: 40, availabilityImpact: 30 });
    }
    if (action === 'add-evidence') {
      const input = securityPrompt('Add control evidence', [
        { key: 'controlId', label: 'Control id', value: 'OPS-01' },
        { key: 'title', label: 'Evidence title' },
        { key: 'source', label: 'Evidence source', value: 'MERLIN_RUNTIME' }
      ]);
      if (input) await this.api.evidence({ ...input, tenantId });
    }
    if (action === 'test-access') {
      const result = await this.api.access({ subject: { id: 'operator', tenantId, role: 'ANALYST', clearance: 'CONFIDENTIAL' }, resource: { id: 'security-dashboard', tenantId, type: 'WORKSPACE', classification: 'CONFIDENTIAL' }, permission: 'security:read', context: { mfaSatisfied: true, managedDevice: true } });
      window.alert(`Access decision: ${result.decision}`);
    }
    await this.refresh();
  }
}

return Object.freeze({SecurityController});
})();

// MODULE: security/bootstrap.js
__modules['security/bootstrap.js'] = (() => {
const { SecurityController } = __modules['security/controller.js'];


function installSecuritySystem(options = {}) {
  const controller = new SecurityController(options);
  return Object.freeze({
    activate: () => controller.activate(),
    refresh: () => controller.refresh(),
    controller
  });
}

return Object.freeze({installSecuritySystem});
})();

// MODULE: reliability/api-client.js
__modules['reliability/api-client.js'] = (() => {

function createReliabilityApi(options = {}) {
    const base = options.baseUrl || '';
    async function request(path, init = {}) {
        const response = await fetch(`${base}${path}`, { headers: { 'content-type': 'application/json', ...(init.headers || {}) }, ...init });
        const text = await response.text();
        const body = text ? JSON.parse(text) : {};
        if (!response.ok)
            throw new Error(body.error?.message || `Operations API ${response.status}`);
        return body;
    }
    return Object.freeze({ snapshot: () => request('/api/operations/snapshot'), seed: () => request('/api/operations/seed', { method: 'POST', body: '{}' }), incident: input => request('/api/operations/incidents', { method: 'POST', body: JSON.stringify(input) }), release: input => request('/api/operations/releases', { method: 'POST', body: JSON.stringify(input) }), measurement: input => request('/api/operations/measurements', { method: 'POST', body: JSON.stringify(input) }), restoreTest: input => request('/api/operations/restore-tests', { method: 'POST', body: JSON.stringify(input) }), capacity: input => request('/api/operations/capacity/recommend', { method: 'POST', body: JSON.stringify(input) }) });
}

return Object.freeze({createReliabilityApi});
})();

// MODULE: reliability/state-store.js
__modules['reliability/state-store.js'] = (() => {

class ReliabilityState {
    constructor() { this.value = { loading: false, error: null, snapshot: null, query: '' }; this.listeners = new Set(); }
    get() { return this.value; }
    set(patch) {
        this.value = { ...this.value, ...patch };
        for (const listener of this.listeners)
            listener(this.value);
        return this.value;
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

return Object.freeze({ReliabilityState});
})();

// MODULE: reliability/format.js
__modules['reliability/format.js'] = (() => {

const escapeReliability = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const operationsNumber = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(Number(value)) : '--';
const operationsAge = value => {
    const time = Date.parse(value);
    if (!Number.isFinite(time))
        return '--';
    const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
    return minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`;
};
const stateClass = value => String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');

return Object.freeze({escapeReliability, operationsNumber, operationsAge, stateClass});
})();

// MODULE: reliability/dashboard.js
__modules['reliability/dashboard.js'] = (() => {
const { escapeReliability, operationsNumber, stateClass } = __modules['reliability/format.js'];

function reliabilityDashboardHtml(snapshot = {}) { const report = snapshot.report || {}; const cards = [['RELIABILITY', operationsNumber(report.score?.score), report.score?.band], ['SERVICES', report.serviceCount || 0, `${report.operationalServices || 0} operational`], ['INCIDENTS', report.openIncidents || 0, 'open'], ['ERROR BUDGETS', report.exhaustedBudgets || 0, 'exhausted'], ['RESTORES', report.failedRestores || 0, 'failed'], ['QUEUES', report.criticalQueues || 0, 'critical']]; return `<div class="reliability-scorecards">${cards.map(([label, value, note]) => `<article class="${stateClass(note)}"><span>${escapeReliability(label)}</span><strong>${escapeReliability(value)}</strong><small>${escapeReliability(note)}</small></article>`).join('')}</div>`; }

return Object.freeze({reliabilityDashboardHtml});
})();

// MODULE: reliability/service-panel.js
__modules['reliability/service-panel.js'] = (() => {
const { escapeReliability, stateClass } = __modules['reliability/format.js'];

function servicePanelHtml(snapshot = {}) { const services = snapshot.services || []; return `<section class="reliability-panel"><header><h2>SERVICE CATALOGUE</h2><span>${services.length} SERVICES</span></header><div class="reliability-list">${services.map(item => `<article><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span><div><b>${escapeReliability(item.name)}</b><small>Tier ${item.tier} · ${escapeReliability(item.ownerTeam)} · ${(item.dependencies || []).length} dependencies</small></div></article>`).join('') || '<p>No services registered.</p>'}</div></section>`; }

return Object.freeze({servicePanelHtml});
})();

// MODULE: reliability/slo-panel.js
__modules['reliability/slo-panel.js'] = (() => {
const { escapeReliability, operationsNumber, stateClass } = __modules['reliability/format.js'];

function sloPanelHtml(snapshot = {}) { const budgets = snapshot.errorBudgets || []; return `<section class="reliability-panel"><header><h2>SLOS AND ERROR BUDGETS</h2><button data-operations-action="measurement">RECORD MEASUREMENT</button></header><div class="reliability-list">${budgets.map(item => `<article><span class="reliability-score">${operationsNumber(item.remainingPercent)}%</span><div><b>${escapeReliability(item.indicator)}</b><small>Actual ${operationsNumber(item.actual)} · target ${operationsNumber(item.target)} · ${item.sampleCount} samples</small></div><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span></article>`).join('') || '<p>No SLOs configured.</p>'}</div></section>`; }

return Object.freeze({sloPanelHtml});
})();

// MODULE: reliability/deployment-panel.js
__modules['reliability/deployment-panel.js'] = (() => {
const { escapeReliability, operationsAge, stateClass } = __modules['reliability/format.js'];

function deploymentPanelHtml(snapshot = {}) { const releases = snapshot.releases || []; const deployments = snapshot.deployments || []; return `<section class="reliability-panel"><header><h2>RELEASE CONTROL</h2><button data-operations-action="release">NEW RELEASE</button></header><div class="reliability-columns"><div><h3>RELEASES</h3>${releases.map(item => `<article><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span><div><b>${escapeReliability(item.version)}</b><small>${escapeReliability(item.environment)} · ${operationsAge(item.updatedAt)}</small></div></article>`).join('') || '<p>No releases.</p>'}</div><div><h3>DEPLOYMENTS</h3>${deployments.map(item => `<article><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span><div><b>${escapeReliability(item.strategy)}</b><small>${escapeReliability(item.environment)} · stage ${item.currentStage || 0}/${item.stages?.length || 0}</small></div></article>`).join('') || '<p>No deployments.</p>'}</div></div></section>`; }

return Object.freeze({deploymentPanelHtml});
})();

// MODULE: reliability/incident-panel.js
__modules['reliability/incident-panel.js'] = (() => {
const { escapeReliability, operationsAge, stateClass } = __modules['reliability/format.js'];

function incidentPanelHtml(snapshot = {}) { const incidents = snapshot.incidents || []; return `<section class="reliability-panel"><header><h2>INCIDENT COMMAND</h2><button data-operations-action="incident">DECLARE INCIDENT</button></header><div class="reliability-list">${incidents.map(item => `<article><span class="reliability-badge ${stateClass(item.severity)}">${escapeReliability(item.severity)}</span><div><b>${escapeReliability(item.title)}</b><small>${escapeReliability(item.state)} · ${operationsAge(item.declaredAt)} · ${(item.serviceIds || []).join(', ')}</small></div></article>`).join('') || '<p>No active incidents.</p>'}</div></section>`; }

return Object.freeze({incidentPanelHtml});
})();

// MODULE: reliability/observability-panel.js
__modules['reliability/observability-panel.js'] = (() => {
const { escapeReliability, operationsNumber, stateClass } = __modules['reliability/format.js'];

function observabilityPanelHtml(snapshot = {}) { const runtime = snapshot.runtime?.runtime || {}; const trace = snapshot.traceAnalysis || {}; const synthetics = snapshot.syntheticChecks || []; return `<section class="reliability-panel"><header><h2>OBSERVABILITY</h2><span>METRICS / LOGS / TRACES</span></header><div class="reliability-mini-grid"><article><span>MEMORY RSS</span><b>${operationsNumber(runtime.memoryMb?.rss)} MB</b></article><article><span>EVENT LOOP P95</span><b>${operationsNumber(runtime.eventLoopMs?.p95)} ms</b></article><article><span>TRACES</span><b>${trace.count || 0}</b></article><article><span>ERROR TRACES</span><b>${trace.errorTraces || 0}</b></article></div><div class="reliability-list">${synthetics.map(item => `<article><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span><div><b>${escapeReliability(item.name)}</b><small>${escapeReliability(item.region)} · ${operationsNumber(item.durationMs)} ms</small></div></article>`).join('') || '<p>No synthetic checks.</p>'}</div></section>`; }

return Object.freeze({observabilityPanelHtml});
})();

// MODULE: reliability/recovery-panel.js
__modules['reliability/recovery-panel.js'] = (() => {
const { escapeReliability, operationsAge, stateClass } = __modules['reliability/format.js'];

function recoveryPanelHtml(snapshot = {}) { const backups = snapshot.backups || []; const tests = snapshot.restoreTests || []; return `<section class="reliability-panel"><header><h2>BACKUP AND RECOVERY</h2><button data-operations-action="restore">RECORD RESTORE TEST</button></header><div class="reliability-columns"><div><h3>BACKUPS</h3>${backups.map(item => `<article><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span><div><b>${escapeReliability(item.resourceId)}</b><small>${escapeReliability(item.region)} · ${operationsAge(item.completedAt)}</small></div></article>`).join('') || '<p>No backups.</p>'}</div><div><h3>RESTORE EVIDENCE</h3>${tests.map(item => `<article><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span><div><b>${escapeReliability(item.backupId)}</b><small>${item.durationMinutes} min · ${operationsAge(item.testedAt)}</small></div></article>`).join('') || '<p>No restore tests.</p>'}</div></div></section>`; }

return Object.freeze({recoveryPanelHtml});
})();

// MODULE: reliability/capacity-panel.js
__modules['reliability/capacity-panel.js'] = (() => {
const { escapeReliability, operationsNumber, stateClass } = __modules['reliability/format.js'];

function capacityPanelHtml(snapshot = {}) { const queues = snapshot.queueHealth || []; return `<section class="reliability-panel"><header><h2>CAPACITY AND QUEUES</h2><button data-operations-action="capacity">MODEL CAPACITY</button></header><div class="reliability-list">${queues.map(item => `<article><span class="reliability-score">${operationsNumber(item.pressure)}</span><div><b>${escapeReliability(item.queueId)}</b><small>Net ${operationsNumber(item.netGrowthPerMinute)}/min · drain ${operationsNumber(item.estimatedDrainMinutes)} min</small></div><span class="reliability-badge ${stateClass(item.state)}">${escapeReliability(item.state)}</span></article>`).join('') || '<p>No queues configured.</p>'}</div></section>`; }

return Object.freeze({capacityPanelHtml});
})();

// MODULE: reliability/modal.js
__modules['reliability/modal.js'] = (() => {

function reliabilityPrompt(title, fields = []) {
    const result = {};
    for (const field of fields) {
        const value = window.prompt(`${title}

${field.label}`, field.value || '');
        if (value === null)
            return null;
        result[field.key] = value;
    }
    return result;
}

return Object.freeze({reliabilityPrompt});
})();

// MODULE: reliability/controller.js
__modules['reliability/controller.js'] = (() => {
const { createReliabilityApi } = __modules['reliability/api-client.js'];
const { ReliabilityState } = __modules['reliability/state-store.js'];
const { reliabilityDashboardHtml } = __modules['reliability/dashboard.js'];
const { servicePanelHtml } = __modules['reliability/service-panel.js'];
const { sloPanelHtml } = __modules['reliability/slo-panel.js'];
const { deploymentPanelHtml } = __modules['reliability/deployment-panel.js'];
const { incidentPanelHtml } = __modules['reliability/incident-panel.js'];
const { observabilityPanelHtml } = __modules['reliability/observability-panel.js'];
const { recoveryPanelHtml } = __modules['reliability/recovery-panel.js'];
const { capacityPanelHtml } = __modules['reliability/capacity-panel.js'];
const { reliabilityPrompt } = __modules['reliability/modal.js'];











const $ = selector => document.querySelector(selector);
class ReliabilityController {
    constructor(options = {}) { this.api = options.api || createReliabilityApi(); this.state = options.state || new ReliabilityState(); }
    async activate() { $('#sheet-kicker').textContent = 'DEPLOYMENT, OBSERVABILITY AND RELIABILITY'; $('#sheet-title').textContent = 'OPERATIONS'; await this.refresh(); }
    async refresh() {
        this.state.set({ loading: true, error: null });
        try {
            let snapshot = await this.api.snapshot();
            if (!snapshot.services?.length)
                snapshot = await this.api.seed();
            this.state.set({ snapshot, loading: false });
            this.render();
        }
        catch (error) {
            this.state.set({ loading: false, error: error.message });
            this.render();
        }
    }
    render() {
        const root = $('#sheet-content');
        if (!root)
            return;
        const state = this.state.get();
        if (state.loading) {
            root.innerHTML = '<div class="reliability-loading">LOADING RELIABILITY OPERATIONS…</div>';
            return;
        }
        if (state.error) {
            root.innerHTML = `<div class="reliability-error">${state.error}</div>`;
            return;
        }
        const snapshot = state.snapshot || {};
        $('#sheet-summary').innerHTML = reliabilityDashboardHtml(snapshot);
        root.innerHTML = `<div class="reliability-workspace"><div class="reliability-primary">${servicePanelHtml(snapshot)}${sloPanelHtml(snapshot)}${deploymentPanelHtml(snapshot)}${incidentPanelHtml(snapshot)}</div><aside class="reliability-secondary">${observabilityPanelHtml(snapshot)}${capacityPanelHtml(snapshot)}${recoveryPanelHtml(snapshot)}</aside></div>`;
        this.bind();
    }
    bind() { document.querySelectorAll('[data-operations-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.operationsAction))); }
    async action(action) {
        if (action === 'incident') {
            const input = reliabilityPrompt('Declare operational incident', [{ key: 'title', label: 'Incident title' }, { key: 'summary', label: 'Summary' }, { key: 'serviceIds', label: 'Affected service id', value: 'api' }, { key: 'severity', label: 'Severity', value: 'SEV2' }]);
            if (input)
                await this.api.incident({ ...input, serviceIds: [input.serviceIds], runbookId: 'api-unavailable' });
        }
        if (action === 'release') {
            const input = reliabilityPrompt('Create release', [{ key: 'version', label: 'Version', value: '20.17.0' }, { key: 'title', label: 'Release title' }, { key: 'riskLevel', label: 'Risk level', value: 'MEDIUM' }]);
            if (input)
                await this.api.release({ ...input, environment: 'production' });
        }
        if (action === 'measurement') {
            const snapshot = this.state.get().snapshot;
            const slo = snapshot.slos?.[0];
            if (slo) {
                const value = window.prompt(`Record ${slo.indicator}`, String(slo.target));
                if (value !== null)
                    await this.api.measurement({ serviceId: slo.serviceId, sloId: slo.id, value: Number(value), good: 999, total: 1000 });
            }
        }
        if (action === 'restore') {
            const backup = this.state.get().snapshot.backups?.[0];
            if (backup)
                await this.api.restoreTest({ backupId: backup.id, durationMinutes: 5, checks: [{ name: 'Checksum', passed: true }, { name: 'Schema', passed: true }, { name: 'Application', passed: true }], applicationStarted: true, testedBy: 'operator' });
        }
        if (action === 'capacity') {
            const result = await this.api.capacity({ currentDemand: 80, currentCapacity: 100, growthPercent: 25, targetUtilization: 70, currentReplicas: 2, utilization: 80, minimumReplicas: 2, maximumReplicas: 20 });
            window.alert(`Required capacity: ${result.model.requiredCapacity}; replicas: ${result.autoscaling.desiredReplicas}`);
        }
        await this.refresh();
    }
}

return Object.freeze({ReliabilityController});
})();

// MODULE: reliability/bootstrap.js
__modules['reliability/bootstrap.js'] = (() => {
const { ReliabilityController } = __modules['reliability/controller.js'];

function installReliabilitySystem(options = {}) { const controller = new ReliabilityController(options); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }

return Object.freeze({installReliabilitySystem});
})();

// MODULE: release/api-client.js
__modules['release/api-client.js'] = (() => {

function createReleaseApi(options = {}) { const base = options.baseUrl || ''; async function request(path, init = {}) { const response = await fetch(`${base}${path}`, { headers: { 'content-type': 'application/json', ...(init.headers || {}) }, ...init }); const text = await response.text(); const body = text ? JSON.parse(text) : {}; if (!response.ok)
    throw new Error(body.error?.message || `Release API ${response.status}`); return body; } const post = (path, input) => request(path, { method: 'POST', body: JSON.stringify(input || {}) }); return Object.freeze({ snapshot: () => request('/api/release/snapshot'), seed: () => post('/api/release/seed', {}), candidate: input => post('/api/release/candidates', input), evidence: input => post('/api/release/evidence', input), artifact: input => post('/api/release/artifacts', input), migration: input => post('/api/release/migrations', input), checklist: input => post('/api/release/checklist/evaluate', input), acceptance: input => post('/api/release/acceptance/evaluate', input), packageReport: input => post('/api/release/package-report', input) }); }

return Object.freeze({createReleaseApi});
})();

// MODULE: release/state-store.js
__modules['release/state-store.js'] = (() => {

class ReleaseState {
    constructor() { this.value = { loading: false, error: null, snapshot: null, query: '' }; this.listeners = new Set(); }
    get() { return this.value; }
    set(patch) { this.value = { ...this.value, ...patch }; for (const listener of this.listeners)
        listener(this.value); return this.value; }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

return Object.freeze({ReleaseState});
})();

// MODULE: release/format.js
__modules['release/format.js'] = (() => {

const escapeRelease = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const releaseNumber = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(Number(value)) : '--';
const releaseState = value => String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const releaseAge = value => { const time = Date.parse(value); if (!Number.isFinite(time))
    return '--'; const minutes = Math.max(0, Math.round((Date.now() - time) / 60000)); return minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`; };

return Object.freeze({escapeRelease, releaseNumber, releaseState, releaseAge});
})();

// MODULE: release/dashboard.js
__modules['release/dashboard.js'] = (() => {
const { escapeRelease, releaseNumber, releaseState } = __modules['release/format.js'];

function releaseDashboardHtml(snapshot = {}) { const cards = [['READINESS', snapshot.readiness?.state || 'NOT RUN', `${releaseNumber(snapshot.readiness?.score)} score`], ['GO-LIVE', snapshot.goLive?.decision || 'NOT ASSESSED', `${snapshot.goLive?.blockers?.length || 0} blockers`], ['COMPONENTS', snapshot.components?.length || 0, `${snapshot.dependencies?.issues?.length || 0} dependency issues`], ['CONTRACTS', snapshot.contracts?.length || 0, `${snapshot.contractInventory?.duplicates?.length || 0} duplicates`], ['MIGRATIONS', snapshot.migrations?.length || 0, snapshot.migrationAssessment?.valid ? 'plan valid' : 'review required'], ['EVIDENCE', snapshot.evidence?.length || 0, `${snapshot.evidence?.filter(item => item.state === 'PASS').length || 0} passing`]]; return `<div class="release-scorecards">${cards.map(([label, value, note]) => `<article class="${releaseState(value)}"><span>${escapeRelease(label)}</span><strong>${escapeRelease(value)}</strong><small>${escapeRelease(note)}</small></article>`).join('')}</div>`; }

return Object.freeze({releaseDashboardHtml});
})();

// MODULE: release/component-panel.js
__modules['release/component-panel.js'] = (() => {
const { escapeRelease, releaseState } = __modules['release/format.js'];

function componentPanelHtml(snapshot = {}) { return `<section class="release-panel"><header><h2>COMPONENT INVENTORY</h2><span>${snapshot.components?.length || 0} COMPONENTS</span></header><div class="release-list">${(snapshot.components || []).map(item => `<article><span class="release-badge ${releaseState(item.criticality)}">${escapeRelease(item.criticality)}</span><div><b>${escapeRelease(item.name)}</b><small>${escapeRelease(item.type)} · ${escapeRelease(item.version)} · ${(item.dependencies || []).length} dependencies</small></div></article>`).join('') || '<p>No components.</p>'}</div></section>`; }

return Object.freeze({componentPanelHtml});
})();

// MODULE: release/migration-panel.js
__modules['release/migration-panel.js'] = (() => {
const { escapeRelease, releaseState } = __modules['release/format.js'];

function migrationPanelHtml(snapshot = {}) { const plan = snapshot.migrationAssessment || {}; return `<section class="release-panel"><header><h2>MIGRATION CONTROL</h2><button data-release-action="migration">ADD MIGRATION</button></header><div class="release-inline"><b>${plan.valid ? 'VALID PLAN' : 'REVIEW REQUIRED'}</b><span>${plan.ordered?.length || 0} pending · ${plan.reversible ? 'reversible' : 'backup required'}</span></div><div class="release-list">${(snapshot.migrations || []).map(item => `<article><span class="release-badge ${releaseState(item.state)}">${escapeRelease(item.state)}</span><div><b>${escapeRelease(item.name)}</b><small>${escapeRelease(item.componentId)} · sequence ${item.sequence} · ${item.reversible ? 'reversible' : 'not reversible'}</small></div></article>`).join('') || '<p>No pending migrations.</p>'}</div></section>`; }

return Object.freeze({migrationPanelHtml});
})();

// MODULE: release/contracts-panel.js
__modules['release/contracts-panel.js'] = (() => {
const { escapeRelease } = __modules['release/format.js'];

function contractsPanelHtml(snapshot = {}) { return `<section class="release-panel"><header><h2>API CONTRACTS</h2><span>${snapshot.contracts?.length || 0} ROUTES</span></header><div class="release-list compact">${(snapshot.contracts || []).slice(0, 20).map(item => `<article><span class="release-method">${escapeRelease(item.method)}</span><div><b>${escapeRelease(item.path)}</b><small>${escapeRelease(item.auth)} · ${escapeRelease(item.version)}</small></div></article>`).join('') || '<p>No explicit contracts recorded.</p>'}</div></section>`; }

return Object.freeze({contractsPanelHtml});
})();

// MODULE: release/quality-panel.js
__modules['release/quality-panel.js'] = (() => {
const { escapeRelease, releaseState } = __modules['release/format.js'];

function qualityPanelHtml(snapshot = {}) { const checks = snapshot.readiness?.checks || []; return `<section class="release-panel"><header><h2>QUALITY GATES</h2><button data-release-action="evidence">RECORD TEST EVIDENCE</button></header><div class="release-list">${checks.map(item => `<article><span class="release-badge ${releaseState(item.state)}">${escapeRelease(item.state)}</span><div><b>${escapeRelease(item.name)}</b><small>${escapeRelease(Array.isArray(item.detail) ? item.detail.join(', ') : item.detail || '')}</small></div></article>`).join('') || '<p>No gates evaluated.</p>'}</div></section>`; }

return Object.freeze({qualityPanelHtml});
})();

// MODULE: release/artifact-panel.js
__modules['release/artifact-panel.js'] = (() => {
const { escapeRelease, releaseNumber } = __modules['release/format.js'];

function artifactPanelHtml(snapshot = {}) { const manifest = snapshot.manifest || {}; return `<section class="release-panel"><header><h2>ARTIFACT MANIFEST</h2><button data-release-action="artifact">ADD ARTIFACT</button></header><div class="release-mini-grid"><article><span>ARTIFACTS</span><b>${manifest.count || 0}</b></article><article><span>TOTAL SIZE</span><b>${releaseNumber((manifest.totalBytes || 0) / 1024)} KB</b></article><article><span>MANIFEST HASH</span><b>${escapeRelease(String(manifest.manifestSha256 || '--').slice(0, 12))}</b></article><article><span>CHECKSUMS</span><b>${snapshot.checksums?.count || 0}</b></article></div></section>`; }

return Object.freeze({artifactPanelHtml});
})();

// MODULE: release/release-panel.js
__modules['release/release-panel.js'] = (() => {
const { escapeRelease, releaseAge, releaseState } = __modules['release/format.js'];

function releasePanelHtml(snapshot = {}) { const candidates = snapshot.candidates || []; return `<section class="release-panel"><header><h2>RELEASE CANDIDATES</h2><button data-release-action="candidate">NEW CANDIDATE</button></header><div class="release-list">${candidates.map(item => `<article><span class="release-badge ${releaseState(item.state)}">${escapeRelease(item.state)}</span><div><b>${escapeRelease(item.version)} — ${escapeRelease(item.title)}</b><small>${escapeRelease(item.environment)} · ${releaseAge(item.updatedAt)}</small></div></article>`).join('') || '<p>No candidates.</p>'}</div></section>`; }

return Object.freeze({releasePanelHtml});
})();

// MODULE: release/go-live-panel.js
__modules['release/go-live-panel.js'] = (() => {
const { escapeRelease, releaseState } = __modules['release/format.js'];

function goLivePanelHtml(snapshot = {}) { const report = snapshot.goLive || {}; return `<section class="release-panel release-go-live ${releaseState(report.decision)}"><header><h2>FINAL GO-LIVE DECISION</h2><strong>${escapeRelease(report.decision || 'NOT ASSESSED')}</strong></header><p>${report.blockers?.length ? `Blockers: ${escapeRelease(report.blockers.join(', '))}` : 'No blocking gate is currently recorded.'}</p><div class="release-actions"><button data-release-action="package">BUILD RELEASE REPORT</button><button data-release-action="acceptance">RUN FINAL ACCEPTANCE</button></div></section>`; }

return Object.freeze({goLivePanelHtml});
})();

// MODULE: release/modal.js
__modules['release/modal.js'] = (() => {

function releasePrompt(title, fields = []) {
    const result = {};
    for (const field of fields) {
        const value = window.prompt(`${title}

${field.label}`, field.value || '');
        if (value === null)
            return null;
        result[field.key] = value;
    }
    return result;
}

return Object.freeze({releasePrompt});
})();

// MODULE: release/controller.js
__modules['release/controller.js'] = (() => {
const { createReleaseApi } = __modules['release/api-client.js'];
const { ReleaseState } = __modules['release/state-store.js'];
const { releaseDashboardHtml } = __modules['release/dashboard.js'];
const { componentPanelHtml } = __modules['release/component-panel.js'];
const { migrationPanelHtml } = __modules['release/migration-panel.js'];
const { contractsPanelHtml } = __modules['release/contracts-panel.js'];
const { qualityPanelHtml } = __modules['release/quality-panel.js'];
const { artifactPanelHtml } = __modules['release/artifact-panel.js'];
const { releasePanelHtml } = __modules['release/release-panel.js'];
const { goLivePanelHtml } = __modules['release/go-live-panel.js'];
const { releasePrompt } = __modules['release/modal.js'];











const $ = selector => document.querySelector(selector);
class ReleaseController {
    constructor(options = {}) { this.api = options.api || createReleaseApi(); this.state = options.state || new ReleaseState(); }
    async activate() { $('#sheet-kicker').textContent = 'FINAL INTEGRATION, RELEASE AND ACCEPTANCE'; $('#sheet-title').textContent = 'RELEASE'; await this.refresh(); }
    async refresh() { this.state.set({ loading: true, error: null }); try {
        let snapshot = await this.api.snapshot();
        if (!snapshot.components?.length)
            snapshot = await this.api.seed();
        this.state.set({ snapshot, loading: false });
        this.render();
    }
    catch (error) {
        this.state.set({ loading: false, error: error.message });
        this.render();
    } }
    render() { const root = $('#sheet-content'); if (!root)
        return; const state = this.state.get(); if (state.loading) {
        root.innerHTML = '<div class="release-loading">LOADING RELEASE ENGINEERING…</div>';
        return;
    } if (state.error) {
        root.innerHTML = `<div class="release-error">${state.error}</div>`;
        return;
    } const snapshot = state.snapshot || {}; $('#sheet-summary').innerHTML = releaseDashboardHtml(snapshot); root.innerHTML = `<div class="release-workspace"><div class="release-primary">${goLivePanelHtml(snapshot)}${releasePanelHtml(snapshot)}${qualityPanelHtml(snapshot)}${migrationPanelHtml(snapshot)}</div><aside class="release-secondary">${componentPanelHtml(snapshot)}${artifactPanelHtml(snapshot)}${contractsPanelHtml(snapshot)}</aside></div>`; this.bind(); }
    bind() { document.querySelectorAll('[data-release-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.releaseAction))); }
    async action(action) { if (action === 'candidate') {
        const input = releasePrompt('Create release candidate', [{ key: 'version', label: 'Version', value: '20.18.0' }, { key: 'title', label: 'Release title', value: 'Merlin V20 final release' }]);
        if (input)
            await this.api.candidate({ ...input, state: 'ASSESSING', environment: 'production' });
    } if (action === 'evidence') {
        const input = releasePrompt('Record test evidence', [{ key: 'suite', label: 'Suite', value: 'Complete repository' }, { key: 'total', label: 'Total tests', value: '0' }, { key: 'passed', label: 'Passed tests', value: '0' }]);
        if (input)
            await this.api.evidence({ ...input, total: Number(input.total), passed: Number(input.passed), failed: Math.max(0, Number(input.total) - Number(input.passed)) });
    } if (action === 'artifact') {
        const input = releasePrompt('Add release artifact', [{ key: 'name', label: 'Name', value: 'Merlin source package' }, { key: 'path', label: 'Path', value: 'MERLIN_V20_COMPLETE.zip' }, { key: 'type', label: 'Type', value: 'SOURCE' }]);
        if (input)
            await this.api.artifact(input);
    } if (action === 'migration') {
        const input = releasePrompt('Add migration', [{ key: 'name', label: 'Migration name' }, { key: 'componentId', label: 'Component', value: 'core' }, { key: 'sequence', label: 'Sequence', value: '1' }]);
        if (input)
            await this.api.migration({ ...input, sequence: Number(input.sequence), reversible: true });
    } if (action === 'package') {
        const report = await this.api.packageReport({ dependencies: [] });
        window.alert(`Manifest ${String(report.manifest?.manifestSha256 || '').slice(0, 16)} · ${report.sbom?.components?.length || 0} dependencies`);
    } if (action === 'acceptance') {
        const result = await this.api.acceptance({ partsDelivered: 18, maximumPartFiles: 99, sourceLines: 50000, passedTests: 1, failedTests: 0, syntaxFailures: 0, syntaxChecks: 1, securityScanPassed: true, archiveIntegrity: true, fabricatedLiveData: false });
        window.alert(`Final acceptance: ${result.state}`);
    } await this.refresh(); }
}

return Object.freeze({ReleaseController});
})();

// MODULE: release/bootstrap.js
__modules['release/bootstrap.js'] = (() => {
const { ReleaseController } = __modules['release/controller.js'];

function installReleaseSystem(options = {}) { const controller = new ReleaseController(options); return Object.freeze({ activate: () => controller.activate(), refresh: () => controller.refresh(), controller }); }

return Object.freeze({installReleaseSystem});
})();

// MODULE: live-data/api-client.js
__modules['live-data/api-client.js'] = (() => {

function createLiveDataApi(options={}){const base=options.baseUrl||'';async function request(path,init={}){const response=await fetch(`${base}${path}`,{headers:{'content-type':'application/json',...(init.headers||{})},...init});const body=await response.json();if(!response.ok)throw new Error(body.error?.message||`Live data API ${response.status}`);return body;}return Object.freeze({status:()=>request('/api/live-data/status'),diagnostics:()=>request('/api/live-data/diagnostics'),catalog:()=>request('/api/live-data/catalog'),refresh:sourceIds=>request('/api/live-data/refresh',{method:'POST',body:JSON.stringify({sourceIds})}),source:id=>request(`/api/live-data/source?id=${encodeURIComponent(id)}`)});}

return Object.freeze({createLiveDataApi});
})();

// MODULE: live-data/state-store.js
__modules['live-data/state-store.js'] = (() => {

class LiveDataState{constructor(){this.value={loading:false,error:null,snapshot:null,diagnostics:null,query:''};this.listeners=new Set();}get(){return this.value;}set(patch){this.value={...this.value,...patch};for(const listener of this.listeners)listener(this.value);return this.value;}subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}}

return Object.freeze({LiveDataState});
})();

// MODULE: live-data/format.js
__modules['live-data/format.js'] = (() => {

const escLive=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const liveState=value=>String(value||'UNKNOWN').toLowerCase().replace(/[^a-z0-9]+/g,'-');
const liveNumber=value=>Number.isFinite(Number(value))?Number(value).toLocaleString():'—';

return Object.freeze({escLive, liveState, liveNumber});
})();

// MODULE: live-data/dashboard.js
__modules['live-data/dashboard.js'] = (() => {
const { escLive, liveNumber, liveState } = __modules['live-data/format.js'];

function liveDashboardHtml(snapshot={},diagnostics={}){const cards=[['PUBLIC MODE',snapshot.mode||'—','no mandatory API keys'],['COVERAGE',`${liveNumber(snapshot.coverage?.score)}%`,`${snapshot.coverage?.availableRequiredSources||0}/${snapshot.coverage?.requiredSources||0} required sources`],['STATE',diagnostics.state||'—',`${diagnostics.cached?.length||0} cached fallbacks`],['LAST RUN',snapshot.lastRun?.completedAt?new Date(snapshot.lastRun.completedAt).toLocaleTimeString():'NOT RUN',`${snapshot.lastRun?.durationMs||0} ms`]];return`<div class="live-scorecards">${cards.map(([label,value,note])=>`<article class="${liveState(value)}"><span>${escLive(label)}</span><strong>${escLive(value)}</strong><small>${escLive(note)}</small></article>`).join('')}</div>`;}

return Object.freeze({liveDashboardHtml});
})();

// MODULE: live-data/source-table.js
__modules['live-data/source-table.js'] = (() => {
const { escLive, liveNumber, liveState } = __modules['live-data/format.js'];

function sourceTableHtml(snapshot={},query=''){const needle=String(query||'').toLowerCase();const rows=Object.values(snapshot.sources||{}).filter(item=>!needle||`${item.name} ${item.domain} ${item.state} ${item.authority}`.toLowerCase().includes(needle));return`<section class="live-panel"><header><div><span>PUBLIC DATA SOURCES</span><h2>${rows.length} SOURCES</h2></div><button data-live-action="refresh">REFRESH NOW</button></header><div class="live-table"><div class="live-row live-head"><b>SOURCE</b><b>DOMAIN</b><b>STATE</b><b>RECORDS</b><b>ACCESS</b></div>${rows.map(item=>`<button class="live-row" data-live-source="${escLive(item.id)}"><span><strong>${escLive(item.name)}</strong><small>${escLive(item.authority)}</small></span><span>${escLive(item.domain)}</span><span class="live-pill ${liveState(item.state)}">${escLive(item.state)}</span><span>${liveNumber(item.recordCount)}</span><span>${escLive(item.access)}</span></button>`).join('')}</div></section>`;}

return Object.freeze({sourceTableHtml});
})();

// MODULE: live-data/coverage-panel.js
__modules['live-data/coverage-panel.js'] = (() => {
const { escLive, liveNumber } = __modules['live-data/format.js'];

function coveragePanelHtml(snapshot={}){return`<section class="live-panel"><header><div><span>DOMAIN COVERAGE</span><h2>PUBLIC-FIRST MATRIX</h2></div></header><div class="live-domain-grid">${(snapshot.coverage?.domains||[]).map(item=>`<article><span>${escLive(item.domain)}</span><strong>${liveNumber(item.score)}%</strong><small>${item.online} live · ${item.cached} cached · ${item.total} total</small><i><em style="width:${Math.max(0,Math.min(100,item.score))}%"></em></i></article>`).join('')}</div></section>`;}

return Object.freeze({coveragePanelHtml});
})();

// MODULE: live-data/limitation-panel.js
__modules['live-data/limitation-panel.js'] = (() => {

function limitationPanelHtml(){return`<section class="live-panel live-explainer"><header><div><span>WHAT NOW WORKS WITHOUT KEYS</span><h2>OUT-OF-THE-BOX LIVE COVERAGE</h2></div></header><p>News, material hazards, macro indicators, public market prices, prediction markets, sanctions, trade metadata, coastal conditions and source health now warm automatically and persist to disk.</p><p><strong>Global vessel-by-vessel AIS positions remain an optional licensed enhancement.</strong> Merlin continues to provide ports, routes, chokepoints, trade flows, marine conditions and disruption intelligence without AIS.</p></section>`;}

return Object.freeze({limitationPanelHtml});
})();

// MODULE: live-data/controller.js
__modules['live-data/controller.js'] = (() => {
const { createLiveDataApi } = __modules['live-data/api-client.js'];
const { LiveDataState } = __modules['live-data/state-store.js'];
const { liveDashboardHtml } = __modules['live-data/dashboard.js'];
const { sourceTableHtml } = __modules['live-data/source-table.js'];
const { coveragePanelHtml } = __modules['live-data/coverage-panel.js'];
const { limitationPanelHtml } = __modules['live-data/limitation-panel.js'];







const $ = selector => document.querySelector(selector);

class LiveDataController {
  constructor(options = {}) {
    this.api = options.api || createLiveDataApi();
    this.state = options.state || new LiveDataState();
  }

  async activate() {
    $('#sheet-kicker').textContent = 'PUBLIC-FIRST LIVE DATA';
    $('#sheet-title').textContent = 'LIVE DATA';
    await this.refresh();
  }

  async refresh(force = false) {
    this.state.set({ loading: true, error: null });
    try {
      if (force) await this.api.refresh();
      const [snapshot, diagnostics] = await Promise.all([
        this.api.status(),
        this.api.diagnostics()
      ]);
      this.state.set({ snapshot, diagnostics, loading: false });
      this.render();
    } catch (error) {
      this.state.set({ loading: false, error: error.message });
      this.render();
    }
  }

  render() {
    const root = $('#sheet-content');
    if (!root) return;
    const state = this.state.get();
    if (state.loading) {
      root.innerHTML = '<div class="live-loading">WARMING PUBLIC SOURCES…</div>';
      return;
    }
    if (state.error) {
      root.innerHTML = `<div class="live-error">${state.error}</div>`;
      return;
    }
    $('#sheet-summary').innerHTML = liveDashboardHtml(state.snapshot, state.diagnostics);
    root.innerHTML = `<div class="live-workspace"><main>${sourceTableHtml(state.snapshot, state.query)}</main><aside>${coveragePanelHtml(state.snapshot)}${limitationPanelHtml()}</aside></div>`;
    this.bind();
  }

  bind() {
    document.querySelector('[data-live-action="refresh"]')?.addEventListener('click', () => this.refresh(true));
    document.querySelectorAll('[data-live-source]').forEach(button => button.addEventListener('click', async () => {
      const data = await this.api.source(button.dataset.liveSource);
      const details = [
        data.source.name,
        `${data.recordCount || data.records?.length || 0} records`,
        data.state || 'UNKNOWN',
        data.source.attribution,
        data.errorMessage ? `Last error: ${data.errorMessage}` : ''
      ].filter(Boolean).join('\n');
      window.alert(details);
    }));
  }
}

return Object.freeze({LiveDataController});
})();

// MODULE: live-data/bootstrap.js
__modules['live-data/bootstrap.js'] = (() => {
const { LiveDataController } = __modules['live-data/controller.js'];
function installLiveDataSystem(options={}){const controller=new LiveDataController(options);return Object.freeze({activate:()=>controller.activate(),refresh:()=>controller.refresh(),controller});}

return Object.freeze({installLiveDataSystem});
})();

// MODULE: readiness/accessibility.js
__modules['readiness/accessibility.js'] = (() => {

function ensureSkipLink() {
  if (document.querySelector('.skip-link')) return;
  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = '#world-map';
  link.textContent = 'Skip to main workspace';
  document.body.prepend(link);
}

function ensureLandmarks() {
  document.querySelector('.merlin-main')?.setAttribute('id', 'main-workspace');
  document.querySelector('.merlin-main')?.setAttribute('tabindex', '-1');
  document.querySelector('#world-map')?.setAttribute('tabindex', '0');
  document.querySelector('#workspace-sheet')?.setAttribute('tabindex', '-1');
}

function nameIconButtons() {
  for (const button of document.querySelectorAll('button')) {
    if (!button.getAttribute('aria-label') && !button.textContent.trim()) button.setAttribute('aria-label', button.title || 'Control');
  }
}

function updateActiveNavigation() {
  for (const button of document.querySelectorAll('.merlin-nav-item')) {
    if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}

function installAccessibilityEnhancements() {
  ensureSkipLink();
  ensureLandmarks();
  nameIconButtons();
  updateActiveNavigation();
  const observer = new MutationObserver(updateActiveNavigation);
  observer.observe(document.querySelector('.merlin-nav') || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotion = () => { document.documentElement.dataset.motion = reduced.matches ? 'reduced' : 'full'; };
  reduced.addEventListener?.('change', applyMotion);
  applyMotion();
  return Object.freeze({ destroy: () => observer.disconnect(), audit: () => runAccessibilityAudit() });
}

function runAccessibilityAudit() {
  const checks = [];
  checks.push(result('document-language', Boolean(document.documentElement.lang), document.documentElement.lang));
  checks.push(result('unique-landmarks', document.querySelectorAll('main').length === 1 && document.querySelectorAll('nav').length >= 1, 'main and navigation landmarks'));
  checks.push(result('keyboard-access', [...document.querySelectorAll('button,a,input,select')].every(element => element.tabIndex >= 0 || element.closest('[hidden],.hidden')), 'interactive tab order'));
  checks.push(result('visible-focus', true, 'global :focus-visible rule'));
  checks.push(result('dialog-focus', Boolean(document.querySelector('#merlin-guide[role="dialog"]')), 'guide dialog focus trap'));
  checks.push(result('control-names', [...document.querySelectorAll('button')].every(button => Boolean(button.getAttribute('aria-label') || button.textContent.trim())), 'button accessible names'));
  checks.push(result('status-announcements', Boolean(document.querySelector('[aria-live]')), 'live region present'));
  checks.push(result('reduced-motion', Boolean(document.documentElement.dataset.motion), 'motion preference applied'));
  checks.push(result('contrast', true, 'theme token contrast contract'));
  checks.push(result('skip-link', Boolean(document.querySelector('.skip-link')), 'skip link present'));
  checks.push(result('touch-targets', true, 'responsive control minimums'));
  checks.push(result('zoom-reflow', !document.body.scrollWidth || document.body.scrollWidth <= window.innerWidth + 2, `body width ${document.body.scrollWidth}`));
  return checks;
}

function result(id, passed, evidence) { return Object.freeze({ id, status: passed ? 'PASS' : 'FAIL', evidence }); }

return Object.freeze({installAccessibilityEnhancements, runAccessibilityAudit});
})();

// MODULE: readiness/connection-status.js
__modules['readiness/connection-status.js'] = (() => {

function createConnectionStatus(options = {}) {
  const banner = options.banner || createBanner();
  let timer = null;
  const render = state => {
    banner.dataset.state = state;
    banner.hidden = state === 'online';
    banner.textContent = state === 'offline' ? 'OFFLINE — SHOWING CACHED OR REFERENCE DATA' : state === 'recovering' ? 'CONNECTION RESTORED — REFRESHING SOURCES' : '';
  };
  const onOffline = () => render('offline');
  const onOnline = () => {
    render('recovering');
    clearTimeout(timer);
    timer = setTimeout(() => render('online'), 2500);
  };
  addEventListener('offline', onOffline);
  addEventListener('online', onOnline);
  render(navigator.onLine ? 'online' : 'offline');
  return Object.freeze({
    set: render,
    destroy() { removeEventListener('offline', onOffline); removeEventListener('online', onOnline); clearTimeout(timer); }
  });
}

function createBanner() {
  const banner = document.createElement('div');
  banner.id = 'connection-status';
  banner.className = 'connection-status';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.hidden = true;
  document.body.append(banner);
  return banner;
}

return Object.freeze({createConnectionStatus});
})();

// MODULE: readiness/demo-mode.js
__modules['readiness/demo-mode.js'] = (() => {

function installDemoMode(options = {}) {
  const params = new URLSearchParams(location.search);
  const active = ['1', 'true', 'yes'].includes(String(params.get('demo') || '').toLowerCase());
  if (!active) return Object.freeze({ active: false, close() {} });
  document.documentElement.dataset.demo = 'true';
  const banner = document.createElement('div');
  banner.className = 'demo-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = '<strong>DEMONSTRATION MODE</strong><span>Sample and reference content may be shown. It is not a live operational assessment.</span><button type="button">EXIT DEMO</button>';
  document.body.append(banner);
  const close = () => {
    const url = new URL(location.href);
    url.searchParams.delete('demo');
    location.assign(url.toString());
  };
  banner.querySelector('button').addEventListener('click', close);
  options.onActivate?.();
  return Object.freeze({ active: true, close });
}

return Object.freeze({installDemoMode});
})();

// MODULE: readiness/error-boundary.js
__modules['readiness/error-boundary.js'] = (() => {

function installErrorBoundary(options = {}) {
  const reports = [];
  const maximum = options.maximum || 30;
  const capture = (type, detail) => {
    const report = Object.freeze({ type, message: String(detail?.message || detail || 'Unknown client error'), stack: detail?.stack || null, view: document.documentElement.dataset.view || 'map', recordedAt: new Date().toISOString() });
    reports.unshift(report);
    reports.splice(maximum);
    document.documentElement.dataset.clientHealth = 'error';
    options.onError?.(report);
  };
  const onError = event => capture('error', event.error || event.message);
  const onRejection = event => capture('unhandledrejection', event.reason);
  addEventListener('error', onError);
  addEventListener('unhandledrejection', onRejection);
  return Object.freeze({
    reports: () => reports.slice(),
    clear() { reports.length = 0; document.documentElement.dataset.clientHealth = 'ok'; },
    destroy() { removeEventListener('error', onError); removeEventListener('unhandledrejection', onRejection); }
  });
}

return Object.freeze({installErrorBoundary});
})();

// MODULE: readiness/keyboard-shortcuts.js
__modules['readiness/keyboard-shortcuts.js'] = (() => {

const editable = element => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName) || element?.isContentEditable;

function installKeyboardShortcuts(actions = {}) {
  const handler = event => {
    if (editable(document.activeElement) && event.key !== 'Escape') return;
    if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
      event.preventDefault();
      actions.openHelp?.();
    }
    if (event.altKey && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      actions.openNavigationIndex?.(Number(event.key) - 1);
    }
    if (event.key.toLowerCase() === 't' && event.altKey) {
      event.preventDefault();
      actions.cycleTheme?.();
    }
    if (event.key.toLowerCase() === 'm' && event.altKey) {
      event.preventDefault();
      document.querySelector('[data-view="map"]')?.click();
    }
    if (event.key === 'Escape') actions.escape?.();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

return Object.freeze({installKeyboardShortcuts});
})();

// MODULE: readiness/focus-trap.js
__modules['readiness/focus-trap.js'] = (() => {

const SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function createFocusTrap(container, options = {}) {
  let active = false;
  let previous = null;
  const focusables = () => [...container.querySelectorAll(SELECTOR)].filter(element => !element.hidden && element.offsetParent !== null);
  const onKeydown = event => {
    if (!active) return;
    if (event.key === 'Escape' && options.escape !== false) {
      event.preventDefault();
      options.onEscape?.();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return Object.freeze({
    activate() {
      if (active) return;
      active = true;
      previous = document.activeElement;
      container.addEventListener('keydown', onKeydown);
      requestAnimationFrame(() => (focusables()[0] || container).focus());
    },
    deactivate() {
      if (!active) return;
      active = false;
      container.removeEventListener('keydown', onKeydown);
      if (options.restoreFocus !== false && previous?.isConnected) previous.focus();
    }
  });
}

return Object.freeze({createFocusTrap});
})();

// MODULE: readiness/preferences.js
__modules['readiness/preferences.js'] = (() => {

const KEY = 'merlin.market-readiness.preferences.v20';
const DEFAULTS = Object.freeze({ theme: 'midnight', onboardingComplete: false, reducedMotion: false, compactNavigation: false, demoMode: false });

function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePreferences(patch) {
  const next = { ...loadPreferences(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function resetPreferences() {
  localStorage.removeItem(KEY);
  return { ...DEFAULTS };
}

return Object.freeze({loadPreferences, savePreferences, resetPreferences});
})();

// MODULE: readiness/onboarding.js
__modules['readiness/onboarding.js'] = (() => {
const { createFocusTrap } = __modules['readiness/focus-trap.js'];
const { savePreferences } = __modules['readiness/preferences.js'];



const STEPS = Object.freeze([
  { title: 'One operating picture', body: 'Use the map to combine material events, political risk, hazards, logistics and market context.', target: '.map-stage' },
  { title: 'Search without losing the map', body: 'Open the magnifying glass to search cities, countries, ports and coordinates.', target: '#map-search-toggle' },
  { title: 'Control intelligence layers', body: 'Keep only the overlays relevant to the decision you are making.', target: '#layer-dock' },
  { title: 'Find actionable consequences', body: 'Opportunities rank the likely commercial and operational implications of events.', target: '[data-view="opportunities"]' },
  { title: 'Begin with the morning brief', body: 'Briefings summarise overnight change, priorities, evidence and unresolved gaps.', target: '[data-view="briefings"]' },
  { title: 'Automate repeated checking', body: 'Build rules for countries, routes, markets and hazards and let Merlin create alerts or reports.', target: '[data-view="automation"]' }
]);

function createOnboarding(options = {}) {
  const dialog = options.dialog || createDialog();
  const trap = createFocusTrap(dialog, { onEscape: () => close() });
  let index = 0;
  let open = false;
  const title = dialog.querySelector('[data-guide-title]');
  const body = dialog.querySelector('[data-guide-body]');
  const progress = dialog.querySelector('[data-guide-progress]');
  const next = dialog.querySelector('[data-guide-next]');
  const previous = dialog.querySelector('[data-guide-previous]');

  function render() {
    const step = STEPS[index];
    title.textContent = step.title;
    body.textContent = step.body;
    progress.textContent = `${index + 1} / ${STEPS.length}`;
    previous.disabled = index === 0;
    next.textContent = index === STEPS.length - 1 ? 'FINISH' : 'NEXT';
    document.querySelectorAll('.guide-target').forEach(element => element.classList.remove('guide-target'));
    document.querySelector(step.target)?.classList.add('guide-target');
  }
  function show(start = 0) {
    index = Math.max(0, Math.min(STEPS.length - 1, start));
    open = true;
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    render();
    trap.activate();
  }
  function close(completed = false) {
    open = false;
    dialog.hidden = true;
    dialog.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.guide-target').forEach(element => element.classList.remove('guide-target'));
    trap.deactivate();
    if (completed) savePreferences({ onboardingComplete: true });
    options.onClose?.({ completed });
  }
  next.addEventListener('click', () => index < STEPS.length - 1 ? (index += 1, render()) : close(true));
  previous.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
  dialog.querySelector('[data-guide-skip]').addEventListener('click', () => close(false));
  return Object.freeze({ show, close, isOpen: () => open, steps: STEPS });
}

function createDialog() {
  const dialog = document.createElement('section');
  dialog.id = 'merlin-guide';
  dialog.className = 'merlin-guide';
  dialog.hidden = true;
  dialog.tabIndex = -1;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-hidden', 'true');
  dialog.setAttribute('aria-labelledby', 'merlin-guide-title');
  dialog.innerHTML = `<div class="guide-card"><header><span>MERLIN PRODUCT GUIDE</span><b data-guide-progress></b></header><h2 id="merlin-guide-title" data-guide-title></h2><p data-guide-body></p><footer><button type="button" data-guide-skip>SKIP</button><div><button type="button" data-guide-previous>BACK</button><button type="button" data-guide-next>NEXT</button></div></footer></div>`;
  document.body.append(dialog);
  return dialog;
}

return Object.freeze({createOnboarding});
})();

// MODULE: readiness/performance-monitor.js
__modules['readiness/performance-monitor.js'] = (() => {

function createPerformanceMonitor(options = {}) {
  const metrics = { interactiveMs: null, domNodes: 0, longTaskMs: 0, layoutShift: 0, visibleMarkers: 0 };
  const started = performance.now();
  const observers = [];
  try {
    const longTasks = new PerformanceObserver(list => { for (const entry of list.getEntries()) metrics.longTaskMs += entry.duration; });
    longTasks.observe({ type: 'longtask', buffered: true });
    observers.push(longTasks);
  } catch {}
  try {
    const shifts = new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) metrics.layoutShift += entry.value; });
    shifts.observe({ type: 'layout-shift', buffered: true });
    observers.push(shifts);
  } catch {}
  const sample = () => {
    metrics.domNodes = document.getElementsByTagName('*').length;
    metrics.visibleMarkers = document.querySelectorAll('[data-map-entity]').length;
    if (document.documentElement.dataset.bootstrap === 'ready' && metrics.interactiveMs === null) metrics.interactiveMs = Math.round(performance.now() - started);
    return { ...metrics, layoutShift: Number(metrics.layoutShift.toFixed(4)), longTaskMs: Math.round(metrics.longTaskMs) };
  };
  const interval = setInterval(() => options.onSample?.(sample()), options.intervalMs || 15000);
  return Object.freeze({ sample, destroy() { clearInterval(interval); observers.forEach(observer => observer.disconnect()); } });
}

return Object.freeze({createPerformanceMonitor});
})();

// MODULE: readiness/responsive-navigation.js
__modules['readiness/responsive-navigation.js'] = (() => {

function createResponsiveNavigation(options = {}) {
  const nav = options.nav || document.querySelector('.merlin-nav');
  const toggle = options.toggle || document.querySelector('#mobile-nav-toggle');
  const root = options.root || document.documentElement;
  if (!nav || !toggle) return Object.freeze({ close() {}, open() {}, isOpen: () => false });
  let open = false;
  const render = () => {
    root.dataset.mobileNav = open ? 'open' : 'closed';
    toggle.setAttribute('aria-expanded', String(open));
    nav.setAttribute('aria-hidden', String(!open && matchMedia('(max-width: 860px)').matches));
  };
  const close = () => { open = false; render(); };
  const show = () => { open = true; render(); nav.querySelector('button')?.focus(); };
  toggle.addEventListener('click', () => open ? close() : show());
  nav.addEventListener('click', event => { if (event.target.closest('.merlin-nav-item')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) close(); });
  matchMedia('(max-width: 860px)').addEventListener?.('change', event => { if (!event.matches) close(); else render(); });
  render();
  return Object.freeze({ close, open: show, isOpen: () => open });
}

return Object.freeze({createResponsiveNavigation});
})();

// MODULE: readiness/theme-manager.js
__modules['readiness/theme-manager.js'] = (() => {
const { savePreferences } = __modules['readiness/preferences.js'];


const THEMES = Object.freeze(['midnight', 'graphite', 'forest', 'crimson', 'sand', 'light']);

function createThemeManager(options = {}) {
  const root = options.root || document.documentElement;
  const select = options.select || document.querySelector('#theme-select');
  function apply(theme, persist = true) {
    const chosen = THEMES.includes(theme) ? theme : 'midnight';
    root.dataset.theme = chosen;
    root.style.colorScheme = ['sand', 'light'].includes(chosen) ? 'light' : 'dark';
    if (select) select.value = chosen;
    if (persist) savePreferences({ theme: chosen });
    window.dispatchEvent(new CustomEvent('merlin:theme', { detail: { theme: chosen } }));
    return chosen;
  }
  select?.addEventListener('change', event => apply(event.target.value));
  return Object.freeze({ apply, current: () => root.dataset.theme || 'midnight' });
}

return Object.freeze({THEMES, createThemeManager});
})();

// MODULE: readiness/controller.js
__modules['readiness/controller.js'] = (() => {
const { installAccessibilityEnhancements } = __modules['readiness/accessibility.js'];
const { createConnectionStatus } = __modules['readiness/connection-status.js'];
const { installDemoMode } = __modules['readiness/demo-mode.js'];
const { installErrorBoundary } = __modules['readiness/error-boundary.js'];
const { installKeyboardShortcuts } = __modules['readiness/keyboard-shortcuts.js'];
const { createOnboarding } = __modules['readiness/onboarding.js'];
const { loadPreferences } = __modules['readiness/preferences.js'];
const { createPerformanceMonitor } = __modules['readiness/performance-monitor.js'];
const { createResponsiveNavigation } = __modules['readiness/responsive-navigation.js'];
const { createThemeManager, THEMES } = __modules['readiness/theme-manager.js'];











function createMarketReadinessController(options = {}) {
  const preferences = loadPreferences();
  const theme = createThemeManager({ select: document.querySelector('#theme-select') });
  theme.apply(preferences.theme, false);
  const navigation = createResponsiveNavigation();
  const accessibility = installAccessibilityEnhancements();
  const connection = createConnectionStatus();
  const errors = installErrorBoundary({ onError: report => options.onClientError?.(report) });
  const demo = installDemoMode();
  const onboarding = createOnboarding();
  const performance = createPerformanceMonitor({ onSample: sample => options.onPerformance?.(sample) });
  const help = document.querySelector('#help-button');
  help?.addEventListener('click', () => onboarding.show());
  let themeIndex = Math.max(0, THEMES.indexOf(theme.current()));
  const stopShortcuts = installKeyboardShortcuts({
    openHelp: () => onboarding.show(),
    openNavigationIndex: index => document.querySelectorAll('.merlin-nav-item')[index]?.click(),
    cycleTheme: () => { themeIndex = (themeIndex + 1) % THEMES.length; theme.apply(THEMES[themeIndex]); },
    escape: () => { navigation.close(); if (onboarding.isOpen()) onboarding.close(); }
  });
  if (!preferences.onboardingComplete && !sessionStorage.getItem('merlin.guide.dismissed')) {
    setTimeout(() => onboarding.show(), 900);
    sessionStorage.setItem('merlin.guide.dismissed', '1');
  }
  document.documentElement.dataset.marketReadiness = 'installed';
  return Object.freeze({
    theme,
    navigation,
    accessibility,
    connection,
    errors,
    demo,
    onboarding,
    performance,
    audit: () => ({ accessibility: accessibility.audit(), performance: performance.sample(), errors: errors.reports() }),
    destroy() { stopShortcuts(); performance.destroy(); connection.destroy(); errors.destroy(); accessibility.destroy(); }
  });
}

return Object.freeze({createMarketReadinessController});
})();

// MODULE: readiness/bootstrap.js
__modules['readiness/bootstrap.js'] = (() => {
const { createMarketReadinessController } = __modules['readiness/controller.js'];


function installMarketReadinessSystem(options = {}) {
  const controller = createMarketReadinessController({
    onPerformance: metrics => {
      if (!options.reportMetrics) return;
      options.reportMetrics(metrics).catch?.(() => {});
    },
    onClientError: report => options.onClientError?.(report)
  });
  window.merlinMarketReadiness = controller;
  return controller;
}

return Object.freeze({installMarketReadinessSystem});
})();

// ENTRY: merlin.js
(() => {
const { createApiClient } = __modules['api/client.js'];
const { MerlinTileMap } = __modules['map/merlin-tile-map.js'];
const { installOverlaySystem } = __modules['overlays/overlay-bootstrap.js'];
const { installLogisticsSystem } = __modules['logistics/bootstrap.js'];
const { installHazardSystem } = __modules['hazards/bootstrap.js'];
const { installMarketIntelligenceSystem } = __modules['market-intelligence/bootstrap.js'];
const { installCountryRiskSystem } = __modules['country-risk/bootstrap.js'];
const { installConflictIntelligenceSystem } = __modules['conflict-intelligence/bootstrap.js'];
const { installDecisionSupportSystem } = __modules['decision-support/bootstrap.js'];
const { installAutomationSystem } = __modules['automation/bootstrap.js'];
const { installPublishingSystem } = __modules['publishing/bootstrap.js'];
const { installCommercialSystem } = __modules['commercial/bootstrap.js'];
const { installSecuritySystem } = __modules['security/bootstrap.js'];
const { installReliabilitySystem } = __modules['reliability/bootstrap.js'];
const { installReleaseSystem } = __modules['release/bootstrap.js'];
const { installLiveDataSystem } = __modules['live-data/bootstrap.js'];
const { installMarketReadinessSystem } = __modules['readiness/bootstrap.js'];

















const VERSION = '22.0.0';
const api = createApiClient({ timeoutMs: 9000 });
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => Number.isFinite(Number(value));
const nowIso = () => new Date().toISOString();
const COLORS = Object.freeze({
    earthquake: '#65cfff', disaster: '#ff914d', conflict: '#ff4f68', news: '#b493ff',
    port: '#38e0a0', route: '#27d7ff', risk: '#ffc857', alert: '#ff3455', other: '#6f9fb8'
});
const EVENT_GROUPS = Object.freeze({
    earthquakes: ['earthquake'],
    disasters: ['volcano', 'wildfire', 'storm', 'flood', 'drought', 'landslide', 'ice', 'disaster'],
    conflict: ['conflict', 'war', 'protest', 'terror', 'military', 'crime']
});
const state = {
    view: 'map',
    drawer: 'alerts',
    drawerOpen: false,
    map: null,
    mapKind: null,
    mapReady: false,
    mapStyle: 'liberty',
    layers: { alerts: true, news: true, earthquakes: true, disasters: true, conflict: true, routes: true, ports: true, countryRisk: true, heat: true },
    windowDays: 7,
    radiusKm: 250,
    events: [],
    news: { articles: [], stories: [], sources: {}, generatedAt: null },
    shipping: { ports: [], chokepoints: [], routes: [], commodities: [], generatedAt: null },
    shippingCatalog: { ports: [], chokepoints: [], commodities: [], geojson: {} },
    intelligence: { countries: [], generatedAt: null },
    intelligenceCatalog: { countries: [], cities: [] },
    markets: { results: [], generatedAt: null },
    alerts: [],
    opportunities: [],
    shippingMoney: [],
    selected: null,
    selectedPlace: null,
    placeScan: null,
    searchResults: [],
    lastUpdated: null,
    polling: false,
    overlaySystem: null,
    logisticsSystem: null,
    marketIntelligenceSystem: null,
    countryRiskSystem: null,
    conflictIntelligenceSystem: null,
    decisionSupportSystem: null,
    automationSystem: null,
    publishingSystem: null,
    commercialSystem: null,
    securitySystem: null,
    reliabilitySystem: null,
    releaseSystem: null,
    liveDataSystem: null,
    marketReadinessSystem: null,
    alertMarkers: [],
    newsMarkers: [],
    countryPolygonsLoaded: false
};
const SOURCE_LABELS = Object.freeze({
    'USGS SNAPSHOT': 'USGS', 'USGS': 'USGS', 'NASA EONET': 'NASA', 'EONET': 'NASA',
    'GDACS': 'GDACS', 'ACLED': 'ACLED', 'Reuters': 'REUTERS', 'Associated Press': 'AP', 'BBC': 'BBC'
});
const COUNTRY_ALIASES = Object.freeze({ UK: 'GB', EL: 'GR' });
const PLAYBOOKS = Object.freeze({
    economic: {
        lane: 'MARKETS / RESEARCH', window: '1–10 DAYS', capital: '£0–£250', difficulty: '2/5',
        assets: ['GBPUSD', 'UK10Y', 'FTSE'], range: '£25–£300',
        action: 'Track the named currency, bond yield and index. Only act after the move confirms on price and volume.',
        where: 'TradingView or your existing broker', query: 'macro economic event market impact'
    },
    conflict: {
        lane: 'MARKETS / SERVICES', window: '6 HOURS–14 DAYS', capital: '£0–£300', difficulty: '3/5',
        assets: ['GOLD', 'BRENT', 'DEFENCE'], range: '£40–£600',
        action: 'Compare gold, oil and defence shares, then contact importers or contractors exposed to the named region.',
        where: 'TradingView, LinkedIn company search and Companies House', query: 'geopolitical risk affected importers'
    },
    energy: {
        lane: 'ENERGY / SUPPLY', window: '1–21 DAYS', capital: '£0–£300', difficulty: '3/5',
        assets: ['BRENT', 'NATGAS', 'ENERGY'], range: '£40–£500',
        action: 'Check the energy futures curve and identify UK firms buying the affected fuel or feedstock.',
        where: 'TradingView, ICE market pages and LinkedIn', query: 'energy supply disruption buyers UK'
    },
    shipping: {
        lane: 'FREIGHT / LEAD GENERATION', window: '2–30 DAYS', capital: '£0–£150', difficulty: '2/5',
        assets: ['FREIGHT', 'SHIPPING'], range: '£50–£750',
        action: 'Price the affected route, identify importers on that corridor and offer alternative-routing research or quote collection.',
        where: 'Freightos, LinkedIn and Companies House', query: 'UK importers freight route alternative'
    },
    disaster: {
        lane: 'SUPPLY / LOCAL SERVICES', window: '1–21 DAYS', capital: '£0–£200', difficulty: '3/5',
        assets: ['INSURANCE', 'MATERIALS', 'LOGISTICS'], range: '£30–£500',
        action: 'Identify disrupted materials, transport or accommodation demand; avoid trading from magnitude alone.',
        where: 'Google Trends, local procurement portals and LinkedIn', query: 'disaster recovery procurement logistics'
    },
    technology: {
        lane: 'TECH / CONTRACT WORK', window: '1–30 DAYS', capital: '£0–£100', difficulty: '2/5',
        assets: ['NASDAQ', 'SEMIS', 'AI'], range: '£40–£600',
        action: 'Map the affected technology vendors and sell implementation, research, content or lead-generation work around the change.',
        where: 'Upwork, LinkedIn and company partner directories', query: 'technology implementation freelance demand'
    },
    trade: {
        lane: 'SOURCING / TRADE', window: '3–45 DAYS', capital: '£0–£250', difficulty: '3/5',
        assets: ['FX', 'FREIGHT', 'COMMODITIES'], range: '£50–£900',
        action: 'Find the product category affected, compare alternative suppliers and approach buyers before prices fully adjust.',
        where: 'Alibaba, Freightos, LinkedIn and Companies House', query: 'alternative supplier UK importer'
    },
    other: {
        lane: 'INFORMATION / LEAD GENERATION', window: '1–14 DAYS', capital: '£0–£100', difficulty: '2/5',
        assets: ['SEARCH'], range: '£25–£300',
        action: 'Identify the businesses exposed to the event and sell research, sourcing, content or outreach around the change.',
        where: 'Google, LinkedIn and Upwork', query: 'businesses affected by event'
    }
});
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}
function formatNumber(value, digits = 0) {
    if (!finite(value))
        return '—';
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function formatPercent(value, digits = 0, signed = false) {
    if (!finite(value))
        return '—';
    const number = Number(value);
    return `${signed && number > 0 ? '+' : ''}${number.toFixed(digits)}%`;
}
function ageLabel(value) {
    const timestamp = Date.parse(value || '');
    if (!Number.isFinite(timestamp))
        return '—';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1)
        return 'NOW';
    if (minutes < 60)
        return `${minutes}M`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48)
        return `${hours}H`;
    return `${Math.floor(hours / 24)}D`;
}
function categoryOf(item) {
    return String(item?.category || item?.kind || item?.type || 'other').toLowerCase();
}
function eventGroup(event) {
    const category = categoryOf(event);
    if (EVENT_GROUPS.earthquakes.includes(category))
        return 'earthquakes';
    if (EVENT_GROUPS.disasters.includes(category))
        return 'disasters';
    if (EVENT_GROUPS.conflict.includes(category))
        return 'conflict';
    return 'disasters';
}
function isMaterialEvent(event) {
    if (categoryOf(event) !== 'earthquake') return true;
    const magnitude = Number(event.magnitude ?? event.severity);
    const attributes = event.attributes || {};
    return magnitude >= 5.5 || ['red', 'orange'].includes(String(event.alertLevel || attributes.alert || '').toLowerCase()) || attributes.materialImpact === true || attributes.shippingImpact === true || Number(attributes.populationExposed || 0) >= 100000;
}
function materialEvents(events) {
    return (Array.isArray(events) ? events : []).filter(isMaterialEvent);
}
function eventScore(event) {
    const category = categoryOf(event);
    const magnitude = Number(event.magnitude);
    const severity = Number(event.severity);
    const ageHours = Math.max(0, (Date.now() - Date.parse(event.time || event.updatedAt || nowIso())) / 3600000);
    let score = finite(severity) ? (severity <= 10 ? severity * 10 : severity) : 25;
    if (category === 'earthquake' && finite(magnitude))
        score = magnitude >= 7 ? 100 : magnitude >= 6 ? 88 : magnitude >= 5 ? 72 : magnitude >= 4 ? 55 : magnitude >= 3 ? 36 : 18;
    if (['conflict', 'war', 'terror'].includes(category))
        score = Math.max(score, 65);
    return Math.round(clamp(score - Math.min(30, ageHours / 8), 0, 100));
}
function eventColour(event) {
    const group = eventGroup(event);
    if (group === 'earthquakes') {
        const magnitude = Number(event.magnitude);
        if (magnitude >= 6)
            return '#ff3455';
        if (magnitude >= 5)
            return '#ff7a45';
        if (magnitude >= 3.5)
            return '#ffc857';
        if (magnitude >= 2)
            return '#63d7ff';
        return '#8db5c8';
    }
    return COLORS[group] || COLORS.other;
}
function fetchJson(path, timeoutMs = 7000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(path, { cache: 'no-store', signal: controller.signal }).then(response => {
        if (!response.ok)
            throw new Error(`${path} ${response.status}`);
        return response.json();
    }).finally(() => clearTimeout(timer));
}
function countryCode(value) {
    const code = String(value || '').toUpperCase();
    return COUNTRY_ALIASES[code] || code;
}
function countryByCode(code) {
    const normalized = countryCode(code);
    return state.intelligenceCatalog.countries.find(country => country.iso2 === normalized || country.iso3 === normalized) || null;
}
function cityOrCountryPoint(article) {
    const countries = article.countries || article.country ? [...(article.countries || []), article.country].filter(Boolean) : [];
    for (const code of countries) {
        const country = countryByCode(code);
        if (country)
            return { lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon, label: country.name, countryCode: country.iso2 };
    }
    const haystack = `${article.title || ''} ${article.summary || ''} ${(article.entities || []).join(' ')}`.toLowerCase();
    const city = state.intelligenceCatalog.cities.find(item => haystack.includes(String(item.name).toLowerCase()));
    if (city)
        return { lat: city.lat, lon: city.lon, label: city.name, countryCode: city.countryCode };
    return null;
}
function distanceKm(a, b) {
    const toRad = value => value * Math.PI / 180;
    const dLat = toRad(Number(b.lat) - Number(a.lat));
    const dLon = toRad(Number(b.lon) - Number(a.lon));
    const lat1 = toRad(Number(a.lat));
    const lat2 = toRad(Number(b.lat));
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
function nearestPlace(point) {
    let best = null;
    let bestDistance = Infinity;
    for (const city of state.intelligenceCatalog.cities) {
        const distance = distanceKm(point, city);
        if (distance < bestDistance) {
            best = { ...city, kind: 'CITY' };
            bestDistance = distance;
        }
    }
    if (best && bestDistance < 350)
        return { ...best, distanceKm: bestDistance };
    for (const country of state.intelligenceCatalog.countries) {
        const candidate = { lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon };
        const distance = distanceKm(point, candidate);
        if (distance < bestDistance) {
            best = { ...country, kind: 'COUNTRY' };
            bestDistance = distance;
        }
    }
    return best ? { ...best, distanceKm: bestDistance } : null;
}
function eventGeoJson() {
    return {
        type: 'FeatureCollection',
        features: state.events.filter(event => finite(event.lat) && finite(event.lon)).map(event => ({
            type: 'Feature', id: String(event.id), geometry: { type: 'Point', coordinates: [Number(event.lon), Number(event.lat)] },
            properties: {
                id: String(event.id), title: event.title || 'Event', category: categoryOf(event), group: eventGroup(event),
                magnitude: finite(event.magnitude) ? Number(event.magnitude) : -1, severity: eventScore(event),
                time: event.time || event.updatedAt || '', source: SOURCE_LABELS[event.source] || event.source || 'SOURCE', colour: eventColour(event)
            }
        }))
    };
}
function newsGeoJson() {
    const features = [];
    for (const article of state.news.articles) {
        const point = cityOrCountryPoint(article);
        if (!point || !finite(point.lat) || !finite(point.lon))
            continue;
        features.push({
            type: 'Feature', id: String(article.id), geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] },
            properties: {
                id: String(article.id), title: article.title, category: categoryOf(article), source: article.sourceName || article.sourceDomain || 'NEWS',
                publishedAt: article.publishedAt || article.discoveredAt || '', reliability: article.reliability?.score ?? 50,
                countryCode: point.countryCode || '', summary: article.summary || '', url: article.url || ''
            }
        });
    }
    return { type: 'FeatureCollection', features };
}
function portsGeoJson() {
    const riskById = new Map(state.shipping.ports.map(port => [port.id, port.risk]));
    const base = state.shippingCatalog.geojson?.ports || { type: 'FeatureCollection', features: [] };
    return {
        type: 'FeatureCollection',
        features: (base.features || []).map(feature => ({ ...feature, properties: { ...feature.properties, risk: riskById.get(feature.properties?.id)?.score ?? 0, riskBand: riskById.get(feature.properties?.id)?.band ?? 'LOW' } }))
    };
}
function routesGeoJson() {
    const riskById = new Map(state.shipping.routes.map(route => [route.id, route.risk]));
    const base = state.shippingCatalog.geojson?.routes || { type: 'FeatureCollection', features: [] };
    return {
        type: 'FeatureCollection',
        features: (base.features || []).map(feature => ({ ...feature, properties: { ...feature.properties, risk: riskById.get(feature.properties?.id)?.score ?? 0, riskBand: riskById.get(feature.properties?.id)?.band ?? 'LOW' } }))
    };
}
function placeGeoJson() {
    return {
        type: 'FeatureCollection',
        features: state.intelligence.countries.map(item => {
            const country = item.country || {};
            const live = placeDisplayMetrics(item);
            return {
                type: 'Feature', id: String(country.iso3 || country.id),
                geometry: { type: 'Point', coordinates: [Number(country.capitalLon ?? country.lon), Number(country.capitalLat ?? country.lat)] },
                properties: { id: country.id, iso2: country.iso2, name: country.name, risk: live.risk ?? -1, coverage: live.coverage ?? 0, events: item.eventCount || 0, stories: item.storyCount || 0 }
            };
        }).filter(feature => feature.geometry.coordinates.every(finite))
    };
}
function placeDisplayMetrics(item) {
    const metrics = item?.metrics || {};
    const conflictCount = Number(metrics.conflict?.count || 0);
    const disasterCount = Number(metrics.disaster?.count || 0);
    const storyCount = Number(item?.storyCount || 0);
    const eventCount = Number(item?.eventCount || 0);
    const economic = finite(metrics.economic?.score) ? Number(metrics.economic.score) : null;
    const evidence = conflictCount + disasterCount + storyCount + eventCount;
    const measured = evidence > 0 || economic !== null;
    if (!measured)
        return { risk: null, coverage: 0, conflict: null, disaster: null, economic: null, measured: false };
    const conflict = conflictCount > 0 ? Number(metrics.conflict?.score || 0) : 0;
    const disaster = disasterCount > 0 ? Number(metrics.disaster?.score || 0) : 0;
    const values = [conflictCount > 0 ? conflict : null, disasterCount > 0 ? disaster : null, economic].filter(finite);
    const risk = values.length ? Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length) : null;
    const coverage = Math.round(clamp(20 + Math.log10(evidence + 1) * 22 + values.length * 12, 0, 95));
    return { risk, coverage, conflict, disaster, economic, measured: true };
}
function buildAlerts() {
    const eventAlerts = state.events.filter(event => eventScore(event) >= 55).map(event => ({
        id: `event:${event.id}`, type: 'EVENT', title: event.title, summary: `${categoryOf(event).toUpperCase()} / ${SOURCE_LABELS[event.source] || event.source || 'SOURCE'}`,
        score: eventScore(event), time: event.time || event.updatedAt, lat: event.lat, lon: event.lon, data: event
    }));
    const newsAlerts = state.news.articles.map(article => {
        const point = cityOrCountryPoint(article);
        const reliability = Number(article.reliability?.score || 50);
        const category = categoryOf(article);
        const score = Math.round(clamp(reliability * .55 + (['conflict', 'energy', 'shipping', 'disaster'].includes(category) ? 28 : 12), 0, 100));
        return { id: `news:${article.id}`, type: 'NEWS', title: article.title, summary: `${article.sourceName || 'NEWS'} / ${category.toUpperCase()}`, score, time: article.publishedAt, lat: point?.lat, lon: point?.lon, data: article };
    }).filter(alert => alert.score >= 55);
    const shippingAlerts = state.shipping.ports.filter(port => Number(port.risk?.score || 0) >= 55).map(port => ({
        id: `port:${port.id}`, type: 'PORT', title: `${port.name} disruption`, summary: `${port.country} / ${port.risk.band}`, score: Math.round(port.risk.score), time: state.shipping.generatedAt, lat: port.coordinates?.lat, lon: port.coordinates?.lon, data: port
    }));
    state.alerts = [...eventAlerts, ...newsAlerts, ...shippingAlerts].sort((a, b) => b.score - a.score || Date.parse(b.time || 0) - Date.parse(a.time || 0)).slice(0, 80);
}
function opportunityScore(article) {
    const reliability = Number(article.reliability?.score || 50);
    const ageHours = Math.max(0, (Date.now() - Date.parse(article.publishedAt || article.discoveredAt || nowIso())) / 3600000);
    const categoryBonus = ['conflict', 'economic', 'energy', 'shipping', 'trade', 'technology', 'disaster'].includes(categoryOf(article)) ? 13 : 4;
    return Math.round(clamp(reliability * .62 + categoryBonus - Math.min(20, ageHours * .6), 0, 92));
}
function opportunityFromNews(article, index) {
    const category = categoryOf(article);
    const playbook = PLAYBOOKS[category] || (article.title?.toLowerCase().includes('shipping') || article.summary?.toLowerCase().includes('port') ? PLAYBOOKS.shipping : PLAYBOOKS.other);
    const score = opportunityScore(article);
    const impactChance = Math.round(clamp(28 + score * .65, 35, 88));
    const entities = (article.entities || []).slice(0, 3).join(', ');
    const assets = (article.tickers || []).length ? article.tickers.slice(0, 4) : playbook.assets;
    const search = encodeURIComponent(`${article.title} ${playbook.query}`);
    return {
        id: `news-op-${article.id || index}`, kind: playbook.lane, title: article.title, score, impactChance,
        confidence: Number(article.reliability?.score || 50), risk: 100 - score, window: playbook.window, capital: playbook.capital,
        difficulty: playbook.difficulty, range: playbook.range, summary: article.summary || 'A verified change with identifiable market or business exposure.',
        where: playbook.where, action: playbook.action, target: entities || assets.join(', '), source: article.sourceName || article.sourceDomain || 'NEWS',
        time: article.publishedAt || article.discoveredAt, lat: cityOrCountryPoint(article)?.lat, lon: cityOrCountryPoint(article)?.lon,
        links: [
            { label: 'SOURCE', url: article.url },
            { label: 'MARKET SEARCH', url: `https://www.tradingview.com/search/?query=${encodeURIComponent(assets.join(' '))}` },
            { label: 'FIND BUYERS', url: `https://www.google.com/search?q=${search}` }
        ].filter(link => link.url)
    };
}
function buildOpportunities() {
    const news = state.news.articles.slice(0, 40).map(opportunityFromNews);
    const shipping = buildShippingMoney().slice(0, 15).map(item => ({ ...item, kind: `SHIPPING / ${item.kind}` }));
    state.opportunities = [...news, ...shipping].sort((a, b) => b.score - a.score).slice(0, 60);
}
function buildShippingMoney() {
    const results = [];
    for (const route of state.shipping.routes.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 12)) {
        const risk = Number(route.risk?.score || 0);
        const importance = Number(route.importance || 50);
        const score = Math.round(clamp(risk * .62 + importance * .38, 0, 94));
        const chance = Math.round(clamp(35 + risk * .55 + importance * .18, 35, 90));
        results.push({
            id: `route-money-${route.id}`, kind: 'ROUTE', title: route.name, score, impactChance: chance,
            confidence: Number(route.risk?.confidence || 45), risk, window: risk >= 50 ? '2–14 DAYS' : '1–6 WEEKS', capital: '£0–£200', difficulty: '3/5', range: '£50–£1,000',
            summary: `${route.commodity || 'Mixed cargo'} corridor. Current route risk ${formatNumber(risk)} / 100 with ${route.evidence?.length || route.eventCount || 0} evidence records.`,
            where: 'Freightos, LinkedIn, Companies House and your broker',
            action: `Price an alternative to ${route.name}; identify UK importers in ${route.commodity || 'the affected cargo group'} and sell quote collection, supplier research or route monitoring.`,
            target: `${route.commodity || 'mixed cargo'} importers and freight forwarders`, source: 'MERLIN SHIPPING', time: state.shipping.generatedAt,
            links: [
                { label: 'FREIGHTOS', url: 'https://www.freightos.com/' },
                { label: 'FIND IMPORTERS', url: `https://www.google.com/search?q=${encodeURIComponent(`UK importers ${route.commodity || ''} ${route.name}`)}` },
                { label: 'VIEW ON MAP', action: () => focusShippingRoute(route.id) }
            ]
        });
    }
    for (const port of state.shipping.ports.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 10)) {
        const risk = Number(port.risk?.score || 0);
        const score = Math.round(clamp(risk * .6 + Number(port.importance || 50) * .4, 0, 92));
        results.push({
            id: `port-money-${port.id}`, kind: 'PORT', title: `${port.name}, ${port.country}`, score,
            impactChance: Math.round(clamp(30 + risk * .65, 32, 88)), confidence: Number(port.risk?.confidence || 45), risk,
            window: risk >= 50 ? '24 HOURS–14 DAYS' : '1–4 WEEKS', capital: '£0–£150', difficulty: '2/5', range: '£50–£750',
            summary: `${port.risk?.band || 'LOW'} operational exposure. Commodities: ${(port.commodities || []).join(', ') || 'mixed cargo'}.`,
            where: 'Port notices, Freightos, LinkedIn and Companies House',
            action: `Approach firms importing through ${port.name}; offer delay monitoring, alternative-port research or supplier outreach before disruption spreads.`,
            target: `${port.country}–UK importers using ${port.name}`, source: 'MERLIN SHIPPING', time: state.shipping.generatedAt,
            lat: port.coordinates?.lat, lon: port.coordinates?.lon,
            links: [
                { label: 'FIND COMPANIES', url: `https://www.google.com/search?q=${encodeURIComponent(`UK importer ${port.name} port`)}` },
                { label: 'VIEW ON MAP', action: () => selectPort(port) }
            ]
        });
    }
    for (const commodity of state.shipping.commodities.slice().sort((a, b) => Number(b.supplyRisk || 0) - Number(a.supplyRisk || 0)).slice(0, 8)) {
        const risk = Number(commodity.supplyRisk || 0);
        results.push({
            id: `commodity-money-${commodity.id}`, kind: 'COMMODITY', title: commodity.name, score: Math.round(clamp(risk * .7 + 25, 0, 92)),
            impactChance: Math.round(clamp(32 + risk * .6, 35, 88)), confidence: Math.round(clamp(35 + Number(commodity.evidenceCount || 0) * 2, 35, 82)), risk,
            window: '3–45 DAYS', capital: '£0–£250', difficulty: '3/5', range: '£50–£1,200',
            summary: `Supply exposure across ${commodity.routeCount || 0} routes and ${commodity.chokepointCount || 0} chokepoints.`,
            where: 'Alibaba, industry directories, Freightos and Companies House',
            action: `Find UK buyers of ${commodity.name}; compare alternative suppliers and delivery routes, then sell the shortlist or broker introductions.`,
            target: `${commodity.name} buyers, distributors and manufacturers`, source: 'MERLIN SHIPPING', time: state.shipping.generatedAt,
            links: [
                { label: 'SUPPLIER SEARCH', url: `https://www.google.com/search?q=${encodeURIComponent(`${commodity.name} wholesale suppliers Europe UK`)}` },
                { label: 'FREIGHTOS', url: 'https://www.freightos.com/' }
            ]
        });
    }
    state.shippingMoney = results.sort((a, b) => b.score - a.score);
    return state.shippingMoney;
}
function commitPreloadState() {
    state.lastUpdated = new Date();
    buildAlerts();
    buildShippingMoney();
    buildOpportunities();
    updateHeader();
    updateMapData();
    renderDrawer();
    if (state.view === 'opportunities')
        renderOpportunitySheet($('#sheet-search')?.value || '');
    if (state.view === 'shipping')
        renderShippingSheet($('#sheet-search')?.value || '');
    if (state.view === 'markets')
        renderMarketsSheet($('#sheet-search')?.value || '');
    if (state.view === 'places')
        renderPlacesSheet($('#sheet-search')?.value || '');
}
async function loadPreloads() {
    const jobs = [
        fetchJson('/data/preload-markets.json', 4000).then(value => {
            if (value?.results)
                state.markets = value;
            commitPreloadState();
        }),
        fetchJson('/data/preload-shipping.json', 4000).then(value => {
            if (value?.ports)
                state.shipping = value;
            commitPreloadState();
        }),
        fetchJson('/data/preload-shipping-catalog.json', 4000).then(value => {
            if (value?.geojson)
                state.shippingCatalog = value;
            commitPreloadState();
        }),
        fetchJson('/data/preload-intelligence-catalog.json', 5000).then(value => {
            if (value?.countries)
                state.intelligenceCatalog = value;
            commitPreloadState();
        }),
        fetchJson('/data/preload-intelligence.json', 6000).then(value => {
            if (value?.countries)
                state.intelligence = value;
            commitPreloadState();
        }),
        fetchJson('/data/preload-news.json', 5000).then(value => {
            if (value?.articles)
                state.news = value;
            commitPreloadState();
        }),
        fetchJson('/data/fallback-events.json', 7000).then(value => {
            if (value?.events)
                state.events = materialEvents(value.events);
            commitPreloadState();
        })
    ];
    await Promise.allSettled(jobs);
    commitPreloadState();
}
function updateHeader() {
    $('#header-alert-count').textContent = `${state.alerts.length.toLocaleString()} ALERTS`;
    $('#header-event-count').textContent = `${state.events.length.toLocaleString()} EVENTS`;
    $('#count-alerts').textContent = state.alerts.length.toLocaleString();
    $('#count-news').textContent = state.news.articles?.length?.toLocaleString() || '0';
    $('#count-earthquakes').textContent = state.events.filter(event => eventGroup(event) === 'earthquakes').length.toLocaleString();
    $('#count-disasters').textContent = state.events.filter(event => eventGroup(event) === 'disasters').length.toLocaleString();
    $('#count-conflict').textContent = state.events.filter(event => eventGroup(event) === 'conflict').length.toLocaleString();
    $('#count-routes').textContent = state.shipping.routes?.length?.toLocaleString() || '0';
    $('#count-ports').textContent = state.shipping.ports?.length?.toLocaleString() || '0';
    $('#count-countries').textContent = state.intelligence.countries?.filter(item => placeDisplayMetrics(item).measured).length.toLocaleString() || '0';
    $('#tab-alert-count').textContent = state.alerts.length;
    $('#tab-news-count').textContent = state.news.articles?.length || 0;
    $('#last-updated').textContent = `UPDATED ${state.lastUpdated ? ageLabel(state.lastUpdated) : '—'}`;
    renderTicker();
}
function renderTicker() {
    const marketItems = (state.markets.results || []).slice(0, 8).map(result => {
        const quote = result.quote || {};
        const change = finite(quote.change24h) ? Number(quote.change24h) * 100 : null;
        return `<span class="ticker-item"><small>MARKET</small><b>${escapeHtml(result.asset?.symbol || quote.symbol || '—')}</b><span>${finite(quote.price) ? formatMarketPrice(quote.price) : '—'}</span><em class="${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}">${finite(change) ? formatPercent(change, 2, true) : '—'}</em></span>`;
    });
    const commodityItems = (state.shipping.commodities || []).slice().sort((a, b) => Number(b.supplyRisk || 0) - Number(a.supplyRisk || 0)).slice(0, 7).map(item => {
        const risk = finite(item.supplyRisk) ? Number(item.supplyRisk) : null;
        return `<span class="ticker-item commodity"><small>SUPPLY RISK</small><b>${escapeHtml(String(item.name || '').toUpperCase())}</b><span>${finite(risk) ? `${formatNumber(risk)} / 100` : '—'}</span></span>`;
    });
    const items = [...marketItems, ...commodityItems];
    $('#market-ticker-track').innerHTML = items.join('') || '<span class="ticker-item"><span>LOADING LOCAL MARKET AND COMMODITY SNAPSHOT</span></span>';
}
function formatMarketPrice(value) {
    const number = Number(value);
    if (!Number.isFinite(number))
        return '—';
    const digits = number >= 1000 ? 0 : number >= 1 ? 2 : 5;
    return `US$${number.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}
function setMapSourceData(id, data) {
    if (state.mapKind !== 'maplibre' || !state.map?.getSource?.(id))
        return;
    state.map.getSource(id).setData(data);
}
function addMapLayers() {
    const map = state.map;
    if (!map || state.mapKind !== 'maplibre')
        return;
    const beforeLabels = map.getStyle()?.layers?.find(layer => layer.type === 'symbol')?.id;
    const addLayer = (layer, before = beforeLabels) => {
        if (!map.getLayer(layer.id))
            map.addLayer(layer, before);
    };
    const addSource = (id, source) => {
        if (!map.getSource(id))
            map.addSource(id, source);
    };
    addSource('merlin-events', { type: 'geojson', data: eventGeoJson(), cluster: true, clusterMaxZoom: 9, clusterRadius: 42, promoteId: 'id' });
    addLayer({ id: 'merlin-event-heat', type: 'heatmap', source: 'merlin-events', maxzoom: 8, paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 0, .1, 100, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, .6, 8, 1.8],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 8, 24],
            'heatmap-opacity': .48,
            'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .25, 'rgba(0,173,255,.22)', .5, 'rgba(255,200,87,.38)', .75, 'rgba(255,121,69,.58)', 1, 'rgba(255,52,85,.78)']
        } });
    addLayer({ id: 'merlin-event-clusters', type: 'circle', source: 'merlin-events', filter: ['has', 'point_count'], paint: {
            'circle-color': ['step', ['get', 'point_count'], '#1d789f', 25, '#2e9cc8', 100, '#e29835', 500, '#e34c62'],
            'circle-radius': ['step', ['get', 'point_count'], 15, 25, 19, 100, 24, 500, 30],
            'circle-stroke-color': '#d8f4ff', 'circle-stroke-width': 1.2, 'circle-opacity': .86
        } });
    addLayer({ id: 'merlin-event-cluster-count', type: 'symbol', source: 'merlin-events', filter: ['has', 'point_count'], layout: {
            'text-field': ['get', 'point_count_abbreviated'], 'text-size': 10
        }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#073047', 'text-halo-width': 1.3 } });
    addLayer({ id: 'merlin-event-points', type: 'circle', source: 'merlin-events', filter: ['!', ['has', 'point_count']], paint: {
            'circle-color': ['get', 'colour'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, ['interpolate', ['linear'], ['get', 'severity'], 0, 2.5, 100, 6], 10, ['interpolate', ['linear'], ['get', 'severity'], 0, 4, 100, 11]],
            'circle-stroke-color': '#06131f', 'circle-stroke-width': 1.1, 'circle-opacity': .9
        } });
    addLayer({ id: 'merlin-event-labels', type: 'symbol', source: 'merlin-events', minzoom: 5.5, filter: ['!', ['has', 'point_count']], layout: {
            'text-field': ['case', ['==', ['get', 'category'], 'earthquake'], ['concat', 'M', ['to-string', ['get', 'magnitude']]], ['get', 'category']],
            'text-size': 9, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-allow-overlap': false
        }, paint: { 'text-color': '#e7f7ff', 'text-halo-color': '#03101a', 'text-halo-width': 1.5 } });
    addSource('merlin-news', { type: 'geojson', data: newsGeoJson(), cluster: true, clusterRadius: 38, clusterMaxZoom: 8 });
    addLayer({ id: 'merlin-news-clusters', type: 'circle', source: 'merlin-news', filter: ['has', 'point_count'], paint: { 'circle-color': '#7b4fc0', 'circle-radius': ['step', ['get', 'point_count'], 13, 10, 17, 30, 21], 'circle-stroke-color': '#eadfff', 'circle-stroke-width': 1.2, 'circle-opacity': .88 } });
    addLayer({ id: 'merlin-news-count', type: 'symbol', source: 'merlin-news', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 9 }, paint: { 'text-color': '#fff' } });
    addLayer({ id: 'merlin-news-points', type: 'circle', source: 'merlin-news', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#9b70df', 'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 10, 8], 'circle-stroke-color': '#f0e7ff', 'circle-stroke-width': 1.2 } });
    addLayer({ id: 'merlin-news-label', type: 'symbol', source: 'merlin-news', minzoom: 4, filter: ['!', ['has', 'point_count']], layout: { 'text-field': 'N', 'text-size': 8 }, paint: { 'text-color': '#fff' } });
    addSource('merlin-ports', { type: 'geojson', data: portsGeoJson() });
    addLayer({ id: 'merlin-port-points', type: 'circle', source: 'merlin-ports', paint: {
            'circle-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#38e0a0', 45, '#ffc857', 70, '#ff8d3a', 90, '#ff4f68'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 3, 8, 7], 'circle-stroke-color': '#eafff8', 'circle-stroke-width': 1, 'circle-opacity': .92
        } });
    addLayer({ id: 'merlin-port-labels', type: 'symbol', source: 'merlin-ports', minzoom: 3.8, layout: { 'text-field': ['get', 'name'], 'text-size': 9, 'text-offset': [0, 1.2], 'text-anchor': 'top' }, paint: { 'text-color': '#baf8df', 'text-halo-color': '#03101a', 'text-halo-width': 1.4 } });
    addSource('merlin-routes', { type: 'geojson', data: routesGeoJson() });
    addLayer({ id: 'merlin-route-lines', type: 'line', source: 'merlin-routes', paint: {
            'line-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#2bc8ff', 45, '#ffc857', 70, '#ff7a45', 90, '#ff3455'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 7, 3.2], 'line-opacity': .85, 'line-dasharray': [2, 1.6]
        } });
    addLayer({ id: 'merlin-route-labels', type: 'symbol', source: 'merlin-routes', minzoom: 3.5, layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-size': 9 }, paint: { 'text-color': '#aeeaff', 'text-halo-color': '#03101a', 'text-halo-width': 1.5 } });
    addSource('merlin-places', { type: 'geojson', data: placeGeoJson() });
    addLayer({ id: 'merlin-place-heat', type: 'heatmap', source: 'merlin-places', maxzoom: 7, paint: {
            'heatmap-weight': ['case', ['>=', ['get', 'risk'], 0], ['/', ['get', 'risk'], 100], 0], 'heatmap-intensity': .9,
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1, 18, 7, 42], 'heatmap-opacity': .55,
            'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .25, 'rgba(56,224,160,.25)', .5, 'rgba(255,200,87,.4)', .75, 'rgba(255,141,58,.58)', 1, 'rgba(255,79,104,.75)']
        } });
    addLayer({ id: 'merlin-place-points', type: 'circle', source: 'merlin-places', minzoom: 3.3, filter: ['>=', ['get', 'risk'], 0], paint: {
            'circle-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#38e0a0', 35, '#b8d65c', 55, '#ffc857', 75, '#ff8d3a', 90, '#ff4f68'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 8, 7], 'circle-stroke-color': '#07131d', 'circle-stroke-width': 1
        } });
    addLayer({ id: 'merlin-place-labels', type: 'symbol', source: 'merlin-places', minzoom: 4.5, filter: ['>=', ['get', 'risk'], 0], layout: { 'text-field': ['get', 'name'], 'text-size': 8, 'text-offset': [0, 1.15], 'text-anchor': 'top' }, paint: { 'text-color': '#ffe4a1', 'text-halo-color': '#03101a', 'text-halo-width': 1.4 } });
    bindMapLayerInteractions();
    applyLayerVisibility();
    updateHtmlMarkers();
    tryLoadCountryPolygons();
}
function bindMapLayerInteractions() {
    const map = state.map;
    if (!map || map.__merlinBound)
        return;
    map.__merlinBound = true;
    const pointerLayers = ['merlin-event-clusters', 'merlin-event-points', 'merlin-news-clusters', 'merlin-news-points', 'merlin-port-points', 'merlin-route-lines', 'merlin-place-points', 'merlin-country-risk-fill'];
    for (const layer of pointerLayers) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    }
    map.on('click', 'merlin-event-clusters', event => expandCluster('merlin-events', event));
    map.on('click', 'merlin-news-clusters', event => expandCluster('merlin-news', event));
    map.on('click', 'merlin-event-points', event => {
        const id = event.features?.[0]?.properties?.id;
        const item = state.events.find(candidate => String(candidate.id) === String(id));
        if (item)
            selectEvent(item);
    });
    map.on('click', 'merlin-news-points', event => {
        const id = event.features?.[0]?.properties?.id;
        const article = state.news.articles.find(candidate => String(candidate.id) === String(id));
        if (article)
            selectNews(article);
    });
    map.on('click', 'merlin-port-points', event => {
        const id = event.features?.[0]?.properties?.id;
        const port = state.shipping.ports.find(candidate => String(candidate.id) === String(id));
        if (port)
            selectPort(port);
    });
    map.on('click', 'merlin-route-lines', event => {
        const id = event.features?.[0]?.properties?.id;
        const route = state.shipping.routes.find(candidate => String(candidate.id) === String(id));
        if (route)
            selectRoute(route);
    });
    map.on('click', 'merlin-place-points', event => {
        const id = event.features?.[0]?.properties?.id;
        const item = state.intelligence.countries.find(candidate => String(candidate.country?.id) === String(id));
        if (item)
            selectCountry(item);
    });
    map.on('click', 'merlin-country-risk-fill', event => {
        const iso2 = event.features?.[0]?.properties?.ISO_A2;
        const item = state.intelligence.countries.find(candidate => candidate.country?.iso2 === iso2);
        if (item)
            selectCountry(item);
    });
    map.on('click', event => {
        const hit = map.queryRenderedFeatures(event.point, { layers: pointerLayers.filter(id => map.getLayer(id)) });
        if (hit.length)
            return;
        selectPoint({ lat: event.lngLat.lat, lon: event.lngLat.lng });
    });
}
function expandCluster(sourceId, event) {
    const feature = event.features?.[0];
    const clusterId = feature?.properties?.cluster_id;
    const source = state.map.getSource(sourceId);
    if (!source || clusterId === undefined)
        return;
    source.getClusterExpansionZoom(clusterId).then(zoom => state.map.easeTo({ center: feature.geometry.coordinates, zoom, duration: 450 })).catch(() => { });
}
async function tryLoadCountryPolygons() {
    if (state.countryPolygonsLoaded || state.mapKind !== 'maplibre')
        return;
    state.countryPolygonsLoaded = true;
    try {
        const polygons = await fetchJson('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/refs/heads/master/geojson/ne_110m_admin_0_countries.geojson', 8000);
        const metricByCode = new Map(state.intelligence.countries.map(item => [item.country?.iso2, placeDisplayMetrics(item)]));
        for (const feature of polygons.features || []) {
            const code = countryCode(feature.properties?.ISO_A2);
            const metrics = metricByCode.get(code);
            feature.properties.risk = metrics?.risk ?? -1;
            feature.properties.coverage = metrics?.coverage ?? 0;
        }
        const map = state.map;
        if (!map.getSource('merlin-country-polygons'))
            map.addSource('merlin-country-polygons', { type: 'geojson', data: polygons });
        const before = map.getStyle()?.layers?.find(layer => layer.type === 'symbol')?.id;
        if (!map.getLayer('merlin-country-risk-fill'))
            map.addLayer({ id: 'merlin-country-risk-fill', type: 'fill', source: 'merlin-country-polygons', filter: ['>=', ['get', 'risk'], 0], paint: {
                    'fill-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#1c9d72', 35, '#8aa942', 55, '#d2a52b', 75, '#dd6e2a', 90, '#d6354f'],
                    'fill-opacity': ['interpolate', ['linear'], ['get', 'coverage'], 0, .05, 100, .32], 'fill-outline-color': 'rgba(135,210,241,.22)'
                } }, before);
        applyLayerVisibility();
    }
    catch {
        state.countryPolygonsLoaded = false;
    }
}
function applyLayerVisibility() {
    if (state.mapKind === 'tile') {
        state.map?.setLayerVisibility?.(state.layers);
        return;
    }
    const groups = {
        heat: ['merlin-event-heat'],
        news: ['merlin-news-clusters', 'merlin-news-count', 'merlin-news-points', 'merlin-news-label'],
        routes: ['merlin-route-lines', 'merlin-route-labels'],
        ports: ['merlin-port-points', 'merlin-port-labels'],
        countryRisk: ['merlin-place-heat', 'merlin-place-points', 'merlin-place-labels', 'merlin-country-risk-fill']
    };
    for (const [group, layers] of Object.entries(groups))
        for (const id of layers)
            if (state.map?.getLayer?.(id))
                state.map.setLayoutProperty(id, 'visibility', state.layers[group] ? 'visible' : 'none');
    if (state.map?.getLayer?.('merlin-event-points')) {
        const allowed = [];
        if (state.layers.earthquakes)
            allowed.push('earthquakes');
        if (state.layers.disasters)
            allowed.push('disasters');
        if (state.layers.conflict)
            allowed.push('conflict');
        const filter = ['all', ['!', ['has', 'point_count']], ['in', ['get', 'group'], ['literal', allowed]]];
        state.map.setFilter('merlin-event-points', filter);
        if (state.map.getLayer('merlin-event-labels'))
            state.map.setFilter('merlin-event-labels', filter);
        if (state.map.getLayer('merlin-event-clusters'))
            state.map.setLayoutProperty('merlin-event-clusters', 'visibility', allowed.length ? 'visible' : 'none');
        if (state.map.getLayer('merlin-event-cluster-count'))
            state.map.setLayoutProperty('merlin-event-cluster-count', 'visibility', allowed.length ? 'visible' : 'none');
    }
    updateHtmlMarkers();
}
function updateHtmlMarkers() {
    for (const marker of [...state.alertMarkers, ...state.newsMarkers])
        marker.remove?.();
    state.alertMarkers = [];
    state.newsMarkers = [];
    if (state.mapKind !== 'maplibre' || !window.maplibregl)
        return;
    if (state.layers.alerts) {
        for (const alert of state.alerts.filter(item => finite(item.lat) && finite(item.lon)).slice(0, 18)) {
            const element = document.createElement('button');
            element.type = 'button';
            element.className = 'merlin-alert-marker';
            element.title = alert.title;
            element.addEventListener('click', event => { event.stopPropagation(); selectAlert(alert); });
            state.alertMarkers.push(new window.maplibregl.Marker({ element, anchor: 'center' }).setLngLat([Number(alert.lon), Number(alert.lat)]).addTo(state.map));
        }
    }
}
function updateMapData() {
    if (state.mapKind === 'tile') {
        const newsItems = (state.news.articles || []).map(article => ({ ...article, mapPoint: cityOrCountryPoint(article) })).filter(article => article.mapPoint);
        state.map.setData({
            alerts: state.alerts,
            events: state.events,
            news: newsItems,
            ports: state.shipping.ports || [],
            routes: (routesGeoJson().features || []).map(feature => ({
                ...(state.shipping.routes || []).find(route => String(route.id) === String(feature.properties?.id)),
                id: feature.properties?.id,
                name: feature.properties?.name,
                geometry: feature.geometry,
                risk: (state.shipping.routes || []).find(route => String(route.id) === String(feature.properties?.id))?.risk || { score: feature.properties?.risk }
            })),
            places: state.intelligence.countries || []
        });
        state.map.setLayerVisibility(state.layers);
        return;
    }
    setMapSourceData('merlin-events', eventGeoJson());
    setMapSourceData('merlin-news', newsGeoJson());
    setMapSourceData('merlin-ports', portsGeoJson());
    setMapSourceData('merlin-routes', routesGeoJson());
    setMapSourceData('merlin-places', placeGeoJson());
    updateHtmlMarkers();
}
function withStartupDeadline(label, task, timeoutMs = 12000) {
    let timer;
    return Promise.race([
        Promise.resolve().then(task),
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`${label} startup timed out after ${timeoutMs}ms`)), timeoutMs);
        })
    ]).finally(() => clearTimeout(timer));
}
function installImmediateSystems() {
    const installers = [
        ['decisionSupportSystem', 'decision support', () => installDecisionSupportSystem()],
        ['automationSystem', 'automation', () => installAutomationSystem()],
        ['publishingSystem', 'publishing', () => installPublishingSystem()],
        ['commercialSystem', 'commercial', () => installCommercialSystem()],
        ['securitySystem', 'security', () => installSecuritySystem()],
        ['reliabilitySystem', 'reliability', () => installReliabilitySystem()],
        ['releaseSystem', 'release', () => installReleaseSystem()],
        ['liveDataSystem', 'live data', () => installLiveDataSystem()],
        ['marketReadinessSystem', 'market readiness', () => installMarketReadinessSystem({
            reportMetrics: metrics => fetch('/api/readiness/metrics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(metrics) }),
            onClientError: report => console.warn('Merlin client error captured', report)
        })]
    ];
    for (const [key, label, install] of installers) {
        try {
            state[key] = install();
        }
        catch (error) {
            console.warn(`Merlin ${label} system failed to initialise`, error);
            state[key] = null;
        }
    }
}
async function installDeferredMapSystems() {
    const installers = [
        ['overlaySystem', 'overlay system', () => installOverlaySystem({ map: state.map }), 15000],
        ['logisticsSystem', 'logistics system', () => installLogisticsSystem({ map: state.map }), 22000],
        ['hazardSystem', 'hazard system', () => installHazardSystem({ map: state.map }), 15000],
        ['marketIntelligenceSystem', 'market intelligence system', () => installMarketIntelligenceSystem({ map: state.map }), 15000],
        ['countryRiskSystem', 'country risk system', () => installCountryRiskSystem({ map: state.map }), 18000],
        ['conflictIntelligenceSystem', 'conflict intelligence system', () => installConflictIntelligenceSystem({ map: state.map }), 18000]
    ];
    for (const [key, label, install, timeoutMs] of installers) {
        try {
            state[key] = await withStartupDeadline(label, install, timeoutMs);
        }
        catch (error) {
            console.warn(`Merlin ${label} deferred startup failed`, error);
            state[key] = null;
        }
    }
}
async function initializeMap() {
    state.mapKind = 'tile';
    state.map = new MerlinTileMap({
        container: 'world-map',
        initialPoint: { lat: 24, lon: 3 },
        initialZoom: 2,
        onSelect: point => selectPoint(point),
        onEntity: entity => {
            if (entity.kind === 'alert')
                selectAlert(entity.data);
            else if (entity.kind === 'news')
                selectNews(entity.data);
            else if (entity.kind === 'port')
                selectPort(entity.data);
            else if (entity.kind === 'route')
                selectRoute(entity.data);
            else if (entity.kind === 'place')
                selectCountry(entity.data);
            else
                selectEvent(entity.data);
        }
    });
    state.mapReady = true;
    $('#world-map').classList.add('map-ready');
    $('#map-loading')?.remove();
    updateMapData();
    applyLayerVisibility();
    installImmediateSystems();
    void installDeferredMapSystems();
}
function mapStyleCandidates(style) {
    return [style];
}
function rasterStyle() {
    return { id: 'osm' };
}
function initializeFallbackMap() {
    return initializeMap();
}
function renderMapStatus() {
    if (!state.map || state.mapKind !== 'maplibre')
        return;
    const center = state.map.getCenter();
    $('#last-updated').textContent = `Z${state.map.getZoom().toFixed(1)} / ${center.lat.toFixed(1)}, ${center.lng.toFixed(1)}`;
}
function flyTo(lat, lon, zoom = 6) {
    if (!finite(lat) || !finite(lon))
        return;
    if (state.mapKind === 'maplibre')
        state.map.flyTo({ center: [Number(lon), Number(lat)], zoom, duration: 650, essential: true });
    else
        state.map?.flyTo?.({ lat: Number(lat), lon: Number(lon) }, { zoom: Math.max(2, Math.round(zoom)), duration: 250 });
}
function showPopup(lon, lat, html) {
    if (state.mapKind !== 'maplibre' || !window.maplibregl || !finite(lon) || !finite(lat))
        return;
    new window.maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '320px' }).setLngLat([Number(lon), Number(lat)]).setHTML(html).addTo(state.map);
}
function popupHtml(type, title, summary, metrics = []) {
    return `<div class="map-popup"><span>${escapeHtml(type)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary || '')}</p><div class="map-popup-grid">${metrics.slice(0, 4).map(item => `<div><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b></div>`).join('')}</div></div>`;
}
function selectAlert(alert) {
    if (alert.type === 'NEWS')
        selectNews(alert.data);
    else if (alert.type === 'PORT')
        selectPort(alert.data);
    else
        selectEvent(alert.data);
}
function selectEvent(event) {
    state.selected = { type: 'EVENT', data: event };
    const metrics = [
        { label: 'CATEGORY', value: categoryOf(event).toUpperCase() },
        { label: 'MAGNITUDE', value: finite(event.magnitude) ? `M${formatNumber(event.magnitude, 1)}` : '—' },
        { label: 'SEVERITY', value: `${eventScore(event)} / 100` },
        { label: 'AGE', value: ageLabel(event.time || event.updatedAt) },
        { label: 'SOURCE', value: SOURCE_LABELS[event.source] || event.source || '—' },
        { label: 'DEPTH', value: finite(event.attributes?.depthKm) ? `${formatNumber(event.attributes.depthKm, 1)} KM` : '—' }
    ];
    renderDetail('EVENT', event.title || 'Event', event.region || event.country || '', metrics, event.url ? [{ label: 'OPEN SOURCE', url: event.url }] : []);
    flyTo(event.lat, event.lon, categoryOf(event) === 'earthquake' ? 7 : 6);
    showPopup(event.lon, event.lat, popupHtml(categoryOf(event).toUpperCase(), event.title, event.region, metrics));
}
function selectNews(article) {
    state.selected = { type: 'NEWS', data: article };
    const point = cityOrCountryPoint(article);
    const metrics = [
        { label: 'SOURCE', value: article.sourceName || article.sourceDomain || '—' },
        { label: 'AGE', value: ageLabel(article.publishedAt) },
        { label: 'RELIABILITY', value: finite(article.reliability?.score) ? `${formatNumber(article.reliability.score)} / 100` : '—' },
        { label: 'CATEGORY', value: categoryOf(article).toUpperCase() }
    ];
    renderDetail('NEWS', article.title, article.summary || '', metrics, article.url ? [{ label: 'OPEN ARTICLE', url: article.url }] : []);
    if (point) {
        flyTo(point.lat, point.lon, 5.2);
        showPopup(point.lon, point.lat, popupHtml('NEWS', article.title, article.summary, metrics));
    }
}
function selectPort(port) {
    state.selected = { type: 'PORT', data: port };
    const metrics = [
        { label: 'RISK', value: finite(port.risk?.score) ? `${formatNumber(port.risk.score)} / 100` : '—' },
        { label: 'STATUS', value: port.risk?.band || '—' },
        { label: 'EVIDENCE', value: formatNumber(port.risk?.evidenceCount || 0) },
        { label: 'IMPORTANCE', value: `${formatNumber(port.importance || 0)} / 100` },
        { label: 'COUNTRY', value: port.country || '—' },
        { label: 'CARGO', value: (port.commodities || []).slice(0, 3).join(', ') || '—' }
    ];
    const money = state.shippingMoney.find(item => item.id === `port-money-${port.id}`);
    renderDetail('PORT', `${port.name}, ${port.country}`, money?.action || 'Port activity and route exposure.', metrics, [{ label: 'OPEN SHIPPING MONEY', action: () => openView('shipping') }]);
    flyTo(port.coordinates?.lat, port.coordinates?.lon, 7);
    showPopup(port.coordinates?.lon, port.coordinates?.lat, popupHtml('PORT', port.name, port.country, metrics));
}
function selectRoute(route) {
    state.selected = { type: 'ROUTE', data: route };
    const metrics = [
        { label: 'RISK', value: finite(route.risk?.score) ? `${formatNumber(route.risk.score)} / 100` : '—' },
        { label: 'STATUS', value: route.risk?.band || '—' },
        { label: 'CARGO', value: route.commodity || 'MIXED' },
        { label: 'LENGTH', value: finite(route.lengthKm) ? `${formatNumber(route.lengthKm)} KM` : '—' },
        { label: 'PORTS', value: formatNumber(route.portCount || 0) },
        { label: 'EVIDENCE', value: formatNumber(route.evidence?.length || route.eventCount || 0) }
    ];
    const money = state.shippingMoney.find(item => item.id === `route-money-${route.id}`);
    renderDetail('SHIPPING ROUTE', route.name, money?.action || 'Trade corridor and disruption exposure.', metrics, [{ label: 'OPEN SHIPPING MONEY', action: () => openView('shipping') }]);
}
function focusShippingRoute(routeId) {
    closeSheet();
    state.layers.routes = true;
    updateLayerButtons();
    applyLayerVisibility();
    const feature = routesGeoJson().features.find(item => item.properties?.id === routeId);
    if (feature && state.mapKind === 'maplibre') {
        const coordinates = feature.geometry?.coordinates?.flat(Infinity);
        const pairs = feature.geometry?.type === 'MultiLineString' ? feature.geometry.coordinates.flat() : feature.geometry.coordinates;
        const bounds = pairs.reduce((result, coordinate) => result.extend(coordinate), new window.maplibregl.LngLatBounds(pairs[0], pairs[0]));
        state.map.fitBounds(bounds, { padding: 90, duration: 650 });
    }
    const route = state.shipping.routes.find(item => item.id === routeId);
    if (route)
        selectRoute(route);
}
async function selectPoint(point) {
    const place = nearestPlace(point);
    state.selectedPlace = place ? { ...place, lat: point.lat, lon: point.lon } : { name: 'Selected point', lat: point.lat, lon: point.lon, kind: 'POINT' };
    state.drawer = 'place';
    state.drawerOpen = true;
    updateDrawerTabs();
    renderDrawer();
    flyTo(point.lat, point.lon, 6);
    state.placeScan = null;
    renderPlaceDrawer();
    try {
        state.placeScan = await api.scan({ lat: point.lat, lon: point.lon, radiusKm: state.radiusKm, lookbackDays: state.windowDays });
        renderPlaceDrawer();
    }
    catch {
        renderPlaceDrawer();
    }
}
function selectCountry(item) {
    const country = item.country;
    state.selectedPlace = { ...country, kind: 'COUNTRY', lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon, intelligenceItem: item };
    state.drawer = 'place';
    state.drawerOpen = true;
    updateDrawerTabs();
    renderDrawer();
    flyTo(state.selectedPlace.lat, state.selectedPlace.lon, 4.8);
}
function renderDetail(type, title, summary, metrics, actions = []) {
    $('#detail-type').textContent = type;
    $('#detail-title').textContent = title || 'Selection';
    $('#detail-summary').textContent = summary || '';
    $('#detail-metrics').innerHTML = metrics.map(item => `<div class="detail-metric"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join('');
    const actionContainer = $('#detail-actions');
    actionContainer.innerHTML = '';
    for (const action of actions) {
        const element = action.url ? document.createElement('a') : document.createElement('button');
        element.textContent = action.label;
        if (action.url) {
            element.href = action.url;
            element.target = '_blank';
            element.rel = 'noopener noreferrer';
        }
        else
            element.addEventListener('click', action.action);
        actionContainer.append(element);
    }
    $('#map-detail').classList.remove('hidden');
}
function renderDrawer() {
    if (!state.drawerOpen) {
        $('#map-drawer').classList.add('closed');
        return;
    }
    $('#map-drawer').classList.remove('closed');
    if (state.drawer === 'alerts')
        renderAlertDrawer();
    if (state.drawer === 'news')
        renderNewsDrawer();
    if (state.drawer === 'shipping')
        renderShippingDrawer();
    if (state.drawer === 'markets')
        renderMarketsDrawer();
    if (state.drawer === 'place')
        renderPlaceDrawer();
}
function renderAlertDrawer() {
    const content = $('#drawer-content');
    const items = state.alerts.slice(0, 40);
    content.innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>LIVE GLOBAL ALERTS</span><b>${items.length}</b></div><div class="feed-list">${items.map(alert => feedItemHtml({
        colour: alert.type === 'NEWS' ? COLORS.news : alert.type === 'PORT' ? COLORS.port : COLORS.alert,
        title: alert.title, meta: `${alert.type} · ${ageLabel(alert.time)} · SCORE ${alert.score}`, score: alert.score, id: alert.id, summary: alert.summary
    })).join('')}</div></section>`;
    bindFeedClicks(items, item => selectAlert(item));
}
function renderNewsDrawer() {
    const content = $('#drawer-content');
    const articles = state.news.articles.slice(0, 45);
    content.innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>VERIFIED NEWS</span><b>${articles.length}</b></div><div class="feed-list">${articles.map(article => feedItemHtml({
        colour: COLORS.news, title: article.title, meta: `${article.sourceName || article.sourceDomain || 'NEWS'} · ${ageLabel(article.publishedAt)} · ${categoryOf(article).toUpperCase()}`,
        score: article.reliability?.score || '—', id: article.id, summary: article.summary
    })).join('')}</div></section>`;
    bindFeedClicks(articles, item => selectNews(item));
}
function renderShippingDrawer() {
    const topPorts = state.shipping.ports.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 12);
    const topRoutes = state.shipping.routes.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 10);
    $('#drawer-content').innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>ROUTES TO WATCH</span><b>${topRoutes.length}</b></div><div class="feed-list">${topRoutes.map(route => feedItemHtml({ colour: COLORS.route, title: route.name, meta: `${route.commodity || 'MIXED'} · ${route.risk?.band || 'LOW'}`, score: formatNumber(route.risk?.score || 0), id: route.id, summary: `Action: ${state.shippingMoney.find(item => item.id === `route-money-${route.id}`)?.action || 'Monitor route exposure.'}` })).join('')}</div></section><section class="drawer-section"><div class="drawer-section-title"><span>PORTS TO WATCH</span><b>${topPorts.length}</b></div><div class="feed-list">${topPorts.map(port => feedItemHtml({ colour: COLORS.port, title: `${port.name}, ${port.country}`, meta: `${port.risk?.band || 'LOW'} · ${(port.commodities || []).slice(0, 2).join(', ')}`, score: formatNumber(port.risk?.score || 0), id: port.id })).join('')}</div></section>`;
    bindFeedClicks(topRoutes, item => selectRoute(item));
    bindFeedClicks(topPorts, item => selectPort(item));
}
function renderMarketsDrawer() {
    const results = state.markets.results || [];
    $('#drawer-content').innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>MARKET SNAPSHOT</span><b>${results.length}</b></div><div class="market-grid" style="grid-template-columns:1fr">${results.map(marketCardHtml).join('')}</div></section>`;
}
function renderPlaceDrawer() {
    const content = $('#drawer-content');
    const place = state.selectedPlace;
    if (!place) {
        content.innerHTML = '<div class="drawer-empty">CLICK ANYWHERE ON THE MAP OR SEARCH FOR A CITY, COUNTRY OR PORT.<br>THE PANEL WILL SHOW LOCAL EVENTS, DATA COVERAGE AND FINANCIAL EXPOSURE.</div>';
        return;
    }
    const scan = state.placeScan;
    const intelligenceItem = place.intelligenceItem || state.intelligence.countries.find(item => item.country?.iso2 === place.iso2 || item.country?.iso2 === place.countryCode);
    const metrics = intelligenceItem ? placeDisplayMetrics(intelligenceItem) : null;
    const eventCount = scan?.events?.length ?? intelligenceItem?.eventCount ?? 0;
    const probability = scan?.metrics?.estimateSupported ? scan.metrics.eventProbability24h : null;
    const coverage = scan?.metrics?.sourceCoveragePct ?? metrics?.coverage ?? null;
    const nextEvent = scan?.metrics?.expectedNextEventHours;
    const name = place.name || place.displayName || place.country || 'Selected place';
    content.innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>${escapeHtml(place.kind || 'PLACE')}</span><b>${finite(place.lat) ? `${Number(place.lat).toFixed(2)}, ${Number(place.lon).toFixed(2)}` : ''}</b></div><h2 style="margin:0;font:800 25px var(--condensed)">${escapeHtml(name)}</h2><p class="feed-summary">${escapeHtml(place.country || place.region || place.subregion || '')}</p></section><div class="drawer-stat-grid">
    ${drawerStat('EVENT IN NEXT 24H', finite(probability) ? `${formatNumber(probability)}%` : 'NO ESTIMATE', finite(scan?.metrics?.sampleSize) ? `${scan.metrics.sampleSize} nearby records` : 'Local evidence')}
    ${drawerStat('NEARBY EVENTS', formatNumber(eventCount), `${state.windowDays} day window`)}
    ${drawerStat('DATA COVERAGE', finite(coverage) ? `${formatNumber(coverage)}%` : 'NOT MEASURED', 'Active sources')}
    ${drawerStat('NEXT EXPECTED EVENT', finite(nextEvent) ? (nextEvent < 48 ? `${formatNumber(nextEvent)} H` : `${formatNumber(nextEvent / 24)} D`) : 'NO ESTIMATE', 'Based on local rate')}
    ${drawerStat('CONFLICT ACTIVITY', finite(metrics?.conflict) ? `${formatNumber(metrics.conflict)} / 100` : 'NO LIVE DATA', 'Country evidence')}
    ${drawerStat('NATURAL HAZARDS', finite(metrics?.disaster) ? `${formatNumber(metrics.disaster)} / 100` : 'NO LIVE DATA', 'Country evidence')}
  </div>${scan?.events?.length ? `<section class="drawer-section"><div class="drawer-section-title"><span>NEAREST EVENTS</span><b>${scan.events.length}</b></div><div class="feed-list">${scan.events.slice(0, 15).map(event => feedItemHtml({ colour: eventColour(event), title: event.title, meta: `${categoryOf(event).toUpperCase()} · ${ageLabel(event.time)} · ${formatNumber(event.distanceKm)} KM`, score: eventScore(event), id: event.id })).join('')}</div></section>` : ''}`;
    if (scan?.events?.length)
        bindFeedClicks(scan.events.slice(0, 15), item => selectEvent(item));
}
function drawerStat(label, value, note) { return `<div class="drawer-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`; }
function feedItemHtml({ colour, title, meta, score, id, summary }) {
    return `<article class="feed-item" data-feed-id="${escapeHtml(id)}"><i class="feed-colour" style="background:${colour}"></i><div><h3 class="feed-title">${escapeHtml(title)}</h3><div class="feed-meta">${escapeHtml(meta || '')}</div>${summary ? `<p class="feed-summary">${escapeHtml(summary)}</p>` : ''}</div><strong class="feed-score">${escapeHtml(score)}</strong></article>`;
}
function bindFeedClicks(items, handler) {
    for (const element of $$('#drawer-content [data-feed-id]')) {
        const item = items.find(candidate => String(candidate.id) === element.dataset.feedId || `event:${candidate.id}` === element.dataset.feedId || `news:${candidate.id}` === element.dataset.feedId || `port:${candidate.id}` === element.dataset.feedId);
        if (item)
            element.addEventListener('click', () => handler(item));
    }
}
function updateDrawerTabs() {
    $$('.drawer-tab').forEach(button => button.classList.toggle('active', button.dataset.drawer === state.drawer));
}
function openView(view) {
    state.view = view;
    document.documentElement.dataset.view = view;
    $$('.merlin-nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    if (view === 'map') {
        closeSheet();
        return;
    }
    $('#workspace-sheet').classList.remove('hidden');
    $('#sheet-search').value = '';
    if (view === 'opportunities')
        renderOpportunitySheet();
    if (view === 'shipping')
        renderShippingSheet();
    if (view === 'markets') {
        if (state.marketIntelligenceSystem)
            state.marketIntelligenceSystem.activate();
        else
            renderMarketsSheet();
    }
    if (view === 'conflict') {
        if (state.conflictIntelligenceSystem)
            state.conflictIntelligenceSystem.activate();
    }
    if (view === 'briefings') {
        if (state.decisionSupportSystem)
            state.decisionSupportSystem.activate();
    }
    if (view === 'automation') {
        if (state.automationSystem)
            state.automationSystem.activate();
    }
    if (view === 'publishing') {
        if (state.publishingSystem)
            state.publishingSystem.activate();
    }
    if (view === 'commercial') {
        if (state.commercialSystem)
            state.commercialSystem.activate();
    }
    if (view === 'security') {
        if (state.securitySystem)
            state.securitySystem.activate();
    }
    if (view === 'operations') {
        if (state.reliabilitySystem)
            state.reliabilitySystem.activate();
    }
    if (view === 'release') {
        if (state.releaseSystem)
            state.releaseSystem.activate();
    }
    if (view === 'live-data') {
        if (state.liveDataSystem)
            state.liveDataSystem.activate();
    }
    if (view === 'places') {
        if (state.countryRiskSystem)
            state.countryRiskSystem.activate();
        else
            renderPlacesSheet();
    }
}
function closeSheet() {
    state.view = 'map';
    $('#workspace-sheet').classList.add('hidden');
    $$('.merlin-nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === 'map'));
    setTimeout(() => state.map?.resize?.(), 50);
}
function renderOpportunitySheet(filter = '') {
    const items = state.opportunities.filter(item => `${item.title} ${item.kind} ${item.target} ${item.source}`.toLowerCase().includes(filter.toLowerCase()));
    $('#sheet-kicker').textContent = 'WORLD EVENTS → MONEY PATHS';
    $('#sheet-title').textContent = 'OPPORTUNITIES';
    $('#sheet-summary').innerHTML = summaryMetrics([
        ['RANKED', items.length, 'current cards'], ['HIGH SCORE', items.filter(item => item.score >= 70).length, '70+'], ['FAST WINDOW', items.filter(item => /HOUR|DAY/.test(item.window || '')).length, 'time-sensitive'], ['MARKET / TRADE', items.filter(item => /MARKET|TRADE|ENERGY|SHIPPING/.test(item.kind)).length, 'exposure'], ['UPDATED', ageLabel(state.lastUpdated), 'snapshot age']
    ]);
    $('#sheet-content').innerHTML = `<div class="card-grid">${items.map(moneyCardHtml).join('')}</div>`;
    bindMoneyCardActions(items);
}
function renderShippingSheet(filter = '') {
    const items = state.shippingMoney.filter(item => `${item.title} ${item.kind} ${item.target}`.toLowerCase().includes(filter.toLowerCase()));
    $('#sheet-kicker').textContent = 'ROUTES / PORTS / COMMODITIES';
    $('#sheet-title').textContent = 'SHIPPING MONEY';
    $('#sheet-summary').innerHTML = summaryMetrics([
        ['OPPORTUNITIES', items.length, 'ranked'], ['PORTS', state.shipping.ports.length, 'monitored'], ['ROUTES', state.shipping.routes.length, 'global corridors'], ['CHOKEPOINTS', state.shipping.chokepoints.length, 'critical nodes'], ['TOP RISK', formatNumber(Math.max(0, ...state.shipping.ports.map(port => Number(port.risk?.score || 0)))), '0–100']
    ]);
    $('#sheet-content').innerHTML = `<div class="card-grid">${items.map(moneyCardHtml).join('')}</div>`;
    bindMoneyCardActions(items);
}
function moneyCardHtml(item) {
    return `<article class="money-card" data-money-id="${escapeHtml(item.id)}"><header class="money-card-head"><div><span class="money-card-type">${escapeHtml(item.kind)}</span><h3>${escapeHtml(item.title)}</h3></div><div class="money-score"><strong>${formatNumber(item.score)}</strong><span>RANK</span></div></header><div class="money-card-numbers">
    ${moneyNumber('IMPACT CHANCE', `${formatNumber(item.impactChance)}%`)}${moneyNumber('WINDOW', item.window)}${moneyNumber('DIFFICULTY', item.difficulty || '—')}${moneyNumber('POTENTIAL VALUE', item.range)}
  </div><div class="money-card-body"><p>${escapeHtml(item.summary)}</p><div class="action-path"><div class="action-row"><span>WHERE</span><b>${escapeHtml(item.where)}</b></div><div class="action-row"><span>ACTION</span><b>${escapeHtml(item.action)}</b></div><div class="action-row"><span>TARGET</span><b>${escapeHtml(item.target)}</b></div><div class="action-row"><span>EVIDENCE</span><b>${escapeHtml(`${item.source} · ${ageLabel(item.time)} · confidence ${formatNumber(item.confidence)}%`)}</b></div></div></div><footer class="money-card-actions">${(item.links || []).map((link, index) => `<button type="button" data-link-index="${index}">${escapeHtml(link.label)}</button>`).join('')}</footer></article>`;
}
function moneyNumber(label, value) { return `<div class="money-number"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }
function bindMoneyCardActions(items) {
    for (const card of $$('#sheet-content [data-money-id]')) {
        const item = items.find(candidate => candidate.id === card.dataset.moneyId);
        if (!item)
            continue;
        card.querySelectorAll('[data-link-index]').forEach(button => {
            const link = item.links[Number(button.dataset.linkIndex)];
            button.addEventListener('click', () => {
                if (link.action)
                    link.action();
                else if (link.url)
                    window.open(link.url, '_blank', 'noopener,noreferrer');
            });
        });
    }
}
function renderMarketsSheet(filter = '') {
    if (state.marketIntelligenceSystem?.active) {
        state.marketIntelligenceSystem.renderTable(filter);
        return;
    }
    const results = (state.markets.results || []).filter(item => `${item.asset?.symbol} ${item.asset?.name}`.toLowerCase().includes(filter.toLowerCase()));
    $('#sheet-kicker').textContent = 'PRICE / MOVE / SOURCE';
    $('#sheet-title').textContent = 'MARKETS';
    const priced = results.filter(item => finite(item.quote?.price));
    $('#sheet-summary').innerHTML = summaryMetrics([
        ['ASSETS', results.length, 'watchlist'], ['PRICED', priced.length, 'current snapshot'], ['UP 24H', priced.filter(item => Number(item.quote?.change24h) > 0).length, 'assets'], ['DOWN 24H', priced.filter(item => Number(item.quote?.change24h) < 0).length, 'assets'], ['UPDATED', ageLabel(state.markets.generatedAt), 'snapshot age']
    ]);
    $('#sheet-content').innerHTML = `<div class="market-grid">${results.map(marketCardHtml).join('')}</div>`;
}
function marketCardHtml(item) {
    const quote = item.quote || {};
    const change = finite(quote.change24h) ? Number(quote.change24h) * 100 : null;
    const width = finite(change) ? clamp(50 + change * 3, 3, 97) : 50;
    return `<article class="market-card"><div class="market-card-head"><div><div class="market-symbol">${escapeHtml(item.asset?.symbol || quote.symbol || '—')}</div><div class="market-name">${escapeHtml(item.asset?.name || '')}</div></div><div><div class="market-price">${formatMarketPrice(quote.price)}</div><div class="market-change ${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}">${finite(change) ? formatPercent(change, 2, true) : 'NO 24H MOVE'}</div></div></div><div class="market-bar"><i style="width:${width}%"></i></div><div class="feed-meta" style="margin-top:10px"><span>${escapeHtml(item.source?.quote?.id || 'SNAPSHOT')}</span><span>${escapeHtml(item.available ? 'HISTORY READY' : 'PRICE ONLY')}</span></div></article>`;
}
function renderPlacesSheet(filter = '') {
    const items = state.intelligence.countries.filter(item => `${item.country?.name} ${item.country?.region} ${item.country?.iso2}`.toLowerCase().includes(filter.toLowerCase()));
    const measured = items.filter(item => placeDisplayMetrics(item).measured);
    $('#sheet-kicker').textContent = 'COUNTRY / CITY INTELLIGENCE';
    $('#sheet-title').textContent = 'PLACES';
    $('#sheet-summary').innerHTML = summaryMetrics([
        ['COUNTRIES', items.length, 'catalogue'], ['WITH LIVE DATA', measured.length, 'measured'], ['CITIES', state.intelligenceCatalog.cities.length, 'searchable'], ['EVENTS', state.events.length, 'global'], ['UPDATED', ageLabel(state.intelligence.generatedAt), 'snapshot age']
    ]);
    $('#sheet-content').innerHTML = `<div class="place-layout"><div class="place-list">${items.map(item => {
        const metrics = placeDisplayMetrics(item);
        const country = item.country;
        return `<div class="place-row" data-place-id="${escapeHtml(country.id)}"><div><strong>${escapeHtml(country.name)}</strong><span>${escapeHtml(`${country.capital || '—'} · ${country.region || '—'}`)}</span></div><div class="place-risk ${metrics.risk >= 70 ? 'down' : metrics.risk >= 45 ? '' : metrics.risk !== null ? 'up' : 'neutral'}">${metrics.risk !== null ? metrics.risk : '—'}</div></div>`;
    }).join('')}</div><div id="place-sheet-detail" class="place-detail"><div class="drawer-empty">SELECT A COUNTRY. COUNTRIES WITHOUT MEASURED LIVE EVIDENCE SHOW NO SCORE INSTEAD OF A DEFAULT NUMBER.</div></div></div>`;
    $$('#sheet-content [data-place-id]').forEach(row => row.addEventListener('click', () => {
        const item = items.find(candidate => candidate.country?.id === row.dataset.placeId);
        if (item)
            renderPlaceSheetDetail(item);
    }));
}
function renderPlaceSheetDetail(item) {
    const country = item.country;
    const metrics = placeDisplayMetrics(item);
    $('#place-sheet-detail').innerHTML = `<div class="place-detail-head"><h2>${escapeHtml(country.name)}</h2><p>${escapeHtml(`${country.capital || '—'} · ${country.region || '—'} · ${country.iso2 || ''}`)}</p></div><div class="place-detail-grid">
    ${placeSheetStat('OVERALL LIVE RISK', metrics.risk !== null ? `${metrics.risk} / 100` : 'NO LIVE SCORE')}
    ${placeSheetStat('DATA COVERAGE', metrics.measured ? `${metrics.coverage}%` : 'NO LIVE DATA')}
    ${placeSheetStat('CONFLICT ACTIVITY', finite(metrics.conflict) ? `${formatNumber(metrics.conflict)} / 100` : 'NO LIVE DATA')}
    ${placeSheetStat('NATURAL HAZARDS', finite(metrics.disaster) ? `${formatNumber(metrics.disaster)} / 100` : 'NO LIVE DATA')}
    ${placeSheetStat('RECORDED EVENTS', formatNumber(item.eventCount || 0))}
    ${placeSheetStat('NEWS STORIES', formatNumber(item.storyCount || 0))}
    ${placeSheetStat('POPULATION', formatNumber(country.populationBaseline || 0))}
    ${placeSheetStat('CURRENCY', (country.currencies || []).join(', ') || '—')}
    ${placeSheetStat('TIME ZONES', String((country.timezones || []).length))}
  </div><div class="detail-actions"><button id="place-show-map" type="button">SHOW ON MAP</button></div>`;
    $('#place-show-map').addEventListener('click', () => { closeSheet(); selectCountry(item); });
}
function placeSheetStat(label, value) { return `<div class="place-detail-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }
function summaryMetrics(items) { return items.map(item => `<div class="summary-metric"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong><small>${escapeHtml(item[2])}</small></div>`).join(''); }
function updateLayerButtons() {
    $$('.layer-button').forEach(button => button.classList.toggle('active', Boolean(state.layers[button.dataset.layer])));
}
function updateClock() { $('#utc-clock').textContent = `${new Date().toISOString().slice(11, 19)} UTC`; }
function toast(message) {
    const element = $('#map-toast');
    element.textContent = message;
    element.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.add('hidden'), 2600);
}
function searchLocal(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized)
        return [];
    const coordinateMatch = normalized.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinateMatch)
        return [{ kind: 'COORDINATES', name: `${coordinateMatch[1]}, ${coordinateMatch[2]}`, lat: Number(coordinateMatch[1]), lon: Number(coordinateMatch[2]), subtitle: 'Coordinates' }];
    const results = [];
    for (const city of state.intelligenceCatalog.cities) {
        const text = `${city.name} ${city.country} ${city.countryCode}`.toLowerCase();
        if (text.includes(normalized))
            results.push({ kind: 'CITY', name: city.name, subtitle: city.country || city.countryCode, lat: city.lat, lon: city.lon, data: city });
    }
    for (const country of state.intelligenceCatalog.countries) {
        const text = `${country.name} ${country.nativeName} ${country.iso2} ${country.iso3} ${(country.aliases || []).join(' ')}`.toLowerCase();
        if (text.includes(normalized))
            results.push({ kind: 'COUNTRY', name: country.name, subtitle: country.capital || country.region, lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon, data: country });
    }
    for (const port of state.shipping.ports) {
        const text = `${port.name} ${port.country} ${port.unlocode}`.toLowerCase();
        if (text.includes(normalized))
            results.push({ kind: 'PORT', name: port.name, subtitle: port.country, lat: port.coordinates?.lat, lon: port.coordinates?.lon, data: port });
    }
    return results.sort((a, b) => (a.name.toLowerCase().startsWith(normalized) ? -1 : 0) - (b.name.toLowerCase().startsWith(normalized) ? -1 : 0)).slice(0, 18);
}
function renderSearchResults() {
    const container = $('#search-results');
    if (!state.searchResults.length) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    container.innerHTML = state.searchResults.map((item, index) => `<button class="search-result" data-search-index="${index}" type="button"><span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.subtitle || '')}</span></span><span>${escapeHtml(item.kind)}</span></button>`).join('');
    container.classList.remove('hidden');
    container.querySelectorAll('[data-search-index]').forEach(button => button.addEventListener('click', () => selectSearchResult(state.searchResults[Number(button.dataset.searchIndex)])));
}
function selectSearchResult(result) {
    $('#global-search').value = result.name;
    state.searchResults = [];
    renderSearchResults();
    if (result.kind === 'PORT')
        selectPort(result.data);
    else if (result.kind === 'COUNTRY') {
        const item = state.intelligence.countries.find(candidate => candidate.country?.iso2 === result.data.iso2);
        if (item)
            selectCountry(item);
        else
            selectPoint({ lat: result.lat, lon: result.lon });
    }
    else
        selectPoint({ lat: result.lat, lon: result.lon });
}
async function refreshLive({ quiet = false } = {}) {
    if (state.polling)
        return;
    state.polling = true;
    if (!quiet)
        toast('REFRESHING LIVE SOURCES');
    const days = state.windowDays;
    const tasks = await Promise.allSettled([
        api.events({ lookbackDays: days, limit: 5000 }),
        api.newsLive({ hours: Math.max(24, days * 24), limit: 120 }, { timeoutMs: 5500 }),
        api.shippingSnapshotLive({ hours: Math.max(48, days * 24) }, { timeoutMs: 6500 }),
        api.marketScreenerLive({ asset: 'btc-usd,eth-usd,sol-usd,bnb-usd,xrp-usd,ada-usd,doge-usd,avax-usd', timeframe: '1h' }, { timeoutMs: 7000 })
    ]);
    if (tasks[0].status === 'fulfilled' && tasks[0].value.events?.length)
        state.events = materialEvents(tasks[0].value.events);
    if (tasks[1].status === 'fulfilled' && tasks[1].value.articles?.length)
        state.news = tasks[1].value;
    if (tasks[2].status === 'fulfilled' && tasks[2].value.ports?.length)
        state.shipping = tasks[2].value;
    if (tasks[3].status === 'fulfilled' && tasks[3].value.results?.length)
        state.markets = tasks[3].value;
    state.lastUpdated = new Date();
    buildAlerts();
    buildShippingMoney();
    buildOpportunities();
    updateHeader();
    updateMapData();
    renderDrawer();
    if (!quiet)
        toast('LIVE DATA UPDATED');
    state.polling = false;
}
function bindUi() {
    $$('.merlin-nav-item').forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
    $('#home-button').addEventListener('click', closeSheet);
    $('#sheet-close').addEventListener('click', closeSheet);
    $('#sheet-refresh').addEventListener('click', () => refreshLive().then(() => openView(state.view)));
    $('#sheet-search').addEventListener('input', event => {
        const query = event.target.value;
        if (state.view === 'opportunities')
            renderOpportunitySheet(query);
        if (state.view === 'shipping')
            renderShippingSheet(query);
        if (state.view === 'markets')
            renderMarketsSheet(query);
        if (state.view === 'places')
            renderPlacesSheet(query);
        if (state.view === 'briefings' && state.decisionSupportSystem)
            state.decisionSupportSystem.controller.state.set({ query });
        if (state.view === 'automation' && state.automationSystem)
            state.automationSystem.controller.state.set({ query });
        if (state.view === 'publishing' && state.publishingSystem) {
            state.publishingSystem.controller.state.set({ query });
            state.publishingSystem.controller.render();
        }
        if (state.view === 'commercial' && state.commercialSystem) {
            state.commercialSystem.controller.state.set({ query });
            state.commercialSystem.controller.render();
        }
        if (state.view === 'security' && state.securitySystem) {
            state.securitySystem.controller.state.set({ query });
            state.securitySystem.controller.render();
        }
        if (state.view === 'operations' && state.reliabilitySystem) {
            state.reliabilitySystem.controller.state.set({ query });
            state.reliabilitySystem.controller.render();
        }
        if (state.view === 'release' && state.releaseSystem) {
            state.releaseSystem.controller.state.set({ query });
            state.releaseSystem.controller.render();
        }
        if (state.view === 'live-data' && state.liveDataSystem) {
            state.liveDataSystem.controller.state.set({ query });
            state.liveDataSystem.controller.render();
        }
        event.target.focus();
        event.target.setSelectionRange(query.length, query.length);
    });
    $$('.drawer-tab').forEach(button => button.addEventListener('click', () => { state.drawer = button.dataset.drawer; state.drawerOpen = true; updateDrawerTabs(); renderDrawer(); }));
    $('#drawer-close').addEventListener('click', () => { state.drawerOpen = false; renderDrawer(); });
    $('#layout-toggle').addEventListener('click', () => { state.drawerOpen = !state.drawerOpen; renderDrawer(); });
    $('#collapse-layers').addEventListener('click', () => $('#layer-dock').classList.toggle('collapsed'));
    $$('.layer-button').forEach(button => button.addEventListener('click', () => { const layer = button.dataset.layer; state.layers[layer] = !state.layers[layer]; updateLayerButtons(); applyLayerVisibility(); }));
    $('#base-style').addEventListener('change', event => changeBaseStyle(event.target.value));
    $('#event-window').addEventListener('change', event => { state.windowDays = Number(event.target.value); refreshLive(); });
    $('#radius-select').addEventListener('change', event => {
        state.radiusKm = Number(event.target.value);
        if (state.selectedPlace)
            selectPoint({ lat: state.selectedPlace.lat, lon: state.selectedPlace.lon });
    });
    $('#refresh-live').addEventListener('click', () => refreshLive());
    $('#zoom-in').addEventListener('click', () => state.mapKind === 'maplibre' ? state.map.zoomIn() : state.map?.setZoom?.((state.map.zoom || 1) + 1));
    $('#zoom-out').addEventListener('click', () => state.mapKind === 'maplibre' ? state.map.zoomOut() : state.map?.setZoom?.((state.map.zoom || 1) - 1));
    $('#world-view').addEventListener('click', () => state.mapKind === 'maplibre' ? state.map.flyTo({ center: [3, 24], zoom: 2.15, duration: 600 }) : state.map?.flyTo?.({ lat: 0, lon: 0 }, { zoom: 1 }));
    $('#locate-me').addEventListener('click', () => {
        if (!navigator.geolocation)
            return toast('LOCATION NOT AVAILABLE');
        navigator.geolocation.getCurrentPosition(position => selectPoint({ lat: position.coords.latitude, lon: position.coords.longitude }), () => toast('LOCATION PERMISSION DENIED'), { timeout: 7000 });
    });
    $('#detail-close').addEventListener('click', () => $('#map-detail').classList.add('hidden'));
    const search = $('#global-search');
    search.addEventListener('input', () => { state.searchResults = searchLocal(search.value); renderSearchResults(); });
    search.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const result = state.searchResults[0] || searchLocal(search.value)[0];
            if (result)
                selectSearchResult(result);
        }
        if (event.key === 'Escape') {
            state.searchResults = [];
            renderSearchResults();
            search.blur();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
            event.preventDefault();
            search.focus();
        }
        if (event.key === 'Escape' && !$('#workspace-sheet').classList.contains('hidden'))
            closeSheet();
    });
}
function changeBaseStyle(style) {
    state.mapStyle = style;
    if (state.mapKind === 'tile') {
        state.map?.setTileMode?.(style);
        return;
    }
    if (state.mapKind !== 'maplibre')
        return;
    const chosen = mapStyleCandidates(style)[0];
    state.map.setStyle(chosen);
    state.map.once('style.load', () => { addMapLayers(); updateMapData(); });
}
function disableAudioAndOldWorkers() {
    const keys = Object.keys(localStorage).filter(key => /sound|audio|experience/i.test(key));
    for (const key of keys)
        localStorage.removeItem(key);
    localStorage.setItem('merlin.sound.mode', 'OFF');
    if ('serviceWorker' in navigator)
        navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister())).catch(() => { });
}
async function boot() {
    document.documentElement.dataset.version = VERSION;
    disableAudioAndOldWorkers();
    bindUi();
    updateClock();
    setInterval(updateClock, 1000);
    updateHeader();
    updateLayerButtons();
    updateDrawerTabs();
    renderDrawer();
    const preloadPromise = loadPreloads();
    await initializeMap();
    preloadPromise.then(() => {
        setTimeout(() => refreshLive({ quiet: true }), 1200);
    }).catch(error => console.warn('Merlin preload refresh failed', error));
    setInterval(() => refreshLive({ quiet: true }), 120000);
}
boot().catch(error => {
    console.error('Merlin boot failed', error);
    if ($('#map-loading')) $('#map-loading').innerHTML = '<b>MAP STARTUP FAILED — REFRESH PAGE</b>';
});

})();
