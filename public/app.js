import { $, $$, debounce, esc, toast, ago } from './modules/utils.js';
import { state, setState } from './modules/state.js';
import { api } from './modules/api.js';
import { MerlinMap } from './modules/map.js';
import { MapRenderer } from './modules/map-renderer.js';
import { renderFeed } from './modules/feed.js';
import { openEvent, closeDetail } from './modules/detail.js';
import { renderWorkspace } from './modules/workspaces.js';

let renderer;
let feedCategory = 'all';
let refreshTimer = null;
let tileState = { loaded: 0, failed: 0, pending: 0, basemap: 'tech' };

const map = new MerlinMap($('#mapViewport'), {
  onTiles: status => {
    tileState = status;
    renderMapStatus();
  },
});
renderer = new MapRenderer(map, selectEvent);

boot();

async function boot() {
  bindEvents();
  clock();
  setInterval(clock, 1000);
  try {
    const [reference, snapshot] = await Promise.all([
      api.reference(),
      api.snapshot(params()),
    ]);
    setState({ reference, snapshot });
    renderer.setReference(reference);
    buildRegions();
    updateLayerCounts();
    focusRegion(state.region, false);
    render();
    refreshTimer = setInterval(() => loadSnapshot(false).catch(() => {}), 60_000);
  } catch (error) {
    renderFatal(error);
  }
}

function params() {
  return {
    region: state.region,
    hours: state.hours,
    minScore: state.minScore,
    category: state.category,
  };
}

async function loadSnapshot(showToast = true) {
  if (showToast) toast('Updating current data…');
  const snapshot = await api.snapshot(params());
  setState({ snapshot });
  render();
  return snapshot;
}

async function manualRefresh() {
  const buttons = $$('[data-action="refresh"]');
  buttons.forEach(button => { button.disabled = true; button.dataset.oldText = button.textContent; button.textContent = 'UPDATING'; });
  try {
    await api.refresh();
    await loadSnapshot(false);
    toast('Sources refreshed');
  } catch (error) {
    toast(`Refresh failed: ${error.message}`);
  } finally {
    buttons.forEach(button => { button.disabled = false; button.textContent = button.dataset.oldText || 'REFRESH'; });
  }
}

function bindEvents() {
  document.addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'workspace') return navigate(actionEl.dataset.view);
    if (action === 'refresh') return manualRefresh();
    if (action === 'zoom-in') return map.setZoom(map.zoom + .55);
    if (action === 'zoom-out') return map.setZoom(map.zoom - .55);
    if (action === 'world') return map.world();
    if (action === 'search-toggle') return toggleSearch(true);
    if (action === 'search-close') return toggleSearch(false);
    if (action === 'detail-close') return closeDetail();
    if (action === 'sources') return openSources();
    if (action === 'sources-close') return closeSources();
    if (action === 'layers-collapse') return $('.layer-box').classList.toggle('collapsed');
    if (action === 'basemap') {
      map.setBasemap(actionEl.dataset.map);
      $$('[data-action="basemap"]').forEach(button => button.classList.toggle('active', button === actionEl));
      return;
    }
  });

  $('#windowSelect').addEventListener('change', event => setHours(Number(event.target.value)));
  $('#scoreInput').addEventListener('input', event => { $('#scoreOutput').textContent = event.target.value; });
  $('#scoreInput').addEventListener('change', event => {
    state.minScore = Number(event.target.value);
    loadSnapshot(false);
  });

  $('#categoryFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    $$('[data-category]', $('#categoryFilters')).forEach(row => row.classList.toggle('active', row === button));
    state.category = button.dataset.category;
    loadSnapshot(false);
  });

  $('#feedTabs').addEventListener('click', event => {
    const button = event.target.closest('[data-feed-category]');
    if (!button) return;
    feedCategory = button.dataset.feedCategory;
    $$('[data-feed-category]', $('#feedTabs')).forEach(row => row.classList.toggle('active', row === button));
    renderCurrentFeed();
  });

  document.addEventListener('click', event => {
    const hours = event.target.closest('[data-hours]');
    if (!hours) return;
    setHours(Number(hours.dataset.hours));
  });

  document.addEventListener('change', event => {
    const id = event.target?.dataset?.layer;
    if (!id) return;
    state.layers[id] = event.target.checked;
    renderer.setLayers(state.layers);
  });

  $('#searchInput').addEventListener('input', debounce(runSearch, 120));
}

function setHours(hours) {
  state.hours = hours;
  $('#windowSelect').value = String(hours);
  $$('[data-hours]').forEach(button => button.classList.toggle('active', Number(button.dataset.hours) === hours));
  loadSnapshot(false);
}

function buildRegions() {
  const tabs = $('#regionTabs');
  tabs.innerHTML = '';
  for (const region of state.reference.regions) {
    const button = document.createElement('button');
    button.textContent = region.short;
    button.dataset.region = region.id;
    button.classList.toggle('active', region.id === state.region);
    button.onclick = () => {
      state.region = region.id;
      $$('[data-region]', tabs).forEach(row => row.classList.toggle('active', row === button));
      focusRegion(region.id, true);
      loadSnapshot(false);
    };
    tabs.append(button);
  }
}

function focusRegion(id, animate = true) {
  const region = state.reference.regions.find(row => row.id === id) || state.reference.regions.find(row => row.id === 'world');
  const adjustedZoom = region.id === 'world' ? 2.05 : Math.max(2.2, region.zoom + .15);
  map.focus(region.center[0], region.center[1], adjustedZoom, animate);
}

function render() {
  const snapshot = state.snapshot || {};
  const events = snapshot.signals || [];
  renderer.setEvents(events);
  renderer.setLayers(state.layers);
  $('#eventCount').textContent = events.length;
  const coverage = snapshot.sourceCoverage || {};
  $('#coverageMetric').textContent = Number.isFinite(coverage.availability) ? `${coverage.availability}%` : '—';
  $('#demoBadge').classList.toggle('hidden', !snapshot.demoMode);
  $('#demoNotice').classList.toggle('hidden', !snapshot.demoMode);
  if (snapshot.demoMode) $('#demoNotice').textContent = snapshot.demoNotice || 'Deterministic demo data — interface preview, not live reporting.';
  $('#highCount').textContent = events.filter(item => ['HIGH', 'CRITICAL'].includes(item.urgency)).length;
  $('#layerEventCount').textContent = events.length;
  $('#feedStamp').textContent = snapshot.generatedAt ? `${ago(snapshot.generatedAt)} old` : '—';
  renderCurrentFeed();
  renderSourceHealth();
  renderMapStatus();
  if (state.view !== 'map') renderCurrentWorkspace();
}

function renderCurrentFeed() {
  const events = state.snapshot?.signals || [];
  const shown = feedCategory === 'all' ? events : events.filter(item => feedGroup(item.category) === feedCategory || item.category === feedCategory);
  renderFeed($('#eventFeed'), shown, selectEvent);
  renderSummary(shown);
}

function feedGroup(category) {
  if (['shipping', 'energy', 'cyber'].includes(category)) return 'shipping';
  if (['macro', 'rates', 'trade', 'commodities'].includes(category)) return 'macro';
  if (['policy', 'sanctions'].includes(category)) return 'policy';
  return category;
}

function renderSummary(events) {
  const high = events.filter(item => ['HIGH', 'CRITICAL'].includes(item.urgency)).length;
  const market = events.filter(item => item.market?.rules?.length).length;
  const verified = events.filter(item => item.independentSources >= 2 || item.officialPrimary).length;
  $('#feedSummary').innerHTML = `<span><b>${high}</b> high priority</span><span><b>${market}</b> market-linked</span><span><b>${verified}</b> corroborated / primary</span>`;
}

function navigate(view) {
  state.view = view;
  $$('.nav').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('#mapWorkspace').classList.toggle('active', view === 'map');
  $('#genericWorkspace').classList.toggle('active', view !== 'map');
  if (view !== 'map') renderCurrentWorkspace();
  else requestAnimationFrame(() => { map.render(); renderer.updatePositions(); });
}

function renderCurrentWorkspace() {
  const titles = {
    opportunities: ['FINANCIAL USE', 'Opportunities', 'Current developments with a defined market effect, ranked by evidence and model match.'],
    markets: ['PRICES AND EFFECTS', 'Markets', 'Current prices together with the events most likely to affect them.'],
    conflicts: ['CONFLICT AND ESCALATION', 'Conflicts', 'Current military and escalation events that pass the selected relevance threshold.'],
    countries: ['COUNTRY COVERAGE', 'Countries', 'Priority coverage, current event counts and the exposures worth checking.'],
    briefing: ['CURRENT SUMMARY', 'Daily brief', 'The most useful current developments without general-news clutter.'],
  };
  const title = titles[state.view] || titles.opportunities;
  $('#workspaceKicker').textContent = title[0];
  $('#workspaceTitle').textContent = title[1];
  $('#workspaceSubtitle').textContent = title[2];
  $('#workspaceBody').innerHTML = renderWorkspace(state.view, state.snapshot, selectEvent, state.reference);
}

function selectEvent(item) {
  if (!item) return;
  state.selectedSignal = item;
  openEvent(item);
  if (Number.isFinite(item.location?.lat) && Number.isFinite(item.location?.lon) && state.view === 'map') {
    map.focus(item.location.lat, item.location.lon, Math.max(map.zoom, 4.0));
  }
}

function renderSourceHealth() {
  const rows = state.snapshot?.sourceStatuses || [];
  const ok = rows.filter(row => row.status === 'ok').length;
  const button = $('#sourceHealth');
  button.querySelector('span').textContent = `${ok}/${rows.length} SOURCES`;
  button.classList.toggle('degraded', rows.length > 0 && ok / rows.length < .55);
}

function renderMapStatus() {
  const stamp = state.snapshot?.generatedAt ? `Data ${ago(state.snapshot.generatedAt)} old` : 'Waiting for data';
  const mapText = tileState.mode === 'fallback' || tileState.basemap === 'local-tech' ? `${stamp} · dark blue relief` : tileState.basemap === 'tech' ? `${stamp} · dark blue relief` : tileState.loaded > 0 ? `${stamp} · satellite` : tileState.failed > 0 ? `${stamp} · dark blue relief` : stamp;
  $('#mapUpdated').textContent = mapText;
}

function updateLayerCounts() {
  const ref = state.reference || {};
  $('#layerNodeCount').textContent = (ref.strategicNodes || []).length;
  $('#layerPortCount').textContent = (ref.ports || []).filter(port => Number(port.importance || 0) >= 70).length;
  $('#layerRouteCount').textContent = (ref.routes || []).length;
}

async function openSources() {
  try {
    const data = await api.sources();
    const coverage = data.coverage || {};
    const lanes = coverage.lanes || [];
    $('#sourceBody').innerHTML = `<p class="source-intro"><b>${coverage.total || data.sources.length} configured public-source streams.</b> Primary documents and official notices are weighted above discovery feeds. Tabloid and low-quality domains are blocked or discounted; disputed claims require corroboration.</p>
      <div class="coverage-summary"><div><b>${coverage.online ?? 0}</b><span>ONLINE</span></div><div><b>${coverage.availability ?? 0}%</b><span>AVAILABLE</span></div><div><b>${coverage.items ?? 0}</b><span>ITEMS</span></div><div><b>${coverage.error ?? 0}</b><span>FAILED</span></div></div>
      <div class="lane-grid">${lanes.map(l => `<div class="lane-card"><b>${esc(l.id.toUpperCase())}</b><strong>${l.online}/${l.total}</strong><small>${l.items} items</small></div>`).join('')}</div>
      <h3 class="source-heading">SOURCE STREAMS</h3>
      <div class="source-grid">${data.sources.map(source => `<div class="source-row ${source.status}"><i></i><span><b>${esc(source.name)}</b><small>${esc((source.lane || source.kind || 'source').toUpperCase())}${source.regionId ? ` · ${esc(source.regionId)}` : ''}</small></span><strong>${esc(source.status.toUpperCase())}</strong><small>${source.itemCount ?? 0} items${source.error ? ` · ${esc(source.error)}` : ''}</small></div>`).join('')}</div>`;
    $('#sourceDrawer').classList.add('open');
    $('#sourceDrawer').setAttribute('aria-hidden', 'false');
  } catch (error) {
    toast(error.message);
  }
}

function closeSources() {
  $('#sourceDrawer').classList.remove('open');
  $('#sourceDrawer').setAttribute('aria-hidden', 'true');
}

function toggleSearch(show) {
  $('#searchPanel').classList.toggle('hidden', !show);
  if (show) {
    $('#searchInput').focus();
    runSearch();
  } else {
    $('#searchInput').value = '';
    $('#searchResults').innerHTML = '';
  }
}

function runSearch() {
  const q = $('#searchInput').value.trim().toLowerCase();
  if (q.length < 2) {
    $('#searchResults').innerHTML = '<span>Type at least 2 characters.</span>';
    return;
  }
  const ref = state.reference;
  const rows = [];
  for (const country of ref.countries || []) {
    if (`${country.name} ${country.nativeName || ''}`.toLowerCase().includes(q)) rows.push({ name: country.name, sub: country.nativeName || country.region, lat: country.lat, lon: country.lon, zoom: 4 });
  }
  for (const city of ref.cities || []) {
    if (`${city.name} ${city.localName || ''}`.toLowerCase().includes(q)) rows.push({ name: city.name, sub: city.country, lat: city.lat, lon: city.lon, zoom: 5 });
  }
  for (const port of ref.ports || []) {
    if (port.name.toLowerCase().includes(q)) rows.push({ name: port.name, sub: `Port · ${port.country}`, lat: port.coordinates.lat, lon: port.coordinates.lon, zoom: 5 });
  }
  for (const node of ref.strategicNodes || []) {
    if (node.name.toLowerCase().includes(q)) rows.push({ name: node.name, sub: 'Key location', lat: node.lat, lon: node.lon, zoom: 5 });
  }
  for (const area of ref.strategicAreas || []) {
    if (`${area.name} ${(area.aliases || []).join(' ')}`.toLowerCase().includes(q)) rows.push({ name: area.name, sub: `Key area · ${area.type}`, lat: area.lat, lon: area.lon, zoom: 5 });
  }
  const top = rows.slice(0, 16);
  $('#searchResults').innerHTML = top.map((row, index) => `<button data-i="${index}"><b>${esc(row.name)}</b><small>${esc(row.sub || '')}</small></button>`).join('') || '<span>No matching place.</span>';
  $$('[data-i]', $('#searchResults')).forEach(button => {
    button.onclick = () => {
      const row = top[Number(button.dataset.i)];
      map.focus(row.lat, row.lon, row.zoom);
      toggleSearch(false);
    };
  });
}

function clock() {
  $('#utcClock').textContent = `${new Date().toISOString().slice(11, 16)} UTC`;
}

function renderFatal(error) {
  $('#eventFeed').innerHTML = `<div class="empty"><b>Merlin could not start.</b><span>${esc(error.message)}</span></div>`;
  $('#sourceHealth span').textContent = 'ERROR';
}
