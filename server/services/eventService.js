const { getJson, postJson } = require('./http');
const { mapNodes, cityNodes } = require('../data/mapData');
const { fetchUcdpEvents } = require('./ucdpService');
const { fetchEarthquakes } = require('./usgsService');

const topicQueries = [
  { topic:'war', q:'(war OR missile OR drone OR attack OR invasion OR troops OR ceasefire OR border clash OR shelling OR airstrike OR strikes)' },
  { topic:'terror', q:'("terror attack" OR terrorism OR bombing OR suicide bombing OR hostage OR armed attack OR mass shooting)' },
  { topic:'disaster', q:'(earthquake OR flood OR wildfire OR hurricane OR cyclone OR landslide OR drought OR volcano OR tsunami OR disaster OR evacuation)' },
  { topic:'election', q:'(election OR polls OR vote OR candidate OR coalition OR referendum OR parliament OR president OR election forecast)' },
  { topic:'shipping', q:'(shipping OR port OR canal OR freight OR tanker OR container OR rerouting OR maritime OR vessel OR chokepoint)' },
  { topic:'energy', q:'(oil OR gas OR LNG OR refinery OR pipeline OR power grid OR electricity OR blackout OR uranium)' },
  { topic:'ai', q:'(AI OR artificial intelligence OR semiconductor OR datacenter OR data centre OR chip OR Nvidia OR transformer OR power capacity)' },
  { topic:'commodity', q:'(copper OR uranium OR gold OR silver OR mine OR strike OR commodity OR refinery OR lithium)' }
];

const aliases = [
  ['ukraine',50.45,30.52,'war'],['russia',55.75,37.62,'war'],['gaza',31.5,34.47,'war'],['israel',32.08,34.78,'war'],['iran',35.69,51.39,'war'],['taiwan',25.03,121.56,'war'],['red sea',18.2,39.5,'shipping'],['suez',30.05,32.56,'shipping'],['hormuz',26.56,56.25,'energy'],['bab el-mandeb',12.6,43.4,'shipping'],['south china sea',14.5,115.5,'shipping'],['panama canal',9.08,-79.68,'shipping'],['caucasus',42.0,45.0,'war'],['sahel',15.0,0.0,'terror'],['sudan',15.5,32.6,'war'],['yemen',15.3,44.2,'war'],['haiti',18.54,-72.34,'terror'],['venezuela',10.48,-66.90,'election'],['pakistan',24.86,67.01,'war'],['north korea',39.04,125.76,'war'],['myanmar',16.84,96.17,'war']
];
const locationHints = [
  ...aliases.map(([name,lat,lng,kind])=>({ name, lat, lng, kind })),
  ...mapNodes.map(n => ({ name:n.name.replace(/ Port| Belt| Risk Zone| Market Session| Node| Strait| Canal| Corridor| Hub| Region| Manufacturing| Semiconductor/g,''), lat:n.lat, lng:n.lng, kind:n.kind })),
  ...cityNodes.map(n => ({ name:n.name, lat:n.lat, lng:n.lng, kind:n.kind }))
];
function norm(s){ return String(s||'').toLowerCase(); }
function classify(title, fallback='news'){
  const s = norm(title);
  if(/terror|bombing|suicide bombing|hostage|mass shooting/.test(s)) return 'terror';
  if(/war|missile|drone|attack|troops|ceasefire|border|invasion|airstrike|shell|strikes/.test(s)) return 'war';
  if(/earthquake|flood|wildfire|hurricane|cyclone|drought|storm|disaster|tsunami|volcano|evacuat/.test(s)) return 'disaster';
  if(/election|poll|vote|candidate|coalition|referendum|parliament|president/.test(s)) return 'election';
  if(/shipping|port|canal|freight|tanker|container|rerout|maritime|vessel|chokepoint/.test(s)) return 'shipping';
  if(/oil|gas|lng|refinery|pipeline|grid|electricity|power|blackout|uranium/.test(s)) return 'energy';
  if(/ai|artificial intelligence|chip|semiconductor|datacenter|data centre|nvidia|transformer/.test(s)) return 'ai';
  if(/copper|uranium|gold|silver|mine|commodity|refinery|lithium/.test(s)) return 'commodity';
  return fallback;
}
function findLocation(text){
  const s = norm(text); let best = null;
  for(const h of locationHints){ const n=norm(h.name); if(n.length>3 && s.includes(n)){ if(!best || n.length > best.name.length) best=h; } }
  return best;
}
function watchFor(kind){
  if(kind==='war'||kind==='terror') return ['GLD','BRENT','LMT','NOC','local FX'];
  if(kind==='disaster') return ['insurance','construction','generators','PWR'];
  if(kind==='election') return ['Polymarket','FX','local equities','bonds'];
  if(kind==='shipping') return ['ZIM','MATX','BRENT','war-risk insurance'];
  if(kind==='energy') return ['BRENT','WTI','URA','PWR'];
  if(kind==='ai') return ['VRT','PWR','ETN','COPPER'];
  if(kind==='commodity') return ['COPPER','GLD','SLV','URA'];
  return ['BTC','GLD'];
}
function eventFromArticle(a, topic){
  const title = a.title || 'Developing event';
  const loc = findLocation([title,a.domain,a.sourceCountry,a.seendate,a.url].join(' '));
  if(!loc) return null;
  const kind = classify(title, topic);
  return { id:`${kind}-${Buffer.from(title).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,42)}`, kind, title, lat:loc.lat, lng:loc.lng, place:loc.name, source:a.domain || 'GDELT', url:a.url || '#', time:a.seendate || new Date().toISOString(), summary:title, watch:watchFor(kind), sources:[{name:a.domain||'GDELT',url:a.url||'#'}], verifiedLocation:true };
}
async function fetchGdelt(){
  const events=[];
  for(const t of topicQueries){
    try{ const url=`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(t.q)}&mode=ArtList&format=json&maxrecords=75&sort=hybridrel&timespan=12h`; const d=await getJson(url,{timeout:16000}); for(const a of (d.articles||[])){ const ev=eventFromArticle(a,t.topic); if(ev) events.push(ev); } }catch(e){}
  }
  return events;
}
async function fetchReliefWeb(){
  try{ const body={limit:60,sort:['date:desc'],fields:{include:['title','url','date','country','disaster_type']},filter:{field:'date.created',value:{from:'now-7d'}}}; const d=await postJson('https://api.reliefweb.int/v1/reports?appname=summit-money-engine',body,{timeout:14000}); return (d.data||[]).map(x=>{ const f=x.fields||{}; const title=f.title||'ReliefWeb update'; const loc=findLocation(title+' '+JSON.stringify(f.country||[])); if(!loc) return null; return {id:`relief-${x.id}`,kind:'disaster',title,lat:loc.lat,lng:loc.lng,place:loc.name,source:'ReliefWeb',url:f.url||'#',time:f.date?.created||new Date().toISOString(),summary:title,watch:watchFor('disaster'),sources:[{name:'ReliefWeb',url:f.url||'#'}],verifiedLocation:true}; }).filter(Boolean); }catch(e){return []}
}
async function fetchXFeed(){
  const token=process.env.X_BEARER_TOKEN; if(!token) return { posts:[], status:{connected:false, reason:'X_BEARER_TOKEN missing in Render Environment'} };
  try{ const query=encodeURIComponent('(war OR earthquake OR election OR shipping OR oil OR AI OR flood OR missile OR port OR terror OR bombing) -is:retweet lang:en'); const url=`https://api.x.com/2/tweets/search/recent?query=${query}&max_results=50&tweet.fields=created_at,public_metrics,geo`; const d=await getJson(url,{headers:{Authorization:`Bearer ${token}`},timeout:12000}); return { posts:(d.data||[]).map(t=>({id:`x-${t.id}`,title:t.text.slice(0,180),text:t.text,url:`https://x.com/i/web/status/${t.id}`,time:t.created_at,source:'X API'})), status:{connected:true, reason:'official X API connected', count:(d.data||[]).length} }; }catch(e){return { posts:[], status:{connected:false, reason:e.message||'X API request failed'} }}
}
function eventsFromX(xfeed){ return (xfeed||[]).map(t=>{ const loc=findLocation(t.text||t.title); if(!loc) return null; const kind=classify(t.text||t.title); return { id:t.id, kind, title:t.title, lat:loc.lat, lng:loc.lng, place:loc.name, source:'X API', url:t.url, time:t.time, summary:t.text, watch:watchFor(kind), sources:[{name:'X post',url:t.url}], verifiedLocation:true }; }).filter(Boolean); }
async function fetchEvents(){
  const xBundle=await fetchXFeed();
  const xfeed=xBundle.posts||[];
  const [ucdp, gdelt, relief, quakes] = await Promise.all([
    fetchUcdpEvents({days:30,limit:180}),
    fetchGdelt(),
    fetchReliefWeb(),
    fetchEarthquakes()
  ]);
  const all=[...(ucdp.events||[]),...gdelt,...relief,...quakes,...eventsFromX(xfeed)];
  const seen=new Set();
  const events=all.filter(e=>{ if(!e||seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0,1200);
  const sourceSummary = [
    'GDELT live news/events active',
    'ReliefWeb disasters active',
    'USGS earthquakes active',
    ucdp.status || 'UCDP optional feed not checked',
    'X tab removed; no fake X posts'
  ].join(' · ');
  return {
    events,
    xfeed: [],
    xStatus: { connected:false, reason:'X tab removed; no fake X data' },
    conflictFeedStatus: sourceSummary
  };
}
module.exports = { fetchEvents, fetchXFeed };
