import {
  ActivityStore,
  ApprovalWorkflowStore,
  BriefingScheduleStore,
  buildDecisionSnapshot,
  buildShiftHandover,
  CaseFileStore,
  composeReport,
  DecisionAuditTrail,
  DecisionRegister,
  decisionSupportCatalog,
  decisionSupportDiagnostics,
  DecisionSupportExportService,
  DEFAULT_ESCALATION_POLICIES,
  distributionPolicy,
  escalationQueue,
  evaluateDistribution,
  notificationDigest,
  redactForDistribution,
  signalsFromConflict,
  signalsFromCountries,
  signalsFromEvents,
  signalsFromHazards,
  signalsFromLogistics,
  signalsFromMarkets,
  signalsFromOpportunities,
  SlaTracker,
  teamActivitySummary,
  WorkspaceStore
} from '../decision-support/index.js';

function deadline(promise, milliseconds, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise(resolve => {
      timer = setTimeout(() => resolve(fallback), milliseconds);
      timer.unref?.();
    })
  ]).finally(() => clearTimeout(timer));
}

function fulfilled(result, fallback = {}) {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function cacheKey(input) {
  return JSON.stringify({
    hours: Number(input.hours) || 72,
    domains: input.domains || [],
    minimumPriority: Number(input.minimumPriority) || 0,
    owner: input.owner || 'anonymous',
    watchlists: (input.watchlists || []).map(item => ({ id: item.id, enabled: item.enabled, minimumPriority: item.minimumPriority }))
  });
}

export class DecisionSupportPlatformService {
  constructor(options = {}) {
    Object.assign(this, options);
    this.workspaces = options.workspaces || new WorkspaceStore();
    this.cases = options.cases || new CaseFileStore();
    this.activity = options.activity || new ActivityStore();
    this.decisions = options.decisions || new DecisionRegister();
    this.audit = options.audit || new DecisionAuditTrail();
    this.slas = options.slas || new SlaTracker();
    this.schedules = options.schedules || new BriefingScheduleStore();
    this.approvals = options.approvals || new ApprovalWorkflowStore();
    this.exporter = options.exporter || new DecisionSupportExportService();
    this.escalationPolicies = Object.freeze((options.escalationPolicies || DEFAULT_ESCALATION_POLICIES).map(item => Object.freeze({ ...item })));
    this.cache = new Map();
    this.cacheTtlMs = Math.max(5_000, Number(options.cacheTtlMs) || 30_000);
  }

  catalog() {
    return decisionSupportCatalog();
  }

  diagnostics() {
    return decisionSupportDiagnostics(this);
  }

  invalidate(owner) {
    const ownerText = String(owner || 'anonymous');
    for (const key of this.cache.keys()) {
      if (key.includes(`"owner":"${ownerText.replaceAll('"', '\\"')}"`)) this.cache.delete(key);
    }
  }

  async recordAudit(owner, input) {
    return this.audit.append(owner, { ...input, actor: input.actor || owner });
  }

  async sourceBundle(input = {}) {
    if (input.bundle) return input.bundle;
    const hours = Math.max(1, Math.min(720, Number(input.hours) || 72));
    const jobs = [
      deadline(this.eventService?.globalSnapshot?.({ since: Date.now() - hours * 3_600_000, limit: 2500 }), 2500, { events: [] }),
      deadline(this.conflict?.snapshot?.({ hours, limit: 80 }), 2800, { theatres: [] }),
      deadline(this.hazards?.snapshot?.({ hours, limit: 120 }), 2800, { events: [] }),
      deadline(this.markets?.snapshot?.({ maximumAssets: 20, includeEvents: true, includePredictions: true }), 3200, { opportunities: [], analyses: [] }),
      deadline(this.countries?.snapshot?.({ limit: 120, includeNews: false }), 2800, { profiles: [] }),
      Promise.resolve(input.logistics || { routes: [] }),
      deadline(this.opportunities?.list?.({ limit: 100 }), 2000, { opportunities: [] })
    ];
    const results = await Promise.allSettled(jobs);
    return Object.freeze({
      events: fulfilled(results[0]),
      conflict: fulfilled(results[1]),
      hazards: fulfilled(results[2]),
      markets: fulfilled(results[3]),
      countries: fulfilled(results[4]),
      logistics: fulfilled(results[5]),
      opportunities: fulfilled(results[6])
    });
  }

  async ensureEscalationSlas(owner, queue) {
    const created = [];
    const existingIds = new Set((await this.slas.list(owner, { limit: 5000 })).map(record => record.id));
    for (const item of queue.slice(0, 250)) {
      const id = `sla-${item.policyId}-${item.signalId}`;
      if (existingIds.has(id)) continue;
      created.push(await this.slas.create(owner, {
        id,
        signalId: item.signalId,
        policyId: item.policyId,
        targetRole: item.targetRole,
        acknowledgeMinutes: item.acknowledgeMinutes,
        resolveMinutes: item.resolveMinutes,
        owner: 'unassigned'
      }));
      existingIds.add(id);
    }
    return Object.freeze(created);
  }

  async operationalSummary(owner) {
    const [workspace, cases, activity, decisions, slas, approvals, schedules, auditVerification] = await Promise.all([
      this.workspaces.summary(owner),
      this.cases.summary(owner),
      this.activity.summary(owner),
      this.decisions.summary(owner),
      this.slas.summary(owner),
      this.approvals.list(owner, { limit: 1000 }).then(items => ({ total: items.length, pending: items.filter(item => ['SUBMITTED', 'IN_REVIEW'].includes(item.state)).length })),
      this.schedules.list(owner).then(items => ({ total: items.length, enabled: items.filter(item => item.enabled).length })),
      this.audit.verify(owner)
    ]);
    return Object.freeze({ workspace, cases, activity, decisions, slas, approvals, schedules, audit: auditVerification });
  }

  async snapshot(input = {}) {
    const key = cacheKey(input);
    const cached = this.cache.get(key);
    if (!input.force && !input.bundle && cached && Date.now() - cached.createdAt < this.cacheTtlMs) {
      return Object.freeze({ ...cached.value, cache: 'HIT' });
    }

    const bundle = await this.sourceBundle(input);
    const signals = [
      ...signalsFromEvents(bundle.events),
      ...signalsFromConflict(bundle.conflict),
      ...signalsFromHazards(bundle.hazards),
      ...signalsFromMarkets(bundle.markets),
      ...signalsFromCountries(bundle.countries),
      ...signalsFromLogistics(bundle.logistics),
      ...signalsFromOpportunities(bundle.opportunities)
    ];
    const owner = input.owner || 'anonymous';
    const [workspaces, cases, activity] = await Promise.all([
      this.workspaces.list(owner),
      this.cases.list(owner),
      this.activity.listActivity(owner)
    ]);
    const result = buildDecisionSnapshot({
      ...input,
      signals,
      watchlists: input.watchlists || [],
      activity
    });
    const escalations = escalationQueue(result.signals, input.escalationPolicies || this.escalationPolicies, { now: input.now, limit: 250 });
    await this.ensureEscalationSlas(owner, escalations);
    const [slaItems, operations] = await Promise.all([
      this.slas.list(owner, { limit: 250 }),
      this.operationalSummary(owner)
    ]);
    const enriched = Object.freeze({
      ...result,
      workspaces,
      cases,
      activity: teamActivitySummary(activity),
      escalations,
      slas: slaItems,
      operations,
      sourceBundleStatus: Object.freeze({
        events: Boolean(bundle.events),
        conflict: Boolean(bundle.conflict),
        hazards: Boolean(bundle.hazards),
        markets: Boolean(bundle.markets),
        countries: Boolean(bundle.countries),
        logistics: Boolean(bundle.logistics),
        opportunities: Boolean(bundle.opportunities)
      }),
      cache: 'MISS'
    });
    if (!input.bundle) this.cache.set(key, { createdAt: Date.now(), value: enriched });
    return enriched;
  }

  async handover(input = {}) {
    const snapshot = input.snapshot || await this.snapshot(input);
    const handover = buildShiftHandover(snapshot, input);
    await this.recordAudit(input.owner || 'anonymous', { action: 'GENERATED', resourceType: 'HANDOVER', resourceId: handover.generatedAt, metadata: { unresolved: handover.unresolved.length } });
    return handover;
  }

  async report(input = {}) {
    const owner = input.owner || 'anonymous';
    const snapshot = input.snapshot || await this.snapshot(input);
    const report = composeReport(snapshot, input);
    await this.recordAudit(owner, { action: 'GENERATED', resourceType: 'REPORT', resourceId: report.id, metadata: { type: report.type, signalCount: report.metadata.signalCount } });
    return report;
  }

  async digest(input = {}) {
    const snapshot = input.snapshot || await this.snapshot(input);
    return notificationDigest(snapshot, input);
  }

  async distribute(input = {}) {
    const owner = input.owner || 'anonymous';
    const evaluation = evaluateDistribution(input);
    const content = evaluation.allowed ? redactForDistribution(input.content, evaluation.controls.redactFields) : null;
    await this.recordAudit(owner, {
      action: evaluation.allowed ? 'DISTRIBUTION_ALLOWED' : 'DISTRIBUTION_BLOCKED',
      resourceType: input.resourceType || 'REPORT',
      resourceId: input.resourceId,
      reason: evaluation.reasons.join('; '),
      metadata: { classification: evaluation.policy.classification, recipients: evaluation.recipients.length }
    });
    return Object.freeze({ evaluation, content, policy: distributionPolicy(input.policy || input) });
  }
}

export function createDecisionSupportPlatformService(options) {
  return new DecisionSupportPlatformService(options);
}
