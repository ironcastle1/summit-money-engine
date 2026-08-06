import { COMMERCIAL_LIMITS, TenantStore, SeatStore, InvitationStore, SuccessPlanStore, SupportCaseStore, StatusComponentStore, StatusIncidentStore, FeatureFlagStore, ReleaseNoteStore, FeedbackStore, UsageMeter, commercialCatalog, commercialDiagnostics, commercialPlan, publicCommercialPlans, onboardingProgress, quotaEvaluation, calculateOverages, rollupUsage, subscriptionChangePreview, adoptionScore, engagementScore, customerHealthScore, retentionRisk, expansionScore, customerBrief, lifecycleStage, customerSegment, prioritizeSupportQueue, supportSla, evaluateFeatureFlag, satisfactionMetrics, commercialMetrics, uptimeSummary, commercialCsv, commercialJson, commercialSummary, invitationRecord, expired, iso } from '../commercial-operations/index.js';
function planAmounts() { return Object.fromEntries(publicCommercialPlans().map(plan => [plan.id, plan.amountMinor])); }
function tenantRequired(value) { if (!value)
    throw new TypeError('Tenant not found'); return value; }
export class CommercialOperationsService {
    constructor(options = {}) {
        this.accounts = options.accounts || null;
        this.subscriptions = options.subscriptions || null;
        this.usageRepository = options.usage || null;
        this.billingProviders = options.billingProviders || null;
        this.publishing = options.publishing || null;
        this.automation = options.automation || null;
        this.audit = options.audit || null;
        this.tenants = new TenantStore({ maximum: COMMERCIAL_LIMITS.tenantsPerOwner });
        this.seats = new SeatStore({ maximum: COMMERCIAL_LIMITS.tenantsPerOwner * 20 });
        this.invitations = new InvitationStore({ maximum: COMMERCIAL_LIMITS.tenantsPerOwner * 10 });
        this.successPlans = new SuccessPlanStore({ maximum: COMMERCIAL_LIMITS.successPlansPerOwner });
        this.supportCases = new SupportCaseStore({ maximum: COMMERCIAL_LIMITS.supportCasesPerOwner });
        this.statusComponents = new StatusComponentStore({ maximum: 500 });
        this.statusIncidents = new StatusIncidentStore({ maximum: COMMERCIAL_LIMITS.incidentsPerOwner });
        this.featureFlags = new FeatureFlagStore({ maximum: COMMERCIAL_LIMITS.flagsPerOwner });
        this.releaseNotes = new ReleaseNoteStore({ maximum: COMMERCIAL_LIMITS.releaseNotesPerOwner });
        this.feedback = new FeedbackStore({ maximum: COMMERCIAL_LIMITS.feedbackPerOwner });
        this.usage = new UsageMeter({ maximum: COMMERCIAL_LIMITS.usageEventsPerOwner });
        this.onboarding = new Map();
    }
    catalog() { return commercialCatalog(); }
    onboardingBucket(owner) {
        const key = String(owner || 'anonymous');
        if (!this.onboarding.has(key))
            this.onboarding.set(key, new Map());
        return this.onboarding.get(key);
    }
    async seed(owner, input = {}) {
        const existing = await this.tenants.list(owner);
        if (existing.length)
            return this.snapshot(owner);
        const tenant = await this.tenants.put(owner, {
            id: input.tenantId || 'tenant-merlin-demo', name: input.name || 'Merlin Intelligence', legalName: input.legalName || 'Merlin Intelligence Ltd',
            state: input.state || 'ACTIVE', segment: input.segment || 'SMB', planId: input.planId || 'TEAM', ownerUserId: input.ownerUserId || owner,
            billingEmail: input.billingEmail || 'billing@example.test', countryCode: input.countryCode || 'GB', industry: 'Intelligence software'
        });
        await this.seats.put(owner, { id: 'seat-owner', tenantId: tenant.id, userId: owner, name: 'Workspace owner', email: input.ownerEmail || 'owner@example.test', role: 'OWNER', active: true, lastActiveAt: iso() });
        this.onboardingBucket(owner).set(tenant.id, new Set(['PROFILE', 'TEAM', 'MAP_VIEW', 'WATCHLIST', 'ALERT']));
        await this.statusComponents.put(owner, { id: 'component-api', name: 'Merlin API', group: 'PLATFORM' });
        await this.statusComponents.put(owner, { id: 'component-map', name: 'Map and overlays', group: 'PRODUCT' });
        await this.statusComponents.put(owner, { id: 'component-sources', name: 'Intelligence sources', group: 'DATA' });
        await this.featureFlags.put(owner, { id: 'flag-commercial', key: 'COMMERCIAL_OPERATIONS', name: 'Commercial operations workspace', rollout: 'ON' });
        await this.releaseNotes.put(owner, { id: 'release-20-15', version: '20.15.0', title: 'Customer operations platform', summary: 'Tenant administration, customer health, support and service-status operations.', state: 'PUBLISHED', publishedAt: iso() });
        await this.successPlans.put(owner, { tenantId: tenant.id, title: 'First value plan', objectives: ['Create operating watchlists', 'Automate material alerts', 'Publish a weekly intelligence brief'], owners: [owner], milestones: [] });
        return this.snapshot(owner);
    }
    async createTenant(owner, input = {}) {
        const tenant = await this.tenants.put(owner, { ...input, ownerUserId: input.ownerUserId || owner, segment: input.segment || customerSegment(input) });
        if (input.ownerEmail)
            await this.seats.put(owner, { tenantId: tenant.id, userId: input.ownerUserId || owner, email: input.ownerEmail, name: input.ownerName || 'Owner', role: 'OWNER' });
        this.onboardingBucket(owner).set(tenant.id, new Set(input.completedOnboarding || []));
        return tenant;
    }
    async inviteSeat(owner, input = {}) {
        const tenant = tenantRequired(await this.tenants.get(owner, input.tenantId));
        const activeSeats = (await this.seats.list(owner, { tenantId: tenant.id })).filter(item => item.active).length;
        const plan = commercialPlan(tenant.planId);
        if (plan.id !== 'ENTERPRISE' && activeSeats >= Math.max(plan.seats, Number(input.seatLimit || plan.seats)))
            throw new TypeError('Seat limit reached');
        return this.invitations.put(owner, { ...input, invitedBy: input.invitedBy || owner });
    }
    async acceptInvitation(owner, token, input = {}) {
        const invites = await this.invitations.list(owner, { limit: COMMERCIAL_LIMITS.invitationsPerTenant });
        const invitation = invites.find(item => item.token === token);
        if (!invitation)
            throw new TypeError('Invitation not found');
        if (invitation.state !== 'PENDING' || expired(invitation.expiresAt))
            throw new TypeError('Invitation is no longer valid');
        const updated = await this.invitations.put(owner, { ...invitation, state: 'ACCEPTED', acceptedAt: iso() });
        const seat = await this.seats.put(owner, { tenantId: invitation.tenantId, userId: input.userId, email: invitation.email, name: input.name, role: invitation.role, active: true, lastActiveAt: iso() });
        return Object.freeze({ invitation: updated, seat });
    }
    async completeOnboarding(owner, tenantId, stepId) {
        tenantRequired(await this.tenants.get(owner, tenantId));
        const bucket = this.onboardingBucket(owner);
        if (!bucket.has(tenantId))
            bucket.set(tenantId, new Set());
        bucket.get(tenantId).add(String(stepId || '').toUpperCase());
        return onboardingProgress([...bucket.get(tenantId)]);
    }
    async onboardingStatus(owner, tenantId) {
        return onboardingProgress([...(this.onboardingBucket(owner).get(tenantId) || [])]);
    }
    async recordUsage(owner, input = {}) {
        tenantRequired(await this.tenants.get(owner, input.tenantId));
        const event = await this.usage.record(owner, input);
        if (this.usageRepository && input.userId)
            await this.usageRepository.increment(input.userId, input.metric, input.quantity || 1).catch(() => null);
        return event;
    }
    async usageSummary(owner, tenantId, filter = {}) {
        const tenant = tenantRequired(await this.tenants.get(owner, tenantId));
        const events = await this.usage.list(owner, { ...filter, tenantId });
        const rollup = rollupUsage(events);
        const quotas = quotaEvaluation(tenant.planId, rollup.metrics, filter.overrides || {});
        return Object.freeze({ tenantId, planId: tenant.planId, rollup, quotas, overages: calculateOverages(quotas.quotas) });
    }
    async supportQueue(owner, filter = {}) {
        const cases = await this.supportCases.list(owner, { ...filter, limit: COMMERCIAL_LIMITS.supportCasesPerOwner });
        return prioritizeSupportQueue(cases);
    }
    async openSupportCase(owner, input = {}) {
        tenantRequired(await this.tenants.get(owner, input.tenantId));
        const record = await this.supportCases.put(owner, input);
        return Object.freeze({ case: record, sla: supportSla(record) });
    }
    async updateSupportCase(owner, input = {}) {
        const current = await this.supportCases.get(owner, input.id);
        if (!current)
            throw new TypeError('Support case not found');
        const patch = { ...current, ...input };
        if (input.state === 'ACKNOWLEDGED' && !patch.acknowledgedAt)
            patch.acknowledgedAt = iso();
        if (input.firstResponse && !patch.firstResponseAt)
            patch.firstResponseAt = iso();
        if (['RESOLVED', 'CLOSED'].includes(String(input.state).toUpperCase()) && !patch.resolvedAt)
            patch.resolvedAt = iso();
        const record = await this.supportCases.put(owner, patch);
        return Object.freeze({ case: record, sla: supportSla(record) });
    }
    async createStatusIncident(owner, input = {}) { return this.statusIncidents.put(owner, input); }
    async updateStatusIncident(owner, input = {}) {
        const current = await this.statusIncidents.get(owner, input.id);
        if (!current)
            throw new TypeError('Status incident not found');
        const patch = { ...current, ...input, updates: [...(current.updates || []), ...(input.update ? [{ message: input.update, state: input.state || current.state, at: iso() }] : [])] };
        if (String(input.state).toUpperCase() === 'RESOLVED' && !patch.resolvedAt)
            patch.resolvedAt = iso();
        return this.statusIncidents.put(owner, patch);
    }
    async statusSummary(owner, days = 30) {
        const components = await this.statusComponents.list(owner, { limit: 500 });
        const incidents = await this.statusIncidents.list(owner, { limit: COMMERCIAL_LIMITS.incidentsPerOwner });
        const start = new Date(Date.now() - Number(days || 30) * 86400000);
        return Object.freeze({ components, incidents, uptime: uptimeSummary(incidents.filter(item => new Date(item.startedAt) >= start), start), generatedAt: iso() });
    }
    async customerHealth(owner, tenantId) {
        const tenant = tenantRequired(await this.tenants.get(owner, tenantId));
        const seats = await this.seats.list(owner, { tenantId, limit: COMMERCIAL_LIMITS.seatsPerTenant });
        const activeSeats = seats.filter(item => item.active && (!item.lastActiveAt || new Date(item.lastActiveAt) >= new Date(Date.now() - 30 * 86400000))).length;
        const usage = await this.usageSummary(owner, tenantId);
        const cases = await this.supportCases.list(owner, { tenantId, limit: COMMERCIAL_LIMITS.supportCasesPerOwner });
        const feedback = await this.feedback.list(owner, { tenantId, limit: COMMERCIAL_LIMITS.feedbackPerOwner });
        const onboarding = await this.onboardingStatus(owner, tenantId);
        const adoption = adoptionScore({ activeFeatures: Object.values(usage.rollup.metrics).filter(value => value > 0).length, availableFeatures: Math.max(1, commercialPlan(tenant.planId).features.length), weeklyActions: Object.values(usage.rollup.metrics).reduce((sum, value) => sum + Number(value || 0), 0), targetWeeklyActions: 40, activeSeats, paidSeats: Math.max(1, commercialPlan(tenant.planId).seats), automations: Number(usage.rollup.metrics.automations || 0) });
        const lastActive = seats.map(item => item.lastActiveAt).filter(Boolean).sort().at(-1);
        const daysSinceActive = lastActive ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000) : 30;
        const engagement = engagementScore({ daysSinceActive, activeDays30: Math.min(30, Number(usage.rollup.metrics.activeDays || 0)), collaborativeActions: Number(usage.rollup.metrics.collaboration || 0) });
        const open = cases.filter(item => !['RESOLVED', 'CLOSED'].includes(item.state));
        const sentiment = satisfactionMetrics(feedback);
        const sentimentScore = sentiment.nps === null ? 70 : Math.max(0, Math.min(100, sentiment.nps + 50));
        const retention = retentionRisk({ daysSinceActive, adoptionScore: adoption.score, openCases: open.length, openSev1: open.filter(item => item.severity === 'SEV1').length, openSev2: open.filter(item => item.severity === 'SEV2').length, pastDue: tenant.state === 'PAST_DUE' });
        const health = customerHealthScore({ adoptionScore: adoption.score, engagementScore: engagement.score, openCases: open.length, openSev1: open.filter(item => item.severity === 'SEV1').length, openSev2: open.filter(item => item.severity === 'SEV2').length, sentimentScore, pastDue: tenant.state === 'PAST_DUE' });
        const quotaPercentages = usage.quotas.quotas.map(item => item.percentage);
        const expansion = expansionScore({ quotaUtilization: quotaPercentages.length ? Math.max(...quotaPercentages) : 0, seatUtilization: commercialPlan(tenant.planId).seats ? activeSeats / commercialPlan(tenant.planId).seats * 100 : 100, healthScore: health.score, requestedPremiumFeatures: feedback.filter(item => item.type === 'IDEA').length });
        const stage = lifecycleStage({ createdAt: tenant.createdAt, cancelledAt: tenant.state === 'CANCELLED' ? tenant.updatedAt : null, trialEndsAt: tenant.trialEndsAt, onboardingScore: onboarding.score, adoptionScore: adoption.score, retentionRisk: retention.risk, expansionOpen: expansion.score >= 75 });
        return Object.freeze({ tenant, seats: seats.length, activeSeats, onboarding, adoption, engagement, health, retention, expansion, sentiment, lifecycleStage: stage, usage, openSupportCases: open.length });
    }
    async accountBrief(owner, tenantId) {
        const analysis = await this.customerHealth(owner, tenantId);
        const incidents = (await this.statusIncidents.list(owner, { limit: 1000 })).filter(item => item.state !== 'RESOLVED');
        const nextActions = [];
        if (analysis.onboarding.score < 100)
            nextActions.push(`Complete onboarding: ${analysis.onboarding.next?.title || 'next step'}`);
        if (analysis.retention.risk >= 55)
            nextActions.push('Open a customer-success intervention');
        if (analysis.expansion.score >= 75)
            nextActions.push('Review plan or seat expansion');
        if (analysis.openSupportCases)
            nextActions.push('Resolve open customer support cases');
        return customerBrief({ ...analysis, openIncidents: incidents.length, nextActions });
    }
    async changePreview(owner, input = {}) {
        const tenant = tenantRequired(await this.tenants.get(owner, input.tenantId));
        return subscriptionChangePreview({ currentPlanId: tenant.planId, targetPlanId: input.targetPlanId, seats: input.seats, periodRemainingFraction: input.periodRemainingFraction, effective: input.effective });
    }
    async evaluateFeature(owner, input = {}) {
        const flags = await this.featureFlags.list(owner, { limit: COMMERCIAL_LIMITS.flagsPerOwner });
        const flag = flags.find(item => item.id === input.flagId || item.key === String(input.key || '').toUpperCase());
        if (!flag)
            return Object.freeze({ enabled: false, reason: 'FLAG_NOT_FOUND' });
        return Object.freeze({ flag, evaluation: evaluateFeatureFlag(flag, input.context || {}) });
    }
    async metrics(owner) {
        const [tenants, seats, supportCases, feedback] = await Promise.all([this.tenants.list(owner, { limit: COMMERCIAL_LIMITS.tenantsPerOwner }), this.seats.list(owner, { limit: COMMERCIAL_LIMITS.tenantsPerOwner * 20 }), this.supportCases.list(owner, { limit: COMMERCIAL_LIMITS.supportCasesPerOwner }), this.feedback.list(owner, { limit: COMMERCIAL_LIMITS.feedbackPerOwner })]);
        return commercialMetrics({ tenants, seats, supportCases, feedback, planAmounts: planAmounts() });
    }
    async diagnostics(owner) {
        const metrics = await this.metrics(owner);
        return commercialDiagnostics({ tenants: this.tenants, usage: this.usage, supportCases: this.supportCases, statusIncidents: this.statusIncidents, featureFlags: this.featureFlags, feedback: this.feedback, metrics });
    }
    async snapshot(owner) {
        const [tenants, seats, invitations, successPlans, supportCases, components, incidents, featureFlags, releaseNotes, feedback, metrics, diagnostics] = await Promise.all([
            this.tenants.list(owner), this.seats.list(owner), this.invitations.list(owner), this.successPlans.list(owner), this.supportQueue(owner), this.statusComponents.list(owner), this.statusIncidents.list(owner), this.featureFlags.list(owner), this.releaseNotes.list(owner), this.feedback.list(owner), this.metrics(owner), this.diagnostics(owner)
        ]);
        const health = [];
        for (const tenant of tenants.slice(0, 100))
            health.push(await this.customerHealth(owner, tenant.id));
        return Object.freeze({ generatedAt: iso(), tenants, seats, invitations, successPlans, supportCases, status: { components, incidents }, featureFlags, releaseNotes, feedback, satisfaction: satisfactionMetrics(feedback), health, metrics, diagnostics });
    }
    async export(owner, input = {}) {
        const snapshot = input.tenantId ? await this.accountBrief(owner, input.tenantId) : await this.snapshot(owner);
        const format = String(input.format || 'JSON').toUpperCase();
        if (format === 'CSV') {
            const rows = input.tenantId ? [snapshot] : snapshot.tenants;
            return Object.freeze({ contentType: 'text/csv; charset=utf-8', extension: 'csv', body: commercialCsv(rows) });
        }
        if (format === 'SUMMARY')
            return Object.freeze({ contentType: 'text/plain; charset=utf-8', extension: 'txt', body: commercialSummary(snapshot) });
        return Object.freeze({ contentType: 'application/json; charset=utf-8', extension: 'json', body: commercialJson(snapshot) });
    }
}
export function createCommercialOperationsService(options = {}) { return new CommercialOperationsService(options); }
