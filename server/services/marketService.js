const { getJson } = require('./http');
const { assets } = require('../data/assets');
function round(n, d=2){ return Number.isFinite(n) ? Number(n.toFixed(d)) : null; }
function fallbackAsset(a, i){
  const base = { BTC:62800, ETH:1780, SOL:82, XRP:1.16, GLD:4187, SLV:36.5, COPPER:6.2, BRENT:72.1, WTI:68.2, URA:43.2, VRT:128, PWR:390, LMT:548, NOC:505, ZIM:18, MATX:125 }[a.id] || (50+i*5);
  const move = Math.sin(Date.now()/600000 + i) * 1.8;
  return { ...a, price:round(base*(1+move/100),2), changePct:round(move,2), status:'fallback', source:'reference', ageSec:0 };
}
async function fetchBinance(a){
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${a.symbol}`;
  const d = await getJson(url);
  return { ...a, price:round(Number(d.lastPrice), a.id==='XRP'?4:2), changePct:round(Number(d.priceChangePercent),2), status:'live', source:'Binance', ageSec:0 };
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
  const isCrypto = ['BTCUSDT','ETHUSDT','SOLUSDT'].includes(symbol);
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
    return Array.from({length:40}, (_,i)=>({t:Date.now()-(40-i)*900000, v:50 + Math.sin(i/4)*3 + i*0.15}));
  }
}
async function fetchMarkets(){
  const out = [];
  for(let i=0;i<assets.length;i++){
    const a = assets[i];
    try { out.push(a.source === 'binance' ? await fetchBinance(a) : await fetchYahoo(a)); }
    catch(e){ out.push(fallbackAsset(a,i)); }
  }
  return out;
}
async function fetchCharts(){
  const wanted = ['BTCUSDT','ETHUSDT','SOLUSDT','HG=F','BZ=F','VRT','PWR','LMT'];
  const obj = {};
  for(const s of wanted) obj[s] = await fetchKlines(s);
  return obj;
}
module.exports = { fetchMarkets, fetchCharts };
