const { getJson } = require('../utils/http');
const { cryptoAssets, marketAssets, fallbackPrices } = require('../data/assets');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchBinanceAsset(asset) {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${asset.pair}`;
  const data = await getJson(url);
  const price = num(data.lastPrice);
  const changePct = num(data.priceChangePercent);
  if (!price) throw new Error(`bad Binance response ${asset.symbol}`);
  return {
    ...asset,
    price,
    changePct: changePct ?? 0,
    status: 'LIVE',
    source: 'Binance',
    updatedAt: new Date().toISOString()
  };
}

async function fetchYahooAsset(asset) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahoo)}?range=5d&interval=1d`;
  const data = await getJson(url);
  const result = data?.chart?.result?.[0];
  const metaPrice = num(result?.meta?.regularMarketPrice);
  const closes = (result?.indicators?.quote?.[0]?.close || []).map(num).filter(v => v !== null);
  const price = metaPrice || closes.at(-1);
  const prev = closes.at(-2) || closes.at(-1) || price;
  if (!price) throw new Error(`bad Yahoo response ${asset.symbol}`);
  return {
    ...asset,
    price,
    changePct: prev ? ((price - prev) / prev) * 100 : 0,
    status: 'LIVE',
    source: 'Yahoo',
    updatedAt: new Date().toISOString()
  };
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
