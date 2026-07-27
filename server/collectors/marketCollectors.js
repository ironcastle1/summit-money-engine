const { fetchJson, fetchText } = require("../core/http");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");
const cache = require("../core/cacheStore");
async function binanceCrypto() {
  startSource("Binance", "crypto-markets");
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT"];
  const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  try {
    const rows = await fetchJson(url, { timeout: 9000 });
    const markets = rows.map(r => ({ id: String(r.symbol).replace("USDT", ""), type: "crypto", symbol: r.symbol, name: String(r.symbol).replace("USDT", ""), price: Number(r.lastPrice), changePct: Number(r.priceChangePercent), volume: Number(r.quoteVolume), source: "Binance" })).filter(m => Number.isFinite(m.price));
    markSuccess("Binance", markets.length, "Loaded crypto tickers"); return markets;
  } catch (err) { markFailure("Binance", err); return []; }
}
async function coingeckoCrypto() {
  startSource("CoinGecko", "crypto-markets");
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,avalanche-2,chainlink,polkadot&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true";
  const map = { bitcoin: ["BTC", "Bitcoin"], ethereum: ["ETH", "Ethereum"], solana: ["SOL", "Solana"], ripple: ["XRP", "XRP"], binancecoin: ["BNB", "BNB"], cardano: ["ADA", "Cardano"], dogecoin: ["DOGE", "Dogecoin"], "avalanche-2": ["AVAX", "Avalanche"], chainlink: ["LINK", "Chainlink"], polkadot: ["DOT", "Polkadot"] };
  try {
    const data = await fetchJson(url, { timeout: 9000 });
    const rows = Object.entries(map).map(([id, [symbol, name]]) => ({ id: symbol, type: "crypto", symbol, name, price: Number(data[id] && data[id].usd), changePct: Number(data[id] && data[id].usd_24h_change), volume: Number(data[id] && data[id].usd_24h_vol), source: "CoinGecko" })).filter(m => Number.isFinite(m.price));
    markSuccess("CoinGecko", rows.length, "Loaded fallback crypto"); return rows;
  } catch (err) { markFailure("CoinGecko", err); return []; }
}
async function yahooChart(symbol, id, name, type = "commodity") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  try { const data = await fetchJson(url, { timeout: 9000 }); const result = data.chart && data.chart.result && data.chart.result[0]; const meta = result && result.meta || {}; const quote = result && result.indicators && result.indicators.quote && result.indicators.quote[0] || {}; const closes = (quote.close || []).filter(x => Number.isFinite(Number(x))); const price = Number(meta.regularMarketPrice) || closes[closes.length - 1]; const first = closes[0] || Number(meta.previousClose); const changePct = price && first ? ((price - first) / first) * 100 : null; return { id, type, symbol, name, price: Number(price), changePct, source: "Yahoo Finance" }; } catch { return { id, type, symbol, name, price: null, changePct: null, source: "Yahoo Finance failed" }; }
}
async function commodities() {
  startSource("Yahoo Finance", "commodities");
  const rows = await Promise.all([["GC=F", "GOLD", "Gold"], ["SI=F", "SILVER", "Silver"], ["HG=F", "COPPER", "Copper"], ["CL=F", "WTI", "WTI crude"], ["BZ=F", "BRENT", "Brent crude"], ["NG=F", "GAS", "Natural gas"], ["ZW=F", "WHEAT", "Wheat"], ["ZC=F", "CORN", "Corn"], ["ZS=F", "SOY", "Soybeans"]].map(r => yahooChart(r[0], r[1], r[2])));
  const good = rows.filter(r => Number.isFinite(r.price)); markSuccess("Yahoo Finance", good.length, "Loaded commodity charts"); return rows;
}
async function ecbFx() {
  const cached = cache.get("ecb:fx"); if (cached) return cached;
  startSource("ECB FX", "money");
  const url = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
  try { const xml = await fetchText(url, { timeout: 9000 }); const rates = [...xml.matchAll(/currency='([A-Z]{3})'\s+rate='([\d.]+)'/g)].map(m => ({ currency: m[1], ratePerEuro: Number(m[2]) })); const gbp = rates.find(r => r.currency === "GBP"), usd = rates.find(r => r.currency === "USD"); const result = { rates, EURGBP: gbp && gbp.ratePerEuro, EURUSD: usd && usd.ratePerEuro, GBPUSD: gbp && usd ? usd.ratePerEuro / gbp.ratePerEuro : null, source: "ECB" }; markSuccess("ECB FX", rates.length, "Loaded ECB FX rates"); return cache.set("ecb:fx", result, 6 * 60 * 60 * 1000); } catch (err) { markFailure("ECB FX", err); return { rates: [], source: "ECB failed" }; }
}
async function collectMarkets() {
  const [b, cg, com, fx] = await Promise.all([binanceCrypto(), coingeckoCrypto(), commodities(), ecbFx()]);
  const byId = new Map();
  for (const m of [...b, ...cg]) if (m && m.id && !byId.has(m.id)) byId.set(m.id, m);
  return { markets: [...byId.values(), ...com].filter(Boolean), fx };
}
module.exports = { collectMarkets };
