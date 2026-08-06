import { MapEngineV20 } from './map-v20/map-engine.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'merlin-v24-saved';
const EARTH_TERMS = /\b(?:earthquake|aftershock|seismic|quake|magnitude\s*[0-9])\b/i;
const CATEGORY_COLOURS = Object.freeze({
  conflict: '#f35d6f',
  disruption: '#ec9250',
  markets: '#9d83ef',
  politics: '#58b8e7',
  world: '#45d19a',
  port: '#59d4d0'
});

const state = {
  snapshot: null,
  staticData: { countries: [], cities: [], ports: [], routes: [] },
  map: null,
  hours: 12,
  feedFilter: 'all',
  focusRegion: 'priority',
  view: 'map',
  query: '',
  refreshing: false,
  saved: loadSaved()
};

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function persistSaved() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved.slice(0, 100))); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
function number(value, digits = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
}
function money(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  const digits = parsed < 1 ? 4 : parsed < 100 ? 2 : 0;
  return `US$${parsed.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}
function ageLabel(value) {
  const ms = Date.now() - Date.parse(value);
  if (!Number.isFinite(ms) || ms < 0) return 'now';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
function dateTime(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown';
}
function categoryLabel(value) {
  return ({ conflict: 'Conflict', disruption: 'Disruption', markets: 'Markets', politics: 'Politics', world: 'World' }[value] || 'Current');
}
function colourFor(category) { return CATEGORY_COLOURS[category] || CATEGORY_COLOURS.world; }
function isCurrent(item) {
  const published = Date.parse(item?.publishedAt || item?.observedAt);
  return Number.isFinite(published) && published >= Date.now() - state.hours * 3_600_000 && !EARTH_TERMS.test(`${item?.title || ''} ${item?.summary || ''}`);
}
function currentArticles() {
  return (state.snapshot?.articles || []).filter(isCurrent).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
function sourceState() {
  const sources = state.snapshot?.sources || [];
  const online = sources.filter(source => source.state === 'ONLINE').length;
  const total = sources.length;
  return { online, total };
}

function regionCatalog() { return state.snapshot?.focusRegions || []; }
function regionById(id) { return regionCatalog().find(region => region.id === id) || null; }
function itemFocusIds(item) { return Array.isArray(item?.focusRegionIds) ? item.focusRegionIds : []; }
function matchesRegionalFocus(item) {
  if (state.focusRegion === 'world') return true;
  if (state.focusRegion === 'priority') return itemFocusIds(item).length > 0;
  return itemFocusIds(item).includes(state.focusRegion);
}
function focusedArticles() { return currentArticles().filter(matchesRegionalFocus); }
function focusedOpportunities() {
  return (state.snapshot?.opportunities || []).filter(item => item.type === 'market' || matchesRegionalFocus(item));
}
function focusedCountries() {
  const profiles = state.snapshot?.priorityCountries || [];
  if (state.focusRegion === 'world' || state.focusRegion === 'priority') return profiles;
  return profiles.filter(country => itemFocusIds(country).includes(state.focusRegion));
}
function focusedWatchAreas() {
  const areas = state.snapshot?.watchAreas || [];
  if (state.focusRegion === 'world' || state.focusRegion === 'priority') return areas;
  return areas.filter(area => area.regionId === state.focusRegion);
}
function regionNames(ids = []) {
  const lookup = new Map(regionCatalog().map(region => [region.id, region.label]));
  return ids.map(id => lookup.get(id)).filter(Boolean);
}
function focusContext() {
  if (state.focusRegion === 'world') return { label: 'World', description: 'All countries and current reporting', regions: regionCatalog() };
  if (state.focusRegion === 'priority') return { label: 'Priority regions', description: 'Middle East, Europe, Russia, major Asia, North Africa and the United States', regions: regionCatalog() };
  const region = regionById(state.focusRegion);
  return region ? { label: region.label, description: region.description, regions: [region] } : { label: 'Priority regions', description: 'Focused commercial and geopolitical coverage', regions: regionCatalog() };
}
function regionBadgeHtml(ids = []) {
  const names = regionNames(ids);
  return names.slice(0, 2).map(name => `<span class="region-badge">${escapeHtml(name)}</span>`).join('');
}
function renderRegionFocus() {
  const context = focusContext();
  const articles = focusedArticles();
  const opportunities = focusedOpportunities().filter(item => item.type !== 'market');
  const conflicts = articles.filter(item => item.category === 'conflict').length;
  const disruptions = articles.filter(item => item.category === 'disruption').length;
  $('#region-focus-summary').textContent = `${context.label}: ${articles.length} current · ${conflicts} conflict · ${disruptions} disruption · ${opportunities.length} opportunities`;
  $('#feed-region-kicker').textContent = context.label.toUpperCase();
  $('#feed-region-title').textContent = state.focusRegion === 'world' ? 'Latest worldwide developments' : 'Latest developments';
  $$('[data-region-focus]').forEach(button => button.classList.toggle('is-active', button.dataset.regionFocus === state.focusRegion));
}
function selectRegionFocus(id, moveMap = true) {
  state.focusRegion = id;
  if (moveMap && state.map) {
    if (id === 'world' || id === 'priority') state.map.flyTo({ lat: 27, lon: 25 }, { zoom: 2 });
    else {
      const region = regionById(id);
      if (region?.centre) state.map.flyTo(region.centre, { zoom: region.zoom || 4 });
    }
  }
  renderAll();
}

async function fetchJson(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally { clearTimeout(timeout); }
}

async function loadStaticData() {
  const settled = await Promise.allSettled([
    fetchJson('/data/countries.json', 4500),
    fetchJson('/data/cities.json', 4500),
    fetchJson('/data/ports.json', 4500),
    fetchJson('/data/routes.json', 4500)
  ]);
  state.staticData = {
    countries: settled[0].status === 'fulfilled' ? settled[0].value.countries || [] : [],
    cities: settled[1].status === 'fulfilled' ? settled[1].value.cities || [] : [],
    ports: settled[2].status === 'fulfilled' ? settled[2].value.ports || [] : [],
    routes: settled[3].status === 'fulfilled' ? settled[3].value.features || [] : []
  };
}

function mapPlaces() {
  const priority = new Map((state.snapshot?.priorityCountries || []).map(country => [country.iso2, country]));
  const countries = state.staticData.countries.map(country => {
    const profile = priority.get(country.iso2);
    return {
      ...country,
      ...(profile || {}),
      id: `country-${country.iso2 || country.id}`,
      nameEnglish: country.name,
      nameLocal: country.nativeName && country.nativeName !== country.name ? country.nativeName : '',
      labelType: 'country',
      kind: 'PLACE',
      priorityCoverage: Boolean(profile),
      focusRegionIds: profile?.focusRegionIds || []
    };
  });
  const cities = state.staticData.cities.map(city => ({
    ...city,
    id: `city-${city.id}`,
    nameEnglish: city.name,
    nameLocal: city.localName || '',
    labelType: city.kind === 'capital' ? 'capital' : 'city',
    kind: 'PLACE',
    priorityCoverage: Boolean(priority.get(city.countryCode)),
    focusRegionIds: priority.get(city.countryCode)?.focusRegionIds || []
  }));
  return [...countries, ...cities];
}

function articleAsMapFeature(article) {
  return {
    ...article,
    coordinates: article.coordinates,
    nameEnglish: article.location?.name || article.title,
    nameLocal: article.location?.localName || '',
    kind: article.category === 'conflict' ? 'CONFLICT' : article.category === 'disruption' ? 'DISRUPTION' : article.category.toUpperCase(),
    colour: colourFor(article.category),
    severity: article.category === 'conflict' ? 82 : article.category === 'disruption' ? 70 : 55
  };
}

function refreshMapData() {
  if (!state.map) return;
  const mapped = focusedArticles().filter(article => article.coordinates).map(articleAsMapFeature);
  const events = mapped.filter(article => ['conflict', 'disruption', 'politics'].includes(article.category));
  const news = mapped.filter(article => !['conflict', 'disruption', 'politics'].includes(article.category));
  const countryProfiles = focusedCountries();
  const focus = countryProfiles.map(country => ({
    ...country,
    id: `focus-${country.iso2}`,
    coordinates: { lat: Number(country.lat), lon: Number(country.lon) },
    nameEnglish: country.name,
    nameLocal: country.nativeName && country.nativeName !== country.name ? country.nativeName : '',
    kind: 'FOCUS',
    severity: Math.min(90, 24 + Number(country.activityCount || 0) * 7),
    colour: '#d4a749'
  }));
  const watch = focusedWatchAreas().map(area => ({
    ...area,
    coordinates: { lat: Number(area.lat), lon: Number(area.lon) },
    nameEnglish: area.title,
    nameLocal: '',
    kind: 'WATCH',
    severity: 68,
    colour: '#ec9250'
  }));
  const ports = (state.snapshot?.ports?.length ? state.snapshot.ports : state.staticData.ports).map(port => ({
    ...port,
    kind: 'PORT',
    nameEnglish: port.name,
    nameLocal: '',
    colour: CATEGORY_COLOURS.port
  }));
  const routes = state.snapshot?.routes?.length ? state.snapshot.routes : state.staticData.routes;
  state.map.setData({ events, news, focus, watch, ports, routes, places: mapPlaces() });
  $('#count-events').textContent = String(events.length);
  $('#count-news').textContent = String(news.length);
  $('#count-focus').textContent = String(focus.length);
  $('#count-watch').textContent = String(watch.length);
  $('#count-ports').textContent = String(ports.length);
  $('#count-routes').textContent = String(routes.length);
}

function initialiseMap() {
  state.map = new MapEngineV20({
    container: $('#world-map'),
    tileMode: 'dark',
    initialPoint: { lat: 27, lon: 25 },
    initialZoom: 2,
    onEntity: entity => showEntity(entity),
    onSelect: point => showMessage(`${point.lat.toFixed(2)}, ${point.lon.toFixed(2)}`)
  });
  state.map.setLayerVisibility({ events: true, news: true, focus: true, watch: true, ports: true, routes: false, places: true, labels: true });
  refreshMapData();
}

async function refreshSnapshot(force = false) {
  if (state.refreshing) return;
  state.refreshing = true;
  setConnection('loading', 'UPDATING');
  $('#refresh-live').disabled = true;
  try {
    const snapshot = await fetchJson(`/api/customer/snapshot?hours=${state.hours}${force ? '&force=1' : ''}`, 9000);
    state.snapshot = snapshot;
    renderAll();
    const { online } = sourceState();
    setConnection(online ? 'live' : snapshot.status === 'CACHED' ? 'limited' : 'limited', online ? 'LIVE' : snapshot.status || 'LIMITED');
  } catch (error) {
    setConnection('limited', 'LIMITED');
    showMessage('Current sources did not respond. The map remains usable; try Refresh again shortly.', 5200);
    renderAll();
  } finally {
    state.refreshing = false;
    $('#refresh-live').disabled = false;
  }
}

function setConnection(mode, label) {
  const element = $('#connection-state');
  element.className = `status-pill ${mode === 'live' ? '' : mode === 'loading' ? 'is-loading' : 'is-limited'}`.trim();
  element.querySelector('b').textContent = label;
}

function renderAll() {
  refreshMapData();
  renderRegionFocus();
  renderTicker();
  renderHeader();
  renderFeed();
  updateFreshness();
  if (state.view !== 'map') renderWorkspace(state.view);
}

function renderTicker() {
  const markets = state.snapshot?.markets || [];
  const ticker = $('#market-ticker');
  if (!markets.length) {
    ticker.innerHTML = '<span class="ticker-loading">Market feed unavailable — current news and map remain active.</span>';
    return;
  }
  ticker.innerHTML = markets.map(market => {
    const change = Number(market.change24h);
    const cls = Number.isFinite(change) && change >= 0 ? 'up' : 'down';
    return `<div class="ticker-item"><small>${escapeHtml(market.symbol)}</small><strong>${escapeHtml(money(market.price))}</strong><span class="ticker-change ${cls}">${Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}</span></div>`;
  }).join('');
}

function renderHeader() {
  const articles = focusedArticles();
  $('#header-event-count').textContent = String(articles.length);
  $('#header-opportunity-count').textContent = String(focusedOpportunities().length);
}

function updateFreshness() {
  const newest = state.snapshot?.newestAt;
  const { online, total } = sourceState();
  $('#last-updated').textContent = newest ? `Newest ${ageLabel(newest)} · ${online}/${total || 0} sources online` : 'Waiting for current sources';
}

function filteredFeed() {
  const articles = focusedArticles();
  return state.feedFilter === 'all' ? articles : articles.filter(article => article.category === state.feedFilter);
}

function renderFeed() {
  const list = $('#feed-list');
  const articles = filteredFeed();
  if (!articles.length) {
    const { online, total } = sourceState();
    const context = focusContext();
    list.innerHTML = `<div class="empty-state"><div><strong>No current ${state.feedFilter === 'all' ? 'reports' : state.feedFilter + ' reports'} for ${escapeHtml(context.label)}</strong><span>${online}/${total || 0} public sources responded. Reference countries, ports and watch areas remain clickable while current sources refresh.</span></div></div>`;
    return;
  }
  list.innerHTML = articles.map(article => `<button class="feed-card" type="button" data-article-id="${escapeHtml(article.id)}">
    <span class="feed-card-top"><i class="dot" style="background:${colourFor(article.category)};color:${colourFor(article.category)}"></i><b class="category">${escapeHtml(categoryLabel(article.category))}</b><span>${escapeHtml(article.source)}</span><time>${escapeHtml(ageLabel(article.publishedAt))}</time></span>
    <span class="feed-card-regions">${regionBadgeHtml(article.focusRegionIds)}</span>
    <h3>${escapeHtml(article.title)}</h3>
    <p>${escapeHtml(article.summary || article.impact)}</p>
  </button>`).join('');
  $$('[data-article-id]').forEach(button => button.addEventListener('click', () => {
    const article = currentArticles().find(item => item.id === button.dataset.articleId);
    if (article) showArticle(article, true);
  }));
}

function showEntity(entity) {
  const data = entity?.data;
  if (!data) return;
  if (entity.kind.includes('watch') || data.regionId && data.why) showWatchArea(data);
  else if (entity.kind.includes('focus')) showPlace(data);
  else if (entity.kind.includes('route') || data.geometry?.type === 'LineString' || data.properties?.class === 'shipping') showRoute(data);
  else if (entity.kind.includes('port') || data.unlocode) showPort(data);
  else if (data.title && data.publishedAt) showArticle(data, false);
  else showPlace(data);
}

function openDetail(kicker, title, html) {
  $('#detail-kicker').textContent = kicker;
  $('#detail-title').textContent = title;
  $('#detail-body').innerHTML = html;
  $('#detail-panel').classList.remove('is-hidden');
}
function detailMeta(items) {
  return `<div class="detail-meta">${items.map(([label, value]) => `<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>`;
}
function saveControl(item) {
  const exists = state.saved.some(saved => saved.id === item.id);
  return `<button class="save-button" type="button" data-save-id="${escapeHtml(item.id)}">${exists ? 'REMOVE FROM SAVED' : 'SAVE ITEM'}</button>`;
}
function bindSave(item) {
  const button = $('[data-save-id]');
  if (!button) return;
  button.addEventListener('click', () => toggleSaved(item));
}
function toggleSaved(item) {
  const index = state.saved.findIndex(saved => saved.id === item.id);
  if (index >= 0) state.saved.splice(index, 1);
  else state.saved.unshift({ ...item, savedAt: new Date().toISOString() });
  persistSaved();
  showMessage(index >= 0 ? 'Removed from saved items' : 'Saved');
  $('#detail-panel').classList.add('is-hidden');
  if (state.view === 'saved') renderWorkspace('saved');
}

function showArticle(article, moveMap) {
  if (moveMap && article.coordinates) state.map?.flyTo(article.coordinates, { zoom: Math.max(4, state.map.zoom) });
  const url = safeUrl(article.url);
  openDetail(categoryLabel(article.category).toUpperCase(), article.title, `
    <p>${escapeHtml(article.summary || article.impact || 'Open the original report for full details.')}</p>
    ${detailMeta([
      ['Published', dateTime(article.publishedAt)],
      ['Source', article.source || 'Unknown'],
      ['Location', article.location?.name || 'Global'],
      ['Why it matters', article.impact || categoryLabel(article.category)]
    ])}
    ${saveControl(article)}
    ${url ? `<a class="detail-action" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL SOURCE ↗</a>` : ''}
  `);
  bindSave(article);
}

function showPort(port) {
  const coords = port.coordinates || {};
  openDetail('MAJOR PORT', port.name || 'Port', `
    <p>${escapeHtml(port.name)} is a ${escapeHtml(port.type || 'commercial')} port in ${escapeHtml(port.country || '')}. Use it to inspect route exposure and nearby current events.</p>
    ${detailMeta([
      ['Country', port.country || '—'],
      ['UN/LOCODE', port.unlocode || '—'],
      ['Importance', number(port.importance)],
      ['Coordinates', `${number(coords.lat, 2)}, ${number(coords.lon, 2)}`]
    ])}
    <p><strong>Main cargo:</strong> ${escapeHtml((port.commodities || []).join(', ') || 'Not specified')}</p>
    ${saveControl({ ...port, id: port.id || port.unlocode, itemType: 'port' })}
  `);
  bindSave({ ...port, id: port.id || port.unlocode, itemType: 'port' });
}

function showRoute(route) {
  const properties = route.properties || route;
  openDetail('SHIPPING ROUTE', properties.name || 'Route', `
    <p>This reference route can be combined with current conflict and disruption markers to identify exposed journeys and alternative corridors.</p>
    ${detailMeta([
      ['Route class', properties.class || 'Shipping'],
      ['Importance', number(properties.importance)],
      ['Cargo', properties.commodity || 'Mixed'],
      ['Status', 'Reference route']
    ])}
    ${saveControl({ ...properties, id: properties.id || properties.name, itemType: 'route' })}
  `);
  bindSave({ ...properties, id: properties.id || properties.name, itemType: 'route' });
}

function showWatchArea(area) {
  const region = regionById(area.regionId);
  openDetail('STRATEGIC WATCH AREA', area.title || 'Watch area', `
    <p>${escapeHtml(area.why || 'A commercially important corridor or concentration of risk.')}</p>
    ${detailMeta([
      ['Priority region', region?.label || area.regionId || '—'],
      ['Primary theme', area.type || 'Current conditions'],
      ['Relevant sectors', (area.sectors || []).join(', ') || 'Multiple'],
      ['Status', 'Reference area — check current reports']
    ])}
    <p><strong>Research use:</strong> Compare current event markers, ports and shipping routes around this area before treating it as an active disruption.</p>
    ${saveControl({ ...area, id: `watch-${area.id}`, itemType: 'watch-area' })}
  `);
  bindSave({ ...area, id: `watch-${area.id}`, itemType: 'watch-area' });
}

function showPlace(place) {
  const name = place.nameEnglish || place.name || place.country || 'Place';
  const local = place.nameLocal || place.nativeName || '';
  const code = place.iso2 || place.countryCode || '';
  const profile = (state.snapshot?.priorityCountries || []).find(country => country.iso2 === code) || place;
  const articles = currentArticles().filter(article => article.location?.countryCode && article.location.countryCode === code);
  const regions = regionNames(profile.focusRegionIds || []);
  const region = regionById(profile.focusRegionIds?.[0]);
  openDetail(place.labelType === 'country' || code ? 'COUNTRY' : 'PLACE', name, `
    ${local && local !== name ? `<p><strong>Local name:</strong> ${escapeHtml(local)}</p>` : ''}
    ${regions.length ? `<div class="detail-region-row">${regions.map(regionName => `<span class="region-badge">${escapeHtml(regionName)}</span>`).join('')}</div>` : ''}
    <p>${articles.length ? `${articles.length} current report${articles.length === 1 ? '' : 's'} mention this country in the selected window.` : 'No current report is matched to this country at present. Its reference profile remains available.'}</p>
    ${detailMeta([
      ['Current reports', String(articles.length)],
      ['Major ports', String(profile.portCount || 0)],
      ['Reference routes', String(profile.routeCount || 0)],
      ['Regional focus', regions.join(', ') || 'World map']
    ])}
    ${region ? `<p><strong>What Merlin monitors here:</strong> ${escapeHtml((region.watchTopics || []).join(' · '))}</p>` : ''}
    ${articles.slice(0, 8).map(article => `<button class="feed-card" type="button" data-place-article="${escapeHtml(article.id)}"><span class="feed-card-top"><b class="category">${escapeHtml(categoryLabel(article.category))}</b><time>${escapeHtml(ageLabel(article.publishedAt))}</time></span><h3>${escapeHtml(article.title)}</h3></button>`).join('')}
  `);
  $$('[data-place-article]').forEach(button => button.addEventListener('click', () => {
    const article = currentArticles().find(item => item.id === button.dataset.placeArticle);
    if (article) showArticle(article, false);
  }));
}

function showMessage(message, timeout = 2800) {
  const element = $('#map-message');
  element.textContent = message;
  element.classList.remove('is-hidden');
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => element.classList.add('is-hidden'), timeout);
}

function openView(view) {
  state.view = view;
  $('#app').dataset.view = view;
  $$('.nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.view === view));
  if (view === 'map') {
    $('#workspace').classList.add('is-hidden');
    $('#map-view').classList.remove('is-hidden');
    state.map?.resize();
  } else {
    $('#map-view').classList.remove('is-hidden');
    $('#workspace').classList.remove('is-hidden');
    renderWorkspace(view);
  }
  closeMobileNav();
}

const VIEW_META = Object.freeze({
  opportunities: ['COMMERCIAL INTELLIGENCE', 'Opportunities', 'Ranked current developments that may create demand, pricing changes or supply gaps.'],
  markets: ['MARKET SNAPSHOT', 'Markets', 'Current public price data and material moves connected to world events.'],
  conflicts: ['CURRENT SECURITY DEVELOPMENTS', 'Conflicts', 'Current conflict reporting, affected countries and possible commercial exposure.'],
  countries: ['COUNTRY ACTIVITY', 'Countries', 'Countries most frequently mentioned by current public sources.'],
  briefing: ['TODAY AT A GLANCE', 'Daily briefing', 'A practical summary of what changed, why it matters and what to check next.'],
  saved: ['YOUR RESEARCH', 'Saved items', 'Reports, ports and routes you saved for later review.']
});

function renderWorkspace(view) {
  const meta = VIEW_META[view] || VIEW_META.opportunities;
  const context = focusContext();
  $('#workspace-kicker').textContent = `${meta[0]} · ${context.label.toUpperCase()}`;
  $('#workspace-title').textContent = meta[1];
  $('#workspace-subtitle').textContent = `${meta[2]} Current filter: ${context.description}.`;
  const renderers = { opportunities: renderOpportunities, markets: renderMarkets, conflicts: renderConflicts, countries: renderCountries, briefing: renderBriefing, saved: renderSaved };
  (renderers[view] || renderOpportunities)();
}

function setSummary(items) {
  $('#workspace-summary').innerHTML = items.map(item => `<div class="summary-stat"><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.detail || '')}</span></div>`).join('');
}
function queryMatches(...values) {
  const query = $('#workspace-search').value.trim().toLowerCase();
  return !query || values.some(value => String(value || '').toLowerCase().includes(query));
}

function renderOpportunities() {
  const opportunities = focusedOpportunities().filter(item => queryMatches(item.title, item.customer, item.whyItMatters)).slice(0, 48);
  const top = opportunities[0]?.score || 0;
  const context = focusContext();
  setSummary([
    { label: 'CURRENT OPPORTUNITIES', value: String(opportunities.length), detail: `${context.label} · last ${state.hours} hours` },
    { label: 'TOP SCORE', value: String(top), detail: 'evidence and timing score' },
    { label: 'SUPPLY / LOGISTICS', value: String(opportunities.filter(item => /supply|freight|port|route|delivery/i.test(`${item.title} ${item.whyItMatters}`)).length), detail: 'possible operational openings' },
    { label: 'MARKET MOVES', value: String(opportunities.filter(item => item.type === 'market').length), detail: 'moves worth investigating' },
    { label: 'SOURCES ONLINE', value: `${sourceState().online}/${sourceState().total || 0}`, detail: 'public sources responding' }
  ]);
  const regions = focusContext().regions;
  $('#workspace-content').innerHTML = `${regionOverviewCards(regions)}${opportunities.length ? `<div class="workspace-grid">${opportunities.map(opportunityCard).join('')}</div>` : emptyWorkspace('No current opportunities met the threshold', 'Reference sectors and watch areas remain visible. Refresh current sources or use a wider time window.')}`;
  bindRegionOverviewButtons();
  bindWorkspaceArticleLinks();
}

function opportunityCard(item) {
  const url = safeUrl(item.sourceUrl);
  return `<article class="content-card">
    <header><div><span>${escapeHtml(item.type === 'market' ? 'MARKET MOVE' : 'CURRENT DEVELOPMENT')}</span><h3>${escapeHtml(item.title)}</h3></div><div class="score-badge">${escapeHtml(item.score)}</div></header>
    <div class="card-body">
      <div class="card-region-row">${regionBadgeHtml(item.focusRegionIds)}</div>
      <div class="card-detail-list">
        <div><small>POSSIBLE CUSTOMER</small><span>${escapeHtml(item.customer)}</span></div>
        <div><small>WHY IT MAY MATTER</small><span>${escapeHtml(item.whyItMatters)}</span></div>
        <div><small>NEXT RESEARCH STEP</small><span>${escapeHtml(item.action)}</span></div>
        <div><small>WHAT COULD INVALIDATE IT</small><span>${escapeHtml(item.risk)}</span></div>
      </div>
      <div class="card-footer"><span>${escapeHtml(item.evidence)} · ${escapeHtml(ageLabel(item.observedAt))}</span>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">SOURCE ↗</a>` : ''}</div>
    </div>
  </article>`;
}

function renderMarkets() {
  const markets = (state.snapshot?.markets || []).filter(item => queryMatches(item.name, item.symbol));
  const positive = markets.filter(item => Number(item.change24h) > 0).length;
  const largest = [...markets].sort((a, b) => Math.abs(Number(b.change24h) || 0) - Math.abs(Number(a.change24h) || 0))[0];
  setSummary([
    { label: 'ASSETS', value: String(markets.length), detail: 'current public prices' },
    { label: 'RISING', value: String(positive), detail: 'positive over 24 hours' },
    { label: 'FALLING', value: String(markets.length - positive), detail: 'negative over 24 hours' },
    { label: 'LARGEST MOVE', value: largest ? `${largest.symbol} ${Number(largest.change24h).toFixed(1)}%` : '—', detail: 'absolute 24-hour move' },
    { label: 'UPDATED', value: markets[0] ? ageLabel(markets[0].updatedAt) : '—', detail: 'market source freshness' }
  ]);
  $('#workspace-content').innerHTML = markets.length ? `<table class="market-table"><thead><tr><th>ASSET</th><th>PRICE</th><th>24H</th><th>UPDATED</th><th>SOURCE</th></tr></thead><tbody>${markets.map(market => {
    const change = Number(market.change24h);
    return `<tr><td><strong>${escapeHtml(market.symbol)}</strong><br><small>${escapeHtml(market.name)}</small></td><td>${escapeHtml(money(market.price))}</td><td class="${change >= 0 ? 'positive' : 'negative'}">${Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}</td><td>${escapeHtml(ageLabel(market.updatedAt))}</td><td>${escapeHtml(market.source)}</td></tr>`;
  }).join('')}</tbody></table>` : emptyWorkspace('Market feed unavailable', 'Current prices were not returned in time. Refresh shortly; news and map data load independently.');
}

function renderConflicts() {
  const items = focusedArticles().filter(item => item.category === 'conflict' && queryMatches(item.title, item.location?.name, item.summary));
  const mapped = items.filter(item => item.coordinates).length;
  const countries = new Set(items.map(item => item.location?.country || item.location?.name).filter(Boolean));
  const watchAreas = focusedWatchAreas().filter(area => queryMatches(area.title, area.why, (area.sectors || []).join(' ')));
  setSummary([
    { label: 'CURRENT REPORTS', value: String(items.length), detail: `${focusContext().label} · within ${state.hours} hours` },
    { label: 'MAPPED', value: String(mapped), detail: 'clickable on the live map' },
    { label: 'COUNTRIES MENTIONED', value: String(countries.size), detail: 'matched from report text' },
    { label: 'WATCH AREAS', value: String(watchAreas.length), detail: 'reference corridors to monitor' },
    { label: 'NEWEST', value: items[0] ? ageLabel(items[0].publishedAt) : '—', detail: 'latest current report' }
  ]);
  const current = items.length ? `<div class="workspace-grid">${items.map(articleCard).join('')}</div>` : emptyWorkspace('No current conflict report in this filter', 'Merlin does not substitute old conflict stories. The strategic watch areas below are reference coverage, not claims of a live incident.');
  const references = watchAreas.length ? `<div class="workspace-grid reference-grid">${watchAreas.map(watchAreaCard).join('')}</div>` : '';
  $('#workspace-content').innerHTML = `${current}<section class="workspace-section-heading"><span>REFERENCE COVERAGE</span><h2>Strategic areas to monitor</h2></section>${references}`;
  bindWorkspaceArticleLinks();
  bindWatchAreaButtons();
}

function articleCard(article) {
  return `<article class="content-card">
    <header><div><span>${escapeHtml(categoryLabel(article.category).toUpperCase())}</span><h3>${escapeHtml(article.title)}</h3></div></header>
    <div class="card-body"><div class="card-region-row">${regionBadgeHtml(article.focusRegionIds)}</div><p>${escapeHtml(article.summary || article.impact)}</p>
      <div class="card-footer"><span>${escapeHtml(article.source)} · ${escapeHtml(article.location?.name || 'Global')} · ${escapeHtml(ageLabel(article.publishedAt))}</span><button type="button" data-open-article="${escapeHtml(article.id)}">VIEW</button></div>
    </div>
  </article>`;
}
function bindWorkspaceArticleLinks() {
  $$('[data-open-article]').forEach(button => button.addEventListener('click', () => {
    const article = currentArticles().find(item => item.id === button.dataset.openArticle);
    if (!article) return;
    openView('map');
    showArticle(article, true);
  }));
}

function renderCountries() {
  const currentActivity = new Map((state.snapshot?.countries || []).map(item => [item.countryCode, item]));
  let profiles = focusedCountries();
  if (state.focusRegion === 'world') {
    const priorityCodes = new Set(profiles.map(item => item.iso2));
    const additional = (state.snapshot?.countries || []).filter(item => !priorityCodes.has(item.countryCode)).map(activity => {
      const base = state.staticData.countries.find(country => country.iso2 === activity.countryCode) || {};
      return { ...base, ...activity, iso2: activity.countryCode, name: activity.country, activityCount: activity.count, latestAt: activity.latestAt, categories: activity.categories || [], focusRegionIds: [] };
    });
    profiles = [...profiles, ...additional];
  }
  profiles = profiles.filter(item => queryMatches(item.name, item.iso2, (item.categories || []).join(' '), regionNames(item.focusRegionIds).join(' '))).sort((a, b) => Number(b.activityCount || currentActivity.get(b.iso2)?.count || 0) - Number(a.activityCount || currentActivity.get(a.iso2)?.count || 0) || String(a.name).localeCompare(String(b.name)));
  setSummary([
    { label: 'COUNTRY PROFILES', value: String(profiles.length), detail: focusContext().label },
    { label: 'WITH CURRENT REPORTS', value: String(profiles.filter(item => Number(item.activityCount || currentActivity.get(item.iso2)?.count || 0) > 0).length), detail: `within ${state.hours} hours` },
    { label: 'MAJOR PORTS', value: String(profiles.reduce((sum, item) => sum + Number(item.portCount || 0), 0)), detail: 'reference coverage' },
    { label: 'CONFLICT EXPOSURE', value: String(profiles.filter(item => (item.categories || []).includes('conflict')).length), detail: 'current reporting' },
    { label: 'REGIONAL GROUPS', value: String(focusContext().regions.length), detail: 'deep coverage areas' }
  ]);
  $('#workspace-content').innerHTML = `${regionOverviewCards(focusContext().regions)}${profiles.length ? `<table class="country-table"><thead><tr><th>COUNTRY</th><th>REGION</th><th>CURRENT</th><th>PORTS / ROUTES</th><th>TOPICS</th><th></th></tr></thead><tbody>${profiles.map(item => {
    const activity = currentActivity.get(item.iso2);
    const count = Number(item.activityCount || activity?.count || 0);
    const topics = (item.categories || activity?.categories || []).map(categoryLabel).join(', ') || 'Reference profile';
    return `<tr><td><div class="focus-country-name"><i></i><span><strong>${escapeHtml(item.name || item.country)}</strong><br><small>${escapeHtml(item.iso2 || item.countryCode)}</small></span></div></td><td>${regionBadgeHtml(item.focusRegionIds)}</td><td>${count}${item.latestAt ? `<br><small>${escapeHtml(ageLabel(item.latestAt))}</small>` : ''}</td><td>${escapeHtml(`${item.portCount || 0} / ${item.routeCount || 0}`)}</td><td>${escapeHtml(topics)}</td><td><button class="save-button" type="button" data-country-code="${escapeHtml(item.iso2 || item.countryCode)}">VIEW ON MAP</button></td></tr>`;
  }).join('')}</tbody></table>` : emptyWorkspace('No country profiles matched', 'All countries remain on the map. Clear the filter or choose World.')}`;
  bindRegionOverviewButtons();
  $$('[data-country-code]').forEach(button => button.addEventListener('click', () => {
    const country = state.staticData.countries.find(item => item.iso2 === button.dataset.countryCode);
    if (!country) return;
    openView('map');
    state.map?.flyTo({ lat: country.lat, lon: country.lon }, { zoom: 4 });
    showPlace({ ...country, nameEnglish: country.name, nameLocal: country.nativeName, labelType: 'country' });
  }));
}

function renderBriefing() {
  const articles = focusedArticles();
  const opportunities = focusedOpportunities();
  const conflicts = articles.filter(item => item.category === 'conflict');
  const disruptions = articles.filter(item => item.category === 'disruption');
  const markets = state.snapshot?.markets || [];
  const regions = focusContext().regions;
  const watches = focusedWatchAreas();
  setSummary([
    { label: 'CURRENT REPORTS', value: String(articles.length), detail: `${focusContext().label} · within ${state.hours} hours` },
    { label: 'CONFLICT', value: String(conflicts.length), detail: 'security-related reports' },
    { label: 'DISRUPTIONS', value: String(disruptions.length), detail: 'supply and transport reports' },
    { label: 'OPPORTUNITIES', value: String(opportunities.length), detail: 'items worth investigating' },
    { label: 'WATCH AREAS', value: String(watches.length), detail: 'commercial corridors' }
  ]);
  const topMoves = [...markets].filter(item => Number.isFinite(Number(item.change24h))).sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5);
  $('#workspace-content').innerHTML = `${regionOverviewCards(regions)}<div class="brief-grid">
    <section class="brief-section"><header><span class="card-kicker">WHAT CHANGED</span><h2>Most recent developments</h2></header>${briefList(articles.slice(0, 12), item => item.title, item => `${item.source} · ${regionNames(item.focusRegionIds).join(', ') || 'World'} · ${ageLabel(item.publishedAt)}`)}</section>
    <section class="brief-section"><header><span class="card-kicker">COMMERCIAL ANGLES</span><h2>Worth investigating</h2></header>${briefList(opportunities.slice(0, 10), item => item.title, item => item.action)}</section>
    <section class="brief-section"><header><span class="card-kicker">CONFLICT & DISRUPTION</span><h2>Possible operational effects</h2></header>${briefList([...conflicts, ...disruptions].slice(0, 10), item => item.title, item => `${item.impact} · ${item.location?.name || regionNames(item.focusRegionIds).join(', ') || 'Global'}`)}</section>
    <section class="brief-section"><header><span class="card-kicker">MARKETS</span><h2>Largest current moves</h2></header>${briefList(topMoves, item => `${item.symbol} ${Number(item.change24h) >= 0 ? 'up' : 'down'} ${Math.abs(Number(item.change24h)).toFixed(2)}%`, item => `${money(item.price)} · ${item.source}`)}</section>
    <section class="brief-section"><header><span class="card-kicker">STRATEGIC WATCH AREAS</span><h2>Where to check exposure</h2></header>${briefList(watches.slice(0, 10), item => item.title, item => item.why)}</section>
    <section class="brief-section"><header><span class="card-kicker">WHAT TO CHECK NEXT</span><h2>Practical research list</h2></header><ul class="brief-list">
      <li><strong>Verify the strongest opportunity</strong><span>Open the original source, find a second independent source and check whether a price or supply change has already occurred.</span></li>
      <li><strong>Review exposed routes</strong><span>Enable shipping routes and compare current conflict or disruption markers with ports and strategic corridors.</span></li>
      <li><strong>Find the customer before the product</strong><span>Identify which business has an urgent problem, then confirm whether you can source, introduce or report something useful.</span></li>
      <li><strong>Reject stale or weak signals</strong><span>Discard anything that cannot be independently verified quickly or whose commercial effect is already priced in.</span></li>
    </ul></section>
    <section class="brief-section"><header><span class="card-kicker">SOURCE HEALTH</span><h2>Current coverage</h2></header><div class="card-body"><div class="source-strip">${(state.snapshot?.sources || []).map(source => `<span class="source-chip ${source.state === 'ONLINE' ? 'online' : 'offline'}">${escapeHtml(source.name)} · ${escapeHtml(source.state)}</span>`).join('')}</div></div></section>
  </div>`;
  bindRegionOverviewButtons();
}

function briefList(items, title, detail) {
  if (!items.length) return '<div class="empty-state"><div><strong>No current items</strong><span>Refresh or use a wider time window.</span></div></div>';
  return `<ul class="brief-list">${items.map(item => `<li><strong>${escapeHtml(title(item))}</strong><span>${escapeHtml(detail(item))}</span></li>`).join('')}</ul>`;
}

function regionOverviewCards(regions = []) {
  if (!regions.length) return '';
  return `<div class="region-overview-grid">${regions.map(region => `<article class="region-overview-card">
    <header><div><span class="card-kicker">PRIORITY REGION</span><h3>${escapeHtml(region.label)}</h3></div><button type="button" data-open-region="${escapeHtml(region.id)}">FOCUS MAP</button></header>
    <div class="region-overview-body">
      <div class="region-overview-metrics"><div><small>CURRENT</small><strong>${escapeHtml(region.counts?.current || 0)}</strong></div><div><small>CONFLICT</small><strong>${escapeHtml(region.counts?.conflict || 0)}</strong></div><div><small>OPENINGS</small><strong>${escapeHtml(region.counts?.opportunities || 0)}</strong></div><div><small>PORTS</small><strong>${escapeHtml(region.counts?.ports || 0)}</strong></div></div>
      <p>${escapeHtml(region.description || '')}</p>
      <div class="region-topic-list">${(region.watchTopics || []).slice(0, 5).map(topic => `<span>${escapeHtml(topic)}</span>`).join('')}</div>
    </div>
  </article>`).join('')}</div>`;
}
function bindRegionOverviewButtons() {
  $$('[data-open-region]').forEach(button => button.addEventListener('click', () => {
    selectRegionFocus(button.dataset.openRegion, true);
    openView('map');
  }));
}
function watchAreaCard(area) {
  const region = regionById(area.regionId);
  return `<article class="content-card reference-card"><header><div><span class="reference-label">REFERENCE WATCH AREA</span><h3>${escapeHtml(area.title)}</h3></div></header><div class="card-body"><div class="card-region-row"><span class="region-badge">${escapeHtml(region?.label || area.regionId)}</span></div><p>${escapeHtml(area.why)}</p><div class="card-footer"><span>${escapeHtml((area.sectors || []).join(' · '))}</span><button type="button" data-watch-area="${escapeHtml(area.id)}">VIEW</button></div></div></article>`;
}
function bindWatchAreaButtons() {
  $$('[data-watch-area]').forEach(button => button.addEventListener('click', () => {
    const area = (state.snapshot?.watchAreas || []).find(item => item.id === button.dataset.watchArea);
    if (!area) return;
    openView('map');
    state.map?.flyTo({ lat: area.lat, lon: area.lon }, { zoom: 5 });
    showWatchArea(area);
  }));
}

function renderSaved() {
  const items = state.saved.filter(item => queryMatches(item.title, item.name, item.country, item.summary));
  setSummary([
    { label: 'SAVED ITEMS', value: String(items.length), detail: 'stored in this browser' },
    { label: 'REPORTS', value: String(items.filter(item => item.publishedAt).length), detail: 'saved current reporting' },
    { label: 'PORTS', value: String(items.filter(item => item.itemType === 'port').length), detail: 'saved port references' },
    { label: 'ROUTES', value: String(items.filter(item => item.itemType === 'route').length), detail: 'saved route references' },
    { label: 'LATEST SAVE', value: items[0]?.savedAt ? ageLabel(items[0].savedAt) : '—', detail: 'saved locally' }
  ]);
  $('#workspace-content').innerHTML = items.length ? `<div class="workspace-grid">${items.map(item => `<article class="content-card"><header><div><span>${escapeHtml(item.itemType?.toUpperCase() || item.category?.toUpperCase() || 'SAVED')}</span><h3>${escapeHtml(item.title || item.name)}</h3></div></header><div class="card-body"><p>${escapeHtml(item.summary || item.country || item.whyItMatters || '')}</p><div class="card-footer"><span>Saved ${escapeHtml(ageLabel(item.savedAt))}</span><button type="button" data-remove-saved="${escapeHtml(item.id)}">REMOVE</button></div></div></article>`).join('')}</div>` : emptyWorkspace('Nothing saved yet', 'Open a current report, port or route and choose Save item.');
  $$('[data-remove-saved]').forEach(button => button.addEventListener('click', () => {
    state.saved = state.saved.filter(item => item.id !== button.dataset.removeSaved);
    persistSaved();
    renderSaved();
  }));
}

function emptyWorkspace(title, text) { return `<div class="empty-state"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div></div>`; }

function searchRecords(query) {
  const text = query.trim().toLowerCase();
  if (text.length < 2) return [];
  return [
    ...state.staticData.countries.map(item => ({ type: 'COUNTRY', name: item.name, localName: item.nativeName, lat: item.lat, lon: item.lon, zoom: 4, data: { ...item, nameEnglish: item.name, nameLocal: item.nativeName, labelType: 'country' } })),
    ...state.staticData.cities.map(item => ({ type: item.kind === 'capital' ? 'CAPITAL' : 'CITY', name: item.name, localName: item.localName, secondary: item.country, lat: item.lat, lon: item.lon, zoom: 6, data: { ...item, nameEnglish: item.name, nameLocal: item.localName || '', labelType: item.kind === 'capital' ? 'capital' : 'city' } })),
    ...state.staticData.ports.map(item => ({ type: 'PORT', name: item.name, secondary: item.country, lat: item.coordinates?.lat, lon: item.coordinates?.lon, zoom: 6, data: item }))
  ].filter(item => `${item.name} ${item.localName || ''} ${item.secondary || ''}`.toLowerCase().includes(text)).slice(0, 24);
}
function renderSearch() {
  const query = $('#map-search').value;
  const results = searchRecords(query);
  $('#search-results').innerHTML = results.length ? results.map((result, index) => `<button class="search-result" type="button" data-search-index="${index}"><span><strong>${escapeHtml(result.name)}</strong><small>${escapeHtml(result.localName && result.localName !== result.name ? `(${result.localName}) · ${result.secondary || result.type}` : result.secondary || result.type)}</small></span><b>${escapeHtml(result.type)}</b></button>`).join('') : query.trim().length >= 2 ? '<div class="empty-state"><div><strong>No place found</strong><span>Try an English country, city or port name.</span></div></div>' : '';
  $$('[data-search-index]').forEach(button => button.addEventListener('click', () => {
    const result = results[Number(button.dataset.searchIndex)];
    state.map?.flyTo({ lat: result.lat, lon: result.lon }, { zoom: result.zoom });
    $('#search-panel').classList.add('is-hidden');
    if (result.type === 'PORT') showPort(result.data); else showPlace(result.data);
  }));
}

function bindEvents() {
  $('#brand-home').addEventListener('click', () => openView('map'));
  $$('.nav-item').forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
  $$('[data-region-focus]').forEach(button => button.addEventListener('click', () => selectRegionFocus(button.dataset.regionFocus, true)));
  $('#workspace-close').addEventListener('click', () => openView('map'));
  $('#workspace-refresh').addEventListener('click', () => refreshSnapshot(true));
  $('#workspace-search').addEventListener('input', () => state.view !== 'map' && renderWorkspace(state.view));
  $('#refresh-live').addEventListener('click', () => refreshSnapshot(true));
  $('#detail-close').addEventListener('click', () => $('#detail-panel').classList.add('is-hidden'));
  $('#search-toggle').addEventListener('click', () => { $('#search-panel').classList.toggle('is-hidden'); if (!$('#search-panel').classList.contains('is-hidden')) $('#map-search').focus(); });
  $('#search-close').addEventListener('click', () => $('#search-panel').classList.add('is-hidden'));
  $('#map-search').addEventListener('input', renderSearch);
  $('#zoom-in').addEventListener('click', () => state.map?.setZoom(state.map.zoom + 1));
  $('#zoom-out').addEventListener('click', () => state.map?.setZoom(state.map.zoom - 1));
  $('#world-view').addEventListener('click', () => selectRegionFocus('world', true));
  $('#layer-collapse').addEventListener('click', () => $('#layer-panel').classList.toggle('is-collapsed'));
  $('#feed-collapse').addEventListener('click', () => $('#live-feed').classList.toggle('is-collapsed'));
  $$('[data-layer]').forEach(input => input.addEventListener('change', () => state.map?.setLayerVisibility({ [input.dataset.layer]: input.checked })));
  $$('[data-feed-filter]').forEach(button => button.addEventListener('click', () => {
    state.feedFilter = button.dataset.feedFilter;
    $$('[data-feed-filter]').forEach(item => item.classList.toggle('is-active', item === button));
    renderFeed();
  }));
  $$('[data-hours]').forEach(button => button.addEventListener('click', () => {
    state.hours = Number(button.dataset.hours);
    $$('[data-hours]').forEach(item => item.classList.toggle('is-active', item === button));
    refreshSnapshot(true);
  }));
  $('#mobile-menu').addEventListener('click', () => {
    $('#app').classList.toggle('mobile-nav-open');
    $('#mobile-nav-scrim').classList.toggle('is-hidden', !$('#app').classList.contains('mobile-nav-open'));
  });
  $('#mobile-nav-scrim').addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('#detail-panel').classList.add('is-hidden'); $('#search-panel').classList.add('is-hidden'); closeMobileNav(); }
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { event.preventDefault(); $('#search-panel').classList.remove('is-hidden'); $('#map-search').focus(); }
  });
}

function closeMobileNav() { $('#app').classList.remove('mobile-nav-open'); $('#mobile-nav-scrim').classList.add('is-hidden'); }

function startClock() {
  const update = () => { $('#utc-clock').textContent = `${new Date().toISOString().slice(11, 19)} UTC`; };
  update();
  setInterval(update, 1000);
}

async function unregisterOldWorkers() {
  try {
    if ('serviceWorker' in navigator) for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    if ('caches' in window) for (const key of await caches.keys()) if (/merlin/i.test(key)) await caches.delete(key);
  } catch {}
}

async function boot() {
  bindEvents();
  startClock();
  await unregisterOldWorkers();
  await loadStaticData();
  initialiseMap();
  renderAll();
  refreshSnapshot(false);
  setInterval(() => refreshSnapshot(false), 90_000);
}

boot().catch(error => {
  console.error('Merlin failed to start', error);
  setConnection('limited', 'LIMITED');
  showMessage('The interface could not start correctly. Reload the page.', 8000);
});
