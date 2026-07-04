const { getJson, postJson } = require('./http');
const { mapNodes, cityNodes } = require('../data/mapData');

const topicQueries = [
  { topic:'war', q:'(war OR missile OR drone OR attack OR invasion OR troops OR ceasefire OR border clash OR shelling OR airstrike)' },
  { topic:'disaster', q:'(earthquake OR flood OR wildfire OR hurricane OR cyclone OR landslide OR drought OR volcano OR tsunami)' },
  { topic:'election', q:'(election OR polls OR vote OR candidate OR coalition OR referendum OR parliament OR president)' },
  { topic:'shipping', q:'(shipping OR port OR canal OR freight OR tanker OR container OR rerouting OR maritime OR vessel)' },
  { topic:'energy', q:'(oil OR gas OR LNG OR refinery OR pipeline OR power grid OR electricity OR blackout)' },
  { topic:'tech', q:'(AI OR semiconductor OR datacenter OR data centre OR chip OR Nvidia OR transformer OR power capacity)' },
  { topic:'commodity', q:'(copper OR uranium OR gold OR silver OR mine OR strike OR commodity OR refinery)' }
];
const locationHints = [...mapNodes, ...cityNodes].map(n => ({ name:n.name.replace(/ Port| Belt| Risk Zone| Market Session| Node| Strait| Canal| Corridor| Hub| Region| Manufacturing| Semiconductor/g,''), lat:n.lat, lng:n.lng, kind:n.kind }));
function norm(s){ return String(s||'').toLowerCase(); }
function classify(title, fallback='news'){
  const s = norm(title);
  if(/war|missile|drone|attack|troops|ceasefire|border|invasion|airstrike|shell/.test(s)) return 'war';
  if(/earthquake|flood|wildfire|hurricane|cyclone|drought|storm|disaster|tsunami|volcano/.test(s)) return 'disaster';
  if(/election|poll|vote|candidate|coalition|referendum|parliament|president/.test(s)) return 'election';
  if(/shipping|port|canal|freight|tanker|container|rerout|maritime|vessel/.test(s)) return 'shipping';
  if(/oil|gas|lng|refinery|pipeline|grid|electricity|power|blackout/.test(s)) return 'energy';
  if(/ai|chip|semiconductor|datacenter|data centre|nvidia|transformer/.test(s)) return 'tech';
  if(/copper|uranium|gold|silver|mine|commodity|refinery/.test(s)) return 'commodity';
  return fallback;
}
function findLocation(text){
  const s = norm(text);
  let best = null;
  for(const h of locationHints){
    const n = norm(h.name);
    if(n.length > 3 && s.includes(n)) {
      if(!best || n.length > best.name.length) best = h;
    }
  }
  return best;
}
function watchFor(kind){
  if(kind==='war') return ['GLD','BRENT','LMT','NOC'];
  if(kind==='disaster') return ['PWR','insurance','construction','generators'];
  if(kind==='election') return ['FX','local equities','bonds','Polymarket'];
  if(kind==='shipping') return ['ZIM','MATX','BRENT','war-risk insurance'];
  if(kind==='energy') return ['BRENT','WTI','URA','PWR'];
  if(kind==='tech') return ['VRT','PWR','ETN','COPPER'];
  if(kind==='commodity') return ['COPPER','GLD','SLV','URA'];
  return ['BTC','GLD'];
}
function eventFromArticle(a, topic){
  const title = a.title || 'Developing event';
  const loc = findLocation([title,a.domain,a.sourceCountry,a.seendate].join(' '));
  if(!loc) return null;
  const kind = classify(title, topic);
  return {
    id: `${kind}-${Buffer.from(title).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,36)}`,
    kind, title, lat:loc.lat, lng:loc.lng, place:loc.name,
    source:a.domain || 'GDELT', url:a.url || '#', time:a.seendate || new Date().toISOString(),
    summary:title, watch:watchFor(kind), verifiedLocation:true
  };
}
async function fetchGdelt(){
  const events = [];
  for(const t of topicQueries){
    try{
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(t.q)}&mode=ArtList&format=json&maxrecords=30&sort=hybridrel&timespan=6h`;
      const d = await getJson(url, { timeout: 14000 });
      for(const a of (d.articles || [])){
        const ev = eventFromArticle(a, t.topic);
        if(ev) events.push(ev);
      }
    }catch(e){}
  }
  return events;
}
async function fetchReliefWeb(){
  try{
    const body = { limit: 35, sort:['date:desc'], fields:{ include:['title','url','date','country','disaster_type'] }, filter:{ field:'date.created', value:{ from:'now-7d' } } };
    const d = await postJson('https://api.reliefweb.int/v1/reports?appname=summit-money-engine', body, { timeout:14000 });
    return (d.data||[]).map(x => {
      const f = x.fields || {}; const title = f.title || 'ReliefWeb update'; const loc = findLocation(title + ' ' + JSON.stringify(f.country||[]));
      if(!loc) return null;
      return { id:`relief-${x.id}`, kind:'disaster', title, lat:loc.lat, lng:loc.lng, place:loc.name, source:'ReliefWeb', url:f.url||'#', time:f.date?.created || new Date().toISOString(), summary:title, watch:watchFor('disaster'), verifiedLocation:true };
    }).filter(Boolean);
  }catch(e){ return []; }
}
async function fetchX(){
  const token = process.env.X_BEARER_TOKEN;
  if(!token) return [];
  try{
    const query = encodeURIComponent('(war OR earthquake OR election OR shipping OR oil OR AI OR flood OR missile OR port) -is:retweet lang:en');
    const url = `https://api.x.com/2/tweets/search/recent?query=${query}&max_results=30&tweet.fields=created_at,public_metrics,geo`;
    const d = await getJson(url, { headers:{ Authorization:`Bearer ${token}` }, timeout:12000 });
    return (d.data||[]).map(t => {
      const loc = findLocation(t.text); if(!loc) return null;
      const kind = classify(t.text);
      return { id:`x-${t.id}`, kind, title:t.text.slice(0,140), lat:loc.lat, lng:loc.lng, place:loc.name, source:'X API', url:`https://x.com/i/web/status/${t.id}`, time:t.created_at, summary:t.text.slice(0,220), watch:watchFor(kind), verifiedLocation:true };
    }).filter(Boolean);
  }catch(e){ return []; }
}
const baselineMonitors = mapNodes.filter(n=>['shipping','energy','war','disaster','tech','commodity'].includes(n.kind)).map(n=>({
  id:'monitor-'+n.id, kind:n.kind, title:n.name, lat:n.lat, lng:n.lng, place:n.name, source:n.source, url:'#', summary:n.note, watch:n.watch, baseline:true
}));
async function fetchEvents(){
  const all = [...baselineMonitors, ...(await fetchGdelt()), ...(await fetchReliefWeb()), ...(await fetchX())];
  const seen = new Set();
  return all.filter(e => { if(!e||seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0,450);
}
module.exports = { fetchEvents };
