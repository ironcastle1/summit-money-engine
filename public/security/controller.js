import { createSecurityApi } from './api-client.js';
import { SecurityState } from './state-store.js';
import { securityDashboardHtml } from './dashboard.js';
import { accessPanelHtml } from './access-panel.js';
import { controlsPanelHtml } from './controls-panel.js';
import { evidencePanelHtml } from './evidence-panel.js';
import { riskPanelHtml } from './risk-panel.js';
import { incidentPanelHtml } from './incident-panel.js';
import { dataGovernancePanelHtml } from './data-governance-panel.js';
import { auditPanelHtml } from './audit-panel.js';
import { securityPrompt } from './modal.js';

const $ = selector => document.querySelector(selector);

export class SecurityController {
  constructor(options = {}) {
    this.api = options.api || createSecurityApi();
    this.state = options.state || new SecurityState();
  }

  async activate() {
    $('#sheet-kicker').textContent = 'SECURITY, PRIVACY AND COMPLIANCE OPERATIONS';
    $('#sheet-title').textContent = 'SECURITY';
    await this.refresh();
  }

  async refresh() {
    this.state.set({ loading: true, error: null });
    try {
      let snapshot = await this.api.snapshot();
      if (!snapshot.policies?.length) snapshot = await this.api.seed();
      this.state.set({ snapshot, loading: false });
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
      root.innerHTML = '<div class="security-loading">LOADING SECURITY OPERATIONS…</div>';
      return;
    }
    if (state.error) {
      root.innerHTML = `<div class="security-error">${state.error}</div>`;
      return;
    }
    const snapshot = state.snapshot || {};
    $('#sheet-summary').innerHTML = securityDashboardHtml(snapshot);
    root.innerHTML = `<div class="security-workspace"><div class="security-primary">${accessPanelHtml(snapshot)}${controlsPanelHtml(snapshot)}${riskPanelHtml(snapshot)}${incidentPanelHtml(snapshot)}</div><aside class="security-secondary">${dataGovernancePanelHtml(snapshot)}${evidencePanelHtml(snapshot)}${auditPanelHtml(snapshot)}</aside></div>`;
    this.bind();
  }

  bind() {
    document.querySelectorAll('[data-security-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.securityAction)));
  }

  async action(action) {
    const tenantId = 'tenant-merlin-demo';
    if (action === 'new-risk') {
      const input = securityPrompt('Create security risk', [
        { key: 'title', label: 'Risk title' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category', value: 'SECURITY' },
        { key: 'likelihood', label: 'Likelihood 0–100', value: '50' },
        { key: 'impact', label: 'Impact 0–100', value: '70' }
      ]);
      if (input) await this.api.risk({ ...input, tenantId, likelihood: Number(input.likelihood), impact: Number(input.impact), controlStrength: 50 });
    }
    if (action === 'new-incident') {
      const input = securityPrompt('Declare security incident', [
        { key: 'title', label: 'Incident title' },
        { key: 'summary', label: 'Summary' },
        { key: 'affectedUsers', label: 'Affected users', value: '0' }
      ]);
      if (input) await this.api.incident({ ...input, tenantId, affectedUsers: Number(input.affectedUsers), confidentialityImpact: 50, integrityImpact: 40, availabilityImpact: 30 });
    }
    if (action === 'add-evidence') {
      const input = securityPrompt('Add control evidence', [
        { key: 'controlId', label: 'Control id', value: 'OPS-01' },
        { key: 'title', label: 'Evidence title' },
        { key: 'source', label: 'Evidence source', value: 'MERLIN_RUNTIME' }
      ]);
      if (input) await this.api.evidence({ ...input, tenantId });
    }
    if (action === 'test-access') {
      const result = await this.api.access({ subject: { id: 'operator', tenantId, role: 'ANALYST', clearance: 'CONFIDENTIAL' }, resource: { id: 'security-dashboard', tenantId, type: 'WORKSPACE', classification: 'CONFIDENTIAL' }, permission: 'security:read', context: { mfaSatisfied: true, managedDevice: true } });
      window.alert(`Access decision: ${result.decision}`);
    }
    await this.refresh();
  }
}
