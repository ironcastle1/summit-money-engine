import { $, $$, escapeHtml, text } from '../ui/dom.js';
import { age, number, percent, upper } from '../ui/format.js';
import { exportCsv, exportJson } from '../export/download.js';

function probability(value) { return Number.isFinite(value) ? percent(value * 100, { digits: 0 }) : 'N/A'; }
function signedPercent(value) { return Number.isFinite(value) ? percent(value * 100, { digits: 2, sign: true }) : 'N/A'; }
function score(value) { return Number.isFinite(value) ? number(value, 1) : 'N/A'; }
function directionClass(direction) { return ['RISE', 'YES'].includes(direction) ? 'positive' : ['FALL', 'NO'].includes(direction) ? 'negative' : 'neutral'; }

function rowHtml(item, selected) {
  return `<button class="opportunity-row ${selected ? 'selected' : ''}" data-id="${escapeHtml(item.id)}" type="button">
    <span class="opportunity-rank">${score(item.score)}</span>
    <span class="opportunity-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle || item.kind)}</small></span>
    <span class="opportunity-kind kind-${item.kind.toLowerCase()}">${escapeHtml(item.kind)}</span>
    <span class="opportunity-direction ${directionClass(item.direction)}">${escapeHtml(item.direction)}</span>
    <span>${probability(item.probability)}</span>
    <span>${score(item.confidence)}</span>
    <span>${escapeHtml(item.evidenceGrade || 'N/A')}</span>
    <span>${age(item.observedAt)}</span>
  </button>`;
}

export class OpportunityController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.initialized = false;
    this.loading = false;
    this.abortController = null;
  }

  bind() {
    $('#opportunity-refresh')?.addEventListener('click', () => this.load());
    $('#opportunity-timeframe')?.addEventListener('change', event => { this.updateFilter({ timeframe: event.target.value }); this.load(); });
    $('#opportunity-min-score')?.addEventListener('change', event => { this.updateFilter({ minimumScore: Number(event.target.value) }); this.load(); });
    $('#opportunity-min-confidence')?.addEventListener('change', event => { this.updateFilter({ minimumConfidence: Number(event.target.value) }); this.load(); });
    $('#opportunity-max-risk')?.addEventListener('change', event => { this.updateFilter({ maximumRisk: Number(event.target.value) }); this.load(); });
    $('#opportunity-kind')?.addEventListener('change', event => { this.updateFilter({ kinds: event.target.value ? [event.target.value] : [] }); this.load(); });
    $('#opportunity-search')?.addEventListener('input', event => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => { this.updateFilter({ search: event.target.value }); this.load(); }, 300);
    });
    $('#opportunity-rows')?.addEventListener('click', event => {
      const row = event.target.closest('[data-id]');
      if (row) this.select(row.dataset.id);
    });
    $('#opportunity-export-json')?.addEventListener('click', () => exportJson('summit-opportunities', this.exportPayload()));
    $('#opportunity-export-csv')?.addEventListener('click', () => exportCsv('summit-opportunities', this.store.getState().opportunities || [], [
      'id', 'kind', 'title', 'subtitle', 'direction', 'score', 'confidence', 'risk', 'probability', 'expectedMove', 'liquidity', 'evidenceGrade', 'sampleSize', 'sourceCount', 'horizon', 'symbol', 'category', 'observedAt', 'generatedAt'
    ]));
    window.addEventListener('summit:workspace-restored', () => this.restoreControls());
    this.restoreControls();
  }

  restoreControls() {
    const filters = this.filters();
    if ($('#opportunity-timeframe')) $('#opportunity-timeframe').value = filters.timeframe;
    if ($('#opportunity-min-score')) $('#opportunity-min-score').value = String(filters.minimumScore);
    if ($('#opportunity-min-confidence')) $('#opportunity-min-confidence').value = String(filters.minimumConfidence);
    if ($('#opportunity-max-risk')) $('#opportunity-max-risk').value = String(filters.maximumRisk);
    if ($('#opportunity-kind')) $('#opportunity-kind').value = filters.kinds?.[0] || '';
    if ($('#opportunity-search')) $('#opportunity-search').value = filters.search || '';
  }

  filters() {
    return {
      timeframe: '1h',
      minimumScore: 45,
      minimumConfidence: 35,
      maximumRisk: 85,
      kinds: [],
      search: '',
      ...(this.store.getState().opportunityFilters || {})
    };
  }

  updateFilter(patch) {
    const opportunityFilters = { ...this.filters(), ...patch };
    this.store.setState({ opportunityFilters }, 'opportunities.filters_changed');
  }

  async ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
      this.bind();
      await this.load();
    }
  }

  async load() {
    if (this.loading) this.abortController?.abort();
    this.abortController = new AbortController();
    this.loading = true;
    this.setLoading(true);
    const filters = this.filters();
    try {
      const payload = await this.api.opportunities({
        timeframe: filters.timeframe,
        minimumScore: filters.minimumScore,
        minimumConfidence: filters.minimumConfidence,
        maximumRisk: filters.maximumRisk,
        kinds: filters.kinds,
        q: filters.search,
        limit: 75
      }, { signal: this.abortController.signal, timeoutMs: 40_000 });
      const opportunities = payload.opportunities || [];
      const selectedId = opportunities.some(item => item.id === this.store.getState().selectedOpportunityId)
        ? this.store.getState().selectedOpportunityId
        : opportunities[0]?.id || null;
      this.store.setState({ opportunities, opportunityPayload: payload, selectedOpportunityId: selectedId }, 'opportunities.loaded');
      this.render();
      window.dispatchEvent(new CustomEvent('summit:opportunities-updated', { detail: { opportunities, payload } }));
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'TIMEOUT') {
        text('#opportunity-error', `${error.code || 'OPPORTUNITY_ERROR'} / ${error.message}`);
        $('#opportunity-error')?.classList.remove('hidden');
      }
    } finally {
      this.loading = false;
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    const button = $('#opportunity-refresh');
    if (button) { button.disabled = loading; button.textContent = loading ? '...' : 'SCAN'; }
    $('#opportunity-workspace')?.classList.toggle('loading', loading);
  }

  select(id) {
    this.store.setState({ selectedOpportunityId: id }, 'opportunities.selected');
    this.renderRows();
    this.renderDetail();
  }

  exportPayload() {
    const state = this.store.getState();
    return { filters: this.filters(), generatedAt: state.opportunityPayload?.generatedAt, totals: state.opportunityPayload?.totals, exposure: state.opportunityPayload?.exposure, opportunities: state.opportunities || [] };
  }

  render() {
    $('#opportunity-error')?.classList.add('hidden');
    const state = this.store.getState();
    const payload = state.opportunityPayload || {};
    text('#opportunity-count', `${state.opportunities?.length || 0}`);
    text('#opportunity-updated', payload.generatedAt ? `${age(payload.generatedAt)} AGO` : '--');
    text('#opportunity-market-count', number(payload.totals?.market || 0));
    text('#opportunity-event-count', number(payload.totals?.events || 0));
    text('#opportunity-prediction-count', number(payload.totals?.predictions || 0));
    text('#opportunity-composite-count', number(payload.totals?.composites || 0));
    text('#opportunity-risk', score(payload.exposure?.weightedRisk));
    text('#opportunity-concentration', score(payload.exposure?.concentrationScore));
    this.renderUpstream(payload.upstream || {});
    this.renderRows();
    this.renderDetail();
  }

  renderUpstream(upstream) {
    const root = $('#opportunity-source-strip');
    if (!root) return;
    root.innerHTML = Object.entries(upstream).map(([name, value]) => `<span class="source-chip ${String(value.state).toLowerCase()}"><i></i>${escapeHtml(name.toUpperCase())} ${escapeHtml(value.state)} ${Number.isFinite(value.count) ? value.count : ''}</span>`).join('');
  }

  renderRows() {
    const root = $('#opportunity-rows');
    if (!root) return;
    const state = this.store.getState();
    const items = state.opportunities || [];
    root.innerHTML = items.length ? items.map(item => rowHtml(item, item.id === state.selectedOpportunityId)).join('') : '<div class="empty-state">0 MATCHES</div>';
  }

  renderDetail() {
    const state = this.store.getState();
    const item = (state.opportunities || []).find(value => value.id === state.selectedOpportunityId);
    const set = (selector, value) => text(selector, value);
    if (!item) {
      ['#op-detail-title', '#op-detail-kind', '#op-detail-score', '#op-detail-probability', '#op-detail-move', '#op-detail-confidence', '#op-detail-risk', '#op-detail-liquidity', '#op-detail-evidence', '#op-detail-sample', '#op-detail-horizon', '#op-detail-age'].forEach(selector => set(selector, 'N/A'));
      $('#op-detail-components').innerHTML = '<div class="empty-state">0 COMPONENTS</div>';
      return;
    }
    set('#op-detail-title', item.title);
    set('#op-detail-kind', `${item.kind} / ${item.direction}`);
    set('#op-detail-score', score(item.score));
    set('#op-detail-probability', probability(item.probability));
    set('#op-detail-move', signedPercent(item.expectedMove));
    set('#op-detail-confidence', score(item.confidence));
    set('#op-detail-risk', score(item.risk));
    set('#op-detail-liquidity', score(item.liquidity));
    set('#op-detail-evidence', `${item.evidenceGrade || 'N/A'} / ${score(item.evidenceScore)}`);
    set('#op-detail-sample', Number.isFinite(item.sampleSize) ? `N=${number(item.sampleSize)}` : 'N/A');
    set('#op-detail-horizon', upper(item.horizon));
    set('#op-detail-age', age(item.observedAt));
    set('#op-detail-sources', (item.sources || []).map(upper).join(' / ') || 'N/A');
    set('#op-detail-tags', (item.tags || []).slice(0, 8).map(upper).join(' / ') || 'N/A');
    const components = item.components || [];
    $('#op-detail-components').innerHTML = components.length ? components.map(component => `<div class="component-row"><span>${escapeHtml(component.kind)}</span><strong>${score(component.score)}</strong><b class="${directionClass(component.direction)}">${escapeHtml(component.direction)}</b></div>`).join('') : '<div class="empty-state">0 COMPONENTS</div>';
  }
}
