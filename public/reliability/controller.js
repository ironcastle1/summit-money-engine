import { createReliabilityApi } from './api-client.js';
import { ReliabilityState } from './state-store.js';
import { reliabilityDashboardHtml } from './dashboard.js';
import { servicePanelHtml } from './service-panel.js';
import { sloPanelHtml } from './slo-panel.js';
import { deploymentPanelHtml } from './deployment-panel.js';
import { incidentPanelHtml } from './incident-panel.js';
import { observabilityPanelHtml } from './observability-panel.js';
import { recoveryPanelHtml } from './recovery-panel.js';
import { capacityPanelHtml } from './capacity-panel.js';
import { reliabilityPrompt } from './modal.js';
const $ = selector => document.querySelector(selector);
export class ReliabilityController {
    constructor(options = {}) { this.api = options.api || createReliabilityApi(); this.state = options.state || new ReliabilityState(); }
    async activate() { $('#sheet-kicker').textContent = 'DEPLOYMENT, OBSERVABILITY AND RELIABILITY'; $('#sheet-title').textContent = 'OPERATIONS'; await this.refresh(); }
    async refresh() {
        this.state.set({ loading: true, error: null });
        try {
            let snapshot = await this.api.snapshot();
            if (!snapshot.services?.length)
                snapshot = await this.api.seed();
            this.state.set({ snapshot, loading: false });
            this.render();
        }
        catch (error) {
            this.state.set({ loading: false, error: error.message });
            this.render();
        }
    }
    render() {
        const root = $('#sheet-content');
        if (!root)
            return;
        const state = this.state.get();
        if (state.loading) {
            root.innerHTML = '<div class="reliability-loading">LOADING RELIABILITY OPERATIONS…</div>';
            return;
        }
        if (state.error) {
            root.innerHTML = `<div class="reliability-error">${state.error}</div>`;
            return;
        }
        const snapshot = state.snapshot || {};
        $('#sheet-summary').innerHTML = reliabilityDashboardHtml(snapshot);
        root.innerHTML = `<div class="reliability-workspace"><div class="reliability-primary">${servicePanelHtml(snapshot)}${sloPanelHtml(snapshot)}${deploymentPanelHtml(snapshot)}${incidentPanelHtml(snapshot)}</div><aside class="reliability-secondary">${observabilityPanelHtml(snapshot)}${capacityPanelHtml(snapshot)}${recoveryPanelHtml(snapshot)}</aside></div>`;
        this.bind();
    }
    bind() { document.querySelectorAll('[data-operations-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.operationsAction))); }
    async action(action) {
        if (action === 'incident') {
            const input = reliabilityPrompt('Declare operational incident', [{ key: 'title', label: 'Incident title' }, { key: 'summary', label: 'Summary' }, { key: 'serviceIds', label: 'Affected service id', value: 'api' }, { key: 'severity', label: 'Severity', value: 'SEV2' }]);
            if (input)
                await this.api.incident({ ...input, serviceIds: [input.serviceIds], runbookId: 'api-unavailable' });
        }
        if (action === 'release') {
            const input = reliabilityPrompt('Create release', [{ key: 'version', label: 'Version', value: '20.17.0' }, { key: 'title', label: 'Release title' }, { key: 'riskLevel', label: 'Risk level', value: 'MEDIUM' }]);
            if (input)
                await this.api.release({ ...input, environment: 'production' });
        }
        if (action === 'measurement') {
            const snapshot = this.state.get().snapshot;
            const slo = snapshot.slos?.[0];
            if (slo) {
                const value = window.prompt(`Record ${slo.indicator}`, String(slo.target));
                if (value !== null)
                    await this.api.measurement({ serviceId: slo.serviceId, sloId: slo.id, value: Number(value), good: 999, total: 1000 });
            }
        }
        if (action === 'restore') {
            const backup = this.state.get().snapshot.backups?.[0];
            if (backup)
                await this.api.restoreTest({ backupId: backup.id, durationMinutes: 5, checks: [{ name: 'Checksum', passed: true }, { name: 'Schema', passed: true }, { name: 'Application', passed: true }], applicationStarted: true, testedBy: 'operator' });
        }
        if (action === 'capacity') {
            const result = await this.api.capacity({ currentDemand: 80, currentCapacity: 100, growthPercent: 25, targetUtilization: 70, currentReplicas: 2, utilization: 80, minimumReplicas: 2, maximumReplicas: 20 });
            window.alert(`Required capacity: ${result.model.requiredCapacity}; replicas: ${result.autoscaling.desiredReplicas}`);
        }
        await this.refresh();
    }
}
