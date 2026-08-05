import { createAutomationApi } from './api-client.js';
import { AutomationState } from './state-store.js';
import { renderAutomationDashboard } from './dashboard.js';
import { WorkflowPanel } from './workflow-panel.js';
import { renderRunHistory } from './run-history.js';
import { NotificationCenter } from './notification-center.js';
import { RuleBuilder } from './rule-builder.js';
import { renderSchedulerPanel } from './scheduler-panel.js';
import { renderAuditPanel } from './audit-panel.js';
const TABS = [['workflows', 'WORKFLOWS'], ['runs', 'RUN HISTORY'], ['rules', 'RULES'], ['notifications', 'NOTIFICATIONS'], ['scheduler', 'SCHEDULER'], ['audit', 'AUDIT']];
export class AutomationController {
    constructor(options = {}) { this.api = options.api || createAutomationApi(); this.state = options.state || new AutomationState(); this.loading = false; this.snapshot = null; }
    mount() { this.root = document.querySelector('#sheet-content'); if (!this.root)
        return; document.querySelector('#sheet-title').textContent = 'AUTOMATION'; document.querySelector('#sheet-kicker').textContent = 'RULES / ALERTS / WORKFLOWS'; this.root.innerHTML = `<div class="automation-shell"><nav class="automation-tabs">${TABS.map(([id, label], index) => `<button data-automation-tab="${id}" class="${index === 0 ? 'active' : ''}" type="button">${label}</button>`).join('')}</nav><section class="automation-toolbar"><button data-refresh type="button">REFRESH</button><button data-seed type="button">INSTALL STARTERS</button><span data-status>READY</span></section><div id="automation-dashboard"></div><div id="automation-content"></div></div>`; this.content = this.root.querySelector('#automation-content'); this.dashboard = this.root.querySelector('#automation-dashboard'); this.status = this.root.querySelector('[data-status]'); this.workflowPanel = new WorkflowPanel(this.content, this.api, { changed: () => this.refresh() }); this.notifications = new NotificationCenter(this.content, this.api, { changed: () => this.refresh() }); this.rules = new RuleBuilder(this.content, this.api, { changed: () => this.refresh() }); this.root.querySelectorAll('[data-automation-tab]').forEach(button => button.addEventListener('click', () => this.setTab(button.dataset.automationTab))); this.root.querySelector('[data-refresh]')?.addEventListener('click', () => this.refresh()); this.root.querySelector('[data-seed]')?.addEventListener('click', async () => { await this.api.seedTemplates(); this.refresh(); }); this.mounted = true; this.setTab(this.state.get().tab || 'workflows', false); this.refresh(); }
    activate() { if (!this.mounted || !document.body.contains(this.root))
        this.mount();
    else
        this.render(); }
    setTab(tab, render = true) { const id = TABS.some(([value]) => value === tab) ? tab : 'workflows'; this.state.set({ tab: id }); this.root?.querySelectorAll('[data-automation-tab]').forEach(button => button.classList.toggle('active', button.dataset.automationTab === id)); if (render)
        this.renderContent(); }
    async refresh() { if (this.loading)
        return; this.loading = true; this.status.textContent = 'LOADING…'; try {
        this.snapshot = await this.api.snapshot();
        this.status.textContent = `${this.snapshot.workflows?.length || 0} WORKFLOWS`;
        this.render();
    }
    catch (error) {
        this.content.innerHTML = `<div class="automation-empty">AUTOMATION UNAVAILABLE: ${String(error.message || error)}</div>`;
        this.status.textContent = 'ERROR';
    }
    finally {
        this.loading = false;
    } }
    render() { if (!this.snapshot)
        return; renderAutomationDashboard(this.dashboard, this.snapshot); const summary = document.querySelector('#sheet-summary'); if (summary) {
        const d = this.snapshot.diagnostics || {};
        summary.innerHTML = [['ACTIVE', d.workflows?.active || 0, 'workflows'], ['SUCCESS', `${d.runs?.successRate ?? 100}%`, 'recent runs'], ['UNREAD', d.notifications?.unread || 0, 'notifications'], ['RULES', d.rules?.enabled || 0, 'enabled']].map(([label, value, note]) => `<div class="summary-metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
    } this.renderContent(); }
    async renderContent() { if (!this.snapshot || !this.content)
        return; const tab = this.state.get().tab; if (tab === 'workflows')
        this.workflowPanel.load(this.snapshot);
    else if (tab === 'runs')
        renderRunHistory(this.content, this.snapshot.runs);
    else if (tab === 'rules')
        this.rules.render(this.snapshot.rules);
    else if (tab === 'notifications')
        this.notifications.render(this.snapshot.notifications);
    else if (tab === 'scheduler')
        renderSchedulerPanel(this.content, this.snapshot, this.api, () => this.refresh());
    else if (tab === 'audit') {
        this.content.innerHTML = '<div class="automation-empty">LOADING AUDIT…</div>';
        renderAuditPanel(this.content, await this.api.audit({ limit: 250 }));
    } }
}
