const { getJson } = require('../utils/http');
const { cryptoAssets, marketAssets } = require('../data/assets');

function num(v){ const n=Number(v); return Number.isFinite(n)?n:null; }

async function binanceChart(pair, interval, limit) {
  const data = await getJson(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}&_=${Date.now()}`);
  return data.map(row => ({ t: row[0], o: num(row[1]), h: num(row[2]), l: num(row[3]), c: num(row[4]), v: num(row[5]) })).filter(x => x.c !== null);
}

async function yahooChart(ticker, range='1d', interval='5m') {
  const data = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}&includePrePost=true&_=${Date.now()}`);
  const result = data?.chart?.result?.[0];
  const times = result?.timestamp || [];
  const q = result?.indicators?.quote?.[0] || {};
  const closes = q.close || [];
  const pts = times.map((t, i) => ({ t: t * 1000, c: num(closes[i]) })).filter(x => x.c !== null);
  if (pts.length < 2) throw new Error('not enough intraday points');
  return pts;
}

async function getChart(symbol, interval='15m', limit=96) {
  const s = String(symbol || '').toUpperCase();
  const crypto = cryptoAssets.find(a => a.symbol === s);
  if (crypto) return { symbol: s, source: 'Binance', points: await binanceChart(crypto.pair, interval, limit) };
  const market = marketAssets.find(a => a.symbol === s);
  if (market) return { symbol: s, source: 'Yahoo intraday', points: await yahooChart(market.yahoo) };
  return { symbol: s, source: 'none', points: [] };
}

module.exports = { getChart };
