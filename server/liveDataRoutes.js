const express = require("express");

const router = express.Router();

const CACHE = {
  state: null,
  mapData: null,
  boundaries: null,
  earthquakes: null,
  disasters: null,
  reliefWeb: null,
  eonet: null,
  nws: null,
  ecb: null,
  sseClients: new Set(),
  short: new Map(),
  updatedAt: 0
};

const TTL = {
  state: 5 * 60 * 1000,
  point: 8 * 60 * 1000,
  wiki: 24 * 60 * 60 * 1000,
  boundaries: 7 * 24 * 60 * 60 * 1000,
  ecb: 6 * 60 * 60 * 1000
};

const HEADERS = {
  "User-Agent": "SummitMoneyEngine/1.0",
  Accept: "application/json,text/plain,*/*"
};

const COUNTRY_ISO2 = {
  "united kingdom": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  ireland: "IE",
  france: "FR",
  germany: "DE",
  spain: "ES",
  portugal: "PT",
  italy: "IT",
  netherlands: "NL",
  belgium: "BE",
  poland: "PL",
  ukraine: "UA",
  russia: "RU",
  "united states": "US",
  usa: "US",
  canada: "CA",
  mexico: "MX",
  brazil: "BR",
  argentina: "AR",
  china: "CN",
  japan: "JP",
  "south korea": "KR",
  "north korea": "KP",
  india: "IN",
  pakistan: "PK",
  iran: "IR",
  iraq: "IQ",
  syria: "SY",
  israel: "IL",
  palestine: "PS",
  lebanon: "LB",
  yemen: "YE",
  "saudi arabia": "SA",
  "united arab emirates": "AE",
  turkey: "TR",
  egypt: "EG",
  sudan: "SD",
  somalia: "SO",
  mali: "ML",
  "burkina faso": "BF",
  niger: "NE",
  nigeria: "NG",
  "south africa": "ZA",
  australia: "AU",
  "new zealand": "NZ",
  indonesia: "ID",
  philippines: "PH",
  thailand: "TH",
  vietnam: "VN",
  taiwan: "TW"
};

const COUNTRY_CENTRES = {
  GB: [54.5, -2.5],
  IE: [53.2, -7.7],
  US: [39, -98],
  CA: [56.1, -106.3],
  MX: [23.6, -102.5],
  FR: [46.2, 2.2],
  DE: [51.1, 10.4],
  ES: [40.4, -3.7],
  PT: [39.4, -8.2],
  IT: [42.8, 12.5],
  NL: [52.1, 5.3],
  BE: [50.7, 4.6],
  PL: [52.1, 19.3],
  RU: [61.5, 90],
  UA: [49, 31],
  SY: [35, 38],
  IR: [32, 53],
  IQ: [33, 44],
  IL: [31.5, 35],
  PS: [31.9, 35.2],
  LB: [33.9, 35.8],
  YE: [15.5, 47.5],
  SD: [15.6, 30.5],
  SO: [5.1, 46.2],
  ML: [17.5, -3.9],
  BF: [12.2, -1.6],
  NE: [17.6, 8.1],
  NG: [9.1, 8.7],
  CN: [35.8, 104],
  JP: [36.2, 138.2],
  KR: [36.2, 127.8],
  KP: [40, 127],
  IN: [22.9, 79],
  PK: [30.3, 69.3],
  TR: [39, 35],
  EG: [26.8, 30.8],
  BR: [-10.8, -52.9],
  AR: [-34, -64],
  AU: [-25.3, 133.8],
  NZ: [-41, 174],
  ID: [-2.5, 118],
  PH: [12.8, 122.7],
  TH: [15.8, 101],
  VN: [16.1, 108],
  TW: [23.7, 121]
};

const CITY_POINTS = [
  ["London", "United Kingdom", 51.5072, -0.1276],
  ["Camden Town", "United Kingdom", 51.539, -0.143],
  ["Manchester", "United Kingdom", 53.4808, -2.2426],
  ["Birmingham", "United Kingdom", 52.4862, -1.8904],
  ["Liverpool", "United Kingdom", 53.4084, -2.9916],
  ["Bristol", "United Kingdom", 51.4545, -2.5879],
  ["Cardiff", "United Kingdom", 51.4816, -3.1791],
  ["Glasgow", "United Kingdom", 55.8642, -4.2518],
  ["Edinburgh", "United Kingdom", 55.9533, -3.1883],
  ["Dublin", "Ireland", 53.3498, -6.2603],
  ["Paris", "France", 48.8566, 2.3522],
  ["Berlin", "Germany", 52.52, 13.405],
  ["Madrid", "Spain", 40.4168, -3.7038],
  ["Lisbon", "Portugal", 38.7223, -9.1393],
  ["Rome", "Italy", 41.9028, 12.4964],
  ["Amsterdam", "Netherlands", 52.3676, 4.9041],
  ["Brussels", "Belgium", 50.8503, 4.3517],
  ["Warsaw", "Poland", 52.2297, 21.0122],
  ["Kyiv", "Ukraine", 50.4501, 30.5234],
  ["Moscow", "Russia", 55.7558, 37.6173],
  ["Damascus", "Syria", 33.5138, 36.2765],
  ["Aleppo", "Syria", 36.2021, 37.1343],
  ["Tehran", "Iran", 35.6892, 51.389],
  ["Baghdad", "Iraq", 33.3152, 44.3661],
  ["Tel Aviv", "Israel", 32.0853, 34.7818],
  ["Jerusalem", "Israel", 31.7683, 35.2137],
  ["Gaza", "Palestine", 31.5017, 34.4668],
  ["Beirut", "Lebanon", 33.8938, 35.5018],
  ["Sanaa", "Yemen", 15.3694, 44.191],
  ["Khartoum", "Sudan", 15.5007, 32.5599],
  ["Mogadishu", "Somalia", 2.0469, 45.3182],
  ["Bamako", "Mali", 12.6392, -8.0029],
  ["Ouagadougou", "Burkina Faso", 12.3714, -1.5197],
  ["Niamey", "Niger", 13.5116, 2.1254],
  ["Lagos", "Nigeria", 6.5244, 3.3792],
  ["New York", "United States", 40.7128, -74.006],
  ["Washington", "United States", 38.9072, -77.0369],
  ["Los Angeles", "United States", 34.0522, -118.2437],
  ["Chicago", "United States", 41.8781, -87.6298],
  ["Toronto", "Canada", 43.6532, -79.3832],
  ["Mexico City", "Mexico", 19.4326, -99.1332],
  ["Beijing", "China", 39.9042, 116.4074],
  ["Shanghai", "China", 31.2304, 121.4737],
  ["Tokyo", "Japan", 35.6762, 139.6503],
  ["Seoul", "South Korea", 37.5665, 126.978],
  ["Pyongyang", "North Korea", 39.0392, 125.7625],
  ["Taipei", "Taiwan", 25.033, 121.5654],
  ["Bangkok", "Thailand", 13.7563, 100.5018],
  ["Singapore", "Singapore", 1.3521, 103.8198],
  ["Dubai", "United Arab Emirates", 25.2048, 55.2708],
  ["Riyadh", "Saudi Arabia", 24.7136, 46.6753],
  ["Istanbul", "Turkey", 41.0082, 28.9784],
  ["Cairo", "Egypt", 30.0444, 31.2357],
  ["Delhi", "India", 28.6139, 77.209],
  ["Mumbai", "India", 19.076, 72.8777],
  ["Karachi", "Pakistan", 24.8607, 67.0011],
  ["Islamabad", "Pakistan", 33.6844, 73.0479],
  ["Sydney", "Australia", -33.8688, 151.2093],
  ["Melbourne", "Australia", -37.8136, 144.9631],
  ["Rio de Janeiro", "Brazil", -22.9068, -43.1729],
  ["São Paulo", "Brazil", -23.5558, -46.6396],
  ["Buenos Aires", "Argentina", -34.6037, -58.3816]
];

const EVENT_KEYWORDS = {
  war: ["war", "missile", "drone", "frontline", "battle", "invasion", "shelling", "airstrike", "troops", "military", "army"],
  terror: ["terror", "terrorist", "bomb", "explosion", "attack", "gunmen", "hostage", "ied", "suicide bomber"],
  crisis: ["earthquake", "flood", "storm", "wildfire", "cyclone", "hurricane", "tornado", "landslide", "volcano", "drought", "evacuation", "humanitarian", "famine"],
  politics: ["election", "coup", "parliament", "president", "minister", "protest", "riot", "sanction", "embassy", "government"],
  energy: ["oil", "gas", "lng", "pipeline", "refinery", "opec", "energy", "nuclear plant"],
  commodity: ["gold", "silver", "copper", "grain", "wheat", "commodity", "fertilizer", "uranium"],
  shipping: ["port", "shipping", "container", "suez", "hormuz", "malacca", "freight", "vessel", "tanker", "red sea"]
};

function now() {
  return Date.now();
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function stableId(input) {
  return Buffer.from(String(input || Math.random()).slice(0, 700)).toString("base64url").slice(0, 36);
}

function stripTags(input) {
  return String(input || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isEnglishEnough(text) {
  const s = String(text || "");
  if (!s) return false;
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  const badScripts = /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/.test(s);
  return !badScripts && nonAscii / Math.max(1, s.length) < 0.08;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);

  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, ...(options.headers || {}) },
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);

  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, ...(options.headers || {}) },
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function cacheGet(key) {
  const row = CACHE.short.get(key);
  if (!row) return null;

  if (row.expires < now()) {
    CACHE.short.delete(key);
    return null;
  }

  return row.value;
}

function cacheSet(key, value, ttl) {
  CACHE.short.set(key, {
    value,
    expires: now() + ttl
  });

  return value;
}

function normaliseCountry(country) {
  if (!country) return "";

  const s = String(country).trim();

  if (/united states|usa|u\.s\./i.test(s)) return "United States";
  if (/united kingdom|britain|england|scotland|wales|northern ireland/i.test(s)) return "United Kingdom";
  if (/russian federation/i.test(s)) return "Russia";
  if (/korea, republic/i.test(s)) return "South Korea";

  return s;
}

function iso2FromCountry(country) {
  if (!country) return null;
  const key = normaliseCountry(country).toLowerCase().trim();
  return COUNTRY_ISO2[key] || null;
}

function classifyEvent(text) {
  const s = String(text || "").toLowerCase();

  for (const [kind, words] of Object.entries(EVENT_KEYWORDS)) {
    if (words.some((word) => s.includes(word))) return kind;
  }

  return "risk";
}

function geocodeArticle(title, sourceCountry) {
  const text = String(title || "").toLowerCase();

  for (const row of CITY_POINTS) {
    const [city, country, lat, lng] = row;
    if (text.includes(city.toLowerCase())) {
      return { lat, lng, place: city, country };
    }
  }

  const country = normaliseCountry(sourceCountry || "");
  const iso = iso2FromCountry(country);

  if (iso && COUNTRY_CENTRES[iso]) {
    return {
      lat: COUNTRY_CENTRES[iso][0],
      lng: COUNTRY_CENTRES[iso][1],
      place: country,
      country
    };
  }

  return {
    lat: 20,
    lng: 12,
    place: country || "global",
    country: country || ""
  };
}

function averageLonLat(coords) {
  const valid = coords
    .filter((p) => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
    .map((p) => ({ lng: Number(p[0]), lat: Number(p[1]) }));

  if (!valid.length) return null;

  return {
    lng: valid.reduce((s, p) => s + p.lng, 0) / valid.length,
    lat: valid.reduce((s, p) => s + p.lat, 0) / valid.length
  };
}

function centroidFromGeometry(geometry) {
  if (!geometry) return null;

  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    return {
      lng: Number(geometry.coordinates[0]),
      lat: Number(geometry.coordinates[1])
    };
  }

  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    return averageLonLat(geometry.coordinates[0] || []);
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return averageLonLat((geometry.coordinates[0] && geometry.coordinates[0][0]) || []);
  }

  return null;
}

function eonetGeometryToPoint(geometries) {
  const g = Array.isArray(geometries) && geometries.length ? geometries[geometries.length - 1] : null;
  if (!g || !Array.isArray(g.coordinates)) return null;

  if (g.type === "Point") {
    return {
      lng: Number(g.coordinates[0]),
      lat: Number(g.coordinates[1])
    };
  }

  if (g.type === "Polygon") {
    return averageLonLat(g.coordinates[0] || []);
  }

  return null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchGdeltEvents() {
  const query = [
    "(war OR missile OR drone OR terror OR earthquake OR flood OR storm OR coup OR protest OR election OR oil OR gas OR port OR shipping OR sanction)",
    "sourcelang:English"
  ].join(" ");

  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc" +
    `?query=${encodeURIComponent(query)}` +
    "&mode=ArtList&format=json&maxrecords=120&sort=DateDesc";

  try {
    const data = await fetchJson(url, { timeout: 16000 });
    const articles = Array.isArray(data.articles) ? data.articles : [];

    return articles
      .map((a) => {
        const title = stripTags(a.title || "");
        if (!title || !isEnglishEnough(title)) return null;

        const sourceCountry = normaliseCountry(a.sourceCountry || a.sourcecountry || "");
        const geo = geocodeArticle(`${title} ${a.domain || ""}`, sourceCountry);
        const kind = classifyEvent(`${title} ${a.domain || ""}`);

        return {
          id: stableId(`gdelt-${a.url}-${a.seendate}`),
          title,
          summary: title,
          kind,
          lat: geo.lat,
          lng: geo.lng,
          place: geo.place,
          country: geo.country || sourceCountry,
          source: a.domain || "GDELT",
          url: a.url,
          publishedAt: a.seendate || new Date().toISOString(),
          sourceSystem: "GDELT"
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn("GDELT failed:", err.message);
    return [];
  }
}

async function fetchReliefWebReports() {
  if (CACHE.reliefWeb && CACHE.reliefWeb.expires > now()) return CACHE.reliefWeb.value;

  const url =
    "https://api.reliefweb.int/v2/reports" +
    "?appname=summit-money-engine" +
    "&profile=list&preset=latest&limit=80" +
    "&fields[include][]=title" +
    "&fields[include][]=url" +
    "&fields[include][]=date.created" +
    "&fields[include][]=country.name" +
    "&fields[include][]=source.name" +
    "&fields[include][]=primary_country.name";

  try {
    const data = await fetchJson(url, { timeout: 14000 });
    const rows = Array.isArray(data.data) ? data.data : [];

    const events = rows.map((row) => {
      const f = row.fields || {};
      const title = stripTags(f.title || "");
      if (!title || !isEnglishEnough(title)) return null;

      const country =
        (f.primary_country && f.primary_country.name) ||
        (Array.isArray(f.country) && f.country[0] && f.country[0].name) ||
        "";

      const geo = geocodeArticle(title, country);

      return {
        id: stableId(`reliefweb-${row.id}-${title}`),
        title,
        summary: `Humanitarian/disaster report: ${title}`,
        kind: "crisis",
        lat: geo.lat,
        lng: geo.lng,
        place: geo.place,
        country: geo.country || normaliseCountry(country),
        source: (Array.isArray(f.source) && f.source[0] && f.source[0].name) || "ReliefWeb",
        url: f.url || "",
        publishedAt: (f.date && f.date.created) || null,
        sourceSystem: "ReliefWeb"
      };
    }).filter(Boolean);

    CACHE.reliefWeb = { value: events, expires: now() + 15 * 60 * 1000 };
    return events;
  } catch (err) {
    console.warn("ReliefWeb failed:", err.message);
    return [];
  }
}

async function fetchEonetEvents() {
  if (CACHE.eonet && CACHE.eonet.expires > now()) return CACHE.eonet.value;

  const url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=120";

  try {
    const data = await fetchJson(url, { timeout: 14000 });
    const rows = Array.isArray(data.events) ? data.events : [];

    const events = rows.map((e) => {
      const point = eonetGeometryToPoint(e.geometry);
      if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;

      const category = (Array.isArray(e.categories) && e.categories[0] && e.categories[0].title) || "Natural event";
      const title = stripTags(e.title || category);

      return {
        id: stableId(`eonet-${e.id}-${title}`),
        title: `${category}: ${title}`,
        summary: `NASA EONET open natural event: ${title}`,
        kind: "crisis",
        lat: point.lat,
        lng: point.lng,
        place: title,
        country: "",
        source: "NASA EONET",
        url: e.link || "",
        publishedAt: null,
        sourceSystem: "NASA EONET"
      };
    }).filter(Boolean);

    CACHE.eonet = { value: events, expires: now() + 20 * 60 * 1000 };
    return events;
  } catch (err) {
    console.warn("NASA EONET failed:", err.message);
    return [];
  }
}

async function fetchNwsAlerts() {
  if (CACHE.nws && CACHE.nws.expires > now()) return CACHE.nws.value;

  const url = "https://api.weather.gov/alerts/active?status=actual&message_type=alert";

  try {
    const data = await fetchJson(url, {
      timeout: 14000,
      headers: {
        Accept: "application/geo+json,application/json"
      }
    });

    const features = Array.isArray(data.features) ? data.features : [];

    const alerts = features.map((feature) => {
      const p = feature.properties || {};
      const point = centroidFromGeometry(feature.geometry);
      if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;

      const title = stripTags(`${p.event || "Weather alert"} - ${p.areaDesc || ""}`);

      return {
        id: stableId(`nws-${p.id || title}`),
        title,
        summary: stripTags(p.headline || p.description || title).slice(0, 420),
        kind: "crisis",
        lat: point.lat,
        lng: point.lng,
        place: p.areaDesc || "United States",
        country: "United States",
        source: "US National Weather Service",
        url: p.uri || "",
        publishedAt: p.sent || p.effective || null,
        severity: p.severity || "",
        urgency: p.urgency || "",
        sourceSystem: "NWS"
      };
    }).filter(Boolean);

    CACHE.nws = { value: alerts, expires: now() + 8 * 60 * 1000 };
    return alerts;
  } catch (err) {
    console.warn("NWS alerts failed:", err.message);
    return [];
  }
}

async function fetchEarthquakes() {
  if (CACHE.earthquakes && CACHE.earthquakes.expires > now()) return CACHE.earthquakes.value;

  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

  try {
    const data = await fetchJson(url, { timeout: 12000 });
    const features = Array.isArray(data.features) ? data.features : [];

    const earthquakes = features.map((f) => {
      const coords = (f.geometry && f.geometry.coordinates) || [];
      const p = f.properties || {};

      return {
        id: stableId(`usgs-${p.url || p.code || p.time}`),
        title: p.title || "Earthquake",
        magnitude: p.mag,
        place: p.place,
        lat: Number(coords[1]),
        lng: Number(coords[0]),
        depthKm: Number(coords[2]),
        time: p.time ? new Date(p.time).toISOString() : null,
        url: p.url,
        source: "USGS",
        kind: "crisis"
      };
    }).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

    CACHE.earthquakes = { value: earthquakes, expires: now() + 10 * 60 * 1000 };
    return earthquakes;
  } catch (err) {
    console.warn("USGS failed:", err.message);
    return [];
  }
}

async function fetchGdacsDisasters() {
  if (CACHE.disasters && CACHE.disasters.expires > now()) return CACHE.disasters.value;

  try {
    const xml = await fetchText("https://www.gdacs.org/xml/rss.xml", { timeout: 12000 });
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

    const disasters = items.map((item) => {
      const title = stripTags(
        (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
          item.match(/<title>([\s\S]*?)<\/title>/) ||
          [])[1] || ""
      );

      const link = stripTags((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");

      const desc = stripTags(
        (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
          item.match(/<description>([\s\S]*?)<\/description>/) ||
          [])[1] || ""
      );

      const point = item.match(/<georss:point>([-\d.]+)\s+([-\d.]+)<\/georss:point>/);

      return {
        id: stableId(`gdacs-${title}-${link}`),
        title,
        summary: desc,
        url: link,
        lat: point ? Number(point[1]) : null,
        lng: point ? Number(point[2]) : null,
        kind: "crisis",
        source: "GDACS",
        sourceSystem: "GDACS"
      };
    }).filter((x) => x.title);

    CACHE.disasters = { value: disasters, expires: now() + 15 * 60 * 1000 };
    return disasters;
  } catch (err) {
    console.warn("GDACS failed:", err.message);
    return [];
  }
}

async function fetchYahooMarket(symbol, id, name, source = "Yahoo Finance") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;

  try {
    const data = await fetchJson(url, { timeout: 9000 });
    const result = data.chart && data.chart.result && data.chart.result[0];
    const meta = result && result.meta;
    const quote = result && result.indicators && result.indicators.quote && result.indicators.quote[0];
    const closes = quote && Array.isArray(quote.close) ? quote.close.filter((x) => Number.isFinite(Number(x))) : [];

    const price = Number(meta && meta.regularMarketPrice) || closes[closes.length - 1] || null;
    const first = closes[0] || Number(meta && meta.previousClose) || null;
    const changePct = price && first ? ((price - first) / first) * 100 : null;

    return {
      id,
      symbol,
      name,
      price,
      changePct,
      source,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`
    };
  } catch (err) {
    return {
      id,
      symbol,
      name,
      price: null,
      changePct: null,
      source,
      status: "failed"
    };
  }
}

async function fetchBinanceMarkets() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT"];
  const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;

  try {
    const rows = await fetchJson(url, { timeout: 9000 });

    return rows.map((r) => ({
      id: String(r.symbol || "").replace("USDT", ""),
      symbol: r.symbol,
      name: String(r.symbol || "").replace("USDT", ""),
      price: Number(r.lastPrice),
      changePct: Number(r.priceChangePercent),
      volume: Number(r.quoteVolume),
      source: "Binance public market data",
      url: `https://www.binance.com/en/trade/${String(r.symbol || "").replace("USDT", "_USDT")}`
    }));
  } catch (err) {
    console.warn("Binance failed, using Yahoo fallback:", err.message);

    return Promise.all([
      fetchYahooMarket("BTC-USD", "BTC", "Bitcoin", "Yahoo crypto fallback"),
      fetchYahooMarket("ETH-USD", "ETH", "Ethereum", "Yahoo crypto fallback"),
      fetchYahooMarket("SOL-USD", "SOL", "Solana", "Yahoo crypto fallback"),
      fetchYahooMarket("XRP-USD", "XRP", "XRP", "Yahoo crypto fallback"),
      fetchYahooMarket("BNB-USD", "BNB", "BNB", "Yahoo crypto fallback"),
      fetchYahooMarket("ADA-USD", "ADA", "Cardano", "Yahoo crypto fallback")
    ]);
  }
}

async function fetchCoinGeckoMarkets() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,avalanche-2,chainlink,polkadot" +
    "&vs_currencies=usd" +
    "&include_24hr_change=true" +
    "&include_24hr_vol=true";

  const map = {
    bitcoin: ["BTC", "Bitcoin"],
    ethereum: ["ETH", "Ethereum"],
    solana: ["SOL", "Solana"],
    ripple: ["XRP", "XRP"],
    binancecoin: ["BNB", "BNB"],
    cardano: ["ADA", "Cardano"],
    dogecoin: ["DOGE", "Dogecoin"],
    "avalanche-2": ["AVAX", "Avalanche"],
    chainlink: ["LINK", "Chainlink"],
    polkadot: ["DOT", "Polkadot"]
  };

  try {
    const data = await fetchJson(url, { timeout: 9000 });

    return Object.entries(map).map(([id, [symbol, name]]) => {
      const row = data[id] || {};

      return {
        id: symbol,
        symbol,
        name,
        price: Number(row.usd),
        changePct: Number(row.usd_24h_change),
        volume: Number(row.usd_24h_vol),
        source: "CoinGecko public API",
        url: `https://www.coingecko.com/en/coins/${id}`
      };
    }).filter((x) => Number.isFinite(x.price));
  } catch (err) {
    console.warn("CoinGecko failed:", err.message);
    return [];
  }
}

async function fetchCommodityMarkets() {
  return Promise.all([
    fetchYahooMarket("GC=F", "GOLD", "Gold futures"),
    fetchYahooMarket("SI=F", "SILVER", "Silver futures"),
    fetchYahooMarket("HG=F", "COPPER", "Copper futures"),
    fetchYahooMarket("CL=F", "WTI", "WTI crude oil"),
    fetchYahooMarket("BZ=F", "BRENT", "Brent crude oil"),
    fetchYahooMarket("NG=F", "GAS", "Natural gas"),
    fetchYahooMarket("ZW=F", "WHEAT", "Wheat futures"),
    fetchYahooMarket("ZC=F", "CORN", "Corn futures"),
    fetchYahooMarket("ZS=F", "SOY", "Soybean futures")
  ]);
}

async function fetchEcbRates() {
  if (CACHE.ecb && CACHE.ecb.expires > now()) return CACHE.ecb.value;

  try {
    const xml = await fetchText("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { timeout: 10000 });
    const pairs = [...xml.matchAll(/currency='([A-Z]{3})'\s+rate='([\d.]+)'/g)];

    const rates = pairs.map((m) => ({
      currency: m[1],
      ratePerEuro: Number(m[2])
    }));

    const gbp = rates.find((r) => r.currency === "GBP");
    const usd = rates.find((r) => r.currency === "USD");

    const result = {
      source: "European Central Bank",
      rates,
      EURGBP: gbp ? gbp.ratePerEuro : null,
      EURUSD: usd ? usd.ratePerEuro : null,
      GBPUSD: gbp && usd ? usd.ratePerEuro / gbp.ratePerEuro : null
    };

    CACHE.ecb = { value: result, expires: now() + TTL.ecb };
    return result;
  } catch (err) {
    console.warn("ECB failed:", err.message);
    return { source: "ECB failed", rates: [], EURGBP: null, EURUSD: null, GBPUSD: null };
  }
}

async function fetchWorldBankIndicator(iso2, indicator) {
  if (!iso2) return null;

  const key = `wb:${iso2}:${indicator}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso2)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=8`;

  try {
    const data = await fetchJson(url, { timeout: 10000 });
    const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    const found = rows.find((r) => r.value !== null && r.value !== undefined);

    const result = found
      ? { value: Number(found.value), year: found.date, source: "World Bank", indicator }
      : { value: null, year: null, source: "World Bank", indicator };

    return cacheSet(key, result, 24 * 60 * 60 * 1000);
  } catch (err) {
    return { value: null, year: null, source: "World Bank failed", indicator };
  }
}

function previousPoliceMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchUkLocalCrime(lat, lng) {
  const date = previousPoliceMonth();
  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&date=${date}`;

  try {
    const rows = await fetchJson(url, { timeout: 11000 });
    const total = Array.isArray(rows) ? rows.length : 0;
    const categories = {};
    const outcomes = {};

    for (const r of rows || []) {
      categories[r.category || "unknown"] = (categories[r.category || "unknown"] || 0) + 1;

      if (r.outcome_status && r.outcome_status.category) {
        outcomes[r.outcome_status.category] = (outcomes[r.outcome_status.category] || 0) + 1;
      }
    }

    return {
      available: true,
      total,
      date,
      categories,
      outcomes,
      source: "data.police.uk street-level crime"
    };
  } catch (err) {
    return {
      available: false,
      total: null,
      date,
      categories: {},
      outcomes: {},
      source: "data.police.uk unavailable"
    };
  }
}

async function reverseGeocode(lat, lng) {
  const key = `reverse:${Number(lat).toFixed(5)}:${Number(lng).toFixed(5)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
    "&addressdetails=1&zoom=18&accept-language=en";

  try {
    const data = await fetchJson(url, { timeout: 10000 });
    const address = data.address || {};

    const result = {
      displayName: data.display_name || "",
      city: address.city || address.town || address.village || address.hamlet || address.suburb || "",
      country: normaliseCountry(address.country || ""),
      countryCode: address.country_code ? String(address.country_code).toUpperCase() : null,
      raw: address,
      source: "Nominatim/OpenStreetMap"
    };

    return cacheSet(key, result, TTL.point);
  } catch (err) {
    return {
      displayName: "",
      city: "",
      country: "",
      countryCode: null,
      raw: {},
      source: "reverse geocode failed"
    };
  }
}

async function fetchWeather(lat, lng) {
  const key = `weather:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}` +
    "&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m" +
    "&hourly=precipitation,wind_gusts_10m,weather_code" +
    "&forecast_days=1&timezone=auto";

  try {
    const data = await fetchJson(url, { timeout: 9000 });
    const current = data.current || {};

    const result = {
      current: {
        temperatureC: current.temperature_2m ?? null,
        rainMm: current.precipitation ?? null,
        precipitationMm: current.precipitation ?? null,
        windKmh: current.wind_speed_10m ?? null,
        gustKmh: current.wind_gusts_10m ?? null,
        code: current.weather_code ?? null
      },
      source: "Open-Meteo"
    };

    return cacheSet(key, result, 10 * 60 * 1000);
  } catch (err) {
    return { current: null, source: "Open-Meteo failed" };
  }
}

async function fetchWikiPlace(name) {
  const clean = String(name || "").replace(/\s+/g, " ").trim();
  if (!clean) return { found: false };

  const key = `wiki:${clean.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const searchUrl =
      "https://en.wikipedia.org/w/api.php" +
      `?action=query&list=search&srsearch=${encodeURIComponent(clean)}` +
      "&format=json&origin=*&srlimit=1";

    const search = await fetchJson(searchUrl, { timeout: 10000 });
    const first = search.query && search.query.search && search.query.search[0];

    if (!first) return cacheSet(key, { found: false }, TTL.wiki);

    const title = first.title;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
    const summary = await fetchJson(summaryUrl, { timeout: 10000 });

    const result = {
      found: true,
      title: summary.title || title,
      extract: summary.extract || "",
      thumbnail: summary.thumbnail && summary.thumbnail.source || null,
      url:
        (summary.content_urls && summary.content_urls.desktop && summary.content_urls.desktop.page) ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      source: "Wikipedia"
    };

    return cacheSet(key, result, TTL.wiki);
  } catch (err) {
    return cacheSet(key, { found: false }, 30 * 60 * 1000);
  }
}

function computeCrimeScore(localCrime, homicide) {
  if (localCrime && localCrime.available && Number.isFinite(Number(localCrime.total))) {
    const total = Number(localCrime.total);
    const score = clamp(100 - total * 2.2, 5, 95);

    return {
      score,
      status: total <= 10 ? "Lower local police count" : total <= 30 ? "Moderate local police count" : "Higher local police count",
      reason: `${total} official local police records near clicked point`
    };
  }

  if (homicide && Number.isFinite(Number(homicide.value))) {
    const rate = Number(homicide.value);
    const score = clamp(100 - rate * 7.5, 5, 92);

    return {
      score,
      status: "National crime indicator",
      reason: `${rate.toFixed(1)} homicide rate per 100k`
    };
  }

  return {
    score: null,
    status: "No crime source",
    reason: "No official local or national crime indicator loaded"
  };
}

function eventPressureScore(events, countryName, kind) {
  const country = String(countryName || "").toLowerCase();

  return events.filter((e) => {
    if (kind && e.kind !== kind) return false;

    const ec = String(e.country || "").toLowerCase();
    const ep = String(e.place || "").toLowerCase();

    return country && (ec.includes(country) || country.includes(ec) || ep.includes(country));
  }).length;
}

function computeRiskScores({ localCrime, homicide, events, countryName, weather, politics }) {
  const crime = computeCrimeScore(localCrime, homicide);

  const warHits = eventPressureScore(events, countryName, "war");
  const terrorHits = eventPressureScore(events, countryName, "terror");
  const politicsHits = eventPressureScore(events, countryName, "politics");
  const crisisHits = eventPressureScore(events, countryName, "crisis");

  const warValue = clamp(warHits * 22, 0, 100);
  const terrorValue = clamp(terrorHits * 25, 0, 100);
  const politicsValue = clamp(politicsHits * 18, 0, 100);
  const crisisValue = clamp(crisisHits * 20, 0, 100);

  const gust = (weather && weather.current && Number(weather.current.gustKmh)) || 0;
  const rain = (weather && weather.current && Number(weather.current.rainMm || weather.current.precipitationMm)) || 0;
  const severeWeatherValue = clamp((gust > 70 ? 30 : 0) + (rain > 15 ? 25 : 0), 0, 100) || 0;

  let politicalStabilityPenalty = 0;

  if (politics && Number.isFinite(Number(politics.politicalStability && politics.politicalStability.value))) {
    const pv = Number(politics.politicalStability.value);
    politicalStabilityPenalty = clamp((0 - pv) * 10, 0, 28) || 0;
  }

  const safetyScore = clamp(
    (crime.score === null ? 62 : crime.score) -
      warValue * 0.35 -
      terrorValue * 0.25 -
      politicsValue * 0.12 -
      crisisValue * 0.15 -
      severeWeatherValue * 0.08 -
      politicalStabilityPenalty,
    2,
    98
  );

  return {
    safety: {
      score: safetyScore,
      status:
        safetyScore >= 75
          ? "Lower current risk"
          : safetyScore >= 55
          ? "Mixed"
          : safetyScore >= 35
          ? "Elevated risk"
          : "High risk",
      reason: "crime + war + terror + politics + crisis + weather + governance"
    },
    crime,
    war: {
      value: warValue,
      score: warValue,
      status: warHits ? `${warHits} live hits` : "No live hits",
      reason: "GDELT / ReliefWeb / live event terms"
    },
    terror: {
      value: terrorValue,
      score: terrorValue,
      status: terrorHits ? `${terrorHits} live hits` : "No live hits",
      reason: "GDELT live terror terms"
    },
    politics: {
      value: Math.max(politicsValue, politicalStabilityPenalty),
      score: Math.max(politicsValue, politicalStabilityPenalty),
      status: politicsHits ? `${politicsHits} live hits` : politicalStabilityPenalty ? "Governance risk" : "No live hits",
      reason: "GDELT + World Bank governance indicators"
    },
    crisis: {
      value: Math.max(crisisValue, severeWeatherValue),
      score: Math.max(crisisValue, severeWeatherValue),
      status: crisisHits ? `${crisisHits} live hits` : severeWeatherValue ? "Weather risk" : "No live hits",
      reason: "GDELT + ReliefWeb + NASA EONET + GDACS + USGS + Open-Meteo"
    }
  };
}

function relatedEventCount(market, events) {
  const id = String(market.id || market.name || "").toLowerCase();
  let words = [id];

  if (/gold|silver|copper|oil|brent|wti|gas|wheat|corn|soy/.test(id)) {
    words.push("war", "shipping", "energy", "oil", "gas", "commodity", "suez", "hormuz", "storm", "drought");
  }

  if (/btc|eth|sol|xrp|bnb|ada|doge|avax|link|dot/.test(id)) {
    words.push("crypto", "inflation", "fed", "risk", "market", "election", "sanction");
  }

  return (events || []).filter((e) => {
    const text = `${e.title || ""} ${e.summary || ""} ${e.kind || ""}`.toLowerCase();
    return words.some((w) => text.includes(w));
  }).length;
}

function buildRapidMovers(markets, events) {
  return (markets || [])
    .filter((m) => Number.isFinite(Number(m.changePct)))
    .map((m) => {
      const move = Number(m.changePct);
      const relatedEvents = relatedEventCount(m, events);
      const score = clamp(Math.abs(move) * 12 + relatedEvents * 12 + (Number(m.volume) > 100000000 ? 8 : 0), 0, 100);

      return {
        id: m.id,
        asset: m.name || m.id,
        price: m.price,
        direction: move > 0 ? "up" : move < 0 ? "down" : "flat",
        move: `${move.toFixed(2)}% 24h`,
        rating: score,
        source: m.source,
        reasons: [
          `${move.toFixed(2)}% 24h price move`,
          relatedEvents ? `${relatedEvents} related live events` : "no related event spike",
          m.source || "market feed"
        ]
      };
    })
    .filter((r) => Math.abs(parseFloat(r.move)) >= 0.35 || r.rating >= 18)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 30);
}

function buildPredictions(markets, events) {
  return (markets || [])
    .filter((m) => Number.isFinite(Number(m.changePct)))
    .map((m) => {
      const move = Number(m.changePct);
      const related = relatedEventCount(m, events);
      const rating = clamp(Math.abs(move) * 10 + related * 12, 0, 100);
      const direction = move > 1 ? "up momentum" : move < -1 ? "down momentum" : "mixed / flat";

      return {
        id: m.id,
        asset: m.name || m.id,
        direction,
        rating,
        reasons: [
          `${move.toFixed(2)}% 24h move`,
          related ? `${related} related event signals` : "no strong related live event",
          "score is setup strength, not guaranteed profit"
        ]
      };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 24);
}

function buildCountryRisk(events) {
  const byCountry = new Map();

  for (const e of events || []) {
    const country = normaliseCountry(e.country || "");
    if (!country) continue;

    const key = country.toLowerCase();

    if (!byCountry.has(key)) {
      byCountry.set(key, {
        country,
        war: 0,
        terror: 0,
        crisis: 0,
        politics: 0,
        shipping: 0,
        energy: 0,
        commodity: 0,
        risk: 0
      });
    }

    const row = byCountry.get(key);
    row[e.kind] = (row[e.kind] || 0) + 1;

    row.risk +=
      e.kind === "war" ? 28 :
      e.kind === "terror" ? 25 :
      e.kind === "crisis" ? 17 :
      e.kind === "politics" ? 13 :
      e.kind === "shipping" ? 10 :
      e.kind === "energy" ? 9 :
      e.kind === "commodity" ? 8 :
      7;
  }

  return [...byCountry.values()].map((r) => ({
    ...r,
    risk: clamp(r.risk, 0, 100),
    colour: r.risk >= 60 ? "#ff174f" : r.risk >= 30 ? "#ff8c00" : "#00a66a"
  }));
}

function dedupeEvents(events) {
  const seen = new Set();
  const out = [];

  for (const e of events || []) {
    const key = stableId(`${e.title}-${e.lat}-${e.lng}-${e.sourceSystem}`);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }

  return out;
}

async function buildState(force = false) {
  if (!force && CACHE.state && now() - CACHE.updatedAt < TTL.state) return CACHE.state;

  const [
    gdeltEvents,
    reliefWebEvents,
    eonetEvents,
    nwsEvents,
    earthquakes,
    gdacsDisasters,
    binanceMarkets,
    coinGeckoMarkets,
    commodityMarkets,
    ecbRates
  ] = await Promise.all([
    fetchGdeltEvents(),
    fetchReliefWebReports(),
    fetchEonetEvents(),
    fetchNwsAlerts(),
    fetchEarthquakes(),
    fetchGdacsDisasters(),
    fetchBinanceMarkets(),
    fetchCoinGeckoMarkets(),
    fetchCommodityMarkets(),
    fetchEcbRates()
  ]);

  const quakeEvents = earthquakes.slice(0, 70).map((q) => ({
    id: q.id,
    title: q.title,
    summary: `${q.magnitude || "N/A"} magnitude earthquake near ${q.place || "unknown location"}`,
    kind: "crisis",
    lat: q.lat,
    lng: q.lng,
    place: q.place,
    country: "",
    source: "USGS",
    url: q.url,
    publishedAt: q.time,
    sourceSystem: "USGS"
  }));

  const disasterEvents = gdacsDisasters
    .slice(0, 50)
    .filter((d) => Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng)));

  const events = dedupeEvents([
    ...gdeltEvents,
    ...reliefWebEvents,
    ...eonetEvents,
    ...nwsEvents,
    ...quakeEvents,
    ...disasterEvents
  ])
    .filter((e) => Number.isFinite(Number(e.lat)) && Number.isFinite(Number(e.lng)))
    .slice(0, 500);

  const cryptoById = new Map();

  for (const item of [...coinGeckoMarkets, ...binanceMarkets]) {
    if (!item || !item.id) continue;
    const old = cryptoById.get(item.id);
    if (!old || old.price === null || old.price === undefined) cryptoById.set(item.id, item);
  }

  const cryptoMarkets = [...cryptoById.values()];
  const markets = [...cryptoMarkets, ...commodityMarkets].filter(Boolean);
  const rapid = buildRapidMovers(markets, events);
  const predictions = buildPredictions(markets, events);
  const countryRisk = buildCountryRisk(events);

  CACHE.state = {
    version: "live-scraper-expanded-fixed",
    lastRefresh: new Date().toISOString(),
    events,
    markets,
    rapid,
    predictions,
    countryRisk,
    fx: ecbRates,
    sources: [
      "GDELT English-filtered live events",
      "ReliefWeb humanitarian reports",
      "NASA EONET natural hazards",
      "US National Weather Service active alerts",
      "USGS earthquake GeoJSON",
      "GDACS disaster RSS",
      "Open-Meteo point weather",
      "Binance crypto ticker",
      "CoinGecko crypto fallback",
      "Yahoo Finance commodity chart fallback",
      "ECB FX rates",
      "World Bank homicide/GDP/governance indicators",
      "data.police.uk local crime where available",
      "Nominatim/OpenStreetMap reverse geocoding",
      "Overpass local places",
      "Wikipedia/Wikimedia place images"
    ]
  };

  CACHE.mapData = {
    nodes: events.slice(0, 220),
    cityNodes: CITY_POINTS.map(([name, country, lat, lng]) => ({
      id: stableId(`${name}-${country}`),
      name,
      country,
      lat,
      lng,
      kind: "city",
      source: "built-in city seed"
    })),
    routes: [],
    countryRisk
  };

  CACHE.updatedAt = now();

  return CACHE.state;
}

router.get("/state", async (req, res) => {
  try {
    const state = await buildState(false);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const state = await buildState(true);

    for (const client of CACHE.sseClients) {
      client.write(`data: ${JSON.stringify({ type: "state", state })}\n\n`);
    }

    res.json({ ok: true, lastRefresh: state.lastRefresh });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/map-data", async (req, res) => {
  try {
    await buildState(false);
    res.json(CACHE.mapData || { nodes: [], cityNodes: [], routes: [], countryRisk: [] });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      nodes: [],
      cityNodes: [],
      routes: [],
      countryRisk: []
    });
  }
});

router.get("/stream", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  CACHE.sseClients.add(res);

  try {
    const state = await buildState(false);
    res.write(`data: ${JSON.stringify({ type: "state", state })}\n\n`);
  } catch {}

  req.on("close", () => {
    CACHE.sseClients.delete(res);
  });
});

router.get("/global-risk/point", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat/lng required" });
  }

  const key = `point:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);

  try {
    const state = await buildState(false);
    const place = await reverseGeocode(lat, lng);
    const countryCode = place.countryCode || iso2FromCountry(place.country);
    const countryName = place.country || "";
    const weather = await fetchWeather(lat, lng);

    if (!countryCode && !countryName) {
      return res.json(cacheSet(key, {
        place,
        countryCode: null,
        countryName: "",
        scores: {},
        localCrime: { available: false },
        national: {},
        politics: {},
        weather,
        eventsNear: [],
        sourceNote: "No land country resolved."
      }, TTL.point));
    }

    const [
      homicide,
      gdp,
      growth,
      politicalStability,
      governmentEffectiveness,
      corruptionControl,
      localCrime
    ] = await Promise.all([
      fetchWorldBankIndicator(countryCode, "VC.IHR.PSRC.P5"),
      fetchWorldBankIndicator(countryCode, "NY.GDP.PCAP.CD"),
      fetchWorldBankIndicator(countryCode, "NY.GDP.MKTP.KD.ZG"),
      fetchWorldBankIndicator(countryCode, "PV.EST"),
      fetchWorldBankIndicator(countryCode, "GE.EST"),
      fetchWorldBankIndicator(countryCode, "CC.EST"),
      countryCode === "GB"
        ? fetchUkLocalCrime(lat, lng)
        : Promise.resolve({ available: false, source: "No official local crime feed connected for this country" })
    ]);

    const politics = {
      politicalStability,
      governmentEffectiveness,
      corruptionControl
    };

    const scores = computeRiskScores({
      localCrime,
      homicide,
      events: state.events,
      countryName,
      weather,
      politics
    });

    const eventsNear = state.events
      .map((e) => ({
        ...e,
        distance: haversineKm(lat, lng, Number(e.lat), Number(e.lng))
      }))
      .filter((e) => Number.isFinite(e.distance) && e.distance <= 700)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 16);

    const result = {
      place,
      countryCode,
      countryName,
      scores,
      localCrime,
      national: {
        homicide,
        gdp,
        growth
      },
      politics,
      weather,
      eventsNear,
      sourceNote:
        "Town-level crime changes only where official local feeds exist. UK uses data.police.uk. Other countries use national indicators, governance indicators, live events and weather."
    };

    res.json(cacheSet(key, result, TTL.point));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/global-weather/earthquakes", async (req, res) => {
  res.json({ earthquakes: await fetchEarthquakes(), source: "USGS" });
});

router.get("/global-weather/disasters", async (req, res) => {
  const [gdacs, eonet, reliefWeb, nws] = await Promise.all([
    fetchGdacsDisasters(),
    fetchEonetEvents(),
    fetchReliefWebReports(),
    fetchNwsAlerts()
  ]);

  res.json({
    disasters: [...gdacs, ...eonet, ...reliefWeb, ...nws],
    source: "GDACS + NASA EONET + ReliefWeb + NWS"
  });
});

router.get("/wiki/place", async (req, res) => {
  const name = String(req.query.name || "").trim();
  if (!name) return res.json({ found: false });

  res.json(await fetchWikiPlace(name));
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) return res.json({ places: [] });

  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&accept-language=en`;

    const rows = await fetchJson(url, { timeout: 10000 });

    res.json({
      places: (rows || []).map((r) => ({
        name: r.name || r.display_name,
        displayName: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
        source: "Nominatim/OpenStreetMap",
        raw: r
      })).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
    });
  } catch (err) {
    res.json({ places: [] });
  }
});

router.get("/local-places", async (req, res) => {
  const south = Number(req.query.south);
  const west = Number(req.query.west);
  const north = Number(req.query.north);
  const east = Number(req.query.east);

  if (![south, west, north, east].every(Number.isFinite)) {
    return res.json({ places: [] });
  }

  const key = `overpass:${south.toFixed(2)}:${west.toFixed(2)}:${north.toFixed(2)}:${east.toFixed(2)}`;
  const cached = cacheGet(key);
  if (cached) return res.json(cached);

  const query = `
    [out:json][timeout:14];
    (
      node["place"~"city|town|village|suburb|hamlet|neighbourhood"](${south},${west},${north},${east});
      node["amenity"~"hospital|police|fire_station|embassy"](${south},${west},${north},${east});
      node["emergency"](${south},${west},${north},${east});
      node["public_transport"="station"](${south},${west},${north},${east});
      node["aeroway"="aerodrome"](${south},${west},${north},${east});
      node["harbour"](${south},${west},${north},${east});
    );
    out center 220;
  `;

  try {
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const data = await fetchJson(url, { timeout: 18000 });

    const places = (data.elements || []).map((el) => ({
      id: el.id,
      name: (el.tags && (el.tags["name:en"] || el.tags.name)) || "Unnamed place",
      lat: el.lat,
      lng: el.lon,
      kind:
        (el.tags && (el.tags.place || el.tags.amenity || el.tags.emergency || el.tags.aeroway || el.tags.public_transport || "place")) ||
        "place",
      tags: el.tags || {},
      source: "OpenStreetMap/Overpass"
    })).filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng));

    res.json(cacheSet(key, { places }, 15 * 60 * 1000));
  } catch (err) {
    res.json({ places: [] });
  }
});

router.get("/boundaries/admin0", async (req, res) => {
  if (CACHE.boundaries && CACHE.boundaries.expires > now()) {
    return res.json(CACHE.boundaries.value);
  }

  try {
    const data = await fetchJson("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson", { timeout: 18000 });
    CACHE.boundaries = { value: data, expires: now() + TTL.boundaries };
    res.json(data);
  } catch (err) {
    res.status(500).json({
      type: "FeatureCollection",
      features: [],
      error: err.message
    });
  }
});

router.get("/sources", (req, res) => {
  res.json({
    sources: [
      { name: "GDELT", category: "global events", provides: ["war", "terror", "politics", "shipping", "commodity event signals"] },
      { name: "ReliefWeb", category: "humanitarian", provides: ["humanitarian reports", "disaster reports", "country reports"] },
      { name: "NASA EONET", category: "natural hazards", provides: ["wildfires", "storms", "volcanoes", "open natural events"] },
      { name: "US National Weather Service", category: "weather alerts", provides: ["active severe weather alerts for US"] },
      { name: "USGS", category: "crisis", provides: ["earthquake GeoJSON feed"] },
      { name: "GDACS", category: "crisis", provides: ["global disaster RSS"] },
      { name: "Open-Meteo", category: "weather", provides: ["temperature", "wind", "gust", "rain", "weather code"] },
      { name: "Binance", category: "crypto", provides: ["24h crypto ticker"] },
      { name: "CoinGecko", category: "crypto fallback", provides: ["public simple crypto prices"] },
      { name: "Yahoo Finance", category: "markets", provides: ["commodity and fallback chart prices"] },
      { name: "ECB", category: "FX", provides: ["EUR, GBP, USD daily exchange rates"] },
      { name: "World Bank", category: "national indicators", provides: ["homicide rate", "GDP per person", "GDP growth", "political stability", "government effectiveness", "corruption control"] },
      { name: "data.police.uk", category: "local crime", provides: ["UK street-level local crime counts"] },
      { name: "Nominatim / OpenStreetMap", category: "places", provides: ["reverse geocode", "search"] },
      { name: "Overpass", category: "local infrastructure", provides: ["towns", "cities", "hospitals", "police", "fire stations", "embassies", "stations", "ports", "airfields"] },
      { name: "Wikipedia / Wikimedia", category: "images", provides: ["place summary", "lead image thumbnail"] }
    ]
  });
});

module.exports = router;
