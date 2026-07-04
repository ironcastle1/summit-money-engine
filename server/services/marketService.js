const { getJson } = require('../utils/http');
const { cryptoAssets, marketAssets, fallbackPrices } = require('../data/assets');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function percent(price, prev) {
  return prev ? ((price - prev) / prev) * 100 : 0;
}

async function fetchBinanceAsset(asset) {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${asset.pair}&_=${Date.now()}`;
  const data = await getJson(url);
  const price = num(data.lastPrice);
  const changePct = num(data.priceChangePercent);
  const volume = num(data.quoteVolume);
  if (!price) throw new Error(`bad Binance response ${asset.symbol}`);
  return {
    ...asset,
    price,
    changePct: changePct ?? 0,
    volume,
    status: 'LIVE',
    source: 'Binance stream-poll',
    updatedAt: new Date().toISOString()
  };
}

async function yahooIntraday(asset) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahoo)}?range=1d&interval=1m&includePrePost=true&_=${Date.now()}`;
  const data = await getJson(url);
  const result = data?.chart?.result?.[0];
  const meta = result?.meta || {};
  const q = result?.indicators?.quote?.[0] || {};
  const closes = (q.close || []).map(num).filter(v => v !== null);
  const price = num(meta.regularMarketPrice) || closes.at(-1);
  const prev = num(meta.previousClose) || closes.find(v => v) || price;
  if (!price) throw new Error(`bad Yahoo intraday ${asset.symbol}`);
  return {
    ...asset,
    price,
    changePct: percent(price, prev),
    status: meta.exchangeName ? 'DELAYED-LIVE' : 'LIVE-POLL',
    source: `Yahoo ${meta.exchangeName || 'chart'} ${meta.instrumentType || ''}`.trim(),
    marketState: meta.marketState || 'unknown',
    updatedAt: new Date().toISOString()
  };
}

async function yahooDaily(asset) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahoo)}?range=5d&interval=1d&_=${Date.now()}`;
  const data = await getJson(url);
  const result = data?.chart?.result?.[0];
  const metaPrice = num(result?.meta?.regularMarketPrice);
  const closes = (result?.indicators?.quote?.[0]?.close || []).map(num).filter(v => v !== null);
  const price = metaPrice || closes.at(-1);
  const prev = closes.at(-2) || closes.at(-1) || price;
  if (!price) throw new Error(`bad Yahoo daily ${asset.symbol}`);
  return {
    ...asset,
    price,
    changePct: percent(price, prev),
    status: 'DELAYED-LIVE',
    source: 'Yahoo chart fallback',
    updatedAt: new Date().toISOString()
  };
}

async function fetchYahooAsset(asset) {
  try { return await yahooIntraday(asset); }
  catch (e) { return await yahooDaily(asset); }
}

function fallback(asset, reason) {
  return {
    ...asset,
    price: fallbackPrices[asset.symbol] || 0,
    changePct: 0,
    status: 'FALLBACK',
    source: 'local reference',
    error: reason,
    updatedAt: new Date().toISOString()
  };
}

async function fetchMarketPrices() {
  const out = [];
  for (const a of cryptoAssets) {
    try { out.push(await fetchBinanceAsset(a)); } catch (e) { out.push(fallback(a, e.message)); }
  }
  for (const a of marketAssets) {
    try { out.push(await fetchYahooAsset(a)); } catch (e) { out.push(fallback(a, e.message)); }
  }
  return out;
}

module.exports = { fetchMarketPrices };
