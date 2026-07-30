import { $, text, escapeHtml } from '../ui/dom.js';
import { exportJson } from '../export/download.js';
import { WorkspaceRepository } from './repository.js';

function stateSnapshot(state) {
  return {
    activeView: state.activeView,
    point: state.point,
    radiusKm: state.radiusKm,
    windowDays: state.windowDays,
    categories: [...(state.categories || [])],
    routesVisible: state.routesVisible,
    clustersVisible: state.clustersVisible,
    marketTimeframe: state.marketTimeframe,
    marketAssetClass: state.marketAssetClass,
    selectedMarketAsset: state.selectedMarketAsset,
    opportunityFilters: state.opportunityFilters || {},
    replaySettings: state.replaySettings || {}
  };
}

export class WorkspaceController {
  constructor(options) {
    this.store = options.store;
    this.switchView = options.switchView;
    this.repository = new WorkspaceRepository();
    this.drawer = null;
  }

  bind() {
    this.drawer = $('#workspace-drawer');
    $('#workspace-toggle')?.addEventListener('click', () => this.open());
    $('#workspace-close')?.addEventListener('click', () => this.close());
    $('#workspace-save')?.addEventListener('click', () => this.save());
    $('#workspace-export')?.addEventListener('click', () => exportJson('summit-workspaces', this.repository.export()));
    $('#workspace-import')?.addEventListener('change', event => this.importFile(event.target.files?.[0]));
    $('#workspace-list')?.addEventListener('click', event => this.handleListClick(event));
    this.render();
  }

  open() { this.drawer?.setAttribute('aria-hidden', 'false'); this.drawer?.classList.add('open'); this.render(); }
  close() { this.drawer?.setAttribute('aria-hidden', 'true'); this.drawer?.classList.remove('open'); }

  save() {
    const input = $('#workspace-name');
    const name = String(input?.value || '').trim() || `WORKSPACE ${this.repository.list().length + 1}`;
    const workspace = this.repository.save({ name, state: stateSnapshot(this.store.getState()) });
    if (input) input.value = '';
    text('#workspace-status', `SAVED ${workspace.updatedAt.slice(11, 19)} UTC`);
    this.render();
  }

  async restore(workspace) {
    const state = workspace.state || {};
    this.store.setState({
      point: state.point || this.store.getState().point,
      radiusKm: state.radiusKm || this.store.getState().radiusKm,
      windowDays: state.windowDays || this.store.getState().windowDays,
      categories: new Set(state.categories || []),
      routesVisible: Boolean(state.routesVisible),
      clustersVisible: state.clustersVisible !== false,
      marketTimeframe: state.marketTimeframe || '1h',
      marketAssetClass: state.marketAssetClass || '',
      selectedMarketAsset: state.selectedMarketAsset || 'btc-usd',
      opportunityFilters: state.opportunityFilters || {},
      replaySettings: state.replaySettings || {}
    }, 'workspace.restored');
    this.repository.setActive(workspace.id);
    await this.switchView(state.activeView || 'map');
    window.dispatchEvent(new CustomEvent('summit:workspace-restored', { detail: workspace }));
    text('#workspace-status', `LOADED ${workspace.name.toUpperCase()}`);
    this.render();
  }

  handleListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const workspace = this.repository.get(button.dataset.id);
    if (button.dataset.action === 'load' && workspace) this.restore(workspace);
    if (button.dataset.action === 'delete') { this.repository.remove(button.dataset.id); this.render(); }
  }

  async importFile(file) {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      const count = this.repository.import(value);
      text('#workspace-status', `IMPORTED ${count}`);
      this.render();
    } catch { text('#workspace-status', 'IMPORT ERROR'); }
  }

  render() {
    const root = $('#workspace-list');
    if (!root) return;
    const active = this.repository.activeId();
    const items = this.repository.list();
    root.innerHTML = items.length ? items.map(item => `
      <article class="workspace-row ${item.id === active ? 'active' : ''}">
        <button type="button" data-action="load" data-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.state?.activeView || 'map')} / ${item.updatedAt.slice(0, 16).replace('T', ' ')}</small></button>
        <button type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete">×</button>
      </article>`).join('') : '<div class="empty-state">0 WORKSPACES</div>';
    text('#workspace-count', String(items.length));
  }
}
