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

export function createDirectMarketData({ catalog = () => [] } = {}) {
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
