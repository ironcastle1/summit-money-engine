import { createLiveDataApi } from './api-client.js';
import { LiveDataState } from './state-store.js';
import { liveDashboardHtml } from './dashboard.js';
import { sourceTableHtml } from './source-table.js';
import { coveragePanelHtml } from './coverage-panel.js';
import { limitationPanelHtml } from './limitation-panel.js';

const $ = selector => document.querySelector(selector);

export class LiveDataController {
  constructor(options = {}) {
    this.api = options.api || createLiveDataApi();
    this.state = options.state || new LiveDataState();
  }

  async activate() {
    $('#sheet-kicker').textContent = 'PUBLIC-FIRST LIVE DATA';
    $('#sheet-title').textContent = 'LIVE DATA';
    await this.refresh();
  }

  async refresh(force = false) {
    this.state.set({ loading: true, error: null });
    try {
      if (force) await this.api.refresh();
      const [snapshot, diagnostics] = await Promise.all([
        this.api.status(),
        this.api.diagnostics()
      ]);
      this.state.set({ snapshot, diagnostics, loading: false });
      this.render();
    } catch (error) {
      this.state.set({ loading: false, error: error.message });
      this.render();
    }
  }

  render() {
    const root = $('#sheet-content');
    if (!root) return;
    const state = this.state.get();
    if (state.loading) {
      root.innerHTML = '<div class="live-loading">WARMING PUBLIC SOURCES…</div>';
      return;
    }
    if (state.error) {
      root.innerHTML = `<div class="live-error">${state.error}</div>`;
      return;
    }
    $('#sheet-summary').innerHTML = liveDashboardHtml(state.snapshot, state.diagnostics);
    root.innerHTML = `<div class="live-workspace"><main>${sourceTableHtml(state.snapshot, state.query)}</main><aside>${coveragePanelHtml(state.snapshot)}${limitationPanelHtml()}</aside></div>`;
    this.bind();
  }

  bind() {
    document.querySelector('[data-live-action="refresh"]')?.addEventListener('click', () => this.refresh(true));
    document.querySelectorAll('[data-live-source]').forEach(button => button.addEventListener('click', async () => {
      const data = await this.api.source(button.dataset.liveSource);
      const details = [
        data.source.name,
        `${data.recordCount || data.records?.length || 0} records`,
        data.state || 'UNKNOWN',
        data.source.attribution,
        data.errorMessage ? `Last error: ${data.errorMessage}` : ''
      ].filter(Boolean).join('\n');
      window.alert(details);
    }));
  }
}
