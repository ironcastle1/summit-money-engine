import { commercialApi } from './api-client.js';
import { CommercialState } from './state-store.js';
import { dashboardHtml } from './dashboard.js';
import { tenantTableHtml } from './tenant-table.js';
import { healthPanelHtml } from './health-panel.js';
import { supportPanelHtml } from './support-panel.js';
import { statusPanelHtml } from './status-panel.js';
import { featurePanelHtml } from './feature-panel.js';
import { onboardingPanelHtml } from './onboarding-panel.js';
import { commercialPrompt } from './modal.js';
const $ = selector => document.querySelector(selector);
export class CommercialController {
    constructor() { this.api = commercialApi(); this.state = new CommercialState(); }
    async activate() { $('#sheet-kicker').textContent = 'CUSTOMER, PRODUCT AND SERVICE OPERATIONS'; $('#sheet-title').textContent = 'CUSTOMERS'; await this.refresh(); }
    async refresh() { this.state.set({ loading: true, error: null }); try {
        let snapshot = await this.api.snapshot();
        if (!snapshot.tenants?.length)
            snapshot = await this.api.seed();
        const selectedTenantId = this.state.get().selectedTenantId || snapshot.tenants?.[0]?.id || null;
        this.state.set({ snapshot, selectedTenantId, loading: false });
        this.render();
    }
    catch (error) {
        this.state.set({ loading: false, error: error.message });
        this.render();
    } }
    render() { const root = $('#sheet-content'); if (!root)
        return; const state = this.state.get(); if (state.loading) {
        root.innerHTML = '<div class="commercial-loading">LOADING CUSTOMER OPERATIONS…</div>';
        return;
    } if (state.error) {
        root.innerHTML = `<div class="commercial-error">${state.error}</div>`;
        return;
    } const snapshot = state.snapshot || {}; const analysis = (snapshot.health || []).find(item => item.tenant.id === state.selectedTenantId) || snapshot.health?.[0]; $('#sheet-summary').innerHTML = dashboardHtml(snapshot); root.innerHTML = `<div class="commercial-workspace"><div class="commercial-primary">${tenantTableHtml(snapshot.tenants, snapshot.health, state.query)}${healthPanelHtml(analysis)}${onboardingPanelHtml(analysis)}</div><aside class="commercial-secondary">${supportPanelHtml(snapshot.supportCases)}${statusPanelHtml(snapshot.status)}${featurePanelHtml(snapshot.featureFlags, snapshot.releaseNotes)}</aside></div>`; this.bind(); }
    bind() { document.querySelectorAll('[data-tenant-id]').forEach(button => button.addEventListener('click', () => { this.state.set({ selectedTenantId: button.dataset.tenantId }); this.render(); })); document.querySelectorAll('[data-commercial-step]').forEach(button => button.addEventListener('click', async () => { await this.api.completeOnboarding({ tenantId: this.state.get().selectedTenantId, stepId: button.dataset.commercialStep }); await this.refresh(); })); document.querySelectorAll('[data-commercial-action]').forEach(button => button.addEventListener('click', () => this.action(button.dataset.commercialAction))); }
    async action(action) { const tenantId = this.state.get().selectedTenantId; if (action === 'new-tenant') {
        const data = commercialPrompt('Create tenant', [{ key: 'name', label: 'Customer name' }, { key: 'billingEmail', label: 'Billing email' }, { key: 'planId', label: 'Plan: FREE, PRO, TEAM or ENTERPRISE', value: 'PRO' }]);
        if (data)
            await this.api.createTenant(data);
    } if (action === 'new-support') {
        const data = commercialPrompt('Open support case', [{ key: 'title', label: 'Case title' }, { key: 'description', label: 'Description' }, { key: 'severity', label: 'Severity: SEV1–SEV4', value: 'SEV3' }]);
        if (data)
            await this.api.support({ ...data, tenantId });
    } if (action === 'new-feature') {
        const data = commercialPrompt('Create feature flag', [{ key: 'name', label: 'Feature name' }, { key: 'key', label: 'Feature key' }, { key: 'rollout', label: 'Rollout: OFF, INTERNAL, PERCENTAGE, TENANTS or ON', value: 'OFF' }]);
        if (data)
            await this.api.feature(data);
    } await this.refresh(); }
}
