(function(){
'use strict';
const VERSION = '18.0.0';
const api = (() => {
  async function get(path, params = {}, timeoutMs = 10_000) {
    const url = new URL(path, location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { headers: { accept: 'application/json', 'x-client-version': '18.0.0-merlin' }, cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
      return response.json();
    } finally { clearTimeout(timer); }
  }
  return Object.freeze({
    events: params => get('/api/events', { days: params.lookbackDays || params.days || 7, limit: params.limit || 5000 }, 12_000),
    scan: params => get('/api/scan', params, 12_000),
    newsLive: (params, options = {}) => get('/api/news', params, options.timeoutMs || 14_000),
    shippingSnapshotLive: (params, options = {}) => get('/api/shipping/snapshot', params, options.timeoutMs || 14_000),
    marketScreenerLive: (params, options = {}) => get('/api/markets/screener', { assets: params.asset || params.assets, timeframe: params.timeframe || '1h', limit: 12 }, options.timeoutMs || 16_000),
    macro: () => get('/api/macro', {}, 14_000)
  });
})();
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => Number.isFinite(Number(value));
const nowIso = () => new Date().toISOString();

const COLORS = Object.freeze({
  earthquake: '#65cfff', disaster: '#ff914d', conflict: '#ff4f68', news: '#b493ff',
  port: '#38e0a0', route: '#27d7ff', risk: '#ffc857', alert: '#ff3455', other: '#6f9fb8'
});

const EVENT_GROUPS = Object.freeze({
  earthquakes: ['earthquake'],
  disasters: ['volcano', 'wildfire', 'storm', 'flood', 'drought', 'landslide', 'ice', 'disaster'],
  conflict: ['conflict', 'war', 'protest', 'terror', 'military', 'crime']
});

const state = {
  view: 'map',
  drawer: 'alerts',
  drawerOpen: false,
  map: null,
  mapKind: null,
  mapReady: false,
  mapStyle: 'streets',
  layers: { alerts: true, news: true, earthquakes: true, disasters: true, conflict: true, routes: true, ports: true, countryRisk: true, heat: true },
  windowDays: 7,
  radiusKm: 250,
  events: [],
  news: { articles: [], stories: [], sources: {}, generatedAt: null },
  shipping: { ports: [], chokepoints: [], routes: [], commodities: [], generatedAt: null },
  shippingCatalog: { ports: [], chokepoints: [], commodities: [], geojson: {} },
  intelligence: { countries: [], generatedAt: null },
  intelligenceCatalog: { countries: [], cities: [] },
  markets: { results: [], generatedAt: null },
  alerts: [],
  opportunities: [],
  shippingMoney: [],
  selected: null,
  selectedPlace: null,
  placeScan: null,
  searchResults: [],
  lastUpdated: null,
  polling: false,
  alertMarkers: [],
  newsMarkers: [],
  countryPolygonsLoaded: false
};

const SOURCE_LABELS = Object.freeze({
  'USGS SNAPSHOT': 'USGS', 'USGS': 'USGS', 'NASA EONET': 'NASA', 'EONET': 'NASA',
  'GDACS': 'GDACS', 'ACLED': 'ACLED', 'Reuters': 'REUTERS', 'Associated Press': 'AP', 'BBC': 'BBC'
});

const COUNTRY_ALIASES = Object.freeze({ UK: 'GB', EL: 'GR' });

const PLAYBOOKS = Object.freeze({
  economic: {
    lane: 'MARKETS / RESEARCH', window: '1–10 DAYS', capital: '£0–£250', difficulty: '2/5',
    assets: ['GBPUSD', 'UK10Y', 'FTSE'], range: '£25–£300',
    action: 'Track the named currency, bond yield and index. Only act after the move confirms on price and volume.',
    where: 'TradingView or your existing broker', query: 'macro economic event market impact'
  },
  conflict: {
    lane: 'MARKETS / SERVICES', window: '6 HOURS–14 DAYS', capital: '£0–£300', difficulty: '3/5',
    assets: ['GOLD', 'BRENT', 'DEFENCE'], range: '£40–£600',
    action: 'Compare gold, oil and defence shares, then contact importers or contractors exposed to the named region.',
    where: 'TradingView, LinkedIn company search and Companies House', query: 'geopolitical risk affected importers'
  },
  energy: {
    lane: 'ENERGY / SUPPLY', window: '1–21 DAYS', capital: '£0–£300', difficulty: '3/5',
    assets: ['BRENT', 'NATGAS', 'ENERGY'], range: '£40–£500',
    action: 'Check the energy futures curve and identify UK firms buying the affected fuel or feedstock.',
    where: 'TradingView, ICE market pages and LinkedIn', query: 'energy supply disruption buyers UK'
  },
  shipping: {
    lane: 'FREIGHT / LEAD GENERATION', window: '2–30 DAYS', capital: '£0–£150', difficulty: '2/5',
    assets: ['FREIGHT', 'SHIPPING'], range: '£50–£750',
    action: 'Price the affected route, identify importers on that corridor and offer alternative-routing research or quote collection.',
    where: 'Freightos, LinkedIn and Companies House', query: 'UK importers freight route alternative'
  },
  disaster: {
    lane: 'SUPPLY / LOCAL SERVICES', window: '1–21 DAYS', capital: '£0–£200', difficulty: '3/5',
    assets: ['INSURANCE', 'MATERIALS', 'LOGISTICS'], range: '£30–£500',
    action: 'Identify disrupted materials, transport or accommodation demand; avoid trading from magnitude alone.',
    where: 'Google Trends, local procurement portals and LinkedIn', query: 'disaster recovery procurement logistics'
  },
  technology: {
    lane: 'TECH / CONTRACT WORK', window: '1–30 DAYS', capital: '£0–£100', difficulty: '2/5',
    assets: ['NASDAQ', 'SEMIS', 'AI'], range: '£40–£600',
    action: 'Map the affected technology vendors and sell implementation, research, content or lead-generation work around the change.',
    where: 'Upwork, LinkedIn and company partner directories', query: 'technology implementation freelance demand'
  },
  trade: {
    lane: 'SOURCING / TRADE', window: '3–45 DAYS', capital: '£0–£250', difficulty: '3/5',
    assets: ['FX', 'FREIGHT', 'COMMODITIES'], range: '£50–£900',
    action: 'Find the product category affected, compare alternative suppliers and approach buyers before prices fully adjust.',
    where: 'Alibaba, Freightos, LinkedIn and Companies House', query: 'alternative supplier UK importer'
  },
  other: {
    lane: 'INFORMATION / LEAD GENERATION', window: '1–14 DAYS', capital: '£0–£100', difficulty: '2/5',
    assets: ['SEARCH'], range: '£25–£300',
    action: 'Identify the businesses exposed to the event and sell research, sourcing, content or outreach around the change.',
    where: 'Google, LinkedIn and Upwork', query: 'businesses affected by event'
  }
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function formatNumber(value, digits = 0) {
  if (!finite(value)) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function formatPercent(value, digits = 0, signed = false) {
  if (!finite(value)) return '—';
  const number = Number(value);
  return `${signed && number > 0 ? '+' : ''}${number.toFixed(digits)}%`;
}

function ageLabel(value) {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'NOW';
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}H`;
  return `${Math.floor(hours / 24)}D`;
}

function categoryOf(item) {
  return String(item?.category || item?.kind || item?.type || 'other').toLowerCase();
}

function eventGroup(event) {
  const category = categoryOf(event);
  if (EVENT_GROUPS.earthquakes.includes(category)) return 'earthquakes';
  if (EVENT_GROUPS.disasters.includes(category)) return 'disasters';
  if (EVENT_GROUPS.conflict.includes(category)) return 'conflict';
  return 'disasters';
}

function eventScore(event) {
  const category = categoryOf(event);
  const magnitude = Number(event.magnitude);
  const severity = Number(event.severity);
  const ageHours = Math.max(0, (Date.now() - Date.parse(event.time || event.updatedAt || nowIso())) / 3_600_000);
  let score = finite(severity) ? (severity <= 10 ? severity * 10 : severity) : 25;
  if (category === 'earthquake' && finite(magnitude)) score = magnitude >= 7 ? 100 : magnitude >= 6 ? 88 : magnitude >= 5 ? 72 : magnitude >= 4 ? 55 : magnitude >= 3 ? 36 : 18;
  if (['conflict', 'war', 'terror'].includes(category)) score = Math.max(score, 65);
  return Math.round(clamp(score - Math.min(30, ageHours / 8), 0, 100));
}

function eventColour(event) {
  const group = eventGroup(event);
  if (group === 'earthquakes') {
    const magnitude = Number(event.magnitude);
    if (magnitude >= 6) return '#ff3455';
    if (magnitude >= 5) return '#ff7a45';
    if (magnitude >= 3.5) return '#ffc857';
    if (magnitude >= 2) return '#63d7ff';
    return '#8db5c8';
  }
  return COLORS[group] || COLORS.other;
}

function fetchJson(path, timeoutMs = 7_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(path, { cache: 'no-store', signal: controller.signal }).then(response => {
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return response.json();
  }).finally(() => clearTimeout(timer));
}

function countryCode(value) {
  const code = String(value || '').toUpperCase();
  return COUNTRY_ALIASES[code] || code;
}

function countryByCode(code) {
  const normalized = countryCode(code);
  return state.intelligenceCatalog.countries.find(country => country.iso2 === normalized || country.iso3 === normalized) || null;
}

function cityOrCountryPoint(article) {
  const countries = article.countries || article.country ? [...(article.countries || []), article.country].filter(Boolean) : [];
  for (const code of countries) {
    const country = countryByCode(code);
    if (country) return { lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon, label: country.name, countryCode: country.iso2 };
  }
  const haystack = `${article.title || ''} ${article.summary || ''} ${(article.entities || []).join(' ')}`.toLowerCase();
  const city = state.intelligenceCatalog.cities.find(item => haystack.includes(String(item.name).toLowerCase()));
  if (city) return { lat: city.lat, lon: city.lon, label: city.name, countryCode: city.countryCode };
  return null;
}

function distanceKm(a, b) {
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLon = toRad(Number(b.lon) - Number(a.lon));
  const lat1 = toRad(Number(a.lat));
  const lat2 = toRad(Number(b.lat));
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function nearestPlace(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const city of state.intelligenceCatalog.cities) {
    const distance = distanceKm(point, city);
    if (distance < bestDistance) { best = { ...city, kind: 'CITY' }; bestDistance = distance; }
  }
  if (best && bestDistance < 350) return { ...best, distanceKm: bestDistance };
  for (const country of state.intelligenceCatalog.countries) {
    const candidate = { lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon };
    const distance = distanceKm(point, candidate);
    if (distance < bestDistance) { best = { ...country, kind: 'COUNTRY' }; bestDistance = distance; }
  }
  return best ? { ...best, distanceKm: bestDistance } : null;
}

function eventGeoJson() {
  return {
    type: 'FeatureCollection',
    features: state.events.filter(event => finite(event.lat) && finite(event.lon)).map(event => ({
      type: 'Feature', id: String(event.id), geometry: { type: 'Point', coordinates: [Number(event.lon), Number(event.lat)] },
      properties: {
        id: String(event.id), title: event.title || 'Event', category: categoryOf(event), group: eventGroup(event),
        magnitude: finite(event.magnitude) ? Number(event.magnitude) : -1, severity: eventScore(event),
        time: event.time || event.updatedAt || '', source: SOURCE_LABELS[event.source] || event.source || 'SOURCE', colour: eventColour(event)
      }
    }))
  };
}

function newsGeoJson() {
  const features = [];
  for (const article of state.news.articles) {
    const point = cityOrCountryPoint(article);
    if (!point || !finite(point.lat) || !finite(point.lon)) continue;
    features.push({
      type: 'Feature', id: String(article.id), geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] },
      properties: {
        id: String(article.id), title: article.title, category: categoryOf(article), source: article.sourceName || article.sourceDomain || 'NEWS',
        publishedAt: article.publishedAt || article.discoveredAt || '', reliability: article.reliability?.score ?? 50,
        countryCode: point.countryCode || '', summary: article.summary || '', url: article.url || ''
      }
    });
  }
  return { type: 'FeatureCollection', features };
}

function portsGeoJson() {
  const riskById = new Map(state.shipping.ports.map(port => [port.id, port.risk]));
  const base = state.shippingCatalog.geojson?.ports || { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: (base.features || []).map(feature => ({ ...feature, properties: { ...feature.properties, risk: riskById.get(feature.properties?.id)?.score ?? 0, riskBand: riskById.get(feature.properties?.id)?.band ?? 'LOW' } }))
  };
}

function routesGeoJson() {
  const riskById = new Map(state.shipping.routes.map(route => [route.id, route.risk]));
  const base = state.shippingCatalog.geojson?.routes || { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: (base.features || []).map(feature => ({ ...feature, properties: { ...feature.properties, risk: riskById.get(feature.properties?.id)?.score ?? 0, riskBand: riskById.get(feature.properties?.id)?.band ?? 'LOW' } }))
  };
}

function placeGeoJson() {
  return {
    type: 'FeatureCollection',
    features: state.intelligence.countries.map(item => {
      const country = item.country || {};
      const live = placeDisplayMetrics(item);
      return {
        type: 'Feature', id: String(country.iso3 || country.id),
        geometry: { type: 'Point', coordinates: [Number(country.capitalLon ?? country.lon), Number(country.capitalLat ?? country.lat)] },
        properties: { id: country.id, iso2: country.iso2, name: country.name, risk: live.risk ?? -1, coverage: live.coverage ?? 0, events: item.eventCount || 0, stories: item.storyCount || 0 }
      };
    }).filter(feature => feature.geometry.coordinates.every(finite))
  };
}

function placeDisplayMetrics(item) {
  const metrics = item?.metrics || {};
  const conflictCount = Number(metrics.conflict?.count || 0);
  const disasterCount = Number(metrics.disaster?.count || 0);
  const storyCount = Number(item?.storyCount || 0);
  const eventCount = Number(item?.eventCount || 0);
  const economic = finite(metrics.economic?.score) ? Number(metrics.economic.score) : null;
  const evidence = conflictCount + disasterCount + storyCount + eventCount;
  const measured = evidence > 0 || economic !== null;
  if (!measured) return { risk: null, coverage: 0, conflict: null, disaster: null, economic: null, measured: false };
  const conflict = conflictCount > 0 ? Number(metrics.conflict?.score || 0) : 0;
  const disaster = disasterCount > 0 ? Number(metrics.disaster?.score || 0) : 0;
  const values = [conflictCount > 0 ? conflict : null, disasterCount > 0 ? disaster : null, economic].filter(finite);
  const risk = values.length ? Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length) : null;
  const coverage = Math.round(clamp(20 + Math.log10(evidence + 1) * 22 + values.length * 12, 0, 95));
  return { risk, coverage, conflict, disaster, economic, measured: true };
}

function buildAlerts() {
  const eventAlerts = state.events.filter(event => eventScore(event) >= 55).map(event => ({
    id: `event:${event.id}`, type: 'EVENT', title: event.title, summary: `${categoryOf(event).toUpperCase()} / ${SOURCE_LABELS[event.source] || event.source || 'SOURCE'}`,
    score: eventScore(event), time: event.time || event.updatedAt, lat: event.lat, lon: event.lon, data: event
  }));
  const newsAlerts = state.news.articles.map(article => {
    const point = cityOrCountryPoint(article);
    const reliability = Number(article.reliability?.score || 50);
    const category = categoryOf(article);
    const score = Math.round(clamp(reliability * .55 + (['conflict', 'energy', 'shipping', 'disaster'].includes(category) ? 28 : 12), 0, 100));
    return { id: `news:${article.id}`, type: 'NEWS', title: article.title, summary: `${article.sourceName || 'NEWS'} / ${category.toUpperCase()}`, score, time: article.publishedAt, lat: point?.lat, lon: point?.lon, data: article };
  }).filter(alert => alert.score >= 55);
  const shippingAlerts = state.shipping.ports.filter(port => Number(port.risk?.score || 0) >= 55).map(port => ({
    id: `port:${port.id}`, type: 'PORT', title: `${port.name} disruption`, summary: `${port.country} / ${port.risk.band}`, score: Math.round(port.risk.score), time: state.shipping.generatedAt, lat: port.coordinates?.lat, lon: port.coordinates?.lon, data: port
  }));
  state.alerts = [...eventAlerts, ...newsAlerts, ...shippingAlerts].sort((a, b) => b.score - a.score || Date.parse(b.time || 0) - Date.parse(a.time || 0)).slice(0, 80);
}

function opportunityScore(article) {
  const reliability = Number(article.reliability?.score || 50);
  const ageHours = Math.max(0, (Date.now() - Date.parse(article.publishedAt || article.discoveredAt || nowIso())) / 3_600_000);
  const categoryBonus = ['conflict', 'economic', 'energy', 'shipping', 'trade', 'technology', 'disaster'].includes(categoryOf(article)) ? 13 : 4;
  return Math.round(clamp(reliability * .62 + categoryBonus - Math.min(20, ageHours * .6), 0, 92));
}

function opportunityFromNews(article, index) {
  const category = categoryOf(article);
  const playbook = PLAYBOOKS[category] || (article.title?.toLowerCase().includes('shipping') || article.summary?.toLowerCase().includes('port') ? PLAYBOOKS.shipping : PLAYBOOKS.other);
  const score = opportunityScore(article);
  const impactChance = Math.round(clamp(28 + score * .65, 35, 88));
  const entities = (article.entities || []).slice(0, 3).join(', ');
  const assets = (article.tickers || []).length ? article.tickers.slice(0, 4) : playbook.assets;
  const search = encodeURIComponent(`${article.title} ${playbook.query}`);
  return {
    id: `news-op-${article.id || index}`, kind: playbook.lane, title: article.title, score, impactChance,
    confidence: Number(article.reliability?.score || 50), risk: 100 - score, window: playbook.window, capital: playbook.capital,
    difficulty: playbook.difficulty, range: playbook.range, summary: article.summary || 'A verified change with identifiable market or business exposure.',
    where: playbook.where, action: playbook.action, target: entities || assets.join(', '), source: article.sourceName || article.sourceDomain || 'NEWS',
    time: article.publishedAt || article.discoveredAt, lat: cityOrCountryPoint(article)?.lat, lon: cityOrCountryPoint(article)?.lon,
    links: [
      { label: 'SOURCE', url: article.url },
      { label: 'MARKET SEARCH', url: `https://www.tradingview.com/search/?query=${encodeURIComponent(assets.join(' '))}` },
      { label: 'FIND BUYERS', url: `https://www.google.com/search?q=${search}` }
    ].filter(link => link.url)
  };
}

function buildOpportunities() {
  const news = state.news.articles.slice(0, 40).map(opportunityFromNews);
  const shipping = buildShippingMoney().slice(0, 15).map(item => ({ ...item, kind: `SHIPPING / ${item.kind}` }));
  state.opportunities = [...news, ...shipping].sort((a, b) => b.score - a.score).slice(0, 60);
}

function buildShippingMoney() {
  const results = [];
  for (const route of state.shipping.routes.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 12)) {
    const risk = Number(route.risk?.score || 0);
    const importance = Number(route.importance || 50);
    const score = Math.round(clamp(risk * .62 + importance * .38, 0, 94));
    const chance = Math.round(clamp(35 + risk * .55 + importance * .18, 35, 90));
    results.push({
      id: `route-money-${route.id}`, kind: 'ROUTE', title: route.name, score, impactChance: chance,
      confidence: Number(route.risk?.confidence || 45), risk, window: risk >= 50 ? '2–14 DAYS' : '1–6 WEEKS', capital: '£0–£200', difficulty: '3/5', range: '£50–£1,000',
      summary: `${route.commodity || 'Mixed cargo'} corridor. Current route risk ${formatNumber(risk)} / 100 with ${route.evidence?.length || route.eventCount || 0} evidence records.`,
      where: 'Freightos, LinkedIn, Companies House and your broker',
      action: `Price an alternative to ${route.name}; identify UK importers in ${route.commodity || 'the affected cargo group'} and sell quote collection, supplier research or route monitoring.`,
      target: `${route.commodity || 'mixed cargo'} importers and freight forwarders`, source: 'MERLIN SHIPPING', time: state.shipping.generatedAt,
      links: [
        { label: 'FREIGHTOS', url: 'https://www.freightos.com/' },
        { label: 'FIND IMPORTERS', url: `https://www.google.com/search?q=${encodeURIComponent(`UK importers ${route.commodity || ''} ${route.name}`)}` },
        { label: 'VIEW ON MAP', action: () => focusShippingRoute(route.id) }
      ]
    });
  }
  for (const port of state.shipping.ports.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 10)) {
    const risk = Number(port.risk?.score || 0);
    const score = Math.round(clamp(risk * .6 + Number(port.importance || 50) * .4, 0, 92));
    results.push({
      id: `port-money-${port.id}`, kind: 'PORT', title: `${port.name}, ${port.country}`, score,
      impactChance: Math.round(clamp(30 + risk * .65, 32, 88)), confidence: Number(port.risk?.confidence || 45), risk,
      window: risk >= 50 ? '24 HOURS–14 DAYS' : '1–4 WEEKS', capital: '£0–£150', difficulty: '2/5', range: '£50–£750',
      summary: `${port.risk?.band || 'LOW'} operational exposure. Commodities: ${(port.commodities || []).join(', ') || 'mixed cargo'}.`,
      where: 'Port notices, Freightos, LinkedIn and Companies House',
      action: `Approach firms importing through ${port.name}; offer delay monitoring, alternative-port research or supplier outreach before disruption spreads.`,
      target: `${port.country}–UK importers using ${port.name}`, source: 'MERLIN SHIPPING', time: state.shipping.generatedAt,
      lat: port.coordinates?.lat, lon: port.coordinates?.lon,
      links: [
        { label: 'FIND COMPANIES', url: `https://www.google.com/search?q=${encodeURIComponent(`UK importer ${port.name} port`)}` },
        { label: 'VIEW ON MAP', action: () => selectPort(port) }
      ]
    });
  }
  for (const commodity of state.shipping.commodities.slice().sort((a, b) => Number(b.supplyRisk || 0) - Number(a.supplyRisk || 0)).slice(0, 8)) {
    const risk = Number(commodity.supplyRisk || 0);
    results.push({
      id: `commodity-money-${commodity.id}`, kind: 'COMMODITY', title: commodity.name, score: Math.round(clamp(risk * .7 + 25, 0, 92)),
      impactChance: Math.round(clamp(32 + risk * .6, 35, 88)), confidence: Math.round(clamp(35 + Number(commodity.evidenceCount || 0) * 2, 35, 82)), risk,
      window: '3–45 DAYS', capital: '£0–£250', difficulty: '3/5', range: '£50–£1,200',
      summary: `Supply exposure across ${commodity.routeCount || 0} routes and ${commodity.chokepointCount || 0} chokepoints.`,
      where: 'Alibaba, industry directories, Freightos and Companies House',
      action: `Find UK buyers of ${commodity.name}; compare alternative suppliers and delivery routes, then sell the shortlist or broker introductions.`,
      target: `${commodity.name} buyers, distributors and manufacturers`, source: 'MERLIN SHIPPING', time: state.shipping.generatedAt,
      links: [
        { label: 'SUPPLIER SEARCH', url: `https://www.google.com/search?q=${encodeURIComponent(`${commodity.name} wholesale suppliers Europe UK`)}` },
        { label: 'FREIGHTOS', url: 'https://www.freightos.com/' }
      ]
    });
  }
  state.shippingMoney = results.sort((a, b) => b.score - a.score);
  return state.shippingMoney;
}

function commitPreloadState() {
  state.lastUpdated = new Date();
  buildAlerts();
  buildShippingMoney();
  buildOpportunities();
  updateHeader();
  updateMapData();
  renderDrawer();
  if (state.view === 'opportunities') renderOpportunitySheet($('#sheet-search')?.value || '');
  if (state.view === 'shipping') renderShippingSheet($('#sheet-search')?.value || '');
  if (state.view === 'markets') renderMarketsSheet($('#sheet-search')?.value || '');
  if (state.view === 'places') renderPlacesSheet($('#sheet-search')?.value || '');
}

async function loadPreloads() {
  const payload = await fetchJson('/data/bootstrap-v18.json', 15_000);
  if (Array.isArray(payload.events)) state.events = payload.events;
  if (payload.news?.articles) state.news = payload.news;
  if (payload.shipping?.ports) state.shipping = payload.shipping;
  if (payload.shippingCatalog?.geojson) state.shippingCatalog = payload.shippingCatalog;
  if (payload.intelligence?.countries) state.intelligence = payload.intelligence;
  if (payload.intelligenceCatalog?.countries) state.intelligenceCatalog = payload.intelligenceCatalog;
  if (payload.markets?.results) state.markets = payload.markets;
  if (payload.opportunities?.opportunities) state.preloadedOpportunities = payload.opportunities.opportunities;
  commitPreloadState();
  document.documentElement.dataset.bootstrap = 'ready';
  return payload;
}
function updateHeader() {
  $('#header-alert-count').textContent = `${state.alerts.length.toLocaleString()} ALERTS`;
  $('#header-event-count').textContent = `${state.events.length.toLocaleString()} EVENTS`;
  $('#count-alerts').textContent = state.alerts.length.toLocaleString();
  $('#count-news').textContent = state.news.articles?.length?.toLocaleString() || '0';
  $('#count-earthquakes').textContent = state.events.filter(event => eventGroup(event) === 'earthquakes').length.toLocaleString();
  $('#count-disasters').textContent = state.events.filter(event => eventGroup(event) === 'disasters').length.toLocaleString();
  $('#count-conflict').textContent = state.events.filter(event => eventGroup(event) === 'conflict').length.toLocaleString();
  $('#count-routes').textContent = state.shipping.routes?.length?.toLocaleString() || '0';
  $('#count-ports').textContent = state.shipping.ports?.length?.toLocaleString() || '0';
  $('#count-countries').textContent = state.intelligence.countries?.filter(item => placeDisplayMetrics(item).measured).length.toLocaleString() || '0';
  $('#tab-alert-count').textContent = state.alerts.length;
  $('#tab-news-count').textContent = state.news.articles?.length || 0;
  $('#last-updated').textContent = `UPDATED ${state.lastUpdated ? ageLabel(state.lastUpdated) : '—'}`;
  renderTicker();
}

function renderTicker() {
  const marketItems = (state.markets.results || []).slice(0, 8).map(result => {
    const quote = result.quote || {};
    const change = finite(quote.change24h) ? Number(quote.change24h) * 100 : null;
    return `<span class="ticker-item"><small>MARKET</small><b>${escapeHtml(result.asset?.symbol || quote.symbol || '—')}</b><span>${finite(quote.price) ? formatMarketPrice(quote.price) : '—'}</span><em class="${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}">${finite(change) ? formatPercent(change, 2, true) : '—'}</em></span>`;
  });
  const commodityItems = (state.shipping.commodities || []).slice().sort((a, b) => Number(b.supplyRisk || 0) - Number(a.supplyRisk || 0)).slice(0, 7).map(item => {
    const risk = finite(item.supplyRisk) ? Number(item.supplyRisk) : null;
    return `<span class="ticker-item commodity"><small>SUPPLY RISK</small><b>${escapeHtml(String(item.name || '').toUpperCase())}</b><span>${finite(risk) ? `${formatNumber(risk)} / 100` : '—'}</span></span>`;
  });
  const items = [...marketItems, ...commodityItems];
  $('#market-ticker-track').innerHTML = items.join('') || '<span class="ticker-item"><span>LOADING LOCAL MARKET AND COMMODITY SNAPSHOT</span></span>';
}
function formatMarketPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const digits = number >= 1000 ? 0 : number >= 1 ? 2 : 5;
  return `US$${number.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}

function setMapSourceData(id, data) {
  if (state.mapKind !== 'maplibre' || !state.map?.getSource?.(id)) return;
  state.map.getSource(id).setData(data);
}

function addMapLayers() {
  const map = state.map;
  if (!map || state.mapKind !== 'maplibre') return;
  const beforeLabels = map.getStyle()?.layers?.find(layer => layer.type === 'symbol')?.id;
  const addLayer = (layer, before = beforeLabels) => { if (!map.getLayer(layer.id)) map.addLayer(layer, before); };
  const addSource = (id, source) => { if (!map.getSource(id)) map.addSource(id, source); };

  addSource('merlin-events', { type: 'geojson', data: eventGeoJson(), cluster: true, clusterMaxZoom: 9, clusterRadius: 42, promoteId: 'id' });
  addLayer({ id: 'merlin-event-heat', type: 'heatmap', source: 'merlin-events', maxzoom: 8, paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 0, .1, 100, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, .6, 8, 1.8],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 8, 24],
    'heatmap-opacity': .48,
    'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .25, 'rgba(0,173,255,.22)', .5, 'rgba(255,200,87,.38)', .75, 'rgba(255,121,69,.58)', 1, 'rgba(255,52,85,.78)']
  }});
  addLayer({ id: 'merlin-event-clusters', type: 'circle', source: 'merlin-events', filter: ['has', 'point_count'], paint: {
    'circle-color': ['step', ['get', 'point_count'], '#1d789f', 25, '#2e9cc8', 100, '#e29835', 500, '#e34c62'],
    'circle-radius': ['step', ['get', 'point_count'], 15, 25, 19, 100, 24, 500, 30],
    'circle-stroke-color': '#d8f4ff', 'circle-stroke-width': 1.2, 'circle-opacity': .86
  }});
  addLayer({ id: 'merlin-event-cluster-count', type: 'symbol', source: 'merlin-events', filter: ['has', 'point_count'], layout: {
    'text-field': ['get', 'point_count_abbreviated'], 'text-size': 10
  }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#073047', 'text-halo-width': 1.3 } });
  addLayer({ id: 'merlin-event-points', type: 'circle', source: 'merlin-events', filter: ['!', ['has', 'point_count']], paint: {
    'circle-color': ['get', 'colour'],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, ['interpolate', ['linear'], ['get', 'severity'], 0, 2.5, 100, 6], 10, ['interpolate', ['linear'], ['get', 'severity'], 0, 4, 100, 11]],
    'circle-stroke-color': '#06131f', 'circle-stroke-width': 1.1, 'circle-opacity': .9
  }});
  addLayer({ id: 'merlin-event-labels', type: 'symbol', source: 'merlin-events', minzoom: 5.5, filter: ['!', ['has', 'point_count']], layout: {
    'text-field': ['case', ['==', ['get', 'category'], 'earthquake'], ['concat', 'M', ['to-string', ['get', 'magnitude']]], ['get', 'category']],
    'text-size': 9, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-allow-overlap': false
  }, paint: { 'text-color': '#e7f7ff', 'text-halo-color': '#03101a', 'text-halo-width': 1.5 } });

  addSource('merlin-news', { type: 'geojson', data: newsGeoJson(), cluster: true, clusterRadius: 38, clusterMaxZoom: 8 });
  addLayer({ id: 'merlin-news-clusters', type: 'circle', source: 'merlin-news', filter: ['has', 'point_count'], paint: { 'circle-color': '#7b4fc0', 'circle-radius': ['step', ['get', 'point_count'], 13, 10, 17, 30, 21], 'circle-stroke-color': '#eadfff', 'circle-stroke-width': 1.2, 'circle-opacity': .88 } });
  addLayer({ id: 'merlin-news-count', type: 'symbol', source: 'merlin-news', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 9 }, paint: { 'text-color': '#fff' } });
  addLayer({ id: 'merlin-news-points', type: 'circle', source: 'merlin-news', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#9b70df', 'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 10, 8], 'circle-stroke-color': '#f0e7ff', 'circle-stroke-width': 1.2 } });
  addLayer({ id: 'merlin-news-label', type: 'symbol', source: 'merlin-news', minzoom: 4, filter: ['!', ['has', 'point_count']], layout: { 'text-field': 'N', 'text-size': 8 }, paint: { 'text-color': '#fff' } });

  addSource('merlin-ports', { type: 'geojson', data: portsGeoJson() });
  addLayer({ id: 'merlin-port-points', type: 'circle', source: 'merlin-ports', paint: {
    'circle-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#38e0a0', 45, '#ffc857', 70, '#ff8d3a', 90, '#ff4f68'],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 3, 8, 7], 'circle-stroke-color': '#eafff8', 'circle-stroke-width': 1, 'circle-opacity': .92
  }});
  addLayer({ id: 'merlin-port-labels', type: 'symbol', source: 'merlin-ports', minzoom: 3.8, layout: { 'text-field': ['get', 'name'], 'text-size': 9, 'text-offset': [0, 1.2], 'text-anchor': 'top' }, paint: { 'text-color': '#baf8df', 'text-halo-color': '#03101a', 'text-halo-width': 1.4 } });

  addSource('merlin-routes', { type: 'geojson', data: routesGeoJson() });
  addLayer({ id: 'merlin-route-lines', type: 'line', source: 'merlin-routes', paint: {
    'line-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#2bc8ff', 45, '#ffc857', 70, '#ff7a45', 90, '#ff3455'],
    'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 7, 3.2], 'line-opacity': .85, 'line-dasharray': [2, 1.6]
  }});
  addLayer({ id: 'merlin-route-labels', type: 'symbol', source: 'merlin-routes', minzoom: 3.5, layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-size': 9 }, paint: { 'text-color': '#aeeaff', 'text-halo-color': '#03101a', 'text-halo-width': 1.5 } });

  addSource('merlin-places', { type: 'geojson', data: placeGeoJson() });
  addLayer({ id: 'merlin-place-heat', type: 'heatmap', source: 'merlin-places', maxzoom: 7, paint: {
    'heatmap-weight': ['case', ['>=', ['get', 'risk'], 0], ['/', ['get', 'risk'], 100], 0], 'heatmap-intensity': .9,
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1, 18, 7, 42], 'heatmap-opacity': .55,
    'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .25, 'rgba(56,224,160,.25)', .5, 'rgba(255,200,87,.4)', .75, 'rgba(255,141,58,.58)', 1, 'rgba(255,79,104,.75)']
  }});
  addLayer({ id: 'merlin-place-points', type: 'circle', source: 'merlin-places', minzoom: 3.3, filter: ['>=', ['get', 'risk'], 0], paint: {
    'circle-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#38e0a0', 35, '#b8d65c', 55, '#ffc857', 75, '#ff8d3a', 90, '#ff4f68'],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 8, 7], 'circle-stroke-color': '#07131d', 'circle-stroke-width': 1
  }});
  addLayer({ id: 'merlin-place-labels', type: 'symbol', source: 'merlin-places', minzoom: 4.5, filter: ['>=', ['get', 'risk'], 0], layout: { 'text-field': ['get', 'name'], 'text-size': 8, 'text-offset': [0, 1.15], 'text-anchor': 'top' }, paint: { 'text-color': '#ffe4a1', 'text-halo-color': '#03101a', 'text-halo-width': 1.4 } });

  bindMapLayerInteractions();
  applyLayerVisibility();
  updateHtmlMarkers();
  tryLoadCountryPolygons();
}

function bindMapLayerInteractions() {
  const map = state.map;
  if (!map || map.__merlinBound) return;
  map.__merlinBound = true;
  const pointerLayers = ['merlin-event-clusters', 'merlin-event-points', 'merlin-news-clusters', 'merlin-news-points', 'merlin-port-points', 'merlin-route-lines', 'merlin-place-points', 'merlin-country-risk-fill'];
  for (const layer of pointerLayers) {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  }
  map.on('click', 'merlin-event-clusters', event => expandCluster('merlin-events', event));
  map.on('click', 'merlin-news-clusters', event => expandCluster('merlin-news', event));
  map.on('click', 'merlin-event-points', event => {
    const id = event.features?.[0]?.properties?.id;
    const item = state.events.find(candidate => String(candidate.id) === String(id));
    if (item) selectEvent(item);
  });
  map.on('click', 'merlin-news-points', event => {
    const id = event.features?.[0]?.properties?.id;
    const article = state.news.articles.find(candidate => String(candidate.id) === String(id));
    if (article) selectNews(article);
  });
  map.on('click', 'merlin-port-points', event => {
    const id = event.features?.[0]?.properties?.id;
    const port = state.shipping.ports.find(candidate => String(candidate.id) === String(id));
    if (port) selectPort(port);
  });
  map.on('click', 'merlin-route-lines', event => {
    const id = event.features?.[0]?.properties?.id;
    const route = state.shipping.routes.find(candidate => String(candidate.id) === String(id));
    if (route) selectRoute(route);
  });
  map.on('click', 'merlin-place-points', event => {
    const id = event.features?.[0]?.properties?.id;
    const item = state.intelligence.countries.find(candidate => String(candidate.country?.id) === String(id));
    if (item) selectCountry(item);
  });
  map.on('click', 'merlin-country-risk-fill', event => {
    const iso2 = event.features?.[0]?.properties?.ISO_A2;
    const item = state.intelligence.countries.find(candidate => candidate.country?.iso2 === iso2);
    if (item) selectCountry(item);
  });
  map.on('click', event => {
    const hit = map.queryRenderedFeatures(event.point, { layers: pointerLayers.filter(id => map.getLayer(id)) });
    if (hit.length) return;
    selectPoint({ lat: event.lngLat.lat, lon: event.lngLat.lng });
  });
}

function expandCluster(sourceId, event) {
  const feature = event.features?.[0];
  const clusterId = feature?.properties?.cluster_id;
  const source = state.map.getSource(sourceId);
  if (!source || clusterId === undefined) return;
  source.getClusterExpansionZoom(clusterId).then(zoom => state.map.easeTo({ center: feature.geometry.coordinates, zoom, duration: 450 })).catch(() => {});
}

async function tryLoadCountryPolygons() {
  if (state.countryPolygonsLoaded || state.mapKind !== 'maplibre') return;
  state.countryPolygonsLoaded = true;
  try {
    const polygons = await fetchJson('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/refs/heads/master/geojson/ne_110m_admin_0_countries.geojson', 8_000);
    const metricByCode = new Map(state.intelligence.countries.map(item => [item.country?.iso2, placeDisplayMetrics(item)]));
    for (const feature of polygons.features || []) {
      const code = countryCode(feature.properties?.ISO_A2);
      const metrics = metricByCode.get(code);
      feature.properties.risk = metrics?.risk ?? -1;
      feature.properties.coverage = metrics?.coverage ?? 0;
    }
    const map = state.map;
    if (!map.getSource('merlin-country-polygons')) map.addSource('merlin-country-polygons', { type: 'geojson', data: polygons });
    const before = map.getStyle()?.layers?.find(layer => layer.type === 'symbol')?.id;
    if (!map.getLayer('merlin-country-risk-fill')) map.addLayer({ id: 'merlin-country-risk-fill', type: 'fill', source: 'merlin-country-polygons', filter: ['>=', ['get', 'risk'], 0], paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'risk'], 0, '#1c9d72', 35, '#8aa942', 55, '#d2a52b', 75, '#dd6e2a', 90, '#d6354f'],
      'fill-opacity': ['interpolate', ['linear'], ['get', 'coverage'], 0, .05, 100, .32], 'fill-outline-color': 'rgba(135,210,241,.22)'
    } }, before);
    applyLayerVisibility();
  } catch { state.countryPolygonsLoaded = false; }
}

function applyLayerVisibility() {
  if (state.mapKind === 'tile') {
    state.map?.setLayerVisibility?.(state.layers);
    return;
  }
  const groups = {
    heat: ['merlin-event-heat'],
    news: ['merlin-news-clusters', 'merlin-news-count', 'merlin-news-points', 'merlin-news-label'],
    routes: ['merlin-route-lines', 'merlin-route-labels'],
    ports: ['merlin-port-points', 'merlin-port-labels'],
    countryRisk: ['merlin-place-heat', 'merlin-place-points', 'merlin-place-labels', 'merlin-country-risk-fill']
  };
  for (const [group, layers] of Object.entries(groups)) for (const id of layers) if (state.map?.getLayer?.(id)) state.map.setLayoutProperty(id, 'visibility', state.layers[group] ? 'visible' : 'none');
  if (state.map?.getLayer?.('merlin-event-points')) {
    const allowed = [];
    if (state.layers.earthquakes) allowed.push('earthquakes');
    if (state.layers.disasters) allowed.push('disasters');
    if (state.layers.conflict) allowed.push('conflict');
    const filter = ['all', ['!', ['has', 'point_count']], ['in', ['get', 'group'], ['literal', allowed]]];
    state.map.setFilter('merlin-event-points', filter);
    if (state.map.getLayer('merlin-event-labels')) state.map.setFilter('merlin-event-labels', filter);
    if (state.map.getLayer('merlin-event-clusters')) state.map.setLayoutProperty('merlin-event-clusters', 'visibility', allowed.length ? 'visible' : 'none');
    if (state.map.getLayer('merlin-event-cluster-count')) state.map.setLayoutProperty('merlin-event-cluster-count', 'visibility', allowed.length ? 'visible' : 'none');
  }
  updateHtmlMarkers();
}

function updateHtmlMarkers() {
  for (const marker of [...state.alertMarkers, ...state.newsMarkers]) marker.remove?.();
  state.alertMarkers = [];
  state.newsMarkers = [];
  if (state.mapKind !== 'maplibre' || !window.maplibregl) return;
  if (state.layers.alerts) {
    for (const alert of state.alerts.filter(item => finite(item.lat) && finite(item.lon)).slice(0, 18)) {
      const element = document.createElement('button');
      element.type = 'button'; element.className = 'merlin-alert-marker'; element.title = alert.title;
      element.addEventListener('click', event => { event.stopPropagation(); selectAlert(alert); });
      state.alertMarkers.push(new window.maplibregl.Marker({ element, anchor: 'center' }).setLngLat([Number(alert.lon), Number(alert.lat)]).addTo(state.map));
    }
  }
}

function updateMapData() {
  if (state.mapKind === 'tile') {
    const newsItems = (state.news.articles || []).map(article => ({ ...article, mapPoint: cityOrCountryPoint(article) })).filter(article => article.mapPoint);
    state.map.setData({
      alerts: state.alerts,
      events: state.events,
      news: newsItems,
      ports: state.shipping.ports || [],
      routes: (routesGeoJson().features || []).map(feature => ({
        ...(state.shipping.routes || []).find(route => String(route.id) === String(feature.properties?.id)),
        id: feature.properties?.id,
        name: feature.properties?.name,
        geometry: feature.geometry,
        risk: (state.shipping.routes || []).find(route => String(route.id) === String(feature.properties?.id))?.risk || { score: feature.properties?.risk }
      })),
      places: state.intelligence.countries || []
    });
    state.map.setLayerVisibility(state.layers);
    return;
  }
  setMapSourceData('merlin-events', eventGeoJson());
  setMapSourceData('merlin-news', newsGeoJson());
  setMapSourceData('merlin-ports', portsGeoJson());
  setMapSourceData('merlin-routes', routesGeoJson());
  setMapSourceData('merlin-places', placeGeoJson());
  updateHtmlMarkers();
}

async function initializeMap() {
  state.mapKind = 'tile';
  state.map = new window.MerlinMapEngine({
    container: 'world-map',
    initialPoint: { lat: 24, lon: 3 },
    initialZoom: 2,
    onSelect: point => selectPoint(point),
    onEntity: entity => {
      if (entity.kind === 'alert') selectAlert(entity.data);
      else if (entity.kind === 'news') selectNews(entity.data);
      else if (entity.kind === 'port') selectPort(entity.data);
      else if (entity.kind === 'route') selectRoute(entity.data);
      else if (entity.kind === 'place') selectCountry(entity.data);
      else selectEvent(entity.data);
    }
  });
  state.mapReady = true;
  $('#world-map').classList.add('map-ready');
  $('#map-loading')?.remove();
  updateMapData();
  applyLayerVisibility();
}

function mapStyleCandidates(style) {
  return [style];
}

function rasterStyle() {
  return { id: 'osm' };
}

function initializeFallbackMap() {
  return initializeMap();
}
function renderMapStatus() {
  if (!state.map || state.mapKind !== 'maplibre') return;
  const center = state.map.getCenter();
  $('#last-updated').textContent = `Z${state.map.getZoom().toFixed(1)} / ${center.lat.toFixed(1)}, ${center.lng.toFixed(1)}`;
}

function flyTo(lat, lon, zoom = 6) {
  if (!finite(lat) || !finite(lon)) return;
  if (state.mapKind === 'maplibre') state.map.flyTo({ center: [Number(lon), Number(lat)], zoom, duration: 650, essential: true });
  else state.map?.flyTo?.({ lat: Number(lat), lon: Number(lon) }, { zoom: Math.max(2, Math.round(zoom)), duration: 250 });
}

function showPopup(lon, lat, html) {
  if (state.mapKind !== 'maplibre' || !window.maplibregl || !finite(lon) || !finite(lat)) return;
  new window.maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '320px' }).setLngLat([Number(lon), Number(lat)]).setHTML(html).addTo(state.map);
}

function popupHtml(type, title, summary, metrics = []) {
  return `<div class="map-popup"><span>${escapeHtml(type)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary || '')}</p><div class="map-popup-grid">${metrics.slice(0, 4).map(item => `<div><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}</b></div>`).join('')}</div></div>`;
}

function selectAlert(alert) {
  if (alert.type === 'NEWS') selectNews(alert.data);
  else if (alert.type === 'PORT') selectPort(alert.data);
  else selectEvent(alert.data);
}

function selectEvent(event) {
  state.selected = { type: 'EVENT', data: event };
  const metrics = [
    { label: 'CATEGORY', value: categoryOf(event).toUpperCase() },
    { label: 'MAGNITUDE', value: finite(event.magnitude) ? `M${formatNumber(event.magnitude, 1)}` : '—' },
    { label: 'SEVERITY', value: `${eventScore(event)} / 100` },
    { label: 'AGE', value: ageLabel(event.time || event.updatedAt) },
    { label: 'SOURCE', value: SOURCE_LABELS[event.source] || event.source || '—' },
    { label: 'DEPTH', value: finite(event.attributes?.depthKm) ? `${formatNumber(event.attributes.depthKm, 1)} KM` : '—' }
  ];
  renderDetail('EVENT', event.title || 'Event', event.region || event.country || '', metrics, event.url ? [{ label: 'OPEN SOURCE', url: event.url }] : []);
  flyTo(event.lat, event.lon, categoryOf(event) === 'earthquake' ? 7 : 6);
  showPopup(event.lon, event.lat, popupHtml(categoryOf(event).toUpperCase(), event.title, event.region, metrics));
}

function selectNews(article) {
  state.selected = { type: 'NEWS', data: article };
  const point = cityOrCountryPoint(article);
  const metrics = [
    { label: 'SOURCE', value: article.sourceName || article.sourceDomain || '—' },
    { label: 'AGE', value: ageLabel(article.publishedAt) },
    { label: 'RELIABILITY', value: finite(article.reliability?.score) ? `${formatNumber(article.reliability.score)} / 100` : '—' },
    { label: 'CATEGORY', value: categoryOf(article).toUpperCase() }
  ];
  renderDetail('NEWS', article.title, article.summary || '', metrics, article.url ? [{ label: 'OPEN ARTICLE', url: article.url }] : []);
  if (point) {
    flyTo(point.lat, point.lon, 5.2);
    showPopup(point.lon, point.lat, popupHtml('NEWS', article.title, article.summary, metrics));
  }
}

function selectPort(port) {
  state.selected = { type: 'PORT', data: port };
  const metrics = [
    { label: 'RISK', value: finite(port.risk?.score) ? `${formatNumber(port.risk.score)} / 100` : '—' },
    { label: 'STATUS', value: port.risk?.band || '—' },
    { label: 'EVIDENCE', value: formatNumber(port.risk?.evidenceCount || 0) },
    { label: 'IMPORTANCE', value: `${formatNumber(port.importance || 0)} / 100` },
    { label: 'COUNTRY', value: port.country || '—' },
    { label: 'CARGO', value: (port.commodities || []).slice(0, 3).join(', ') || '—' }
  ];
  const money = state.shippingMoney.find(item => item.id === `port-money-${port.id}`);
  renderDetail('PORT', `${port.name}, ${port.country}`, money?.action || 'Port activity and route exposure.', metrics, [{ label: 'OPEN SHIPPING MONEY', action: () => openView('shipping') }]);
  flyTo(port.coordinates?.lat, port.coordinates?.lon, 7);
  showPopup(port.coordinates?.lon, port.coordinates?.lat, popupHtml('PORT', port.name, port.country, metrics));
}

function selectRoute(route) {
  state.selected = { type: 'ROUTE', data: route };
  const metrics = [
    { label: 'RISK', value: finite(route.risk?.score) ? `${formatNumber(route.risk.score)} / 100` : '—' },
    { label: 'STATUS', value: route.risk?.band || '—' },
    { label: 'CARGO', value: route.commodity || 'MIXED' },
    { label: 'LENGTH', value: finite(route.lengthKm) ? `${formatNumber(route.lengthKm)} KM` : '—' },
    { label: 'PORTS', value: formatNumber(route.portCount || 0) },
    { label: 'EVIDENCE', value: formatNumber(route.evidence?.length || route.eventCount || 0) }
  ];
  const money = state.shippingMoney.find(item => item.id === `route-money-${route.id}`);
  renderDetail('SHIPPING ROUTE', route.name, money?.action || 'Trade corridor and disruption exposure.', metrics, [{ label: 'OPEN SHIPPING MONEY', action: () => openView('shipping') }]);
}

function focusShippingRoute(routeId) {
  closeSheet();
  state.layers.routes = true;
  updateLayerButtons(); applyLayerVisibility();
  const feature = routesGeoJson().features.find(item => item.properties?.id === routeId);
  if (feature && state.mapKind === 'maplibre') {
    const coordinates = feature.geometry?.coordinates?.flat(Infinity);
    const pairs = feature.geometry?.type === 'MultiLineString' ? feature.geometry.coordinates.flat() : feature.geometry.coordinates;
    const bounds = pairs.reduce((result, coordinate) => result.extend(coordinate), new window.maplibregl.LngLatBounds(pairs[0], pairs[0]));
    state.map.fitBounds(bounds, { padding: 90, duration: 650 });
  }
  const route = state.shipping.routes.find(item => item.id === routeId);
  if (route) selectRoute(route);
}

async function selectPoint(point) {
  const place = nearestPlace(point);
  state.selectedPlace = place ? { ...place, lat: point.lat, lon: point.lon } : { name: 'Selected point', lat: point.lat, lon: point.lon, kind: 'POINT' };
  state.drawer = 'place'; state.drawerOpen = true; updateDrawerTabs(); renderDrawer();
  flyTo(point.lat, point.lon, 6);
  state.placeScan = null;
  renderPlaceDrawer();
  try {
    state.placeScan = await api.scan({ lat: point.lat, lon: point.lon, radiusKm: state.radiusKm, lookbackDays: state.windowDays });
    renderPlaceDrawer();
  } catch { renderPlaceDrawer(); }
}

function selectCountry(item) {
  const country = item.country;
  state.selectedPlace = { ...country, kind: 'COUNTRY', lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon, intelligenceItem: item };
  state.drawer = 'place'; state.drawerOpen = true; updateDrawerTabs(); renderDrawer();
  flyTo(state.selectedPlace.lat, state.selectedPlace.lon, 4.8);
}

function renderDetail(type, title, summary, metrics, actions = []) {
  $('#detail-type').textContent = type;
  $('#detail-title').textContent = title || 'Selection';
  $('#detail-summary').textContent = summary || '';
  $('#detail-metrics').innerHTML = metrics.map(item => `<div class="detail-metric"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join('');
  const actionContainer = $('#detail-actions');
  actionContainer.innerHTML = '';
  for (const action of actions) {
    const element = action.url ? document.createElement('a') : document.createElement('button');
    element.textContent = action.label;
    if (action.url) { element.href = action.url; element.target = '_blank'; element.rel = 'noopener noreferrer'; }
    else element.addEventListener('click', action.action);
    actionContainer.append(element);
  }
  $('#map-detail').classList.remove('hidden');
}

function renderDrawer() {
  if (!state.drawerOpen) { $('#map-drawer').classList.add('closed'); return; }
  $('#map-drawer').classList.remove('closed');
  if (state.drawer === 'alerts') renderAlertDrawer();
  if (state.drawer === 'news') renderNewsDrawer();
  if (state.drawer === 'shipping') renderShippingDrawer();
  if (state.drawer === 'markets') renderMarketsDrawer();
  if (state.drawer === 'place') renderPlaceDrawer();
}

function renderAlertDrawer() {
  const content = $('#drawer-content');
  const items = state.alerts.slice(0, 40);
  content.innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>LIVE GLOBAL ALERTS</span><b>${items.length}</b></div><div class="feed-list">${items.map(alert => feedItemHtml({
    colour: alert.type === 'NEWS' ? COLORS.news : alert.type === 'PORT' ? COLORS.port : COLORS.alert,
    title: alert.title, meta: `${alert.type} · ${ageLabel(alert.time)} · SCORE ${alert.score}`, score: alert.score, id: alert.id, summary: alert.summary
  })).join('')}</div></section>`;
  bindFeedClicks(items, item => selectAlert(item));
}

function renderNewsDrawer() {
  const content = $('#drawer-content');
  const articles = state.news.articles.slice(0, 45);
  content.innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>VERIFIED NEWS</span><b>${articles.length}</b></div><div class="feed-list">${articles.map(article => feedItemHtml({
    colour: COLORS.news, title: article.title, meta: `${article.sourceName || article.sourceDomain || 'NEWS'} · ${ageLabel(article.publishedAt)} · ${categoryOf(article).toUpperCase()}`,
    score: article.reliability?.score || '—', id: article.id, summary: article.summary
  })).join('')}</div></section>`;
  bindFeedClicks(articles, item => selectNews(item));
}

function renderShippingDrawer() {
  const topPorts = state.shipping.ports.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 12);
  const topRoutes = state.shipping.routes.slice().sort((a, b) => Number(b.risk?.score || 0) - Number(a.risk?.score || 0)).slice(0, 10);
  $('#drawer-content').innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>ROUTES TO WATCH</span><b>${topRoutes.length}</b></div><div class="feed-list">${topRoutes.map(route => feedItemHtml({ colour: COLORS.route, title: route.name, meta: `${route.commodity || 'MIXED'} · ${route.risk?.band || 'LOW'}`, score: formatNumber(route.risk?.score || 0), id: route.id, summary: `Action: ${state.shippingMoney.find(item => item.id === `route-money-${route.id}`)?.action || 'Monitor route exposure.'}` })).join('')}</div></section><section class="drawer-section"><div class="drawer-section-title"><span>PORTS TO WATCH</span><b>${topPorts.length}</b></div><div class="feed-list">${topPorts.map(port => feedItemHtml({ colour: COLORS.port, title: `${port.name}, ${port.country}`, meta: `${port.risk?.band || 'LOW'} · ${(port.commodities || []).slice(0, 2).join(', ')}`, score: formatNumber(port.risk?.score || 0), id: port.id })).join('')}</div></section>`;
  bindFeedClicks(topRoutes, item => selectRoute(item));
  bindFeedClicks(topPorts, item => selectPort(item));
}

function renderMarketsDrawer() {
  const results = state.markets.results || [];
  $('#drawer-content').innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>MARKET SNAPSHOT</span><b>${results.length}</b></div><div class="market-grid" style="grid-template-columns:1fr">${results.map(marketCardHtml).join('')}</div></section>`;
}

function renderPlaceDrawer() {
  const content = $('#drawer-content');
  const place = state.selectedPlace;
  if (!place) {
    content.innerHTML = '<div class="drawer-empty">CLICK ANYWHERE ON THE MAP OR SEARCH FOR A CITY, COUNTRY OR PORT.<br>THE PANEL WILL SHOW LOCAL EVENTS, DATA COVERAGE AND FINANCIAL EXPOSURE.</div>';
    return;
  }
  const scan = state.placeScan;
  const intelligenceItem = place.intelligenceItem || state.intelligence.countries.find(item => item.country?.iso2 === place.iso2 || item.country?.iso2 === place.countryCode);
  const metrics = intelligenceItem ? placeDisplayMetrics(intelligenceItem) : null;
  const eventCount = scan?.events?.length ?? intelligenceItem?.eventCount ?? 0;
  const probability = scan?.metrics?.estimateSupported ? scan.metrics.eventProbability24h : null;
  const coverage = scan?.metrics?.sourceCoveragePct ?? metrics?.coverage ?? null;
  const nextEvent = scan?.metrics?.expectedNextEventHours;
  const name = place.name || place.displayName || place.country || 'Selected place';
  content.innerHTML = `<section class="drawer-section"><div class="drawer-section-title"><span>${escapeHtml(place.kind || 'PLACE')}</span><b>${finite(place.lat) ? `${Number(place.lat).toFixed(2)}, ${Number(place.lon).toFixed(2)}` : ''}</b></div><h2 style="margin:0;font:800 25px var(--condensed)">${escapeHtml(name)}</h2><p class="feed-summary">${escapeHtml(place.country || place.region || place.subregion || '')}</p></section><div class="drawer-stat-grid">
    ${drawerStat('EVENT IN NEXT 24H', finite(probability) ? `${formatNumber(probability)}%` : 'NO ESTIMATE', finite(scan?.metrics?.sampleSize) ? `${scan.metrics.sampleSize} nearby records` : 'Local evidence')}
    ${drawerStat('NEARBY EVENTS', formatNumber(eventCount), `${state.windowDays} day window`)}
    ${drawerStat('DATA COVERAGE', finite(coverage) ? `${formatNumber(coverage)}%` : 'NOT MEASURED', 'Active sources')}
    ${drawerStat('NEXT EXPECTED EVENT', finite(nextEvent) ? (nextEvent < 48 ? `${formatNumber(nextEvent)} H` : `${formatNumber(nextEvent / 24)} D`) : 'NO ESTIMATE', 'Based on local rate')}
    ${drawerStat('CONFLICT ACTIVITY', finite(metrics?.conflict) ? `${formatNumber(metrics.conflict)} / 100` : 'NO LIVE DATA', 'Country evidence')}
    ${drawerStat('NATURAL HAZARDS', finite(metrics?.disaster) ? `${formatNumber(metrics.disaster)} / 100` : 'NO LIVE DATA', 'Country evidence')}
  </div>${scan?.events?.length ? `<section class="drawer-section"><div class="drawer-section-title"><span>NEAREST EVENTS</span><b>${scan.events.length}</b></div><div class="feed-list">${scan.events.slice(0, 15).map(event => feedItemHtml({ colour: eventColour(event), title: event.title, meta: `${categoryOf(event).toUpperCase()} · ${ageLabel(event.time)} · ${formatNumber(event.distanceKm)} KM`, score: eventScore(event), id: event.id })).join('')}</div></section>` : ''}`;
  if (scan?.events?.length) bindFeedClicks(scan.events.slice(0, 15), item => selectEvent(item));
}

function drawerStat(label, value, note) { return `<div class="drawer-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`; }

function feedItemHtml({ colour, title, meta, score, id, summary }) {
  return `<article class="feed-item" data-feed-id="${escapeHtml(id)}"><i class="feed-colour" style="background:${colour}"></i><div><h3 class="feed-title">${escapeHtml(title)}</h3><div class="feed-meta">${escapeHtml(meta || '')}</div>${summary ? `<p class="feed-summary">${escapeHtml(summary)}</p>` : ''}</div><strong class="feed-score">${escapeHtml(score)}</strong></article>`;
}

function bindFeedClicks(items, handler) {
  for (const element of $$('#drawer-content [data-feed-id]')) {
    const item = items.find(candidate => String(candidate.id) === element.dataset.feedId || `event:${candidate.id}` === element.dataset.feedId || `news:${candidate.id}` === element.dataset.feedId || `port:${candidate.id}` === element.dataset.feedId);
    if (item) element.addEventListener('click', () => handler(item));
  }
}

function updateDrawerTabs() {
  $$('.drawer-tab').forEach(button => button.classList.toggle('active', button.dataset.drawer === state.drawer));
}

function openView(view) {
  state.view = view;
  document.documentElement.dataset.view = view;
  $$('.merlin-nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'map') { closeSheet(); return; }
  $('#workspace-sheet').classList.remove('hidden');
  $('#sheet-search').value = '';
  if (view === 'opportunities') renderOpportunitySheet();
  if (view === 'shipping') renderShippingSheet();
  if (view === 'markets') renderMarketsSheet();
  if (view === 'places') renderPlacesSheet();
}

function closeSheet() {
  state.view = 'map';
  $('#workspace-sheet').classList.add('hidden');
  $$('.merlin-nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === 'map'));
  setTimeout(() => state.map?.resize?.(), 50);
}

function renderOpportunitySheet(filter = '') {
  const items = state.opportunities.filter(item => `${item.title} ${item.kind} ${item.target} ${item.source}`.toLowerCase().includes(filter.toLowerCase()));
  $('#sheet-kicker').textContent = 'WORLD EVENTS → MONEY PATHS';
  $('#sheet-title').textContent = 'OPPORTUNITIES';
  $('#sheet-summary').innerHTML = summaryMetrics([
    ['RANKED', items.length, 'current cards'], ['HIGH SCORE', items.filter(item => item.score >= 70).length, '70+'], ['LOW CAPITAL', items.filter(item => item.capital?.includes('£0')).length, 'starts at £0'], ['MARKET / TRADE', items.filter(item => /MARKET|TRADE|ENERGY|SHIPPING/.test(item.kind)).length, 'exposure'], ['UPDATED', ageLabel(state.lastUpdated), 'snapshot age']
  ]);
  $('#sheet-content').innerHTML = `<div class="card-grid">${items.map(moneyCardHtml).join('')}</div>`;
  bindMoneyCardActions(items);
}

function renderShippingSheet(filter = '') {
  const items = state.shippingMoney.filter(item => `${item.title} ${item.kind} ${item.target}`.toLowerCase().includes(filter.toLowerCase()));
  $('#sheet-kicker').textContent = 'ROUTES / PORTS / COMMODITIES';
  $('#sheet-title').textContent = 'SHIPPING MONEY';
  $('#sheet-summary').innerHTML = summaryMetrics([
    ['OPPORTUNITIES', items.length, 'ranked'], ['PORTS', state.shipping.ports.length, 'monitored'], ['ROUTES', state.shipping.routes.length, 'global corridors'], ['CHOKEPOINTS', state.shipping.chokepoints.length, 'critical nodes'], ['TOP RISK', formatNumber(Math.max(0, ...state.shipping.ports.map(port => Number(port.risk?.score || 0)))), '0–100']
  ]);
  $('#sheet-content').innerHTML = `<div class="card-grid">${items.map(moneyCardHtml).join('')}</div>`;
  bindMoneyCardActions(items);
}

function moneyCardHtml(item) {
  return `<article class="money-card" data-money-id="${escapeHtml(item.id)}"><header class="money-card-head"><div><span class="money-card-type">${escapeHtml(item.kind)}</span><h3>${escapeHtml(item.title)}</h3></div><div class="money-score"><strong>${formatNumber(item.score)}</strong><span>RANK</span></div></header><div class="money-card-numbers">
    ${moneyNumber('IMPACT CHANCE', `${formatNumber(item.impactChance)}%`)}${moneyNumber('WINDOW', item.window)}${moneyNumber('STARTING CAPITAL', item.capital)}${moneyNumber('POTENTIAL VALUE', item.range)}
  </div><div class="money-card-body"><p>${escapeHtml(item.summary)}</p><div class="action-path"><div class="action-row"><span>WHERE</span><b>${escapeHtml(item.where)}</b></div><div class="action-row"><span>ACTION</span><b>${escapeHtml(item.action)}</b></div><div class="action-row"><span>TARGET</span><b>${escapeHtml(item.target)}</b></div><div class="action-row"><span>EVIDENCE</span><b>${escapeHtml(`${item.source} · ${ageLabel(item.time)} · confidence ${formatNumber(item.confidence)}%`)}</b></div></div></div><footer class="money-card-actions">${(item.links || []).map((link, index) => `<button type="button" data-link-index="${index}">${escapeHtml(link.label)}</button>`).join('')}</footer></article>`;
}
function moneyNumber(label, value) { return `<div class="money-number"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }

function bindMoneyCardActions(items) {
  for (const card of $$('#sheet-content [data-money-id]')) {
    const item = items.find(candidate => candidate.id === card.dataset.moneyId);
    if (!item) continue;
    card.querySelectorAll('[data-link-index]').forEach(button => {
      const link = item.links[Number(button.dataset.linkIndex)];
      button.addEventListener('click', () => { if (link.action) link.action(); else if (link.url) window.open(link.url, '_blank', 'noopener,noreferrer'); });
    });
  }
}

function renderMarketsSheet(filter = '') {
  const results = (state.markets.results || []).filter(item => `${item.asset?.symbol} ${item.asset?.name}`.toLowerCase().includes(filter.toLowerCase()));
  $('#sheet-kicker').textContent = 'PRICE / MOVE / SOURCE';
  $('#sheet-title').textContent = 'MARKETS';
  const priced = results.filter(item => finite(item.quote?.price));
  $('#sheet-summary').innerHTML = summaryMetrics([
    ['ASSETS', results.length, 'watchlist'], ['PRICED', priced.length, 'current snapshot'], ['UP 24H', priced.filter(item => Number(item.quote?.change24h) > 0).length, 'assets'], ['DOWN 24H', priced.filter(item => Number(item.quote?.change24h) < 0).length, 'assets'], ['UPDATED', ageLabel(state.markets.generatedAt), 'snapshot age']
  ]);
  $('#sheet-content').innerHTML = `<div class="market-grid">${results.map(marketCardHtml).join('')}</div>`;
}

function marketCardHtml(item) {
  const quote = item.quote || {};
  const change = finite(quote.change24h) ? Number(quote.change24h) * 100 : null;
  const width = finite(change) ? clamp(50 + change * 3, 3, 97) : 50;
  return `<article class="market-card"><div class="market-card-head"><div><div class="market-symbol">${escapeHtml(item.asset?.symbol || quote.symbol || '—')}</div><div class="market-name">${escapeHtml(item.asset?.name || '')}</div></div><div><div class="market-price">${formatMarketPrice(quote.price)}</div><div class="market-change ${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}">${finite(change) ? formatPercent(change, 2, true) : 'NO 24H MOVE'}</div></div></div><div class="market-bar"><i style="width:${width}%"></i></div><div class="feed-meta" style="margin-top:10px"><span>${escapeHtml(item.source?.quote?.id || 'SNAPSHOT')}</span><span>${escapeHtml(item.available ? 'HISTORY READY' : 'PRICE ONLY')}</span></div></article>`;
}

function renderPlacesSheet(filter = '') {
  const items = state.intelligence.countries.filter(item => `${item.country?.name} ${item.country?.region} ${item.country?.iso2}`.toLowerCase().includes(filter.toLowerCase()));
  const measured = items.filter(item => placeDisplayMetrics(item).measured);
  $('#sheet-kicker').textContent = 'COUNTRY / CITY INTELLIGENCE';
  $('#sheet-title').textContent = 'PLACES';
  $('#sheet-summary').innerHTML = summaryMetrics([
    ['COUNTRIES', items.length, 'catalogue'], ['WITH LIVE DATA', measured.length, 'measured'], ['CITIES', state.intelligenceCatalog.cities.length, 'searchable'], ['EVENTS', state.events.length, 'global'], ['UPDATED', ageLabel(state.intelligence.generatedAt), 'snapshot age']
  ]);
  $('#sheet-content').innerHTML = `<div class="place-layout"><div class="place-list">${items.map(item => {
    const metrics = placeDisplayMetrics(item); const country = item.country;
    return `<div class="place-row" data-place-id="${escapeHtml(country.id)}"><div><strong>${escapeHtml(country.name)}</strong><span>${escapeHtml(`${country.capital || '—'} · ${country.region || '—'}`)}</span></div><div class="place-risk ${metrics.risk >= 70 ? 'down' : metrics.risk >= 45 ? '' : metrics.risk !== null ? 'up' : 'neutral'}">${metrics.risk !== null ? metrics.risk : '—'}</div></div>`;
  }).join('')}</div><div id="place-sheet-detail" class="place-detail"><div class="drawer-empty">SELECT A COUNTRY. COUNTRIES WITHOUT MEASURED LIVE EVIDENCE SHOW NO SCORE INSTEAD OF A DEFAULT NUMBER.</div></div></div>`;
  $$('#sheet-content [data-place-id]').forEach(row => row.addEventListener('click', () => {
    const item = items.find(candidate => candidate.country?.id === row.dataset.placeId);
    if (item) renderPlaceSheetDetail(item);
  }));
}

function renderPlaceSheetDetail(item) {
  const country = item.country; const metrics = placeDisplayMetrics(item);
  $('#place-sheet-detail').innerHTML = `<div class="place-detail-head"><h2>${escapeHtml(country.name)}</h2><p>${escapeHtml(`${country.capital || '—'} · ${country.region || '—'} · ${country.iso2 || ''}`)}</p></div><div class="place-detail-grid">
    ${placeSheetStat('OVERALL LIVE RISK', metrics.risk !== null ? `${metrics.risk} / 100` : 'NO LIVE SCORE')}
    ${placeSheetStat('DATA COVERAGE', metrics.measured ? `${metrics.coverage}%` : 'NO LIVE DATA')}
    ${placeSheetStat('CONFLICT ACTIVITY', finite(metrics.conflict) ? `${formatNumber(metrics.conflict)} / 100` : 'NO LIVE DATA')}
    ${placeSheetStat('NATURAL HAZARDS', finite(metrics.disaster) ? `${formatNumber(metrics.disaster)} / 100` : 'NO LIVE DATA')}
    ${placeSheetStat('RECORDED EVENTS', formatNumber(item.eventCount || 0))}
    ${placeSheetStat('NEWS STORIES', formatNumber(item.storyCount || 0))}
    ${placeSheetStat('POPULATION', formatNumber(country.populationBaseline || 0))}
    ${placeSheetStat('CURRENCY', (country.currencies || []).join(', ') || '—')}
    ${placeSheetStat('TIME ZONES', String((country.timezones || []).length))}
  </div><div class="detail-actions"><button id="place-show-map" type="button">SHOW ON MAP</button></div>`;
  $('#place-show-map').addEventListener('click', () => { closeSheet(); selectCountry(item); });
}
function placeSheetStat(label, value) { return `<div class="place-detail-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }

function summaryMetrics(items) { return items.map(item => `<div class="summary-metric"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong><small>${escapeHtml(item[2])}</small></div>`).join(''); }

function updateLayerButtons() {
  $$('.layer-button').forEach(button => button.classList.toggle('active', Boolean(state.layers[button.dataset.layer])));
}

function updateClock() { $('#utc-clock').textContent = `${new Date().toISOString().slice(11, 19)} UTC`; }

function toast(message) {
  const element = $('#map-toast'); element.textContent = message; element.classList.remove('hidden');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.add('hidden'), 2600);
}

function searchLocal(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const coordinateMatch = normalized.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (coordinateMatch) return [{ kind: 'COORDINATES', name: `${coordinateMatch[1]}, ${coordinateMatch[2]}`, lat: Number(coordinateMatch[1]), lon: Number(coordinateMatch[2]), subtitle: 'Coordinates' }];
  const results = [];
  for (const city of state.intelligenceCatalog.cities) {
    const text = `${city.name} ${city.country} ${city.countryCode}`.toLowerCase();
    if (text.includes(normalized)) results.push({ kind: 'CITY', name: city.name, subtitle: city.country || city.countryCode, lat: city.lat, lon: city.lon, data: city });
  }
  for (const country of state.intelligenceCatalog.countries) {
    const text = `${country.name} ${country.nativeName} ${country.iso2} ${country.iso3} ${(country.aliases || []).join(' ')}`.toLowerCase();
    if (text.includes(normalized)) results.push({ kind: 'COUNTRY', name: country.name, subtitle: country.capital || country.region, lat: country.capitalLat ?? country.lat, lon: country.capitalLon ?? country.lon, data: country });
  }
  for (const port of state.shipping.ports) {
    const text = `${port.name} ${port.country} ${port.unlocode}`.toLowerCase();
    if (text.includes(normalized)) results.push({ kind: 'PORT', name: port.name, subtitle: port.country, lat: port.coordinates?.lat, lon: port.coordinates?.lon, data: port });
  }
  return results.sort((a, b) => (a.name.toLowerCase().startsWith(normalized) ? -1 : 0) - (b.name.toLowerCase().startsWith(normalized) ? -1 : 0)).slice(0, 18);
}

function renderSearchResults() {
  const container = $('#search-results');
  if (!state.searchResults.length) { container.classList.add('hidden'); container.innerHTML = ''; return; }
  container.innerHTML = state.searchResults.map((item, index) => `<button class="search-result" data-search-index="${index}" type="button"><span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.subtitle || '')}</span></span><span>${escapeHtml(item.kind)}</span></button>`).join('');
  container.classList.remove('hidden');
  container.querySelectorAll('[data-search-index]').forEach(button => button.addEventListener('click', () => selectSearchResult(state.searchResults[Number(button.dataset.searchIndex)])));
}

function selectSearchResult(result) {
  $('#global-search').value = result.name; state.searchResults = []; renderSearchResults();
  if (result.kind === 'PORT') selectPort(result.data);
  else if (result.kind === 'COUNTRY') {
    const item = state.intelligence.countries.find(candidate => candidate.country?.iso2 === result.data.iso2);
    if (item) selectCountry(item); else selectPoint({ lat: result.lat, lon: result.lon });
  } else selectPoint({ lat: result.lat, lon: result.lon });
}

async function refreshLive({ quiet = false } = {}) {
  if (state.polling) return;
  state.polling = true;
  if (!quiet) toast('REFRESHING LIVE SOURCES');
  const days = state.windowDays;
  const tasks = await Promise.allSettled([
    api.events({ lookbackDays: days, limit: 5000 }),
    api.newsLive({ hours: Math.max(24, days * 24), limit: 120 }, { timeoutMs: 5_500 }),
    api.shippingSnapshotLive({ hours: Math.max(48, days * 24) }, { timeoutMs: 6_500 }),
    api.marketScreenerLive({ asset: 'btc-usd,eth-usd,sol-usd,bnb-usd,xrp-usd,ada-usd,doge-usd,avax-usd', timeframe: '1h' }, { timeoutMs: 7_000 })
  ]);
  if (tasks[0].status === 'fulfilled' && tasks[0].value.events?.length) state.events = tasks[0].value.events;
  if (tasks[1].status === 'fulfilled' && tasks[1].value.articles?.length) state.news = tasks[1].value;
  if (tasks[2].status === 'fulfilled' && tasks[2].value.ports?.length) state.shipping = tasks[2].value;
  if (tasks[3].status === 'fulfilled' && tasks[3].value.results?.length) state.markets = tasks[3].value;
  state.lastUpdated = new Date();
  buildAlerts(); buildShippingMoney(); buildOpportunities();
  updateHeader(); updateMapData(); renderDrawer();
  if (!quiet) toast('LIVE DATA UPDATED');
  state.polling = false;
}

function bindUi() {
  $$('.merlin-nav-item').forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
  $('#home-button').addEventListener('click', closeSheet);
  $('#sheet-close').addEventListener('click', closeSheet);
  $('#sheet-refresh').addEventListener('click', () => refreshLive().then(() => openView(state.view)));
  $('#sheet-search').addEventListener('input', event => {
    const query = event.target.value;
    if (state.view === 'opportunities') renderOpportunitySheet(query);
    if (state.view === 'shipping') renderShippingSheet(query);
    if (state.view === 'markets') renderMarketsSheet(query);
    if (state.view === 'places') renderPlacesSheet(query);
    event.target.focus(); event.target.setSelectionRange(query.length, query.length);
  });
  $$('.drawer-tab').forEach(button => button.addEventListener('click', () => { state.drawer = button.dataset.drawer; state.drawerOpen = true; updateDrawerTabs(); renderDrawer(); }));
  $('#drawer-close').addEventListener('click', () => { state.drawerOpen = false; renderDrawer(); });
  $('#layout-toggle').addEventListener('click', () => { state.drawerOpen = !state.drawerOpen; renderDrawer(); });
  $('#collapse-layers').addEventListener('click', () => $('#layer-dock').classList.toggle('collapsed'));
  $$('.layer-button').forEach(button => button.addEventListener('click', () => { const layer = button.dataset.layer; state.layers[layer] = !state.layers[layer]; updateLayerButtons(); applyLayerVisibility(); }));
  $('#base-style').addEventListener('change', event => changeBaseStyle(event.target.value));
  $('#event-window').addEventListener('change', event => { state.windowDays = Number(event.target.value); refreshLive(); });
  $('#radius-select').addEventListener('change', event => { state.radiusKm = Number(event.target.value); if (state.selectedPlace) selectPoint({ lat: state.selectedPlace.lat, lon: state.selectedPlace.lon }); });
  $('#refresh-live').addEventListener('click', () => refreshLive());
  $('#zoom-in').addEventListener('click', () => state.mapKind === 'maplibre' ? state.map.zoomIn() : state.map?.setZoom?.((state.map.zoom || 1) + 1));
  $('#zoom-out').addEventListener('click', () => state.mapKind === 'maplibre' ? state.map.zoomOut() : state.map?.setZoom?.((state.map.zoom || 1) - 1));
  $('#world-view').addEventListener('click', () => state.mapKind === 'maplibre' ? state.map.flyTo({ center: [3, 24], zoom: 2.15, duration: 600 }) : state.map?.flyTo?.({ lat: 0, lon: 0 }, { zoom: 1 }));
  $('#locate-me').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('LOCATION NOT AVAILABLE');
    navigator.geolocation.getCurrentPosition(position => selectPoint({ lat: position.coords.latitude, lon: position.coords.longitude }), () => toast('LOCATION PERMISSION DENIED'), { timeout: 7_000 });
  });
  $('#detail-close').addEventListener('click', () => $('#map-detail').classList.add('hidden'));
  const search = $('#global-search');
  search.addEventListener('input', () => { state.searchResults = searchLocal(search.value); renderSearchResults(); });
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); const result = state.searchResults[0] || searchLocal(search.value)[0]; if (result) selectSearchResult(result); }
    if (event.key === 'Escape') { state.searchResults = []; renderSearchResults(); search.blur(); }
  });
  document.addEventListener('keydown', event => { if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') { event.preventDefault(); search.focus(); } if (event.key === 'Escape' && !$('#workspace-sheet').classList.contains('hidden')) closeSheet(); });
}

function changeBaseStyle(style) {
  state.mapStyle = style;
  if (state.mapKind === 'tile') {
    state.map?.setTileMode?.(style);
    return;
  }
  if (state.mapKind !== 'maplibre') return;
  const chosen = mapStyleCandidates(style)[0];
  state.map.setStyle(chosen);
  state.map.once('style.load', () => { addMapLayers(); updateMapData(); });
}

function disableAudioAndOldWorkers() {
  try {
    const keys = Object.keys(window.localStorage || {}).filter(key => /sound|audio|experience/i.test(key));
    for (const key of keys) window.localStorage.removeItem(key);
    window.localStorage.setItem('merlin.sound.mode', 'OFF');
  } catch {}
  if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister())).catch(() => {});
}

async function boot() {
  document.documentElement.dataset.version = VERSION;
  disableAudioAndOldWorkers();
  bindUi();
  updateClock();
  setInterval(updateClock, 1000);
  updateHeader();
  updateLayerButtons();
  updateDrawerTabs();
  renderDrawer();
  await initializeMap();
  loadPreloads().then(() => {
    setTimeout(() => refreshLive({ quiet: true }), 8_000);
  }).catch(error => { console.error('Bootstrap data failed', error); toast('LOCAL DATA COULD NOT BE LOADED'); });
  setInterval(() => refreshLive({ quiet: true }), 300_000);
}

boot().catch(error => {
  console.error('Merlin boot failed', error);
  $('#map-loading').innerHTML = '<b>MAP STARTUP FAILED — REFRESH PAGE</b>';
});

})();
