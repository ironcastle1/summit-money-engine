const { getJson } = require('./http');
const { assets } = require('../data/assets');
function round(n, d=2){ return Number.isFinite(n) ? Number(n.toFixed(d)) : null; }
const coinGeckoIds = {
  BTC:'bitcoin',
  ETH:'ethereum',
  SOL:'solana',
  XRP:'ripple',
  BNB:'binancecoin',
  ADA:'cardano',
  DOGE:'dogecoin',
  LINK:'chainlink',
  AVAX:'avalanche-2'
};
async function fetchBinance(a){
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${a.symbol}`;
  const d = await getJson(url);
  return { ...a, price:round(Number(d.lastPrice), Number(d.lastPrice) < 10 ? 4 : 2), changePct:round(Number(d.priceChangePercent),2), status:'live', source:'Binance', ageSec:0 };
}
async function fetchCoinGecko(a){
  const id = coinGeckoIds[a.id];
  if(!id) throw new Error(`No CoinGecko id for ${a.id}`);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;
  const d = await getJson(url, { timeout: 12000 });
  const row = d[id] || {};
  return {
    ...a,
    price: round(Number(row.usd), Number(row.usd) < 10 ? 4 : 2),
    changePct: round(Number(row.usd_24h_change), 2),
    status: 'live',
    source: 'CoinGecko',
    ageSec: row.last_updated_at ? Math.max(0, Math.floor(Date.now()/1000 - Number(row.last_updated_at))) : null
  };
}
async function fetchYahoo(a){
  const s = encodeURIComponent(a.symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=1d&interval=1m`;
  const d = await getJson(url);
  const r = d.chart && d.chart.result && d.chart.result[0];
  const q = r && r.meta;
  const closes = r && r.indicators && r.indicators.quote && r.indicators.quote[0].close || [];
  const valid = closes.filter(x => Number.isFinite(x));
  const last = q && q.regularMarketPrice || valid[valid.length-1];
  const prev = q && q.previousClose || valid[0] || last;
  return { ...a, price:round(Number(last),2), changePct:round(((last-prev)/prev)*100,2), status:'delayed-live', source:'Yahoo chart', ageSec: q && q.regularMarketTime ? Math.max(0, Math.floor(Date.now()/1000 - q.regularMarketTime)) : null };
}
async function fetchKlines(symbol){
  const isCrypto = /^[A-Z0-9]+USDT$/.test(symbol);
  try{
    if(isCrypto){
      const rows = await getJson(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=80`);
      return rows.map(r => ({ t:r[0], v:Number(r[4]) }));
    }
    const ys = encodeURIComponent(symbol);
    const d = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${ys}?range=5d&interval=30m`);
    const r = d.chart.result[0];
    const times = r.timestamp || [];
    const closes = r.indicators.quote[0].close || [];
    return closes.map((v,i) => ({ t:(times[i]||0)*1000, v:Number(v) })).filter(x => Number.isFinite(x.v));
  }catch(e){
    const asset = assets.find(a => a.symbol === symbol);
    if(asset?.group === 'crypto') return fetchCoinGeckoChart(asset).catch(() => []);
    return [];
  }
}
async function fetchCoinGeckoChart(a){
  const id = coinGeckoIds[a.id];
  if(!id) return [];
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=2&interval=hourly`;
  const d = await getJson(url, { timeout: 12000 });
  return (d.prices || []).map(([t,v]) => ({ t, v:Number(v) })).filter(x => Number.isFinite(x.v));
}
async function fetchMarkets(){
  const out = [];
  for(let i=0;i<assets.length;i++){
    const a = assets[i];
    try { out.push(a.source === 'binance' ? await fetchBinance(a) : await fetchYahoo(a)); }
    catch(e){
      if(a.group === 'crypto'){
        try { out.push(await fetchCoinGecko(a)); continue; } catch(_){}
      }
      out.push({ ...a, price:null, changePct:null, status:'unavailable', source:a.source === 'binance' ? 'Binance/CoinGecko' : 'Yahoo chart', ageSec:null, error:e.message });
    }
  }
  return out;
}
async function fetchCharts(){
  const wanted = [...new Set(assets.map(a => a.symbol))];
  const obj = {};
  for(const s of wanted) obj[s] = await fetchKlines(s);
  return obj;
}
module.exports = { fetchMarkets, fetchCharts };
