const { getJson } = require('../utils/http');
const { matchPlace } = require('../data/placeIndex');

const EVENT_QUERIES = [
  'war OR missile OR invasion OR ceasefire OR attack OR drone',
  'earthquake OR hurricane OR flood OR wildfire OR cyclone',
  'shipping OR port OR canal OR freight OR tanker OR container',
  'election OR coup OR protest OR sanctions OR tariff',
  'AI OR semiconductor OR data center OR grid OR power demand',
  'oil OR copper OR uranium OR lithium OR gold'
];

const FALLBACK_DOTS = [
  { id:'seed-red-sea', title:'Red Sea / Suez route pressure watch', place:'Red Sea', lat:18.5, lng:39.0, type:'shipping', severity:78, probability:63, assets:['BRENT','WTI','IYT','GOLD'], sources:['engine seed'], fresh:false },
  { id:'seed-hormuz', title:'Hormuz energy-risk watch', place:'Strait of Hormuz', lat:26.6, lng:56.3, type:'energy', severity:72, probability:51, assets:['BRENT','WTI','XLE','GOLD'], sources:['engine seed'], fresh:false },
  { id:'seed-taiwan', title:'Taiwan semiconductor route risk watch', place:'Taiwan', lat:23.7, lng:121.0, type:'tech', severity:68, probability:34, assets:['SMH','NVDA','TSM','GOLD'], sources:['engine seed'], fresh:false },
  { id:'seed-panama', title:'Panama Canal water/shipping constraint watch', place:'Panama Canal', lat:9.1, lng:-79.7, type:'shipping', severity:55, probability:42, assets:['IYT','XLE','BRENT'], sources:['engine seed'], fresh:false },
  { id:'seed-copper', title:'Copper supply chain pressure watch', place:'Chile/Peru copper belt', lat:-20.0, lng:-69.0, type:'commodity', severity:60, probability:49, assets:['COPPER','PWR','ETN'], sources:['engine seed'], fresh:false }
];

function classify(text=''){
  const t = String(text).toLowerCase();
  if (/earthquake|hurricane|flood|wildfire|cyclone|disaster/.test(t)) return 'disaster';
  if (/war|missile|attack|drone|invasion|ceasefire|military/.test(t)) return 'war';
  if (/shipping|port|canal|freight|tanker|container/.test(t)) return 'shipping';
  if (/oil|gas|energy|lng|hormuz/.test(t)) return 'energy';
  if (/ai|semiconductor|chip|data center|data centre|grid|power/.test(t)) return 'tech';
  if (/copper|uranium|lithium|gold|silver/.test(t)) return 'commodity';
  if (/election|coup|protest|sanction|tariff/.test(t)) return 'politics';
  return 'market';
}
function assetsFor(type){
  return ({ war:['GOLD','LMT','RTX','ITA'], disaster:['INSURANCE','XLE','COPPER'], shipping:['BRENT','WTI','IYT'], energy:['BRENT','WTI','XLE'], tech:['VRT','PWR','ETN','COPPER'], commodity:['COPPER','GOLD','URA'], politics:['DXY','GOLD','SPY'], market:['BTC','ETH','GOLD'] })[type] || ['GOLD'];
}
function severityFor(title, sourceCount=1){
  const t = String(title).toLowerCase();
  let s = 35 + sourceCount * 8;
  if (/breaking|urgent|missile|earthquake|hurricane|invasion|attack|explosion|default|coup/.test(t)) s += 25;
  if (/warn|risk|threat|likely|prepares|evacuate/.test(t)) s += 12;
  return Math.max(10, Math.min(95, s));
}
async function queryGdelt(q){
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&format=json&maxrecords=35&timespan=3h&sort=HybridRel`;
  const data = await getJson(url);
  return data?.articles || [];
}
async function fetchEventDots(news=[]){
  const seen = new Map();
  for (const n of news || []) {
    const place = matchPlace(`${n.title} ${(n.themes||[]).join(' ')}`);
    if (!place) continue;
    const type = classify(n.title);
    const id = `rss-${Buffer.from(`${n.title}-${place.label}`).toString('base64').slice(0,18)}`;
    seen.set(id, { id, title:n.title, place:place.label, lat:place.lat, lng:place.lng, type, severity:severityFor(n.title), probability:Math.min(85, severityFor(n.title)-10), assets:assetsFor(type), sources:[n.source], url:n.url, publishedAt:n.publishedAt, fresh:true });
  }
  for (const q of EVENT_QUERIES) {
    try {
      const articles = await queryGdelt(q);
      for (const a of articles.slice(0, 12)) {
        const title = a.title || '';
        const place = matchPlace(`${title} ${a.seendate || ''}`);
        if (!place) continue;
        const type = classify(title);
        const id = `gdelt-${Buffer.from(`${title}-${a.url}`).toString('base64').slice(0,22)}`;
        seen.set(id, { id, title, place:place.label, lat:place.lat, lng:place.lng, type, severity:severityFor(title), probability:Math.min(88, severityFor(title)-8), assets:assetsFor(type), sources:[a.domain || 'GDELT'], url:a.url, publishedAt:a.seendate, fresh:true });
      }
    } catch (_) {}
  }
  const dots = [...seen.values()].sort((a,b)=>(b.severity||0)-(a.severity||0));
  return dots.length ? dots.slice(0, 90) : FALLBACK_DOTS;
}
module.exports = { fetchEventDots };
