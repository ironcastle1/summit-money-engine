const { cachedJson, cachedText } = require('./http');
const cache = require('./cache');

const TTL = 3 * 60 * 1000;

async function binance() {
  const symbols = ['BTCUSDT','ETHUSDT','BNBUSDT','ADAUSDT','XRPUSDT','LINKUSDT','DOGEUSDT','SOLUSDT','AVAXUSDT','DOTUSDT'];
  const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  try {
    const rows = await cachedJson('markets:binance', url, TTL, 'Binance public ticker', { timeout: 4000 });
    return rows.map(r => ({
      id: String(r.symbol || '').replace('USDT',''),
      symbol: String(r.symbol || '').replace('USDT',''),
      name: String(r.symbol || '').replace('USDT',''),
      price: Number(r.lastPrice),
      changePct: Number(r.priceChangePercent),
      volume: Number(r.quoteVolume),
      category: 'crypto',
      source: 'Binance'
    })).filter(x => Number.isFinite(x.price));
  } catch { return []; }
}

async function yahoo(symbol, id, name, category) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=15m`;
  try {
    const data = await cachedJson(`yahoo:${symbol}`, url, TTL, `Yahoo ${id}`, { timeout: 4000 });
    const result = data.chart && data.chart.result && data.chart.result[0];
    const meta = result && result.meta;
    const quote = result && result.indicators && result.indicators.quote && result.indicators.quote[0];
    const close = quote && Array.isArray(quote.close) ? quote.close.filter(Number.isFinite) : [];
    const price = Number(meta && meta.regularMarketPrice) || close[close.length - 1];
    const start = close[0] || Number(meta && meta.previousClose);
    const changePct = price && start ? ((price - start) / start) * 100 : null;
    return { id, symbol, name, price, changePct, category, source: 'Yahoo Finance' };
  } catch {
    return null;
  }
}

async function stooq(symbol, id, name, category) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
  try {
    const text = await cachedText(`stooq:${symbol}`, url, TTL, `Stooq ${id}`, { timeout: 4000 });
    const [, row] = text.trim().split(/\r?\n/);
    if (!row) return null;
    const cols = row.split(',');
    const close = Number(cols[6]);
    const open = Number(cols[3]);
    const changePct = close && open ? ((close - open) / open) * 100 : null;
    return { id, symbol, name, price: close, changePct, category, source: 'Stooq' };
  } catch { return null; }
}

async function commodities() {
  const definitions = [
    ['GC=F','GOLD','Gold','commodity','xauusd'],
    ['SI=F','SILVER','Silver','commodity','xagusd'],
    ['HG=F','COPPER','Copper','commodity','hg.f'],
    ['CL=F','WTI','WTI Oil','commodity','cl.f'],
    ['BZ=F','BRENT','Brent Oil','commodity','brent'],
    ['NG=F','GAS','Natural Gas','commodity','ng.f'],
    ['ZW=F','WHEAT','Wheat','commodity','zw.f'],
    ['ZC=F','CORN','Corn','commodity','zc.f']
  ];
  const rows = await Promise.all(definitions.map(async ([ys, id, name, category, st]) => {
    const y = await yahoo(ys, id, name, category);
    return y || await stooq(st, id, name, category);
  }));
  return rows.filter(Boolean);
}

async function collectMarkets() {
  const cached = cache.get('markets:all');
  if (cached) return cached;
  const [crypto, comms] = await Promise.all([binance(), commodities()]);
  const markets = [...crypto, ...comms]
    .filter(x => Number.isFinite(Number(x.price)))
    .sort((a, b) => Math.abs(Number(b.changePct || 0)) - Math.abs(Number(a.changePct || 0)));
  cache.mark('Market compiler', markets.length ? 'OK' : 'FAIL', { detail: `${markets.length} market rows` });
  return cache.set('markets:all', markets, TTL);
}

module.exports = { collectMarkets };
