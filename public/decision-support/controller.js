import { createDecisionSupportApi } from './api-client.js';
import { DecisionSupportState } from './state-store.js';
import { renderDashboard } from './dashboard.js';
import { renderBriefing } from './briefing-view.js';
import { renderEvidencePanel } from './evidence-panel.js';
import { WatchlistPanel } from './watchlist-panel.js';
import { WorkspacePanel } from './workspace-panel.js';
import { CaseFilePanel } from './case-file-panel.js';
import { renderTimeline } from './timeline.js';
import { ReportPanel } from './report-panel.js';
import { OperationsPanel } from './operations-panel.js';
import { escapeHtml } from './format.js';

const TABS = Object.freeze([
  ['brief', 'BRIEF'],
  ['timeline', 'TIMELINE'],
  ['watchlists', 'WATCHLISTS'],
  ['workspaces', 'WORKSPACES'],
  ['cases', 'CASE FILES'],
  ['operations', 'OPERATIONS'],
  ['reports', 'REPORTS']
]);

export class DecisionSupportController {
  constructor(options = {}) {
    this.api = options.api || createDecisionSupportApi();
    this.state = options.state || new DecisionSupportState();
    this.snapshot = null;
    this.loading = false;
    this.mounted = false;
    this.refreshSequence = 0;
  }

  mount() {
    this.root = document.querySelector('#sheet-content');
    if (!this.root) return;
    document.querySelector('#sheet-title').textContent = 'BRIEFINGS';
    document.querySelector('#sheet-kicker').textContent = 'EXECUTIVE DECISION SUPPORT';
    this.root.innerHTML = `<div class="decision-shell">
      <nav class="decision-tabs" aria-label="Decision support sections">
        ${TABS.map(([id, label], index) => `<button data-decision-tab="${id}" class="${index === 0 ? 'active' : ''}" type="button">${label}</button>`).join('')}
      </nav>
      <section class="decision-toolbar">
        <label><span>MINIMUM PRIORITY</span><input data-decision-priority type="range" min="0" max="100" step="5" value="${Number(this.state.get().minimumPriority || 45)}"><b data-decision-priority-value>${Number(this.state.get().minimumPriority || 45)}</b></label>
        <label><span>WINDOW</span><select data-decision-hours><option value="24">24 HOURS</option><option value="72" selected>72 HOURS</option><option value="168">7 DAYS</option><option value="720">30 DAYS</option></select></label>
        <button data-decision-refresh type="button">REFRESH BRIEF</button>
        <span data-decision-status>READY</span>
      </section>
      <div id="decision-dashboard"></div>
      <div class="decision-main">
        <div id="decision-content"></div>
        <aside id="decision-evidence"></aside>
      </div>
    </div>`;
    this.content = this.root.querySelector('#decision-content');
    this.evidence = this.root.querySelector('#decision-evidence');
    this.dashboard = this.root.querySelector('#decision-dashboard');
    this.status = this.root.querySelector('[data-decision-status]');
    this.priorityInput = this.root.querySelector('[data-decision-priority]');
    this.priorityValue = this.root.querySelector('[data-decision-priority-value]');
    this.hoursInput = this.root.querySelector('[data-decision-hours]');

    this.watchlists = new WatchlistPanel(this.content, () => this.refresh({ force: true }));
    this.workspaces = new WorkspacePanel(this.content, this.api, workspace => this.loadWorkspace(workspace));
    this.cases = new CaseFilePanel(this.content, this.api, item => this.selectCase(item));
    this.reports = new ReportPanel(this.content, this.api);
    this.operations = new OperationsPanel(this.content, this.api, { onChanged: () => this.refresh({ force: true, preserveTab: true }) });

    this.root.querySelectorAll('[data-decision-tab]').forEach(button => {
      button.addEventListener('click', () => this.setTab(button.dataset.decisionTab));
    });
    this.root.querySelector('[data-decision-refresh]')?.addEventListener('click', () => this.refresh({ force: true }));
    this.priorityInput?.addEventListener('input', () => {
      this.priorityValue.textContent = this.priorityInput.value;
    });
    this.priorityInput?.addEventListener('change', () => {
      this.state.set({ minimumPriority: Number(this.priorityInput.value) });
      this.refresh({ force: true });
    });
    this.hoursInput?.addEventListener('change', () => {
      this.state.set({ hours: Number(this.hoursInput.value) });
      this.refresh({ force: true });
    });
    const stored = this.state.get();
    if (stored.hours) this.hoursInput.value = String(stored.hours);
    this.mounted = true;
    this.setTab(stored.activeTab || 'brief', { render: false });
    this.refresh();
  }

  activate() {
    if (!this.mounted || !document.body.contains(this.root)) this.mount();
    else if (!this.snapshot) this.refresh();
    else this.render();
  }

  setStatus(message, state = 'READY') {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.dataset.state = state;
  }

  async refresh(options = {}) {
    if (this.loading && !options.force) return;
    const sequence = ++this.refreshSequence;
    this.loading = true;
    this.setStatus('BUILDING LIVE BRIEF…', 'LOADING');
    if (!options.preserveTab) this.content.innerHTML = '<div class="decision-empty">BUILDING LIVE BRIEF…</div>';
    const current = this.state.get();
    try {
      const snapshot = await this.api.snapshot({
        hours: Number(current.hours || 72),
        minimumPriority: Number(current.minimumPriority || 45),
        domains: current.domains?.join(',') || '',
        watchlists: this.watchlists?.list?.() || [],
        force: Boolean(options.force)
      });
      if (sequence !== this.refreshSequence) return;
      this.snapshot = snapshot;
      this.setStatus(`${snapshot.signals?.length || 0} SIGNALS · ${snapshot.cache || 'LIVE'}`, 'READY');
      this.render();
    } catch (error) {
      if (sequence !== this.refreshSequence) return;
      const message = String(error?.name === 'AbortError' ? 'Request timed out' : error?.message || error);
      this.content.innerHTML = `<div class="decision-empty">BRIEF UNAVAILABLE: ${escapeHtml(message)}</div>`;
      this.setStatus('BRIEF UNAVAILABLE', 'ERROR');
    } finally {
      if (sequence === this.refreshSequence) this.loading = false;
    }
  }

  setTab(tab, options = {}) {
    const id = TABS.some(([value]) => value === tab) ? tab : 'brief';
    this.state.set({ activeTab: id });
    this.root?.querySelectorAll('[data-decision-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.decisionTab === id);
      button.setAttribute('aria-current', button.dataset.decisionTab === id ? 'page' : 'false');
    });
    if (options.render !== false) this.renderContent();
  }

  render() {
    if (!this.snapshot) return;
    renderDashboard(this.dashboard, this.snapshot);
    const summary = document.querySelector('#sheet-summary');
    if (summary) {
      const operationalCards = [
        { label: 'ESCALATIONS', value: this.snapshot.escalations?.length || 0, note: 'policy matches' },
        { label: 'SLA BREACHES', value: this.snapshot.operations?.slas?.breached || 0, note: `${this.snapshot.operations?.slas?.compliancePercent || 0}% compliance` }
      ];
      summary.innerHTML = [...(this.snapshot.cards || []).slice(0, 4), ...operationalCards].map(card => `<div class="summary-metric"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.value)}</strong><small>${escapeHtml(card.note)}</small></div>`).join('');
    }
    this.renderContent();
  }

  renderContent() {
    if (!this.snapshot || !this.content) return;
    const tab = this.state.get().activeTab;
    if (tab === 'brief') renderBriefing(this.content, this.snapshot, id => this.selectSignal(id));
    else if (tab === 'timeline') renderTimeline(this.content, this.snapshot.timeline);
    else if (tab === 'watchlists') this.watchlists.render();
    else if (tab === 'workspaces') this.workspaces.load(this.snapshot);
    else if (tab === 'cases') this.cases.load();
    else if (tab === 'operations') this.operations.load();
    else if (tab === 'reports') this.reports.renderLauncher(this.snapshot);
    this.renderEvidence();
  }

  renderEvidence() {
    const selected = this.snapshot?.signals?.find(item => item.id === this.state.get().selectedSignalId);
    renderEvidencePanel(this.evidence, selected);
  }

  selectSignal(id) {
    this.state.set({ selectedSignalId: id });
    this.renderEvidence();
  }

  selectCase(item) {
    this.state.set({ selectedCaseId: item?.id });
    if (!item) return this.renderEvidence();
    this.evidence.innerHTML = `<header class="evidence-head"><div><span>CASE FILE</span><h2>${escapeHtml(item.title || 'Case')}</h2></div><b>${escapeHtml(item.status || '')}</b></header>
      <p>${escapeHtml(item.summary || 'No case summary.')}</p>
      <div class="evidence-metrics"><div><span>PRIORITY</span><strong>${Number(item.priority || 0)}</strong></div><div><span>SIGNALS</span><strong>${item.signalIds?.length || 0}</strong></div><div><span>TASKS</span><strong>${item.taskIds?.length || 0}</strong></div><div><span>DECISIONS</span><strong>${item.decisionIds?.length || 0}</strong></div></div>`;
  }

  loadWorkspace(workspace) {
    if (!workspace) return;
    const patch = {};
    if (workspace.filters?.minimumPriority !== undefined) patch.minimumPriority = Number(workspace.filters.minimumPriority);
    if (workspace.filters?.hours !== undefined) patch.hours = Number(workspace.filters.hours);
    if (workspace.filters?.domains) patch.domains = workspace.filters.domains;
    this.state.set(patch);
    if (this.priorityInput && patch.minimumPriority !== undefined) {
      this.priorityInput.value = String(patch.minimumPriority);
      this.priorityValue.textContent = String(patch.minimumPriority);
    }
    if (this.hoursInput && patch.hours !== undefined) this.hoursInput.value = String(patch.hours);
    this.setTab('brief');
    this.refresh({ force: true });
  }
}
