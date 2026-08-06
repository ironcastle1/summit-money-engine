import { MapEngineV20 } from './map-v20/map-engine.js';

const HOUR = 3_600_000;
const EARTHQUAKE_RE = /\b(earthquake|aftershock|seismic|quake|magnitude\s*[0-9])\b/i;
const CONFLICT_RE = /\b(war|conflict|missile|drone strike|airstrike|shelling|military|troops|ceasefire|terror|attack|armed|invasion|frontline|hostilities)\b/i;
const DISRUPTION_RE = /\b(flood|storm|cyclone|hurricane|typhoon|wildfire|volcano|landslide|drought|outage|port closure|closed port|shipping disruption|supply disruption|evacuation)\b/i;
const BUSINESS_RE = /\b(market|trade|economy|economic|inflation|interest rate|central bank|commodity|oil|gas|shipping|supply chain|tariff|sanction|currency|earnings|investment|business)\b/i;

const state = {
  hours: 24,
  view: 'map',
  feedFilter: 'all',
  opportunityFilter: 'all',
  opportunitySearch: '',
  map: null,
  staticReady: false,
  loading: false,
  countries: [],
  cities: [],
  ports: [],
  routes: [],
  countryByCode: new Map(),
  countryByName: new Map(),
  locationAliases: [],
  events: [],
  news: [],
  markets: [],
  opportunities: [],
  sources: {},
  lastUpdated: null,
  saved: loadSaved()
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const byId = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanText(value, fallback = '') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function finite(value) { return Number.isFinite(Number(value)); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
function timestamp(value) { const parsed = Date.parse(value || ''); return Number.isFinite(parsed) ? parsed : 0; }
function itemTime(item) { return timestamp(item.time || item.publishedAt || item.observedAt || item.updatedAt || item.generatedAt); }
function isFresh(item, hours = state.hours) { const time = itemTime(item); return time > 0 && time >= Date.now() - hours * HOUR; }

function ageLabel(value) {
  const time = typeof value === 'number' ? value : timestamp(value);
  if (!time) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatNumber(value, digits = 0) {
  if (!finite(value)) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function formatPrice(value) {
  if (!finite(value)) return '—';
  const number = Number(value);
  const digits = number >= 1000 ? 0 : number >= 1 ? 2 : number >= .01 ? 4 : 6;
  return `US$${number.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}

function formatPercent(value) {
  if (!finite(value)) return '—';
  const number = Math.abs(Number(value)) <= 1.5 ? Number(value) * 100 : Number(value);
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
}

function toast(message) {
  const root = byId('toast');
  root.textContent = message;
  root.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => root.classList.remove('show'), 2600);
}

async function fetchJson(url, timeoutMs = 8500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function safeFetch(url, timeoutMs) {
  try { return await fetchJson(url, timeoutMs); }
  catch (error) { console.warn(`Merlin request failed: ${url}`, error); return null; }
}

function eventGroup(item) {
  const value = `${item.category || ''} ${item.title || ''} ${item.summary || ''}`.toLowerCase();
  if (CONFLICT_RE.test(value)) return 'conflict';
  if (DISRUPTION_RE.test(value)) return 'disruption';
  if (BUSINESS_RE.test(value)) return 'business';
  return 'event';
}

function colourFor(group) {
  return { conflict: '#d64045', disruption: '#d97706', business: '#6d4aff', news: '#5663dc', event: '#2563eb' }[group] || '#2563eb';
}

function countryForCode(code) {
  return state.countryByCode.get(String(code || '').toUpperCase()) || null;
}

function countryForValue(value) {
  const key = String(value || '').trim().toLowerCase();
  return state.countryByName.get(key) || countryForCode(value) || null;
}

function findLocationInText(text) {
  const haystack = ` ${String(text || '').toLowerCase()} `;
  for (const item of state.locationAliases) {
    if (haystack.includes(` ${item.alias} `) || haystack.includes(item.alias)) return item.record;
  }
  return null;
}

function mapPointForArticle(article) {
  for (const code of article.countries || []) {
    const country = countryForCode(code);
    if (country) return { lat: country.lat, lon: country.lon, countryCode: country.iso2, countryName: country.name };
  }
  const location = findLocationInText(`${article.title || ''} ${(article.entities || []).join(' ')} ${article.summary || ''}`);
  if (location) return { lat: location.lat, lon: location.lon, countryCode: location.countryCode || location.iso2, countryName: location.country || location.name };
  return null;
}

function normalizeEvent(item, index) {
  const title = cleanText(item.title || item.name, 'Current event');
  const category = cleanText(item.category || item.kind, 'event').toLowerCase();
  if (category === 'earthquake' || EARTHQUAKE_RE.test(title)) return null;
  const lat = Number(item.lat ?? item.latitude ?? item.coordinates?.lat);
  const lon = Number(item.lon ?? item.longitude ?? item.coordinates?.lon);
  const group = eventGroup({ ...item, category, title });
  const country = countryForValue(item.country || item.countryCode);
  const severityRaw = Number(item.severity ?? item.severityScore ?? item.attributes?.severity ?? 40);
  const severity = severityRaw <= 5 ? severityRaw * 20 : clamp(severityRaw, 0, 100);
  return {
    ...item,
    id: String(item.id || `event-${index}`),
    _type: 'event',
    title,
    summary: cleanText(item.summary || item.description || item.region || item.country, 'No further description was supplied by the source.'),
    category,
    group,
    colour: colourFor(group),
    severity,
    lat,
    lon,
    countryCode: String(item.countryCode || country?.iso2 || '').toUpperCase(),
    countryName: item.country || country?.name || '',
    time: item.time || item.occurredAt || item.updatedAt,
    sourceLabel: cleanText(item.source || item.sourceName, 'Public source'),
    url: item.url || null
  };
}

function normalizeArticle(item, index) {
  const title = cleanText(item.title, 'Untitled report');
  const summary = cleanText(item.summary || item.description, 'Open the original source for the full report.');
  if (String(item.category || '').toLowerCase() === 'earthquake' || EARTHQUAKE_RE.test(`${title} ${summary}`)) return null;
  const group = CONFLICT_RE.test(`${title} ${summary}`)
    ? 'conflict'
    : DISRUPTION_RE.test(`${title} ${summary}`)
      ? 'disruption'
      : BUSINESS_RE.test(`${title} ${summary}`)
        ? 'business'
        : 'news';
  const mapPoint = mapPointForArticle(item);
  return {
    ...item,
    id: String(item.id || `news-${index}`),
    _type: 'news',
    title,
    summary,
    group,
    colour: colourFor(group),
    publishedAt: item.publishedAt || item.discoveredAt,
    sourceLabel: cleanText(item.sourceName || item.source || item.sourceDomain, 'Public source'),
    mapPoint,
    countryCode: mapPoint?.countryCode || (item.countries || [])[0] || '',
    countryName: mapPoint?.countryName || '',
    url: item.url || item.externalId || null
  };
}

function normalizeMarket(item, index) {
  const asset = item.asset || {};
  const quote = item.quote || item.latest || {};
  return {
    id: String(asset.id || item.assetId || `market-${index}`),
    symbol: cleanText(asset.symbol || item.symbol, '—').toUpperCase(),
    name: cleanText(asset.name || item.name, asset.symbol || item.symbol || 'Market'),
    price: Number(quote.price ?? item.price),
    change: Number(quote.change24h ?? item.change24h ?? item.change),
    source: cleanText(item.source?.id || item.source?.source || item.source, 'Public exchange'),
    generatedAt: item.generatedAt || quote.time || new Date().toISOString(),
    raw: item
  };
}

function normalizeOpportunity(item, index) {
  return {
    ...item,
    id: String(item.id || `opportunity-${index}`),
    _type: 'opportunity',
    title: cleanText(item.title, 'Research lead'),
    subtitle: cleanText(item.subtitle || item.category, 'Current signal'),
    kind: cleanText(item.kind, 'EVENT').toUpperCase(),
    score: clamp(item.score ?? 50, 0, 100),
    confidence: finite(item.confidence) ? clamp(item.confidence, 0, 100) : null,
    risk: finite(item.risk) ? clamp(item.risk, 0, 100) : null,
    observedAt: item.observedAt || item.generatedAt || new Date().toISOString(),
    summary: opportunitySummary(item),
    nextCheck: opportunityNextCheck(item),
    whoBenefits: opportunityWhoBenefits(item),
    action: opportunityAction(item),
    url: item.metadata?.url || item.url || null
  };
}

function opportunitySummary(item) {
  if (item.summary) return cleanText(item.summary);
  if (String(item.kind).toUpperCase() === 'MARKET') return `A current market signal has been detected for ${item.symbol || item.title}. Treat it as a research lead, not a guaranteed trade.`;
  if (String(item.kind).toUpperCase() === 'PREDICTION') return `Public prediction-market pricing is showing a notable probability or momentum signal.`;
  return `A recent world event may affect trade, demand, costs, supply chains or local risk.`;
}

function opportunityNextCheck(item) {
  if (item.assetId || item.symbol) return 'Check price, volume, liquidity and the news catalyst before acting.';
  if (item.latitude || item.longitude) return 'Check nearby ports, routes, suppliers and exposed companies.';
  return 'Open the supporting sources and confirm the signal is current and independently corroborated.';
}

function opportunityWhoBenefits(item) {
  const supplied = item.whoBenefits || item.customer || item.targetCustomer || item.beneficiary || item.playbook?.customer;
  if (supplied) return cleanText(Array.isArray(supplied) ? supplied.join(', ') : supplied);
  const text = `${item.title || ''} ${item.subtitle || ''} ${item.summary || ''}`.toLowerCase();
  if (/shipping|freight|port|route|container/.test(text)) return 'Exporters, freight brokers and alternative carriers';
  if (/supply|shortage|outage|closure|disruption/.test(text)) return 'Importers, distributors and replacement suppliers';
  if (item.assetId || item.symbol || String(item.kind).toUpperCase() === 'MARKET') return 'Traders and businesses exposed to this market';
  return 'Businesses that can solve the affected supply, cost or availability problem';
}

function opportunityAction(item) {
  const supplied = item.action || item.playbook?.action || item.recommendedAction || item.nextAction;
  if (supplied) return cleanText(Array.isArray(supplied) ? supplied.join(' ') : supplied);
  const text = `${item.title || ''} ${item.subtitle || ''} ${item.summary || ''}`.toLowerCase();
  if (/shipping|freight|port|route|container/.test(text)) return 'Compare route and freight alternatives, then identify firms facing an urgent delivery gap.';
  if (/supply|shortage|outage|closure|disruption/.test(text)) return 'Find exposed buyers and verify which alternative suppliers can deliver now.';
  if (item.assetId || item.symbol || String(item.kind).toUpperCase() === 'MARKET') return 'Confirm the catalyst, liquidity and invalidation level before taking a position.';
  return 'Identify the affected customer, confirm the problem is current, and contact providers able to solve it.';
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem('merlin-v23-saved') || '[]'); }
  catch { return []; }
}

function saveSaved() {
  localStorage.setItem('merlin-v23-saved', JSON.stringify(state.saved.slice(0, 250)));
}

function savedId(item) { return `${item._type || item.kind || 'item'}:${item.id || item.title}`; }
function isSaved(item) { return state.saved.some(entry => entry.savedId === savedId(item)); }
function toggleSaved(item) {
  const id = savedId(item);
  const index = state.saved.findIndex(entry => entry.savedId === id);
  if (index >= 0) {
    state.saved.splice(index, 1);
    toast('Removed from saved items');
  } else {
    state.saved.unshift({
      savedId: id,
      id: item.id,
      _type: item._type || 'item',
      title: item.title || item.name,
      summary: item.summary || item.subtitle || '',
      url: item.url || null,
      lat: item.lat ?? item.mapPoint?.lat,
      lon: item.lon ?? item.mapPoint?.lon,
      savedAt: new Date().toISOString()
    });
    toast('Saved');
  }
  saveSaved();
  renderSaved();
}

async function loadStaticData() {
  const [countryPayload, cityPayload, portPayload, routePayload] = await Promise.all([
    safeFetch('/data/countries.json', 5000),
    safeFetch('/data/cities.json', 5000),
    safeFetch('/data/ports.json', 5000),
    safeFetch('/data/routes.json', 5000)
  ]);
  state.countries = countryPayload?.countries || [];
  state.cities = cityPayload?.cities || [];
  state.ports = portPayload?.ports || [];
  state.routes = (routePayload?.features || []).map((feature, index) => ({
    id: feature.properties?.id || `route-${index}`,
    name: feature.properties?.name || 'Shipping route',
    geometry: feature.geometry,
    properties: feature.properties,
    risk: feature.properties?.risk || 0,
    _type: 'route'
  }));

  state.countryByCode = new Map();
  state.countryByName = new Map();
  for (const country of state.countries) {
    state.countryByCode.set(country.iso2, country);
    state.countryByCode.set(country.iso3, country);
    for (const alias of [country.name, country.nativeName, ...(country.aliases || [])]) {
      if (alias) state.countryByName.set(String(alias).toLowerCase(), country);
    }
  }
  const aliases = [];
  for (const country of state.countries) {
    for (const alias of [country.name, ...(country.aliases || [])]) if (alias && String(alias).length >= 4) aliases.push({ alias: String(alias).toLowerCase(), record: country });
  }
  for (const city of state.cities) if (city.name?.length >= 4) aliases.push({ alias: city.name.toLowerCase(), record: city });
  for (const port of state.ports) if (port.name?.length >= 4) aliases.push({ alias: port.name.toLowerCase(), record: { ...port.coordinates, name: port.name, country: port.country, countryCode: port.countryCode } });
  state.locationAliases = aliases.sort((a, b) => b.alias.length - a.alias.length).slice(0, 700);
  state.staticReady = true;
}

function placeData() {
  const countries = state.countries.map(country => ({
    ...country,
    _type: 'place',
    nameEnglish: country.name,
    nameLocal: country.nativeName,
    labelType: 'country',
    labelPriority: 100 + Math.log10(Math.max(1, Number(country.populationBaseline || 1))) * 3,
    colour: '#52616b'
  }));
  const cities = state.cities.map(city => ({
    ...city,
    _type: 'place',
    nameEnglish: city.name,
    nameLocal: '',
    labelType: city.kind === 'capital' ? 'capital' : 'city',
    labelPriority: city.kind === 'capital' ? 90 : 55,
    colour: '#52616b'
  }));
  return [...countries, ...cities];
}

function initialiseMap() {
  state.map = new MapEngineV20({
    container: 'world-map',
    initialPoint: { lat: 18, lon: 2 },
    initialZoom: 2,
    tileMode: 'clean',
    onSelect: point => openAreaDetail(point),
    onEntity: entity => openDetail(entity.data)
  });
  state.map.setData({ events: [], news: [], ports: state.ports.map(port => ({ ...port, _type: 'port', colour: '#007f72' })), routes: state.routes, places: placeData() });
  state.map.setLayerVisibility({ events: true, news: true, ports: true, routes: false, places: false, labels: true });
  byId('port-count').textContent = state.ports.length.toLocaleString();
  byId('route-count').textContent = state.routes.length.toLocaleString();
}

async function loadLiveData({ force = false } = {}) {
  if (state.loading) return;
  state.loading = true;
  byId('refresh-button').disabled = true;
  byId('freshness-badge').textContent = 'Refreshing current data…';
  const days = state.hours <= 24 ? 1 : 2;
  const cacheBust = force ? `&refresh=${Date.now()}` : '';
  const [eventPayload, newsPayload, marketPayload, opportunityPayload] = await Promise.all([
    safeFetch(`/api/events?days=${days}&limit=2500${cacheBust}`, 13000),
    safeFetch(`/api/news?hours=${state.hours}&limit=120&sourceLimit=180&sort=latest${cacheBust}`, 13000),
    safeFetch(`/api/markets/screener?timeframe=1h&limit=16${cacheBust}`, 9000),
    safeFetch(`/api/opportunities?timeframe=1h&limit=40&minimumScore=35&minimumConfidence=15&maximumRisk=95${cacheBust}`, 14000)
  ]);

  const cutoff = Date.now() - state.hours * HOUR;
  state.events = (eventPayload?.events || [])
    .map(normalizeEvent)
    .filter(Boolean)
    .filter(item => itemTime(item) >= cutoff)
    .sort((a, b) => itemTime(b) - itemTime(a));
  state.news = (newsPayload?.articles || [])
    .map(normalizeArticle)
    .filter(Boolean)
    .filter(item => itemTime(item) >= cutoff)
    .sort((a, b) => itemTime(b) - itemTime(a));
  state.markets = (marketPayload?.results || []).map(normalizeMarket).filter(item => item.symbol !== '—');
  state.opportunities = (opportunityPayload?.opportunities || [])
    .map(normalizeOpportunity)
    .filter(item => item.kind !== 'EVENT' || itemTime(item) >= cutoff);
  if (!state.opportunities.length) state.opportunities = deriveOpportunities();
  state.sources = { ...(eventPayload?.sources || {}), ...(newsPayload?.sources || {}) };
  state.lastUpdated = new Date().toISOString();
  state.loading = false;
  byId('refresh-button').disabled = false;
  updateMapData();
  renderAll();
}

function updateMapData() {
  if (!state.map) return;
  state.map.setData({
    events: state.events.filter(item => finite(item.lat) && finite(item.lon)),
    news: state.news.filter(item => item.mapPoint),
    ports: state.ports.map(port => ({ ...port, _type: 'port', colour: '#007f72' })),
    routes: state.routes,
    places: placeData()
  });
}

function combinedFeed() {
  return [...state.events, ...state.news]
    .filter(item => state.feedFilter === 'all' || item.group === state.feedFilter)
    .sort((a, b) => itemTime(b) - itemTime(a));
}

function renderAll() {
  renderStatus();
  renderFeed();
  renderMarkets();
  renderOpportunities();
  renderConflicts();
  renderCountries();
  renderBriefing();
  renderSaved();
}

function renderStatus() {
  byId('event-count').textContent = state.events.length.toLocaleString();
  byId('news-count').textContent = state.news.length.toLocaleString();
  const online = Object.values(state.sources).filter(source => ['ONLINE', 'DEGRADED'].includes(String(source.state || source.pipelineState).toUpperCase()));
  const dot = byId('source-dot');
  dot.classList.toggle('online', online.length > 0);
  dot.classList.toggle('offline', online.length === 0 && Object.keys(state.sources).length > 0);
  byId('source-label').textContent = online.length ? `${online.length} public sources responding` : 'Public sources are reconnecting';
  byId('source-note').textContent = `${state.events.length + state.news.length} current items in the selected window.`;
  const latest = Math.max(0, ...[...state.events, ...state.news].map(itemTime));
  byId('freshness-badge').textContent = latest ? `${state.events.length + state.news.length} current items · newest ${ageLabel(latest)}` : 'No current items returned yet';
}

function renderFeed() {
  const root = byId('live-feed');
  const items = combinedFeed().slice(0, 120);
  if (!items.length) {
    root.innerHTML = `<div class="empty-state"><div><strong>No current items in this window</strong><span>Merlin does not fill the map with old reports. Try 48 hours or refresh the public feeds.</span></div></div>`;
    return;
  }
  root.innerHTML = items.map(item => `
    <button class="feed-card" data-item-type="${escapeHtml(item._type)}" data-item-id="${escapeHtml(item.id)}" type="button">
      <span class="feed-card-top"><span class="feed-type ${escapeHtml(item.group)}">${escapeHtml(item.group === 'news' ? 'News' : item.group)}</span><span class="feed-age">${escapeHtml(ageLabel(itemTime(item)))}</span></span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <span class="feed-card-footer"><span>${escapeHtml(item.sourceLabel)}</span><span>${escapeHtml(item.countryName || item.country || item.region || '')}</span></span>
    </button>`).join('');
  root.querySelectorAll('[data-item-id]').forEach(button => button.addEventListener('click', () => openDetail(findItem(button.dataset.itemType, button.dataset.itemId))));
}

function findItem(type, id) {
  if (type === 'event') return state.events.find(item => item.id === id);
  if (type === 'news') return state.news.find(item => item.id === id);
  if (type === 'opportunity') return state.opportunities.find(item => item.id === id);
  return state.saved.find(item => item.id === id || item.savedId === id);
}

function deriveOpportunities() {
  const leads = [];
  for (const market of state.markets.filter(item => finite(item.change)).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5)) {
    const changePct = Math.abs(market.change) <= 1.5 ? market.change * 100 : market.change;
    if (Math.abs(changePct) < .8) continue;
    leads.push(normalizeOpportunity({
      id: `derived-market-${market.id}`,
      kind: 'MARKET',
      title: `${market.symbol} moved ${formatPercent(market.change)}`,
      subtitle: 'Current market movement',
      score: clamp(48 + Math.abs(changePct) * 5, 0, 88),
      confidence: 55,
      risk: clamp(45 + Math.abs(changePct) * 3, 0, 90),
      observedAt: market.generatedAt,
      symbol: market.symbol,
      summary: `A notable price move is underway. The useful question is whether current news, liquidity or positioning explains it.`,
      nextCheck: 'Check the catalyst, trading volume and whether the move is continuing across related assets.',
      whoBenefits: 'Traders and businesses exposed to this market',
      action: 'Confirm the move, define the invalidation level and compare related assets before acting.'
    }, leads.length));
  }
  for (const item of [...state.events, ...state.news].filter(entry => ['conflict', 'disruption', 'business'].includes(entry.group)).slice(0, 8)) {
    leads.push(normalizeOpportunity({
      id: `derived-event-${item.id}`,
      kind: 'EVENT',
      title: `Research the commercial effect of: ${item.title}`,
      subtitle: item.countryName || item.sourceLabel,
      score: clamp(45 + (item.severity || 25) * .35, 0, 84),
      confidence: 50,
      risk: item.severity || 50,
      observedAt: item.time || item.publishedAt,
      latitude: item.lat || item.mapPoint?.lat,
      longitude: item.lon || item.mapPoint?.lon,
      summary: `This current development may change local demand, transport costs, supplier availability or market expectations.`,
      nextCheck: 'Check exposed ports, routes, commodities, listed companies and alternative suppliers.',
      whoBenefits: item.group === 'disruption' ? 'Importers, distributors and replacement suppliers' : item.group === 'conflict' ? 'Businesses needing alternative routes, suppliers or risk cover' : 'Businesses exposed to the affected market or supply chain',
      action: item.group === 'disruption' ? 'Identify buyers facing an urgent gap and verify alternative supply or delivery capacity.' : 'Map the affected businesses, confirm the impact and identify a practical service, supplier or market response.',
      metadata: { url: item.url }
    }, leads.length));
  }
  return leads.slice(0, 20);
}

function filteredOpportunities() {
  const query = state.opportunitySearch.toLowerCase();
  return state.opportunities.filter(item => {
    if (state.opportunityFilter !== 'all' && item.kind.toLowerCase() !== state.opportunityFilter) return false;
    return !query || `${item.title} ${item.subtitle} ${item.summary}`.toLowerCase().includes(query);
  });
}

function renderOpportunities() {
  const root = byId('opportunity-grid');
  const items = filteredOpportunities();
  byId('opportunity-meta').textContent = `${items.length} current research leads`;
  if (!items.length) {
    root.innerHTML = `<div class="empty-state"><div><strong>No matching research leads</strong><span>Refresh the live feeds or broaden the filters.</span></div></div>`;
    return;
  }
  root.innerHTML = items.map(item => `
    <article class="opportunity-card">
      <div class="opportunity-card-header"><div><small>${escapeHtml(item.kind)} · ${escapeHtml(ageLabel(item.observedAt))}</small><h3>${escapeHtml(item.title)}</h3></div><span class="score-badge">${Math.round(item.score)}</span></div>
      <p>${escapeHtml(item.summary)}</p>
      <div class="opportunity-facts"><div><span>Confidence</span><b>${finite(item.confidence) ? `${Math.round(item.confidence)} / 100` : 'Needs review'}</b></div><div><span>Risk</span><b>${finite(item.risk) ? `${Math.round(item.risk)} / 100` : 'Unknown'}</b></div><div><span>Window</span><b>${escapeHtml(item.horizon || 'Current')}</b></div></div>
      <p><strong>Potential customer:</strong> ${escapeHtml(item.whoBenefits)}</p>
      <p><strong>Immediate action:</strong> ${escapeHtml(item.action)}</p>
      <p><strong>Verify:</strong> ${escapeHtml(item.nextCheck)}</p>
      <div class="opportunity-actions"><button data-open-opportunity="${escapeHtml(item.id)}" class="primary" type="button">Review</button><button data-save-opportunity="${escapeHtml(item.id)}" type="button">${isSaved(item) ? 'Saved' : 'Save'}</button></div>
    </article>`).join('');
  root.querySelectorAll('[data-open-opportunity]').forEach(button => button.addEventListener('click', () => openDetail(state.opportunities.find(item => item.id === button.dataset.openOpportunity))));
  root.querySelectorAll('[data-save-opportunity]').forEach(button => button.addEventListener('click', () => { const item = state.opportunities.find(entry => entry.id === button.dataset.saveOpportunity); toggleSaved(item); renderOpportunities(); }));
}

function renderMarkets() {
  const root = byId('market-grid');
  byId('market-meta').textContent = state.markets.length ? `${state.markets.length} assets from public exchanges` : 'Waiting for live exchange data';
  if (!state.markets.length) {
    root.innerHTML = `<div class="empty-state"><div><strong>No live market quotes returned</strong><span>The rest of Merlin remains usable. Refresh when public exchange access recovers.</span></div></div>`;
    return;
  }
  root.innerHTML = state.markets.map(item => {
    const changePct = Math.abs(item.change) <= 1.5 ? item.change * 100 : item.change;
    const tone = changePct > .01 ? 'up' : changePct < -.01 ? 'down' : '';
    return `<article class="market-card"><header><div><span class="market-symbol">${escapeHtml(item.symbol)}</span><span class="market-name">${escapeHtml(item.name)}</span></div><span class="market-change ${tone}">${escapeHtml(formatPercent(item.change))}</span></header><div class="market-price">${escapeHtml(formatPrice(item.price))}</div><footer><span>24-hour change</span><span>${escapeHtml(item.source)}</span></footer></article>`;
  }).join('');
}

function conflictItems() {
  return [...state.events, ...state.news].filter(item => item.group === 'conflict').sort((a, b) => itemTime(b) - itemTime(a));
}

function renderConflicts() {
  const root = byId('conflict-list');
  const items = conflictItems();
  byId('conflict-meta').textContent = `${items.length} current reports in ${state.hours} hours`;
  if (!items.length) {
    root.innerHTML = `<div class="empty-state"><div><strong>No current conflict reports returned</strong><span>Merlin will not show week-old conflict items simply to fill this page.</span></div></div>`;
    return;
  }
  root.innerHTML = items.map(item => `<article class="story-row"><time>${escapeHtml(ageLabel(itemTime(item)))}</time><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div><button data-conflict-id="${escapeHtml(item.id)}" data-conflict-type="${escapeHtml(item._type)}" type="button">Open</button></article>`).join('');
  root.querySelectorAll('[data-conflict-id]').forEach(button => button.addEventListener('click', () => openDetail(findItem(button.dataset.conflictType, button.dataset.conflictId))));
}

function countryActivity() {
  const counts = new Map(state.countries.map(country => [country.iso2, { country, events: 0, news: 0, latest: 0 }]));
  for (const item of state.events) {
    const country = countryForValue(item.countryCode || item.countryName || item.country);
    if (!country) continue;
    const record = counts.get(country.iso2);
    record.events += 1;
    record.latest = Math.max(record.latest, itemTime(item));
  }
  for (const item of state.news) {
    const country = countryForCode(item.countryCode);
    if (!country) continue;
    const record = counts.get(country.iso2);
    record.news += 1;
    record.latest = Math.max(record.latest, itemTime(item));
  }
  return [...counts.values()].filter(item => item.events + item.news > 0).sort((a, b) => (b.events + b.news) - (a.events + a.news));
}

function renderCountries() {
  const root = byId('country-grid');
  const query = String(byId('country-search')?.value || '').toLowerCase();
  const items = countryActivity().filter(item => !query || `${item.country.name} ${item.country.nativeName}`.toLowerCase().includes(query));
  if (!items.length) {
    root.innerHTML = `<div class="empty-state"><div><strong>No current country activity matches</strong><span>Try another search or widen the time window.</span></div></div>`;
    return;
  }
  root.innerHTML = items.map(item => `<article class="country-card"><button data-country-code="${escapeHtml(item.country.iso2)}" type="button"><h3>${escapeHtml(item.country.name)}</h3><small>${escapeHtml(item.country.nativeName || item.country.region)}</small><div class="country-counts"><span>${item.events} events</span><span>${item.news} reports</span><span>${escapeHtml(ageLabel(item.latest))}</span></div></button></article>`).join('');
  root.querySelectorAll('[data-country-code]').forEach(button => button.addEventListener('click', () => {
    const country = countryForCode(button.dataset.countryCode);
    showView('map');
    state.map.flyTo({ lat: country.lat, lon: country.lon }, { zoom: 5 });
    openDetail({ ...country, _type: 'place', title: country.name, summary: `${country.region} · ${country.subregion}` });
  }));
}

function renderBriefing() {
  const root = byId('briefing-content');
  const top = [...state.events, ...state.news].sort((a, b) => itemTime(b) - itemTime(a)).slice(0, 8);
  const conflicts = conflictItems().slice(0, 5);
  const disruptions = [...state.events, ...state.news].filter(item => item.group === 'disruption').slice(0, 5);
  const opportunities = state.opportunities.slice(0, 5);
  const movers = [...state.markets].filter(item => finite(item.change)).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
  byId('briefing-meta').textContent = `${state.events.length + state.news.length} current items · ${state.hours}-hour window`;
  root.innerHTML = `
    <section class="briefing-card full"><h3>What changed</h3>${briefingList(top, item => `<strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.summary)}`)}</section>
    <section class="briefing-card"><h3>Conflicts and disruptions</h3>${briefingList([...conflicts, ...disruptions].slice(0, 6), item => `<strong>${escapeHtml(item.title)}</strong> <span>(${escapeHtml(ageLabel(itemTime(item)))})</span>`)}</section>
    <section class="briefing-card"><h3>Possible commercial effects</h3>${briefingList(opportunities, item => `<strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.nextCheck)}`)}</section>
    <section class="briefing-card"><h3>Largest market moves</h3>${briefingList(movers, item => `<strong>${escapeHtml(item.symbol)}</strong> ${escapeHtml(formatPercent(item.change))} at ${escapeHtml(formatPrice(item.price))}`)}</section>
    <section class="briefing-card"><h3>What to check next</h3><ul><li>Confirm the newest high-impact reports with their original sources.</li><li>Check whether affected ports, routes, suppliers or commodities create a real price or availability change.</li><li>Save only the leads that have a clear customer, market or operational use.</li></ul></section>`;
}

function briefingList(items, render) {
  if (!items.length) return '<div class="empty-state"><div><strong>No current items</strong><span>The briefing will populate as current public feeds return data.</span></div></div>';
  return `<ol>${items.map(item => `<li>${render(item)}</li>`).join('')}</ol>`;
}

function renderSaved() {
  const root = byId('saved-list');
  if (!state.saved.length) {
    root.innerHTML = `<div class="empty-state"><div><strong>No saved items yet</strong><span>Save a report or opportunity to build a personal watchlist.</span></div></div>`;
    return;
  }
  root.innerHTML = state.saved.map(item => `<article class="story-row"><time>${escapeHtml(ageLabel(item.savedAt))}</time><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div><button data-saved-id="${escapeHtml(item.savedId)}" type="button">Remove</button></article>`).join('');
  root.querySelectorAll('[data-saved-id]').forEach(button => button.addEventListener('click', () => { state.saved = state.saved.filter(item => item.savedId !== button.dataset.savedId); saveSaved(); renderSaved(); }));
}

function openDetail(item) {
  if (!item) return;
  const type = item._type || (item.coordinates ? 'port' : item.geometry ? 'route' : 'item');
  const title = item.title || item.name || 'Details';
  const summary = item.summary || item.description || item.subtitle || item.region || item.country || 'No further description is available.';
  const metrics = detailMetrics(item, type);
  byId('detail-kind').textContent = detailKind(type, item);
  byId('detail-title').textContent = title;
  byId('detail-body').innerHTML = `<p>${escapeHtml(summary)}</p><div class="detail-grid">${metrics.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}</div>${type === 'opportunity' ? `<p><strong>Potential customer:</strong> ${escapeHtml(item.whoBenefits)}</p><p><strong>Immediate action:</strong> ${escapeHtml(item.action)}</p><p><strong>Verify:</strong> ${escapeHtml(item.nextCheck)}</p>` : ''}`;
  const sourceLink = item.url && /^https?:\/\//i.test(item.url) ? `<a class="primary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Open source</a>` : '';
  byId('detail-footer').innerHTML = `${sourceLink}<button id="detail-save" type="button">${isSaved(item) ? 'Remove saved' : 'Save item'}</button>`;
  byId('detail-save')?.addEventListener('click', () => { toggleSaved(item); openDetail(item); });
  const panel = byId('detail-panel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  const lat = Number(item.lat ?? item.latitude ?? item.mapPoint?.lat ?? item.coordinates?.lat);
  const lon = Number(item.lon ?? item.longitude ?? item.mapPoint?.lon ?? item.coordinates?.lon);
  if (finite(lat) && finite(lon) && state.view === 'map') state.map.flyTo({ lat, lon }, { zoom: Math.max(5, state.map.zoom) });
}

function detailKind(type, item) {
  if (type === 'news') return `${item.sourceLabel || 'News'} · ${ageLabel(itemTime(item))}`;
  if (type === 'event') return `${item.group || item.category || 'Event'} · ${ageLabel(itemTime(item))}`;
  if (type === 'opportunity') return `Research lead · score ${Math.round(item.score || 0)}`;
  if (type === 'port') return 'Major port';
  if (type === 'route') return 'Shipping route';
  if (type === 'place') return 'Country or place';
  return 'Details';
}

function detailMetrics(item, type) {
  if (type === 'news') return [['Published', ageLabel(itemTime(item))], ['Source', item.sourceLabel], ['Country', item.countryName || 'Not mapped'], ['Category', item.group]];
  if (type === 'event') return [['Reported', ageLabel(itemTime(item))], ['Source', item.sourceLabel], ['Country', item.countryName || item.country || 'Not supplied'], ['Severity', `${Math.round(item.severity || 0)} / 100`]];
  if (type === 'opportunity') return [['Score', `${Math.round(item.score || 0)} / 100`], ['Confidence', finite(item.confidence) ? `${Math.round(item.confidence)} / 100` : 'Needs review'], ['Risk', finite(item.risk) ? `${Math.round(item.risk)} / 100` : 'Unknown'], ['Observed', ageLabel(item.observedAt)]];
  if (type === 'port') return [['Country', item.country || '—'], ['Region', item.region || '—'], ['Importance', formatNumber(item.importance)], ['Commodities', (item.commodities || []).slice(0, 4).join(', ') || '—']];
  if (type === 'route') return [['Route', item.name || item.id], ['Type', 'Shipping corridor'], ['Risk', formatNumber(item.risk?.score ?? item.risk)], ['Status', 'Reference route']];
  if (type === 'place') {
    const activity = countryActivity().find(record => record.country.iso2 === item.iso2);
    return [['Region', item.region || item.country || '—'], ['Current events', String(activity?.events || 0)], ['Current reports', String(activity?.news || 0)], ['Local name', item.nativeName || item.nameLocal || '—']];
  }
  return [['Status', 'Current']];
}

function openAreaDetail(point) {
  const nearby = [...state.events, ...state.news]
    .map(item => ({ item, distance: distanceKm(point, { lat: item.lat ?? item.mapPoint?.lat, lon: item.lon ?? item.mapPoint?.lon }) }))
    .filter(entry => finite(entry.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);
  byId('detail-kind').textContent = 'Selected map area';
  byId('detail-title').textContent = `${point.lat.toFixed(2)}, ${point.lon.toFixed(2)}`;
  byId('detail-body').innerHTML = nearby.length
    ? `<p>The nearest current items to this point are shown below.</p>${nearby.map(entry => `<button class="feed-card" data-area-type="${escapeHtml(entry.item._type)}" data-area-id="${escapeHtml(entry.item.id)}"><span class="feed-card-top"><span class="feed-type ${escapeHtml(entry.item.group)}">${escapeHtml(entry.item.group)}</span><span class="feed-age">${Math.round(entry.distance)} km</span></span><h3>${escapeHtml(entry.item.title)}</h3></button>`).join('')}`
    : '<div class="empty-state"><div><strong>No current items nearby</strong><span>Try another area or widen the time window.</span></div></div>';
  byId('detail-footer').innerHTML = '';
  byId('detail-panel').classList.add('open');
  byId('detail-panel').setAttribute('aria-hidden', 'false');
  byId('detail-body').querySelectorAll('[data-area-id]').forEach(button => button.addEventListener('click', () => openDetail(findItem(button.dataset.areaType, button.dataset.areaId))));
}

function distanceKm(a, b) {
  if (!finite(a?.lat) || !finite(a?.lon) || !finite(b?.lat) || !finite(b?.lon)) return NaN;
  const rad = value => Number(value) * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function closeDetail() {
  byId('detail-panel').classList.remove('open');
  byId('detail-panel').setAttribute('aria-hidden', 'true');
}

const VIEW_TEXT = {
  map: ['Current world activity', 'Live map'],
  opportunities: ['Research leads based on current signals', 'Opportunities'],
  markets: ['Public exchange data', 'Markets'],
  conflicts: ['Conflict-related reporting from the current window', 'Conflicts'],
  countries: ['Current activity grouped by country', 'Countries'],
  briefing: ['A concise summary of what changed', 'Daily briefing'],
  saved: ['Your personal watchlist', 'Saved items']
};

function showView(view) {
  state.view = view;
  $$('.view').forEach(panel => panel.classList.toggle('active', panel.dataset.viewPanel === view));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const [kicker, title] = VIEW_TEXT[view] || VIEW_TEXT.map;
  byId('page-kicker').textContent = kicker;
  byId('page-title').textContent = title;
  document.title = view === 'map' ? 'Merlin' : `${title} · Merlin`;
  $('.sidebar').classList.remove('open');
  if (view === 'map') setTimeout(() => state.map?.resize(), 30);
}

function renderSearch(query) {
  const root = byId('search-results');
  const text = String(query || '').trim().toLowerCase();
  if (text.length < 2) { root.classList.add('hidden'); root.innerHTML = ''; return; }
  const candidates = [
    ...state.countries.map(item => ({ ...item, resultType: 'Country', lat: item.lat, lon: item.lon })),
    ...state.cities.map(item => ({ ...item, resultType: item.kind === 'capital' ? 'Capital' : 'City' })),
    ...state.ports.map(item => ({ ...item, resultType: 'Port', lat: item.coordinates.lat, lon: item.coordinates.lon }))
  ].filter(item => `${item.name} ${item.nativeName || ''} ${item.country || ''}`.toLowerCase().includes(text)).slice(0, 12);
  root.classList.toggle('hidden', !candidates.length);
  root.innerHTML = candidates.map((item, index) => `<button class="search-result" data-search-index="${index}" type="button"><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.nativeName || item.country || item.region || '')}</small></span><em>${escapeHtml(item.resultType)}</em></button>`).join('');
  root.querySelectorAll('[data-search-index]').forEach(button => button.addEventListener('click', () => {
    const item = candidates[Number(button.dataset.searchIndex)];
    showView('map');
    state.map.flyTo({ lat: Number(item.lat), lon: Number(item.lon) }, { zoom: item.resultType === 'Country' ? 5 : 7 });
    openDetail({ ...item, _type: item.resultType === 'Port' ? 'port' : 'place', title: item.name });
    root.classList.add('hidden');
  }));
}

function installEvents() {
  $$('.nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  byId('brand-home').addEventListener('click', () => showView('map'));
  byId('mobile-menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
  byId('refresh-button').addEventListener('click', () => loadLiveData({ force: true }));
  byId('detail-close').addEventListener('click', closeDetail);
  byId('clear-saved').addEventListener('click', () => { state.saved = []; saveSaved(); renderSaved(); toast('Saved items cleared'); });
  byId('zoom-in').addEventListener('click', () => state.map.setZoom(state.map.zoom + 1));
  byId('zoom-out').addEventListener('click', () => state.map.setZoom(state.map.zoom - 1));
  byId('world-view').addEventListener('click', () => state.map.flyTo({ lat: 27, lon: 9 }, { zoom: 3 }));
  byId('layer-collapse').addEventListener('click', () => {
    const card = $('.map-layer-card');
    card.classList.toggle('collapsed');
    byId('layer-collapse').textContent = card.classList.contains('collapsed') ? 'Show' : 'Hide';
  });
  $$('[data-layer-toggle]').forEach(input => input.addEventListener('change', () => state.map.setLayerVisibility({ [input.dataset.layerToggle]: input.checked })));
  $$('[data-hours]').forEach(button => button.addEventListener('click', () => {
    state.hours = Number(button.dataset.hours);
    $$('[data-hours]').forEach(item => item.classList.toggle('active', item === button));
    loadLiveData({ force: true });
  }));
  $$('[data-feed]').forEach(button => button.addEventListener('click', () => {
    state.feedFilter = button.dataset.feed;
    $$('[data-feed]').forEach(item => item.classList.toggle('active', item === button));
    renderFeed();
  }));
  $$('[data-opportunity-filter]').forEach(button => button.addEventListener('click', () => {
    state.opportunityFilter = button.dataset.opportunityFilter;
    $$('[data-opportunity-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderOpportunities();
  }));
  byId('opportunity-search').addEventListener('input', event => { state.opportunitySearch = event.target.value; renderOpportunities(); });
  byId('country-search').addEventListener('input', renderCountries);
  byId('global-search').addEventListener('input', event => renderSearch(event.target.value));
  byId('global-search-button').addEventListener('click', () => {
    showView('map');
    const root = byId('map-search');
    if (!root.classList.contains('open')) byId('map-search-toggle').click();
  });
  byId('current-panel-close').addEventListener('click', () => $('.current-panel').classList.remove('open'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeDetail(); $('.sidebar').classList.remove('open'); $('.current-panel').classList.remove('open'); }
  });
}

async function start() {
  installEvents();
  await loadStaticData();
  initialiseMap();
  renderAll();
  await loadLiveData();
}

start().catch(error => {
  console.error('Merlin failed to start', error);
  byId('freshness-badge').textContent = 'Merlin could not load current data';
  toast('The live feeds could not be loaded. The map and reference data remain available.');
});
