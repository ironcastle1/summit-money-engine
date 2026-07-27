const express = require("express");
const countryCodes = require("./data/countryCodes");

const router = express.Router();

const APP_VERSION = "open-intel-v3-full-rebuild";
const STARTED_AT = new Date().toISOString();

const CACHE = {
  state: null,
  mapData: null,
  boundaries: null,
  local: new Map(),
  sseClients: new Set(),
  sourceHealth: {},
  updatedAt: 0
};

const TTL = {
  state: 4 * 60 * 1000,
  point: 8 * 60 * 1000,
  places: 15 * 60 * 1000,
  wiki: 24 * 60 * 60 * 1000,
  boundary: 7 * 24 * 60 * 60 * 1000,
  worldBank: 24 * 60 * 60 * 1000,
  fx: 6 * 60 * 60 * 1000
};

const HEADERS = {
  "User-Agent": "SummitMoneyEngine/3.0 open-public-data-dashboard",
  Accept: "application/json,text/plain,*/*"
};

const SOURCE_META = [
  { id: "gdelt", name: "GDELT", type: "live events", gives: "English live event/news signals for war, terror, politics, shipping and markets" },
  { id: "reliefweb", name: "ReliefWeb", type: "humanitarian", gives: "humanitarian and disaster reports" },
  { id: "usgs", name: "USGS", type: "earthquakes", gives: "global earthquake feed" },
  { id: "gdacs", name: "GDACS", type: "disasters", gives: "global disaster alerts" },
  { id: "eonet", name: "NASA EONET", type: "natural hazards", gives: "open natural hazard events" },
  { id: "nws", name: "US NWS", type: "weather alerts", gives: "active severe weather alerts in the United States" },
  { id: "openMeteo", name: "Open-Meteo", type: "weather", gives: "point weather and air-quality lookups" },
  { id: "binance", name: "Binance", type: "crypto", gives: "public 24h crypto prices" },
  { id: "coingecko", name: "CoinGecko", type: "crypto fallback", gives: "public crypto prices fallback" },
  { id: "yahoo", name: "Yahoo Finance chart", type: "commodities", gives: "commodities and market ETF chart fallback" },
  { id: "stooq", name: "Stooq", type: "market fallback", gives: "CSV fallback for major indices and commodities" },
  { id: "ecb", name: "ECB", type: "FX", gives: "daily FX rates" },
  { id: "worldBank", name: "World Bank", type: "country indicators", gives: "homicide, GDP, inflation, governance and rule-of-law indicators" },
  { id: "ukPolice", name: "data.police.uk", type: "local crime", gives: "official street-level local crime for UK points only" },
  { id: "nominatim", name: "Nominatim / OSM", type: "geocoding", gives: "place search and reverse geocoding" },
  { id: "overpass", name: "Overpass / OSM", type: "local infrastructure", gives: "local towns, hospitals, police, fire stations, embassies, airports and ports" },
  { id: "wikipedia", name: "Wikipedia / Wikimedia", type: "images", gives: "place summary and sourced lead images where available" }
];

const COUNTRY_ALIAS = {
  "united kingdom": "GB", england: "GB", scotland: "GB", wales: "GB", "northern ireland": "GB", britain: "GB",
  ireland: "IE", france: "FR", germany: "DE", spain: "ES", portugal: "PT", italy: "IT", netherlands: "NL", belgium: "BE", poland: "PL",
  ukraine: "UA", russia: "RU", "russian federation": "RU", "united states": "US", usa: "US", canada: "CA", mexico: "MX", brazil: "BR", argentina: "AR",
  china: "CN", japan: "JP", "south korea": "KR", "north korea": "KP", india: "IN", pakistan: "PK", iran: "IR", iraq: "IQ", syria: "SY", israel: "IL", palestine: "PS", lebanon: "LB", yemen: "YE", "saudi arabia": "SA", "united arab emirates": "AE", turkey: "TR", egypt: "EG", sudan: "SD", somalia: "SO", mali: "ML", "burkina faso": "BF", niger: "NE", nigeria: "NG", "south africa": "ZA", australia: "AU", "new zealand": "NZ", indonesia: "ID", philippines: "PH", thailand: "TH", vietnam: "VN", taiwan: "TW", afghanistan: "AF", haiti: "HT", myanmar: "MM", libya: "LY", ethiopia: "ET", chad: "TD", venezuela: "VE", colombia: "CO", chile: "CL", peru: "PE", greece: "GR", sweden: "SE", norway: "NO", finland: "FI", denmark: "DK", czechia: "CZ", austria: "AT", switzerland: "CH", romania: "RO", hungary: "HU", serbia: "RS", morocco: "MA", algeria: "DZ", tunisia: "TN", jordan: "JO", qatar: "QA", kuwait: "KW", oman: "OM"
};

const COUNTRY_CENTRES = {
  GB: [54.5, -2.5], IE: [53.2, -7.7], US: [39, -98], CA: [56.1, -106.3], MX: [23.6, -102.5], FR: [46.2, 2.2], DE: [51.1, 10.4], ES: [40.4, -3.7], PT: [39.4, -8.2], IT: [42.8, 12.5], NL: [52.1, 5.3], BE: [50.7, 4.6], PL: [52.1, 19.3], RU: [61.5, 90], UA: [49, 31], SY: [35, 38], IR: [32, 53], IQ: [33, 44], IL: [31.5, 35], PS: [31.9, 35.2], LB: [33.9, 35.8], YE: [15.5, 47.5], SD: [15.6, 30.5], SO: [5.1, 46.2], ML: [17.5, -3.9], BF: [12.2, -1.6], NE: [17.6, 8.1], NG: [9.1, 8.7], CN: [35.8, 104], JP: [36.2, 138.2], KR: [36.2, 127.8], KP: [40, 127], IN: [22.9, 79], PK: [30.3, 69.3], TR: [39, 35], EG: [26.8, 30.8], BR: [-10.8, -52.9], AR: [-34, -64], AU: [-25.3, 133.8], NZ: [-41, 174], ID: [-2.5, 118], PH: [12.8, 122.7], TH: [15.8, 101], VN: [16.1, 108], TW: [23.7, 121], AF: [34, 66], HT: [19, -72.4], MM: [21.9, 95.9], LY: [26.3, 17.2], ET: [9, 40.5], TD: [15.5, 18.7], VE: [7, -66]
};

const CITY_POINTS = [
  ["London", "United Kingdom", 51.5072, -0.1276], ["Camden Town", "United Kingdom", 51.539, -0.143], ["Exeter", "United Kingdom", 50.7184, -3.5339], ["Paignton", "United Kingdom", 50.4353, -3.5642], ["Plymouth", "United Kingdom", 50.3755, -4.1427], ["Bristol", "United Kingdom", 51.4545, -2.5879], ["Cardiff", "United Kingdom", 51.4816, -3.1791], ["Manchester", "United Kingdom", 53.4808, -2.2426], ["Birmingham", "United Kingdom", 52.4862, -1.8904], ["Liverpool", "United Kingdom", 53.4084, -2.9916], ["Glasgow", "United Kingdom", 55.8642, -4.2518], ["Edinburgh", "United Kingdom", 55.9533, -3.1883], ["Dublin", "Ireland", 53.3498, -6.2603],
  ["Paris", "France", 48.8566, 2.3522], ["Berlin", "Germany", 52.52, 13.405], ["Madrid", "Spain", 40.4168, -3.7038], ["Lisbon", "Portugal", 38.7223, -9.1393], ["Rome", "Italy", 41.9028, 12.4964], ["Amsterdam", "Netherlands", 52.3676, 4.9041], ["Brussels", "Belgium", 50.8503, 4.3517], ["Warsaw", "Poland", 52.2297, 21.0122], ["Kyiv", "Ukraine", 50.4501, 30.5234], ["Moscow", "Russia", 55.7558, 37.6173], ["Saint Petersburg", "Russia", 59.9311, 30.3609],
  ["Damascus", "Syria", 33.5138, 36.2765], ["Aleppo", "Syria", 36.2021, 37.1343], ["Tehran", "Iran", 35.6892, 51.389], ["Baghdad", "Iraq", 33.3152, 44.3661], ["Tel Aviv", "Israel", 32.0853, 34.7818], ["Jerusalem", "Israel", 31.7683, 35.2137], ["Gaza", "Palestine", 31.5017, 34.4668], ["Beirut", "Lebanon", 33.8938, 35.5018], ["Sanaa", "Yemen", 15.3694, 44.191], ["Khartoum", "Sudan", 15.5007, 32.5599], ["Mogadishu", "Somalia", 2.0469, 45.3182], ["Bamako", "Mali", 12.6392, -8.0029], ["Ouagadougou", "Burkina Faso", 12.3714, -1.5197], ["Niamey", "Niger", 13.5116, 2.1254], ["Lagos", "Nigeria", 6.5244, 3.3792], ["Abuja", "Nigeria", 9.0765, 7.3986],
  ["New York", "United States", 40.7128, -74.006], ["Washington", "United States", 38.9072, -77.0369], ["Los Angeles", "United States", 34.0522, -118.2437], ["Chicago", "United States", 41.8781, -87.6298], ["Toronto", "Canada", 43.6532, -79.3832], ["Mexico City", "Mexico", 19.4326, -99.1332], ["Rio de Janeiro", "Brazil", -22.9068, -43.1729], ["São Paulo", "Brazil", -23.5558, -46.6396], ["Buenos Aires", "Argentina", -34.6037, -58.3816],
  ["Beijing", "China", 39.9042, 116.4074], ["Shanghai", "China", 31.2304, 121.4737], ["Tokyo", "Japan", 35.6762, 139.6503], ["Seoul", "South Korea", 37.5665, 126.978], ["Pyongyang", "North Korea", 39.0392, 125.7625], ["Taipei", "Taiwan", 25.033, 121.5654], ["Bangkok", "Thailand", 13.7563, 100.5018], ["Singapore", "Singapore", 1.3521, 103.8198], ["Dubai", "United Arab Emirates", 25.2048, 55.2708], ["Riyadh", "Saudi Arabia", 24.7136, 46.6753], ["Istanbul", "Turkey", 41.0082, 28.9784], ["Cairo", "Egypt", 30.0444, 31.2357], ["Delhi", "India", 28.6139, 77.209], ["Mumbai", "India", 19.076, 72.8777], ["Karachi", "Pakistan", 24.8607, 67.0011], ["Islamabad", "Pakistan", 33.6844, 73.0479], ["Sydney", "Australia", -33.8688, 151.2093], ["Melbourne", "Australia", -37.8136, 144.9631]
];

const EVENT_WORDS = {
  war: ["war", "missile", "drone", "frontline", "battle", "invasion", "shelling", "airstrike", "troops", "military", "army", "strike", "ceasefire"],
  terror: ["terror", "terrorist", "bomb", "explosion", "attack", "gunmen", "hostage", "ied", "suicide bomber", "knife attack"],
  crisis: ["earthquake", "flood", "storm", "wildfire", "cyclone", "hurricane", "tornado", "landslide", "volcano", "drought", "evacuation", "humanitarian", "famine", "cholera"],
  politics: ["election", "coup", "parliament", "president", "minister", "protest", "riot", "sanction", "embassy", "government", "referendum", "tariff"],
  shipping: ["port", "shipping", "container", "suez", "hormuz", "malacca", "freight", "vessel", "tanker", "red sea", "canal"],
  energy: ["oil", "gas", "lng", "pipeline", "refinery", "opec", "energy", "nuclear plant", "power grid"],
  commodity: ["gold", "silver", "copper", "grain", "wheat", "corn", "soy", "commodity", "fertilizer", "uranium"],
  finance: ["stock", "bond", "currency", "rate", "inflation", "central bank", "market", "fed", "ecb"]
};

function now(){ return Date.now(); }
function clamp(v, lo, hi){ const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; }
function id(s){ return Buffer.from(String(s || Math.random()).slice(0,900)).toString("base64url").slice(0,38); }
function strip(s){ return String(s || "").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(); }
function isEnglish(s){ const t=String(s||""); if(!t) return false; return !/[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/.test(t) && ((t.match(/[^\x00-\x7F]/g)||[]).length / Math.max(1,t.length)) < 0.1; }
function cacheGet(k){ const x=CACHE.local.get(k); if(!x) return null; if(x.expires<now()){ CACHE.local.delete(k); return null; } return x.value; }
function cacheSet(k,v,ttl){ CACHE.local.set(k,{value:v,expires:now()+ttl}); return v; }
function setSource(id, ok, detail, count){ CACHE.sourceHealth[id] = { ok: !!ok, detail: detail || "", count: Number.isFinite(count) ? count : null, checkedAt: new Date().toISOString() }; }

async function fetchText(url, opts={}){
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), opts.timeout || 12000);
  try{
    const res = await fetch(url, { headers:{ ...HEADERS, ...(opts.headers||{}) }, signal: controller.signal });
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  } finally { clearTimeout(timer); }
}
async function fetchJson(url, opts={}){ return JSON.parse(await fetchText(url, opts)); }

function normalCountry(country){
  const s = String(country || "").trim();
  if(!s) return "";
  if(/united states|usa|u\.s\./i.test(s)) return "United States";
  if(/united kingdom|britain|england|scotland|wales|northern ireland/i.test(s)) return "United Kingdom";
  if(/russian federation/i.test(s)) return "Russia";
  if(/korea, republic/i.test(s)) return "South Korea";
  if(/iran/i.test(s)) return "Iran";
  return s;
}
function iso2(country){
  const c = normalCountry(country).toLowerCase();
  if(COUNTRY_ALIAS[c]) return COUNTRY_ALIAS[c];
  for(const v of Object.values(countryCodes || {})){
    if(!v) continue;
    if(String(v.englishName||"").toLowerCase() === c || String(v.officialName||"").toLowerCase() === c) return v.iso2;
  }
  return null;
}
function centreFor(country){ const code = iso2(country); return code && COUNTRY_CENTRES[code] ? COUNTRY_CENTRES[code] : null; }
function classify(text){
  const s=String(text||"").toLowerCase();
  for(const [kind, words] of Object.entries(EVENT_WORDS)){ if(words.some(w=>s.includes(w))) return kind; }
  return "risk";
}
function geocodeText(title, sourceCountry){
  const text=String(title||"").toLowerCase();
  for(const [city,country,lat,lng] of CITY_POINTS){ if(text.includes(city.toLowerCase())) return { lat, lng, place: city, country }; }
  const c = normalCountry(sourceCountry || "");
  const ctr = centreFor(c);
  if(ctr) return { lat: ctr[0], lng: ctr[1], place: c, country: c };
  return { lat: 20, lng: 12, place: c || "global", country: c };
}
function averageLonLat(coords){
  const pts=(coords||[]).filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]))).map(p=>({lng:Number(p[0]),lat:Number(p[1])}));
  if(!pts.length) return null;
  return { lng: pts.reduce((a,p)=>a+p.lng,0)/pts.length, lat: pts.reduce((a,p)=>a+p.lat,0)/pts.length };
}
function centroid(geometry){
  if(!geometry) return null;
  if(geometry.type === "Point" && Array.isArray(geometry.coordinates)) return { lng:Number(geometry.coordinates[0]), lat:Number(geometry.coordinates[1]) };
  if(geometry.type === "Polygon") return averageLonLat((geometry.coordinates||[])[0] || []);
  if(geometry.type === "MultiPolygon") return averageLonLat((((geometry.coordinates||[])[0]||[])[0]) || []);
  return null;
}
function eonetPoint(geoms){
  const g = Array.isArray(geoms) && geoms.length ? geoms[geoms.length-1] : null;
  if(!g) return null;
  if(g.type === "Point") return { lng:Number(g.coordinates[0]), lat:Number(g.coordinates[1]) };
  if(g.type === "Polygon") return averageLonLat((g.coordinates||[])[0] || []);
  return null;
}
function distanceKm(a,b,c,d){
  if(![a,b,c,d].every(Number.isFinite)) return null;
  const R=6371, dLat=(c-a)*Math.PI/180, dLng=(d-b)*Math.PI/180;
  const x=Math.sin(dLat/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

async function scrapeGdelt(){
  const query = `(war OR missile OR drone OR terror OR earthquake OR flood OR storm OR coup OR protest OR election OR oil OR gas OR port OR shipping OR sanction OR inflation OR strike) sourcelang:English`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=140&sort=DateDesc`;
  try{
    const data=await fetchJson(url,{timeout:17000});
    const rows=Array.isArray(data.articles)?data.articles:[];
    const out=rows.map(a=>{
      const title=strip(a.title); if(!isEnglish(title)) return null;
      const country=normalCountry(a.sourceCountry || a.sourcecountry || "");
      const geo=geocodeText(`${title} ${a.domain||""}`, country);
      return { id:id(`gdelt-${a.url}-${a.seendate}`), title, summary:title, kind:classify(title), lat:geo.lat, lng:geo.lng, place:geo.place, country:geo.country||country, source:a.domain||"GDELT", url:a.url, publishedAt:a.seendate||null, sourceSystem:"GDELT" };
    }).filter(Boolean);
    setSource("gdelt", true, "loaded English filtered live articles", out.length); return out;
  }catch(e){ setSource("gdelt", false, e.message, 0); return []; }
}
async function scrapeReliefWeb(){
  const key="reliefweb"; const cached=cacheGet(key); if(cached) return cached;
  const url="https://api.reliefweb.int/v2/reports?appname=summit-money-engine&profile=list&preset=latest&limit=100&fields[include][]=title&fields[include][]=url&fields[include][]=date.created&fields[include][]=country.name&fields[include][]=source.name&fields[include][]=primary_country.name";
  try{
    const data=await fetchJson(url,{timeout:15000}); const rows=Array.isArray(data.data)?data.data:[];
    const out=rows.map(r=>{ const f=r.fields||{}; const title=strip(f.title); if(!isEnglish(title)) return null; const country=normalCountry((f.primary_country&&f.primary_country.name)||(Array.isArray(f.country)&&f.country[0]&&f.country[0].name)||""); const geo=geocodeText(title,country); return { id:id(`relief-${r.id}-${title}`), title, summary:`Humanitarian/disaster report: ${title}`, kind:"crisis", lat:geo.lat, lng:geo.lng, place:geo.place, country:geo.country||country, source:(Array.isArray(f.source)&&f.source[0]&&f.source[0].name)||"ReliefWeb", url:f.url||"", publishedAt:(f.date&&f.date.created)||null, sourceSystem:"ReliefWeb" }; }).filter(Boolean);
    setSource("reliefweb", true, "loaded reports", out.length); return cacheSet(key,out,15*60*1000);
  }catch(e){ setSource("reliefweb", false, e.message, 0); return []; }
}
async function scrapeEonet(){
  const key="eonet"; const cached=cacheGet(key); if(cached) return cached;
  try{
    const data=await fetchJson("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=120",{timeout:15000}); const rows=Array.isArray(data.events)?data.events:[];
    const out=rows.map(e=>{ const p=eonetPoint(e.geometry); if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)) return null; const cat=(Array.isArray(e.categories)&&e.categories[0]&&e.categories[0].title)||"Natural event"; const title=strip(e.title||cat); return { id:id(`eonet-${e.id}-${title}`), title:`${cat}: ${title}`, summary:`NASA EONET open natural event: ${title}`, kind:"crisis", lat:p.lat, lng:p.lng, place:title, country:"", source:"NASA EONET", url:e.link||"", publishedAt:null, sourceSystem:"NASA EONET" }; }).filter(Boolean);
    setSource("eonet", true, "loaded open natural hazards", out.length); return cacheSet(key,out,20*60*1000);
  }catch(e){ setSource("eonet", false, e.message, 0); return []; }
}
async function scrapeNws(){
  const key="nws"; const cached=cacheGet(key); if(cached) return cached;
  try{
    const data=await fetchJson("https://api.weather.gov/alerts/active?status=actual&message_type=alert",{timeout:15000,headers:{Accept:"application/geo+json,application/json"}}); const rows=Array.isArray(data.features)?data.features:[];
    const out=rows.map(f=>{ const p=f.properties||{}; const c=centroid(f.geometry); if(!c||!Number.isFinite(c.lat)||!Number.isFinite(c.lng)) return null; const title=strip(`${p.event||"Weather alert"} - ${p.areaDesc||""}`); return { id:id(`nws-${p.id||title}`), title, summary:strip(p.headline||p.description||title).slice(0,420), kind:"crisis", lat:c.lat, lng:c.lng, place:p.areaDesc||"United States", country:"United States", source:"US National Weather Service", url:p.uri||"", publishedAt:p.sent||p.effective||null, severity:p.severity||"", urgency:p.urgency||"", sourceSystem:"NWS" }; }).filter(Boolean);
    setSource("nws", true, "loaded US severe weather alerts", out.length); return cacheSet(key,out,8*60*1000);
  }catch(e){ setSource("nws", false, e.message, 0); return []; }
}
async function scrapeUSGS(){
  const key="usgs"; const cached=cacheGet(key); if(cached) return cached;
  try{
    const data=await fetchJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",{timeout:13000}); const rows=Array.isArray(data.features)?data.features:[];
    const out=rows.map(f=>{ const c=(f.geometry&&f.geometry.coordinates)||[]; const p=f.properties||{}; return { id:id(`usgs-${p.url||p.code||p.time}`), title:p.title||"Earthquake", summary:`${p.mag||"N/A"} magnitude earthquake near ${p.place||"unknown"}`, kind:"crisis", magnitude:p.mag, place:p.place, lat:Number(c[1]), lng:Number(c[0]), depthKm:Number(c[2]), time:p.time?new Date(p.time).toISOString():null, url:p.url, source:"USGS", sourceSystem:"USGS" }; }).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
    setSource("usgs", true, "loaded all-day earthquake feed", out.length); return cacheSet(key,out,10*60*1000);
  }catch(e){ setSource("usgs", false, e.message, 0); return []; }
}
async function scrapeGDACS(){
  const key="gdacs"; const cached=cacheGet(key); if(cached) return cached;
  try{
    const xml=await fetchText("https://www.gdacs.org/xml/rss.xml",{timeout:13000}); const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>m[1]);
    const out=items.map(item=>{ const title=strip(((item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)||item.match(/<title>([\s\S]*?)<\/title>/)||[])[1])||""); const link=strip((item.match(/<link>([\s\S]*?)<\/link>/)||[])[1]||""); const desc=strip(((item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)||item.match(/<description>([\s\S]*?)<\/description>/)||[])[1])||""); const point=item.match(/<georss:point>([-\d.]+)\s+([-\d.]+)<\/georss:point>/); return { id:id(`gdacs-${title}-${link}`), title, summary:desc, kind:"crisis", url:link, lat:point?Number(point[1]):null, lng:point?Number(point[2]):null, place:title, country:"", source:"GDACS", sourceSystem:"GDACS" }; }).filter(x=>x.title);
    setSource("gdacs", true, "loaded disaster RSS", out.length); return cacheSet(key,out,15*60*1000);
  }catch(e){ setSource("gdacs", false, e.message, 0); return []; }
}
async function scrapeBinance(){
  const symbols=["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","BNBUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","DOTUSDT","LTCUSDT","TRXUSDT"];
  const url=`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  try{
    const rows=await fetchJson(url,{timeout:10000}); const out=(Array.isArray(rows)?rows:[]).map(r=>({ id:String(r.symbol||"").replace("USDT",""), symbol:r.symbol, name:String(r.symbol||"").replace("USDT",""), assetClass:"crypto", price:Number(r.lastPrice), changePct:Number(r.priceChangePercent), volume:Number(r.quoteVolume), source:"Binance", url:`https://www.binance.com/en/trade/${String(r.symbol||"").replace("USDT","_USDT")}` })).filter(x=>x.id&&Number.isFinite(x.price));
    setSource("binance", true, "loaded crypto 24h tickers", out.length); return out;
  }catch(e){ setSource("binance", false, e.message, 0); return []; }
}
async function scrapeCoinGecko(){
  const ids="bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,avalanche-2,chainlink,polkadot,litecoin,tron";
  const map={ bitcoin:["BTC","Bitcoin"], ethereum:["ETH","Ethereum"], solana:["SOL","Solana"], ripple:["XRP","XRP"], binancecoin:["BNB","BNB"], cardano:["ADA","Cardano"], dogecoin:["DOGE","Dogecoin"], "avalanche-2":["AVAX","Avalanche"], chainlink:["LINK","Chainlink"], polkadot:["DOT","Polkadot"], litecoin:["LTC","Litecoin"], tron:["TRX","TRON"] };
  try{
    const data=await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,{timeout:10000});
    const out=Object.entries(map).map(([key,[sym,name]])=>{ const r=data[key]||{}; return { id:sym, symbol:sym, name, assetClass:"crypto", price:Number(r.usd), changePct:Number(r.usd_24h_change), volume:Number(r.usd_24h_vol), source:"CoinGecko", url:`https://www.coingecko.com/en/coins/${key}` }; }).filter(x=>Number.isFinite(x.price));
    setSource("coingecko", true, "loaded crypto fallback", out.length); return out;
  }catch(e){ setSource("coingecko", false, e.message, 0); return []; }
}
async function yahoo(symbol,idv,name,assetClass="commodity"){
  try{
    const d=await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`,{timeout:10000});
    const result=d.chart&&d.chart.result&&d.chart.result[0]; const meta=result&&result.meta; const closes=result&&result.indicators&&result.indicators.quote&&result.indicators.quote[0]&&result.indicators.quote[0].close ? result.indicators.quote[0].close.filter(x=>Number.isFinite(Number(x))) : [];
    const price=Number(meta&&meta.regularMarketPrice)||closes[closes.length-1]||null; const first=closes[0]||Number(meta&&meta.previousClose)||null; const changePct=price&&first?((price-first)/first)*100:null;
    return { id:idv, symbol, name, assetClass, price, changePct, source:"Yahoo Finance chart", url:`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}` };
  }catch(e){ return { id:idv, symbol, name, assetClass, price:null, changePct:null, source:"Yahoo failed" }; }
}
async function scrapeYahooMarkets(){
  const out=await Promise.all([
    yahoo("GC=F","GOLD","Gold futures"), yahoo("SI=F","SILVER","Silver futures"), yahoo("HG=F","COPPER","Copper futures"), yahoo("CL=F","WTI","WTI crude oil"), yahoo("BZ=F","BRENT","Brent crude oil"), yahoo("NG=F","GAS","Natural gas"), yahoo("ZW=F","WHEAT","Wheat futures"), yahoo("ZC=F","CORN","Corn futures"), yahoo("ZS=F","SOY","Soybean futures"), yahoo("^GSPC","S&P500","S&P 500","index"), yahoo("^FTSE","FTSE","FTSE 100","index"), yahoo("DX-Y.NYB","DXY","US Dollar Index","fx")
  ]);
  const usable=out.filter(x=>Number.isFinite(Number(x.price))); setSource("yahoo", usable.length>0, usable.length?"loaded market charts":"no chart rows", usable.length); return out;
}
async function scrapeEcb(){
  const key="ecb"; const cached=cacheGet(key); if(cached) return cached;
  try{
    const xml=await fetchText("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",{timeout:10000}); const rows=[...xml.matchAll(/currency='([A-Z]{3})'\s+rate='([\d.]+)'/g)].map(m=>({currency:m[1],ratePerEuro:Number(m[2])}));
    const gbp=rows.find(r=>r.currency==="GBP"), usd=rows.find(r=>r.currency==="USD"); const out={source:"ECB", rates:rows, EURGBP:gbp?gbp.ratePerEuro:null, EURUSD:usd?usd.ratePerEuro:null, GBPUSD:gbp&&usd?usd.ratePerEuro/gbp.ratePerEuro:null};
    setSource("ecb", true, "loaded FX rates", rows.length); return cacheSet(key,out,TTL.fx);
  }catch(e){ setSource("ecb", false, e.message, 0); return {source:"ECB failed",rates:[]}; }
}
async function scrapeStooq(){
  const symbols = { spx:"S&P500", ndq:"NASDAQ", uk100:"UK100", xauusd:"Gold spot", xagusd:"Silver spot", brent:"Brent", crude_oil:"WTI" };
  const out=[];
  for(const [sym,name] of Object.entries(symbols)){
    try{
      const txt=await fetchText(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`,{timeout:7000});
      const lines=txt.trim().split(/\r?\n/); const vals=(lines[1]||"").split(","); const close=Number(vals[6]); if(Number.isFinite(close)) out.push({id:name.toUpperCase().replace(/\W+/g,"_"), symbol:sym, name, assetClass:"market", price:close, changePct:null, source:"Stooq CSV", url:`https://stooq.com/q/?s=${sym}`});
    }catch(e){}
  }
  setSource("stooq", out.length>0, out.length?"loaded CSV fallback":"no rows", out.length); return out;
}
async function wb(iso, indicator){
  if(!iso) return null; const key=`wb:${iso}:${indicator}`; const cached=cacheGet(key); if(cached) return cached;
  try{
    const data=await fetchJson(`https://api.worldbank.org/v2/country/${encodeURIComponent(iso)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=10`,{timeout:10000}); const rows=Array.isArray(data)&&Array.isArray(data[1])?data[1]:[]; const row=rows.find(r=>r.value!==null&&r.value!==undefined); const out=row?{value:Number(row.value),year:row.date,indicator,source:"World Bank"}:{value:null,year:null,indicator,source:"World Bank"}; setSource("worldBank", true, "indicator lookup complete", null); return cacheSet(key,out,TTL.worldBank);
  }catch(e){ setSource("worldBank", false, e.message, null); return {value:null,year:null,indicator,source:"World Bank failed"}; }
}
function previousPoliceMonth(){ const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
async function ukCrime(lat,lng){
  const date=previousPoliceMonth();
  try{
    const rows=await fetchJson(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${date}`,{timeout:12000}); const list=Array.isArray(rows)?rows:[]; const categories={}; const outcomes={};
    for(const r of list){ categories[r.category||"unknown"]=(categories[r.category||"unknown"]||0)+1; if(r.outcome_status&&r.outcome_status.category) outcomes[r.outcome_status.category]=(outcomes[r.outcome_status.category]||0)+1; }
    setSource("ukPolice", true, "loaded UK local crime", list.length); return {available:true,total:list.length,date,categories,outcomes,source:"data.police.uk"};
  }catch(e){ setSource("ukPolice", false, e.message, null); return {available:false,total:null,date,categories:{},outcomes:{},source:"data.police.uk unavailable"}; }
}
async function reverseGeocode(lat,lng){
  const key=`rev:${Number(lat).toFixed(5)}:${Number(lng).toFixed(5)}`; const cached=cacheGet(key); if(cached) return cached;
  try{
    const d=await fetchJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18&accept-language=en`,{timeout:10000}); const a=d.address||{}; const out={displayName:d.display_name||"", city:a.city||a.town||a.village||a.hamlet||a.suburb||a.neighbourhood||"", country:normalCountry(a.country||""), countryCode:a.country_code?String(a.country_code).toUpperCase():null, raw:a, source:"Nominatim"}; setSource("nominatim", true, "reverse geocode ok", null); return cacheSet(key,out,TTL.point);
  }catch(e){ setSource("nominatim", false, e.message, null); return {displayName:"",city:"",country:"",countryCode:null,raw:{},source:"reverse failed"}; }
}
async function weather(lat,lng){
  const key=`weather:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}`; const cached=cacheGet(key); if(cached) return cached;
  try{
    const d=await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation,wind_gusts_10m,weather_code&forecast_days=1&timezone=auto`,{timeout:9000}); const c=d.current||{}; const out={current:{temperatureC:c.temperature_2m??null,rainMm:c.precipitation??null,windKmh:c.wind_speed_10m??null,gustKmh:c.wind_gusts_10m??null,code:c.weather_code??null},source:"Open-Meteo"}; setSource("openMeteo", true, "weather point ok", null); return cacheSet(key,out,10*60*1000);
  }catch(e){ setSource("openMeteo", false, e.message, null); return {current:null,source:"Open-Meteo failed"}; }
}
async function airQuality(lat,lng){
  const key=`air:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}`; const cached=cacheGet(key); if(cached) return cached;
  try{
    const d=await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone&timezone=auto`,{timeout:9000}); const out={current:d.current||null,source:"Open-Meteo Air Quality"}; return cacheSet(key,out,10*60*1000);
  }catch(e){ return {current:null,source:"Open-Meteo air quality failed"}; }
}
async function wikiPlace(name){
  const clean=strip(String(name||"").split(",").slice(0,2).join(", ")); if(!clean) return {found:false}; const key=`wiki:${clean.toLowerCase()}`; const cached=cacheGet(key); if(cached) return cached;
  try{
    const s=await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(clean)}&format=json&origin=*&srlimit=1`,{timeout:10000}); const first=s.query&&s.query.search&&s.query.search[0]; if(!first) return cacheSet(key,{found:false},TTL.wiki);
    const title=first.title; const d=await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`,{timeout:10000}); const out={found:true,title:d.title||title,extract:d.extract||"",thumbnail:(d.thumbnail&&d.thumbnail.source)||(d.originalimage&&d.originalimage.source)||null,url:(d.content_urls&&d.content_urls.desktop&&d.content_urls.desktop.page)||`https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g,"_"))}`,source:"Wikipedia"}; setSource("wikipedia", true, "wiki lookup ok", null); return cacheSet(key,out,TTL.wiki);
  }catch(e){ setSource("wikipedia", false, e.message, null); return cacheSet(key,{found:false},30*60*1000); }
}
async function localPlaces(south,west,north,east,zoom){
  if(![south,west,north,east].every(Number.isFinite)) return {places:[]}; const z=Number(zoom)||8; const key=`over:${south.toFixed(2)}:${west.toFixed(2)}:${north.toFixed(2)}:${east.toFixed(2)}:${Math.floor(z)}`; const cached=cacheGet(key); if(cached) return cached;
  const q=`[out:json][timeout:14];(node["place"~"city|town|village|suburb|hamlet|neighbourhood"](${south},${west},${north},${east});node["amenity"~"hospital|police|fire_station|embassy"](${south},${west},${north},${east});node["emergency"](${south},${west},${north},${east});node["public_transport"="station"](${south},${west},${north},${east});node["aeroway"="aerodrome"](${south},${west},${north},${east});node["harbour"](${south},${west},${north},${east}););out center 260;`;
  try{
    const d=await fetchJson(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`,{timeout:18000}); const places=(d.elements||[]).map(el=>({id:el.id,name:(el.tags&&(el.tags["name:en"]||el.tags.name))||"Unnamed place",lat:el.lat,lng:el.lon,kind:(el.tags&&(el.tags.place||el.tags.amenity||el.tags.emergency||el.tags.aeroway||el.tags.public_transport||"place"))||"place",tags:el.tags||{},source:"OpenStreetMap/Overpass"})).filter(p=>p.name&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)); setSource("overpass", true, "loaded local infrastructure", places.length); return cacheSet(key,{places},TTL.places);
  }catch(e){ setSource("overpass", false, e.message, 0); return {places:[]}; }
}

function crimeScore(localCrime,homicide){
  if(localCrime&&localCrime.available&&Number.isFinite(localCrime.total)){ const total=localCrime.total; const score=clamp(100-total*2.2,5,95); return {score,status: total<=10?"Lower local police count":total<=30?"Moderate local police count":"Higher local police count",reason:`${total} official local records near clicked point`}; }
  if(homicide&&Number.isFinite(homicide.value)){ const rate=Number(homicide.value); return {score:clamp(100-rate*7.5,5,92),status:"National crime indicator",reason:`${rate.toFixed(1)} homicide rate per 100k`}; }
  return {score:null,status:"No crime source",reason:"No official local or national crime indicator loaded"};
}
function eventHits(events,country,kind){ const c=String(country||"").toLowerCase(); if(!c) return 0; return events.filter(e=>(!kind||e.kind===kind)&&String(e.country||"").toLowerCase().includes(c)).length; }
function riskScores({localCrime,homicide,events,country,weatherData,air,politics}){
  const crime=crimeScore(localCrime,homicide); const war=eventHits(events,country,"war"), terror=eventHits(events,country,"terror"), pol=eventHits(events,country,"politics"), crisis=eventHits(events,country,"crisis");
  const warValue=clamp(war*22,0,100), terrorValue=clamp(terror*25,0,100), polValue=clamp(pol*18,0,100), crisisValue=clamp(crisis*16,0,100);
  const gust=(weatherData&&weatherData.current&&Number(weatherData.current.gustKmh))||0; const rain=(weatherData&&weatherData.current&&Number(weatherData.current.rainMm))||0; const weatherValue=clamp((gust>70?30:0)+(rain>15?25:0),0,100)||0;
  const aqi=(air&&air.current&&Number(air.current.us_aqi || air.current.european_aqi))||null; const airPenalty=aqi?clamp(aqi/4,0,30):0;
  let governancePenalty=0; const ps=politics&&politics.politicalStability; if(ps&&Number.isFinite(Number(ps.value))) governancePenalty=clamp((0-Number(ps.value))*10,0,28)||0;
  const safety=clamp((crime.score===null?62:crime.score)-warValue*.35-terrorValue*.25-polValue*.13-crisisValue*.15-weatherValue*.08-airPenalty*.05-governancePenalty,2,98);
  return { safety:{score:safety,status:safety>=75?"Lower current risk":safety>=55?"Mixed":safety>=35?"Elevated risk":"High risk",reason:"crime + conflict + terror + politics + crisis + weather + governance"}, crime, war:{value:warValue,status:war?`${war} live hits`:"No live hits",reason:"live event terms"}, terror:{value:terrorValue,status:terror?`${terror} live hits`:"No live hits",reason:"live terror terms"}, politics:{value:Math.max(polValue,governancePenalty),status:pol?`${pol} live hits`:governancePenalty?"Governance risk":"No live hits",reason:"live politics + governance indicators"}, crisis:{value:Math.max(crisisValue,weatherValue),status:crisis?`${crisis} live hits`:weatherValue?"Weather risk":"No live hits",reason:"disaster/weather/natural hazard sources"}, air:{value:aqi,status:aqi?`AQI ${Math.round(aqi)}`:"No AQI",reason:"Open-Meteo air quality"} };
}
function relatedEvents(asset,events){ const idv=String(asset.id||asset.name||"").toLowerCase(); let words=[idv]; if(/gold|silver|copper|oil|brent|wti|gas|wheat|corn|soy/.test(idv)) words.push("war","shipping","energy","oil","gas","suez","hormuz","storm","drought","commodity"); if(/btc|eth|sol|xrp|bnb|ada|doge|avax|link|dot|ltc|trx/.test(idv)) words.push("crypto","inflation","fed","risk","market","election","sanction"); return events.filter(e=>{ const t=`${e.title||""} ${e.summary||""} ${e.kind||""}`.toLowerCase(); return words.some(w=>t.includes(w)); }).length; }
function actionFor(move,score){ if(score>=70&&move>0) return "Strong watch: rising now. Do not chase without chart confirmation."; if(score>=70&&move<0) return "Strong downside watch: falling now. Avoid unless reversal confirms."; if(score>=45&&move>0) return "Moderate upward setup. Needs confirmation."; if(score>=45&&move<0) return "Moderate downside setup. Wait for stabilisation."; return "Weak / unclear. Usually ignore."; }
function buildRapid(markets,events){ return markets.filter(m=>Number.isFinite(Number(m.changePct))).map(m=>{ const move=Number(m.changePct); const rel=relatedEvents(m,events); const score=clamp(Math.abs(move)*12+rel*10+(Number(m.volume)>100000000?8:0),0,100); return {id:m.id,asset:m.name||m.id,price:m.price,direction:move>0?"up":move<0?"down":"flat",move:`${move.toFixed(2)}% 24h`,rating:score,action:actionFor(move,score),source:m.source,reasons:[`${move.toFixed(2)}% 24h move`,rel?`${rel} related live signals`:"no related event spike",m.source||"market feed"]}; }).filter(r=>Math.abs(parseFloat(r.move))>=0.25||r.rating>=15).sort((a,b)=>b.rating-a.rating).slice(0,35); }
function buildPredictions(markets,events){ return markets.filter(m=>Number.isFinite(Number(m.changePct))).map(m=>{ const move=Number(m.changePct); const rel=relatedEvents(m,events); const rating=clamp(Math.abs(move)*9+rel*13,0,100); return {id:m.id,asset:m.name||m.id,direction:move>1?"up momentum":move<-1?"down momentum":"mixed / flat",rating,probability:clamp(50+(move>0?1:-1)*Math.min(18,Math.abs(move)*3)+Math.min(12,rel*2),5,95),action:actionFor(move,rating),reasons:[`${move.toFixed(2)}% 24h move`,rel?`${rel} related live signals`:"no strong related live event","score is setup strength, not guaranteed profit"]}; }).sort((a,b)=>b.rating-a.rating).slice(0,30); }
function buildBrief(events,markets,rapid){
  const important=events.filter(e=>["war","terror","crisis","shipping","energy","politics"].includes(e.kind)).slice(0,18);
  const movers=rapid.slice(0,8);
  return { headline: important[0] ? important[0].title : "No major live signal loaded yet", sections:[ {title:"Top live risks",items:important.slice(0,7).map(e=>({label:e.kind,text:e.title,place:e.place||e.country,source:e.source,url:e.url}))}, {title:"Markets moving now",items:movers.map(m=>({label:m.asset,text:`${m.move} | ${m.action}`,source:m.source}))}, {title:"How to use",items:[{label:"Step 1",text:"Click a risk dot or country colour."},{label:"Step 2",text:"Check source and nearby signals."},{label:"Step 3",text:"Compare against Rapid Movers and commodities/crypto."},{label:"Rule",text:"No trade is automatic. Treat scores as triage, not commands."}]} ]};
}
function buildCountryRisk(events){
  const map=new Map();
  for(const e of events){ const country=normalCountry(e.country||""); if(!country) continue; const k=country.toLowerCase(); if(!map.has(k)) map.set(k,{country,war:0,terror:0,crisis:0,politics:0,shipping:0,energy:0,commodity:0,finance:0,risk:0}); const r=map.get(k); r[e.kind]=(r[e.kind]||0)+1; r.risk += e.kind==="war"?28:e.kind==="terror"?25:e.kind==="crisis"?17:e.kind==="politics"?13:e.kind==="shipping"?10:e.kind==="energy"?9:e.kind==="commodity"?8:7; }
  return [...map.values()].map(r=>({...r,risk:clamp(r.risk,0,100),colour:r.risk>=55?"#ff174f":r.risk>=30?"#ff8c00":"#00a66a"}));
}
function dedupe(events){ const seen=new Set(), out=[]; for(const e of events){ const k=id(`${e.title}-${e.lat}-${e.lng}-${e.sourceSystem}`); if(seen.has(k)) continue; seen.add(k); out.push(e); } return out; }

async function buildState(force=false){
  if(!force && CACHE.state && now()-CACHE.updatedAt<TTL.state) return CACHE.state;
  const [gdelt, relief, eonet, nws, usgs, gdacs, binance, cg, yahooRows, stooq, fx] = await Promise.all([ scrapeGdelt(), scrapeReliefWeb(), scrapeEonet(), scrapeNws(), scrapeUSGS(), scrapeGDACS(), scrapeBinance(), scrapeCoinGecko(), scrapeYahooMarkets(), scrapeStooq(), scrapeEcb() ]);
  const events=dedupe([...gdelt,...relief,...eonet,...nws,...usgs,...gdacs]).filter(e=>Number.isFinite(Number(e.lat))&&Number.isFinite(Number(e.lng))).slice(0,700);
  const cryptoMap=new Map(); for(const item of [...cg,...binance]){ if(!item||!item.id) continue; const old=cryptoMap.get(item.id); if(!old || old.price==null) cryptoMap.set(item.id,item); }
  const marketMap=new Map(); for(const item of [...cryptoMap.values(),...yahooRows,...stooq]){ if(!item||!item.id) continue; const key=item.id; const old=marketMap.get(key); if(!old || old.price==null) marketMap.set(key,item); }
  const markets=[...marketMap.values()].filter(m=>m.price!==null&&m.price!==undefined&&Number.isFinite(Number(m.price)));
  const rapid=buildRapid(markets,events); const predictions=buildPredictions(markets,events); const countryRisk=buildCountryRisk(events); const brief=buildBrief(events,markets,rapid);
  CACHE.state={ version:APP_VERSION, startedAt:STARTED_AT, lastRefresh:new Date().toISOString(), events, markets, rapid, predictions, countryRisk, brief, fx, sourceHealth:CACHE.sourceHealth, sources:SOURCE_META };
  CACHE.mapData={ nodes:events.slice(0,260), cityNodes:CITY_POINTS.map(([name,country,lat,lng])=>({id:id(`${name}-${country}`),name,country,lat,lng,kind:"city",source:"city seed + OSM click lookup"})), routes:[], countryRisk };
  CACHE.updatedAt=now(); return CACHE.state;
}

router.get("/state", async (req,res)=>{ try{ res.json(await buildState(false)); }catch(e){ res.status(500).json({error:e.message}); } });
router.post("/refresh", async (req,res)=>{ try{ const state=await buildState(true); for(const c of CACHE.sseClients){ try{ c.write(`data: ${JSON.stringify({type:"state",state})}\n\n`); }catch{} } res.json({ok:true,lastRefresh:state.lastRefresh}); }catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get("/map-data", async (req,res)=>{ try{ await buildState(false); res.json(CACHE.mapData); }catch(e){ res.status(500).json({error:e.message,nodes:[],cityNodes:[],routes:[],countryRisk:[]}); } });
router.get("/stream", async (req,res)=>{ res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform",Connection:"keep-alive","X-Accel-Buffering":"no"}); CACHE.sseClients.add(res); try{ const state=await buildState(false); res.write(`data: ${JSON.stringify({type:"state",state})}\n\n`); }catch{} const keep=setInterval(()=>{ try{res.write(": ping\n\n");}catch{} },25000); req.on("close",()=>{clearInterval(keep); CACHE.sseClients.delete(res);}); });
router.get("/live-brief", async (req,res)=>{ const state=await buildState(false); res.json(state.brief); });
router.get("/sources", (req,res)=>res.json({sources:SOURCE_META, health:CACHE.sourceHealth}));
router.get("/global-weather/earthquakes", async (req,res)=>res.json({earthquakes:await scrapeUSGS(),source:"USGS"}));
router.get("/global-weather/disasters", async (req,res)=>{ const [a,b,c,d]=await Promise.all([scrapeGDACS(),scrapeEonet(),scrapeReliefWeb(),scrapeNws()]); res.json({disasters:[...a,...b,...c,...d],source:"GDACS + NASA EONET + ReliefWeb + NWS"}); });
router.get("/wiki/place", async (req,res)=>res.json(await wikiPlace(req.query.name)));
router.get("/search", async (req,res)=>{ const q=String(req.query.q||"").trim(); if(!q) return res.json({places:[]}); try{ const rows=await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=10&addressdetails=1&accept-language=en`,{timeout:10000}); res.json({places:(rows||[]).map(r=>({name:r.name||r.display_name,displayName:r.display_name,lat:Number(r.lat),lng:Number(r.lon),source:"Nominatim",raw:r})).filter(r=>Number.isFinite(r.lat)&&Number.isFinite(r.lng))}); }catch(e){ res.json({places:[]}); } });
router.get("/local-places", async (req,res)=>res.json(await localPlaces(Number(req.query.south),Number(req.query.west),Number(req.query.north),Number(req.query.east),Number(req.query.zoom))));
router.get("/global-risk/point", async (req,res)=>{
  const lat=Number(req.query.lat), lng=Number(req.query.lng); if(!Number.isFinite(lat)||!Number.isFinite(lng)) return res.status(400).json({error:"lat/lng required"}); const key=`point:${lat.toFixed(4)}:${lng.toFixed(4)}`; const cached=cacheGet(key); if(cached) return res.json(cached);
  try{ const state=await buildState(false); const place=await reverseGeocode(lat,lng); const code=place.countryCode||iso2(place.country); const country=place.country||""; const [homicide,gdp,growth,inflation,ruleLaw,politicalStability,govEffect,corruption,weatherData,air,localCrime] = await Promise.all([ wb(code,"VC.IHR.PSRC.P5"), wb(code,"NY.GDP.PCAP.CD"), wb(code,"NY.GDP.MKTP.KD.ZG"), wb(code,"FP.CPI.TOTL.ZG"), wb(code,"RL.EST"), wb(code,"PV.EST"), wb(code,"GE.EST"), wb(code,"CC.EST"), weather(lat,lng), airQuality(lat,lng), code==="GB"?ukCrime(lat,lng):Promise.resolve({available:false,total:null,categories:{},outcomes:{},source:"No official local crime feed connected for this country"}) ]);
    const politics={ruleLaw,politicalStability,governmentEffectiveness:govEffect,corruptionControl:corruption}; const scores=riskScores({localCrime,homicide,events:state.events,country,weatherData,air,politics}); const eventsNear=state.events.map(e=>({...e,distance:distanceKm(lat,lng,Number(e.lat),Number(e.lng))})).filter(e=>Number.isFinite(e.distance)&&e.distance<=700).sort((a,b)=>a.distance-b.distance).slice(0,18); const out={place,countryCode:code,countryName:country,scores,localCrime,national:{homicide,gdp,growth,inflation},politics,weather:weatherData,airQuality:air,eventsNear,sourceNote:"Town-level crime changes only where official local feeds exist. UK uses data.police.uk. Elsewhere this uses national indicators, governance, weather, air-quality and live event pressure."}; res.json(cacheSet(key,out,TTL.point)); }catch(e){ res.status(500).json({error:e.message}); }
});
router.get("/boundaries/admin0", async (req,res)=>{ if(CACHE.boundaries&&CACHE.boundaries.expires>now()) return res.json(CACHE.boundaries.value); try{ const data=await fetchJson("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",{timeout:20000}); CACHE.boundaries={value:data,expires:now()+TTL.boundary}; res.json(data); }catch(e){ res.json({type:"FeatureCollection",features:[],error:e.message}); } });

module.exports = router;
