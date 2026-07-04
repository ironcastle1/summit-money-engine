const { getJson, postJson } = require('./http');
const { mapNodes } = require('../data/mapData');
const topicQueries = [
  { topic:'war', label:'WAR', q:'(war OR missile OR drone OR attack OR invasion OR troops OR ceasefire OR border clash)' },
  { topic:'disaster', label:'DISASTER', q:'(earthquake OR flood OR wildfire OR hurricane OR cyclone OR landslide OR drought)' },
  { topic:'election', label:'ELECTION', q:'(election OR polls OR vote OR candidate OR coalition OR referendum)' },
  { topic:'shipping', label:'SHIPPING', q:'(shipping OR port OR canal OR freight OR tanker OR container OR rerouting)' },
  { topic:'energy', label:'ENERGY', q:'(oil OR gas OR LNG OR refinery OR pipeline OR power grid OR electricity)' },
  { topic:'tech', label:'TECH', q:'(AI OR semiconductor OR datacenter OR data centre OR chip OR Nvidia OR transformer)' },
  { topic:'commodity', label:'COMMODITY', q:'(copper OR uranium OR gold OR silver OR mine OR strike)' }
];
const cityHints = [
  ['London',51.51,-0.13],['Paris',48.85,2.35],['Berlin',52.52,13.40],['Warsaw',52.23,21.01],['Kyiv',50.45,30.52],['Moscow',55.76,37.62],['Istanbul',41.01,28.97],['Cairo',30.04,31.24],['Dubai',25.20,55.27],['Riyadh',24.71,46.67],['Tel Aviv',32.08,34.78],['Jerusalem',31.78,35.21],['Tehran',35.69,51.39],['Doha',25.29,51.53],['Singapore',1.29,103.85],['Shanghai',31.23,121.47],['Shenzhen',22.54,114.06],['Taipei',25.03,121.56],['Tokyo',35.68,139.76],['Seoul',37.56,126.98],['Mumbai',19.08,72.88],['Delhi',28.61,77.21],['New York',40.71,-74.01],['Washington',38.90,-77.04],['Houston',29.76,-95.37],['Los Angeles',34.05,-118.24],['Panama',9.08,-79.68],['Sao Paulo',-23.55,-46.63],['Buenos Aires',-34.60,-58.38],['Cape Town',-33.92,18.42],['Lagos',6.52,3.38],['Nairobi',-1.29,36.82]
];
function inferLocation(title){
  const lower = title.toLowerCase();
  for(const [name,lat,lng] of cityHints){ if(lower.includes(name.toLowerCase())) return { name, lat, lng }; }
  const n = mapNodes[Math.abs([...title].reduce((a,c)=>a+c.charCodeAt(0),0)) % mapNodes.length];
  return { name:n.name, lat:n.lat + (Math.random()-0.5)*3, lng:n.lng + (Math.random()-0.5)*3 };
}
function classify(title, fallback='news'){
  const s = title.toLowerCase();
  if(/war|missile|drone|attack|troops|ceasefire|border|invasion/.test(s)) return 'war';
  if(/earthquake|flood|wildfire|hurricane|cyclone|drought|storm|disaster/.test(s)) return 'disaster';
  if(/election|poll|vote|candidate|coalition|referendum/.test(s)) return 'election';
  if(/shipping|port|canal|freight|tanker|container|rerout/.test(s)) return 'shipping';
  if(/oil|gas|lng|refinery|pipeline|grid|electricity|power/.test(s)) return 'energy';
  if(/ai|chip|semiconductor|datacenter|data centre|nvidia/.test(s)) return 'tech';
  if(/copper|uranium|gold|silver|mine|commodity/.test(s)) return 'commodity';
  return fallback;
}
function eventFromArticle(a, topic){
  const title = a.title || a.seendate || 'Developing event';
  const loc = inferLocation(title + ' ' + (a.domain||''));
  const kind = classify(title, topic);
  return {
    id: `${kind}-${Buffer.from(title).toString('base64').slice(0,28)}`,
    kind, title, lat:loc.lat, lng:loc.lng, place:loc.name,
    source:a.domain || 'GDELT', url:a.url || '#', time:a.seendate || new Date().toISOString(),
    summary: `${loc.name}: ${title}`,
    watch: kind==='war' ? ['GLD','BRENT','LMT'] : kind==='disaster' ? ['PWR','insurance','construction'] : kind==='election' ? ['FX','local equities','bonds'] : kind==='shipping' ? ['ZIM','MATX','BRENT'] : kind==='tech' ? ['VRT','PWR','COPPER'] : ['GLD','COPPER','BRENT']
  };
}
async function fetchGdelt(){
  const events = [];
  for(const t of topicQueries){
    try{
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(t.q)}&mode=ArtList&format=json&maxrecords=12&sort=hybridrel&timespan=6h`;
      const d = await getJson(url, { timeout: 12000 });
      const arts = d.articles || [];
      for(const a of arts) events.push(eventFromArticle(a, t.topic));
    }catch(e){}
  }
  return events;
}
async function fetchReliefWeb(){
  try{
    const body = { limit: 20, sort:['date:desc'], fields:{ include:['title','url','date','country','disaster_type'] }, filter:{ field:'date.created', value:{ from:'now-7d' } } };
    const d = await postJson('https://api.reliefweb.int/v1/reports?appname=summit-money-engine', body, { timeout:12000 });
    return (d.data||[]).map(x => {
      const f = x.fields || {}; const title = f.title || 'ReliefWeb update'; const loc = inferLocation(title + ' ' + JSON.stringify(f.country||[]));
      return { id:`relief-${x.id}`, kind:'disaster', title, lat:loc.lat, lng:loc.lng, place:loc.name, source:'ReliefWeb', url:f.url||'#', time:f.date?.created || new Date().toISOString(), summary:title, watch:['PWR','insurance','construction'] };
    });
  }catch(e){ return []; }
}
async function fetchX(){
  const token = process.env.X_BEARER_TOKEN;
  if(!token) return [];
  try{
    const query = encodeURIComponent('(war OR earthquake OR election OR shipping OR oil OR AI) -is:retweet lang:en');
    const url = `https://api.x.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=created_at,public_metrics,geo&expansions=geo.place_id&place.fields=full_name,geo`;
    const d = await getJson(url, { headers:{ Authorization:`Bearer ${token}` }, timeout:10000 });
    return (d.data||[]).map(t => { const loc = inferLocation(t.text); const kind = classify(t.text); return { id:`x-${t.id}`, kind, title:t.text.slice(0,120), lat:loc.lat, lng:loc.lng, place:loc.name, source:'X API', url:`https://x.com/i/web/status/${t.id}`, time:t.created_at, summary:t.text.slice(0,180), watch: kind==='war'?['GLD','BRENT']:['BTC','GLD'] }; });
  }catch(e){ return []; }
}
const seedEvents = [
  { id:'seed-red-sea', kind:'shipping', title:'Red Sea route risk monitor', lat:12.61,lng:43.33, place:'Bab el-Mandeb', source:'Route monitor', url:'#', summary:'Watch route delays, war-risk insurance, oil bid, shipping names.', watch:['BRENT','ZIM','MATX','GLD'] },
  { id:'seed-hormuz', kind:'energy', title:'Hormuz energy choke monitor', lat:26.57,lng:56.25, place:'Hormuz', source:'Route monitor', url:'#', summary:'Oil and LNG disruption sensitivity.', watch:['BRENT','WTI','GLD'] },
  { id:'seed-taiwan', kind:'tech', title:'Taiwan semiconductor risk monitor', lat:24.80,lng:120.97, place:'Taiwan', source:'Supply-chain monitor', url:'#', summary:'Watch chip supply-chain risk and AI hardware names.', watch:['VRT','PWR','GLD'] },
  { id:'seed-ukraine', kind:'war', title:'Ukraine escalation monitor', lat:48.75,lng:37.60, place:'Ukraine', source:'Conflict monitor', url:'#', summary:'Watch defence, energy and gold reaction.', watch:['LMT','NOC','GLD','BRENT'] },
  { id:'seed-election', kind:'election', title:'Major election volatility monitor', lat:38.90,lng:-77.04, place:'Washington', source:'Election monitor', url:'#', summary:'Watch FX, rates, sector rotation and prediction-market swings.', watch:['GLD','BTC','USD'] }
];
async function fetchEvents(){
  const all = [...seedEvents, ...(await fetchGdelt()), ...(await fetchReliefWeb()), ...(await fetchX())];
  const seen = new Set();
  return all.filter(e => { if(seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0,220);
}
module.exports = { fetchEvents };
