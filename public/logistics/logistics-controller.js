import { LogisticsApiClient } from './api-client.js';
import { LogisticsStateStore } from './state-store.js';
import { PlannerForm } from './planner-form.js';
import { ResultPanel } from './result-panel.js';
import { ScenarioPanel } from './scenario-panel.js';
import { WatchlistPanel } from './watchlist-panel.js';
import { LogisticsRouteLayer } from './route-layer.js';
export class LogisticsController {
  constructor(options) {
    this.map = options.map; this.api = options.api || new LogisticsApiClient(); this.store = new LogisticsStateStore(); this.root = options.root;
    this.routeLayer = new LogisticsRouteLayer(this.map); this.bindStructure(); this.store.subscribe(state => this.reflect(state));
  }
  bindStructure() {
    this.root.innerHTML = `<header><div><b>LOGISTICS ROUTE EXPOSURE</b><small>Map-only shipping intelligence</small></div><button data-close aria-label="Close">×</button></header><nav><button data-tab="PLAN" class="active">PLAN</button><button data-tab="SCENARIO">SCENARIO</button><button data-tab="WATCHLIST">WATCHLIST</button></nav><section data-pane="PLAN"><div data-planner></div><div data-status></div><div data-results></div></section><section data-pane="SCENARIO" hidden><div data-scenario></div><div data-scenario-result></div></section><section data-pane="WATCHLIST" hidden><div data-watchlist></div></section>`;
    this.planner = new PlannerForm({ root: this.root.querySelector('[data-planner]'), onSubmit: payload => this.plan(payload) });
    this.results = new ResultPanel({ root: this.root.querySelector('[data-results]'), onSelect: id => this.selectRoute(id), onSave: result => this.save(result), onWatch: result => this.watch(result) });
    this.scenarios = new ScenarioPanel({ root: this.root.querySelector('[data-scenario]'), onRun: payload => this.runScenario(payload) });
    this.watchlists = new WatchlistPanel({ root: this.root.querySelector('[data-watchlist]'), api: this.api });
    this.root.querySelector('[data-close]').addEventListener('click', () => this.close());
    this.root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => this.tab(button.dataset.tab)));
  }
  async start() { const network = await this.api.network(); this.store.set({ network }, 'network.loaded'); this.planner.setNetwork(network); return this; }
  open() { this.store.set({ open: true }, 'panel.opened'); }
  close() { this.store.set({ open: false }, 'panel.closed'); }
  toggle() { this.store.get().open ? this.close() : this.open(); }
  tab(id) { this.store.set({ activeTab: id }, 'tab.changed'); if (id === 'WATCHLIST') this.watchlists.render().catch(error => this.fail(error)); }
  async plan(payload) { this.store.set({ loading: true, error: null }, 'plan.started'); try { const result = await this.api.plan(payload); this.store.set({ result, loading: false, selectedRouteId: result.routes?.[0]?.id || null }, 'plan.completed'); this.results.render(result); this.scenarios.setRequest(result.request); this.routeLayer.show(result, result.routes?.[0]?.id); } catch (error) { this.fail(error); } }
  selectRoute(id) { const result = this.store.get().result; this.store.set({ selectedRouteId: id }, 'route.selected'); this.routeLayer.show(result, id); }
  async runScenario(payload) { this.store.set({ loading: true, error: null }, 'scenario.started'); try { const scenario = await this.api.scenario(payload); this.store.set({ scenario, loading: false }, 'scenario.completed'); this.root.querySelector('[data-scenario-result]').textContent = `${scenario.routes.length} viable alternatives after disruption`; this.routeLayer.show({ geojson: { features: scenario.routes.flatMap(route => route.metrics.segments.map((segment, index) => ({ type: 'Feature', properties: { routePlanId: route.id, order: index + 1 }, geometry: { type: 'LineString', coordinates: route.path.edges[index]?.coordinates || [] } }))) } }); } catch (error) { this.fail(error); } }
  async save(result) { await this.api.save({ result, metadata: { name: `${result.request.originId} to ${result.request.destinationId}` } }); }
  async watch(result) { const route = result.routes.find(item => item.recommended) || result.routes[0]; if (!route) return; await this.api.addWatch({ routeId: route.id, name: `${result.request.originId} to ${result.request.destinationId}`, thresholds: { riskScore: 60, etaChangeHours: 12, costChangePct: 15 } }); }
  fail(error) { this.store.set({ loading: false, error: error.message || String(error) }, 'operation.failed'); }
  reflect(state) { this.root.classList.toggle('hidden', !state.open); this.root.querySelector('[data-status]').textContent = state.loading ? 'CALCULATING…' : state.error || ''; this.root.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === state.activeTab)); this.root.querySelectorAll('[data-pane]').forEach(pane => { pane.hidden = pane.dataset.pane !== state.activeTab; }); }
}
