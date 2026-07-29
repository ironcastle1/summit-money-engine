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
const workspaceController = new WorkspaceController({ store, switchView });
const accountController = new AccountController({ store, api });
const opsController = new OpsController({ api });
const connectivity = new ConnectivityController({ onChange: state => { const el = $('#connectivity-indicator'); if (el) el.classList.toggle('hidden', state.online); } });
const experience = new ExperienceController({ switchView });
const pwa = new PwaController({ onState: state => {
  const button = $('#pwa-action');
  if (!button) return;
  button.classList.toggle('hidden', !state.installable && !state.updateAvailable);
  button.classList.toggle('update', Boolean(state.updateAvailable));
  button.textContent = state.updateAvailable ? 'UPDATE' : 'INSTALL';
  button.dataset.mode = state.updateAvailable ? 'update' : 'install';
} });

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
  if (view === 'news') await newsController.ensureInitialized();
  if (view === 'shipping') await shippingController.ensureInitialized();
  if (view === 'intelligence') await intelligenceController.ensureInitialized();
  if (view === 'markets') await marketController.ensureInitialized();
  if (view === 'predictions') await predictionController.ensureInitialized();
  if (view === 'opportunities') await opportunityController.ensureInitialized();
  if (view === 'replay') await replayController.ensureInitialized();
  if (view === 'alerts') await alertController.ensureInitialized();
  if (view === 'account') await accountController.ensureInitialized();
  if (view === 'ops') await opsController.ensureInitialized();
  if (view === 'map') setTimeout(() => store.getState().map?.resize?.(), 0);
}

function bindControls() {
  $('#radius-select').addEventListener('change', event => { store.setState({ radiusKm: Number(event.target.value) }, 'controls.radius_changed'); mapController.updateGeometry(); scanController.scan(); });
  $('#window-select').addEventListener('change', event => { store.setState({ windowDays: Number(event.target.value) }, 'controls.window_changed'); scanController.applyFilters(); });
  $('#routes-toggle').addEventListener('click', async event => {
    const visible = !store.getState().routesVisible;
    store.setState({ routesVisible: visible }, 'controls.routes_toggled');
    event.currentTarget.classList.toggle('active', visible);
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = `ROUTES ${visible ? 'ON' : 'OFF'}`;
    try { await mapController.setRoutesVisible(visible); } catch (error) { showMapMessage(`${error.code || 'ROUTE_ERROR'} / ${error.message}`); }
  });
  $('#clusters-toggle').addEventListener('click', event => {
    const visible = !store.getState().clustersVisible;
    store.setState({ clustersVisible: visible }, 'controls.clusters_toggled');
    event.currentTarget.classList.toggle('active', visible);
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = `CLUSTERS ${visible ? 'ON' : 'OFF'}`;
    mapController.setClustersVisible(visible);
  });
  $('#refresh-button').addEventListener('click', async event => {
    event.currentTarget.disabled = true; event.currentTarget.textContent = '...';
    try { await Promise.all([loadGlobalEvents(), scanController.scan()]); }
    finally { event.currentTarget.disabled = false; event.currentTarget.textContent = 'REFRESH'; }
  });
  $$('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
  $('#pwa-action')?.addEventListener('click', async event => {
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
    mapController.flyTo(state.point, { zoom: 5, duration: 500 });
    mapController.setClustersVisible(state.clustersVisible);
    try { await mapController.setRoutesVisible(state.routesVisible); } catch {}
    window.dispatchEvent(new CustomEvent('summit:filters-changed'));
    window.dispatchEvent(new CustomEvent('summit:scan-requested'));
  });
}

async function loadGlobalEvents() {
  try {
    const payload = await api.events({ days: 30, limit: 5000 });
    store.setState({ globalEvents: payload.events || [], sourceStatus: payload.sources || {} }, 'events.global_loaded');
    mapController.setGlobalEvents(payload.events || []);
    sourcePanel.render();
    text('#global-event-count', `${number(payload.filteredCount || 0)} EVENTS`);
  } catch (error) { showMapMessage(`${error.code || 'EVENT_ERROR'} / ${error.message}`); }
}

async function bootstrap() {
  updateClock(); setInterval(updateClock, 1_000);
  connectivity.bind();
  pwa.register();
  diagnosticsDrawer.bind(); searchController.bind(); bindControls(); experience.bind(); workspaceController.bind(); accountController.bind(); await Promise.all([alertController.ensureInitialized(), accountController.ensureInitialized()]);
  try {
    const config = await api.config();
    new ClientMetrics({ report: payload => api.reportClientMetric(payload), version: config.version }).start();
    store.setState({ config, point: config.defaultPoint, radiusKm: config.defaultRadiusKm, marketTimeframe: config.defaultMarketTimeframe || '1h' }, 'config.loaded');
    $('#radius-select').value = String(config.defaultRadiusKm);
    $('#market-timeframe').value = config.defaultMarketTimeframe || '1h';
    await mapController.initialize(config);
    await Promise.all([loadGlobalEvents(), scanController.scan()]);
    const requestedView = new URLSearchParams(location.search).get('view');
    if (requestedView && $(`[data-app-view="${requestedView}"]`)) await switchView(requestedView);
  } catch (error) {
    showMapMessage(`${error.code || 'BOOT_ERROR'} / ${error.message}`, { duration: 12_000 });
    console.error(error);
  }
}
bootstrap();
