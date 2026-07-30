import { createStore } from './state/store.js';
import { createApiClient } from './api/client.js';
import { MapController } from './map/map-controller.js';
import { EventList } from './scan/event-list.js';
import { CategoryFilters } from './scan/category-filters.js';
import { ScanController } from './scan/scan-controller.js';
import { SearchController } from './search/search-controller.js';
import { SourcePanel } from './sources/source-panel.js';
import { DiagnosticsDrawer } from './sources/diagnostics-drawer.js';
import { MarketController } from './markets/market-controller.js';
import { PredictionController } from './markets/prediction-controller.js';
import { OpportunityController } from './opportunities/controller.js';
import { NewsController } from './news/controller.js';
import { ShippingController } from './shipping/controller.js';
import { IntelligenceController } from './intelligence/controller.js';
import { ReplayController } from './replay/controller.js';
import { AlertController } from './alerts/controller.js';
import { WorkspaceController } from './workspaces/controller.js';
import { AccountController } from './account/controller.js';
import { OpsController } from './ops/controller.js';
import { PwaController } from './pwa/register.js';
import { ConnectivityController } from './pwa/connectivity.js';
import { ClientMetrics } from './performance/client-metrics.js';
import { ExperienceController } from './experience/experience-controller.js';
import { $, $$, text } from './ui/dom.js';
import { number } from './ui/format.js';
import { showMapMessage } from './ui/message.js';

const store = createStore();
const api = createApiClient();
const mapController = new MapController({ store, api });
const eventList = new EventList({ store, mapController });
const categoryFilters = new CategoryFilters({ store });
const scanController = new ScanController({ store, api, mapController, eventList, categoryFilters });
const searchController = new SearchController({ store, api, mapController });
const sourcePanel = new SourcePanel({ store });
const diagnosticsDrawer = new DiagnosticsDrawer({ api });
const marketController = new MarketController({ store, api });
const predictionController = new PredictionController({ api });
const opportunityController = new OpportunityController({ store, api });
const newsController = new NewsController({ store, api });
const shippingController = new ShippingController({ store, api });
const intelligenceController = new IntelligenceController({ store, api });
const replayController = new ReplayController({ store, api });
const alertController = new AlertController({ store, api });
const accountController = new AccountController({ store, api });
const opsController = new OpsController({ api });
let workspaceController;
let experience;
let pwa;
let connectivity;

function bootState(state, detail = '') {
  document.documentElement.dataset.bootState = state.toLowerCase();
  globalThis.__SUMMIT_BOOT__ = { state, detail, at: new Date().toISOString(), version: '16.9.3-resilient' };
}

function bootFailure(stage, error, { visible = true } = {}) {
  const code = error?.code || error?.name || 'ERROR';
  const message = error?.message || String(error || 'Unknown error');
  console.error(`[SUMMIT:${stage}]`, error);
  globalThis.__SUMMIT_BOOT_ERRORS__ ||= [];
  globalThis.__SUMMIT_BOOT_ERRORS__.push({ stage, code, message, at: new Date().toISOString() });
  if (visible) showMapMessage(`${stage} / ${code} / ${message}`, { duration: 12_000 });
}

async function safeStage(stage, operation, options = {}) {
  try { return await operation(); }
  catch (error) { bootFailure(stage, error, options); return null; }
}

function updateClock() { text('#utc-clock', `${new Date().toISOString().slice(11, 19)} UTC`); }

async function switchView(view) {
  if (view === 'sources') { diagnosticsDrawer.open(); return; }
  store.setState({ activeView: view }, 'view.changed');
  document.documentElement.dataset.activeView = view;
  window.dispatchEvent(new CustomEvent('summit:view-changed', { detail: { view } }));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  $$('[data-app-view]').forEach(element => {
    const active = element.dataset.appView === view;
    element.classList.toggle('hidden', !active);
    element.classList.toggle('active', active);
  });
  const initializers = {
    news: () => newsController.ensureInitialized(),
    shipping: () => shippingController.ensureInitialized(),
    intelligence: () => intelligenceController.ensureInitialized(),
    markets: () => marketController.ensureInitialized(),
    predictions: () => predictionController.ensureInitialized(),
    opportunities: () => opportunityController.ensureInitialized(),
    replay: () => replayController.ensureInitialized(),
    alerts: () => alertController.ensureInitialized(),
    account: () => accountController.ensureInitialized(),
    ops: () => opsController.ensureInitialized()
  };
  if (initializers[view]) await safeStage(`VIEW_${view.toUpperCase()}`, initializers[view], { visible: false });
  if (view === 'map') setTimeout(() => store.getState().map?.resize?.(), 0);
}

function bindControls() {
  $('#radius-select')?.addEventListener('change', event => {
    store.setState({ radiusKm: Number(event.target.value) }, 'controls.radius_changed');
    mapController.updateGeometry();
    scanController.scan();
  });
  $('#window-select')?.addEventListener('change', event => {
    store.setState({ windowDays: Number(event.target.value) }, 'controls.window_changed');
    scanController.applyFilters();
  });
  $('#routes-toggle')?.addEventListener('click', async event => {
    const visible = !store.getState().routesVisible;
    store.setState({ routesVisible: visible }, 'controls.routes_toggled');
    event.currentTarget.classList.toggle('active', visible);
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = `ROUTES ${visible ? 'ON' : 'OFF'}`;
    await safeStage('ROUTES', () => mapController.setRoutesVisible(visible));
  });
  $('#clusters-toggle')?.addEventListener('click', event => {
    const visible = !store.getState().clustersVisible;
    store.setState({ clustersVisible: visible }, 'controls.clusters_toggled');
    event.currentTarget.classList.toggle('active', visible);
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = `CLUSTERS ${visible ? 'ON' : 'OFF'}`;
    try { mapController.setClustersVisible(visible); } catch (error) { bootFailure('CLUSTERS', error); }
  });
  $('#refresh-button')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '...';
    try { await Promise.allSettled([loadGlobalEvents(), scanController.scan()]); }
    finally { event.currentTarget.disabled = false; event.currentTarget.textContent = 'REFRESH'; }
  });
  $$('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
  $('#pwa-action')?.addEventListener('click', async event => {
    if (!pwa) return;
    if (event.currentTarget.dataset.mode === 'update') await pwa.applyUpdate();
    else await pwa.install();
  });
  window.addEventListener('summit:scan-requested', () => scanController.scan());
  window.addEventListener('summit:filters-changed', () => scanController.applyFilters());
  window.addEventListener('summit:sources-updated', () => sourcePanel.render());
  window.addEventListener('summit:workspace-restored', async () => {
    const state = store.getState();
    if ($('#radius-select')) $('#radius-select').value = String(state.radiusKm);
    if ($('#window-select')) $('#window-select').value = String(state.windowDays);
    if ($('#routes-toggle')) {
      $('#routes-toggle').classList.toggle('active', state.routesVisible);
      $('#routes-toggle').setAttribute('aria-pressed', String(state.routesVisible));
      $('#routes-toggle').textContent = `ROUTES ${state.routesVisible ? 'ON' : 'OFF'}`;
    }
    if ($('#clusters-toggle')) {
      $('#clusters-toggle').classList.toggle('active', state.clustersVisible);
      $('#clusters-toggle').setAttribute('aria-pressed', String(state.clustersVisible));
      $('#clusters-toggle').textContent = `CLUSTERS ${state.clustersVisible ? 'ON' : 'OFF'}`;
    }
    mapController.updateGeometry();
    mapController.flyTo(state.point, { zoom: 1.5, duration: 350 });
    mapController.setClustersVisible(state.clustersVisible);
    await safeStage('WORKSPACE_ROUTES', () => mapController.setRoutesVisible(state.routesVisible), { visible: false });
    window.dispatchEvent(new CustomEvent('summit:filters-changed'));
    window.dispatchEvent(new CustomEvent('summit:scan-requested'));
  });
}

async function loadGlobalEvents() {
  const payload = await api.events({ days: 30, limit: 5000 });
  store.setState({ globalEvents: payload.events || [], sourceStatus: payload.sources || {} }, 'events.global_loaded');
  mapController.setGlobalEvents(payload.events || []);
  sourcePanel.render();
  text('#global-event-count', `${number(payload.filteredCount || 0)} EVENTS`);
  const sourceCount = Object.keys(payload.sources || {}).length;
  const onlineCount = Object.values(payload.sources || {}).filter(source => ['ONLINE', 'DEGRADED', 'STALE'].includes(source.state)).length;
  text('#global-source-count', `${onlineCount}/${sourceCount} SOURCES`);
  return payload;
}

function bindCoreSynchronously() {
  updateClock();
  setInterval(updateClock, 1_000);
  bindControls();
  searchController.bind();
  diagnosticsDrawer.bind();
  accountController.bind();
  workspaceController = new WorkspaceController({ store, switchView });
  safeStage('WORKSPACES', () => workspaceController.bind(), { visible: false });
}

async function startOptionalSystems(config) {
  await safeStage('ALERTS', () => alertController.ensureInitialized(), { visible: false });
  await safeStage('ACCOUNT', () => accountController.ensureInitialized(), { visible: false });
  await safeStage('EXPERIENCE', async () => {
    experience = new ExperienceController({ switchView });
    experience.bind();
  }, { visible: false });
  await safeStage('CONNECTIVITY', async () => {
    connectivity = new ConnectivityController({ onChange: state => {
      const el = $('#connectivity-indicator');
      if (el) el.classList.toggle('hidden', state.online);
    } });
    connectivity.bind();
  }, { visible: false });
  // Service-worker registration is intentionally disabled in 16.9.3. The
  // product must always use the current API and client bundle; installability
  // can return after the live application is stable.
  await safeStage('PWA_RESET', async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    const button = $('#pwa-action');
    if (button) button.classList.add('hidden');
  }, { visible: false });
  await safeStage('METRICS', async () => {
    new ClientMetrics({ report: payload => api.reportClientMetric(payload), version: config.version }).start();
  }, { visible: false });
}

async function bootstrap() {
  await globalThis.__SUMMIT_PREBOOT__;
  bootState('STARTING');
  window.addEventListener('error', event => bootFailure('WINDOW', event.error || new Error(event.message), { visible: false }));
  window.addEventListener('unhandledrejection', event => bootFailure('PROMISE', event.reason, { visible: false }));
  bindCoreSynchronously();

  const config = await safeStage('CONFIG', () => api.config());
  if (!config) { bootState('FAILED', 'CONFIG'); return; }
  store.setState({ config, point: config.defaultPoint, radiusKm: config.defaultRadiusKm, marketTimeframe: config.defaultMarketTimeframe || '1h' }, 'config.loaded');
  if ($('#radius-select')) $('#radius-select').value = String(config.defaultRadiusKm);
  if ($('#market-timeframe')) $('#market-timeframe').value = config.defaultMarketTimeframe || '1h';

  const map = await safeStage('MAP', () => mapController.initialize(config));
  if (!map) { bootState('DEGRADED', 'MAP'); }
  await Promise.allSettled([
    safeStage('EVENTS', () => loadGlobalEvents()),
    safeStage('SCAN', () => scanController.scan())
  ]);

  const requestedView = new URLSearchParams(location.search).get('view');
  if (requestedView && $(`[data-app-view="${requestedView}"]`)) await switchView(requestedView);
  await startOptionalSystems(config);
  bootState(map ? 'READY' : 'DEGRADED', store.getState().mapMode || 'MAPLIBRE');
}

bootstrap().catch(error => {
  bootFailure('BOOT', error);
  bootState('FAILED', error?.message || 'BOOT');
});
