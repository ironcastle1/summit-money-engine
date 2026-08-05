import { ServiceStore, SloStore, MeasurementStore, IncidentStore, TimelineStore, ReleaseStore, DeploymentStore, QueueStore, JobStore, BackupPolicyStore, BackupStore, RestoreTestStore, MaintenanceStore, RiskStore, SyntheticStore, LogStore, MetricStore, TraceStore, reliabilityCatalog, serviceRecord, serviceLevelObjective, sliMeasurement, errorBudget, burnRate, syntheticCheck, operationalIncident, incidentTimelineEntry, releaseRecord, deploymentPlan, queueRecord, jobRecord, backupPolicy, backupRecord, restoreTest, maintenanceWindow, operationalRisk, queueHealth, capacityModel, autoscalingPlan, canaryAnalysis, rollbackDecision, configurationDrift, statusPage, reliabilityReport, reliabilityDiagnostics, operationsJson, operationsCsv, operationsSummary, logEvent, metricSample, traceSpan, traceAnalysis, latencyAnalysis, DEFAULT_SERVICES, SLO_TEMPLATES, runbookExecution, disasterRecoveryPlan, recoveryObjective } from '../reliability-operations/index.js';
export class ReliabilityOperationsService {
    constructor(dependencies = {}) {
        this.dependencies = dependencies;
        this.services = new ServiceStore();
        this.slos = new SloStore();
        this.measurements = new MeasurementStore();
        this.incidents = new IncidentStore();
        this.timeline = new TimelineStore();
        this.releases = new ReleaseStore();
        this.deployments = new DeploymentStore();
        this.queues = new QueueStore();
        this.jobs = new JobStore();
        this.backupPolicies = new BackupPolicyStore();
        this.backups = new BackupStore();
        this.restoreTests = new RestoreTestStore();
        this.maintenance = new MaintenanceStore();
        this.risks = new RiskStore();
        this.syntheticChecks = new SyntheticStore();
        this.logs = new LogStore();
        this.metricSamples = new MetricStore();
        this.traces = new TraceStore();
        this.recoveryPlans = new Map();
    }
    catalog() { return reliabilityCatalog(); }
    async seed(owner = 'anonymous', input = {}) {
        if ((await this.services.list(owner)).length)
            return this.snapshot(owner);
        for (const template of DEFAULT_SERVICES)
            await this.services.put(owner, serviceRecord({ ...template, tenantId: input.tenantId }));
        for (const service of await this.services.list(owner)) {
            const template = service.id === 'api' ? SLO_TEMPLATES.find(item => item.id === 'latency-api') : service.id === 'ingestion' ? SLO_TEMPLATES.find(item => item.id === 'freshness-intelligence') : SLO_TEMPLATES.find(item => item.id === (service.tier === 1 ? 'availability-critical' : 'availability-standard'));
            const slo = serviceLevelObjective({ ...template, serviceId: service.id, tenantId: service.tenantId });
            await this.slos.put(owner, slo);
            const value = slo.comparator === 'LTE' ? Math.max(1, slo.target * .7) : Math.min(100, slo.target + .05);
            await this.measurements.put(owner, sliMeasurement({ serviceId: service.id, sloId: slo.id, value, good: 999, total: 1000, source: 'SEED_BASELINE' }));
            await this.syntheticChecks.put(owner, syntheticCheck({ serviceId: service.id, name: `${service.name} core journey`, passed: true, durationMs: 120, steps: [{ name: 'Resolve', passed: true, durationMs: 20 }, { name: 'Request', passed: true, durationMs: 70 }, { name: 'Validate', passed: true, durationMs: 30 }] }));
        }
        const queue = queueRecord({ id: 'queue-intelligence-ingestion', name: 'Intelligence ingestion', serviceId: 'ingestion', depth: 12, consumers: 2, ingressPerMinute: 40, egressPerMinute: 45, oldestJobAgeSeconds: 18 });
        await this.queues.put(owner, queue);
        const policy = backupPolicy({ id: 'backup-policy-runtime', name: 'Runtime data daily', resourceIds: ['runtime-data'], frequencyHours: 24, retentionDays: 30, encrypted: true, immutable: true, regions: ['primary', 'secondary'] });
        await this.backupPolicies.put(owner, policy);
        const backup = backupRecord({ id: 'backup-runtime-seed', policyId: policy.id, resourceId: 'runtime-data', state: 'VERIFIED', checksum: 'seed-verification', encrypted: true, immutable: true, sizeBytes: 1024 });
        await this.backups.put(owner, backup);
        await this.restoreTests.put(owner, restoreTest({ backupId: backup.id, durationMinutes: 4, checks: [{ name: 'Checksum', passed: true }, { name: 'Schema', passed: true }, { name: 'Application start', passed: true }], applicationStarted: true }));
        this.recoveryPlans.set(String(owner), [disasterRecoveryPlan({ id: 'dr-merlin-core', name: 'Merlin core recovery', serviceIds: ['web', 'api', 'persistence'], primaryRegion: 'primary', recoveryRegion: 'secondary', strategy: 'WARM_STANDBY', rpoMinutes: 60, rtoMinutes: 240, steps: ['Declare recovery', 'Restore verified data', 'Start isolated services', 'Validate integrity', 'Approve cutover'] })]);
        return this.snapshot(owner);
    }
    async createService(owner, input) { const record = serviceRecord(input); await this.services.put(owner, record); return record; }
    async createSlo(owner, input) { const record = serviceLevelObjective(input); await this.slos.put(owner, record); return record; }
    async recordMeasurement(owner, input) { const record = sliMeasurement(input); await this.measurements.put(owner, record); return record; }
    async recordSynthetic(owner, input) { const record = syntheticCheck(input); await this.syntheticChecks.put(owner, record); return record; }
    async createIncident(owner, input) { const record = operationalIncident(input); await this.incidents.put(owner, record); await this.timeline.put(owner, incidentTimelineEntry({ incidentId: record.id, type: 'DECLARED', message: record.summary || record.title, actor: owner })); return Object.freeze({ incident: record, runbook: record.runbookId ? runbookExecution({ runbookId: record.runbookId, incidentId: record.id }) : null }); }
    async addTimeline(owner, input) { const record = incidentTimelineEntry(input); await this.timeline.put(owner, record); return record; }
    async createRelease(owner, input) { const record = releaseRecord(input); await this.releases.put(owner, record); return record; }
    async createDeployment(owner, input) { const record = deploymentPlan(input); await this.deployments.put(owner, record); return record; }
    async createQueue(owner, input) { const record = queueRecord(input); await this.queues.put(owner, record); return Object.freeze({ queue: record, health: queueHealth(record) }); }
    async createJob(owner, input) { const record = jobRecord(input); await this.jobs.put(owner, record); return record; }
    async createBackupPolicy(owner, input) { const record = backupPolicy(input); await this.backupPolicies.put(owner, record); return record; }
    async createBackup(owner, input) { const record = backupRecord(input); await this.backups.put(owner, record); return record; }
    async createRestoreTest(owner, input) { const record = restoreTest(input); await this.restoreTests.put(owner, record); return record; }
    async createMaintenance(owner, input) { const record = maintenanceWindow(input); await this.maintenance.put(owner, record); return record; }
    async createRisk(owner, input) { const record = operationalRisk(input); await this.risks.put(owner, record); return record; }
    async addLog(owner, input) { const record = logEvent(input); await this.logs.put(owner, record); return record; }
    async addMetric(owner, input) { const record = metricSample(input); await this.metricSamples.put(owner, record); return record; }
    async addTrace(owner, input) { const record = traceSpan(input); await this.traces.put(owner, record); return record; }
    canary(input) { return canaryAnalysis(input); }
    rollback(input) { return rollbackDecision(input); }
    capacity(input) { const model = capacityModel(input); return Object.freeze({ model, autoscaling: autoscalingPlan({ currentReplicas: input.currentReplicas || 1, utilization: input.utilization || 0, targetUtilization: input.targetUtilization || 65, minimumReplicas: input.minimumReplicas || 1, maximumReplicas: input.maximumReplicas || 100 }) }); }
    drift(input) { return configurationDrift(input.expected || {}, input.actual || {}, input.ignored || []); }
    recovery(input) { return recoveryObjective(input); }
    async runtimeSnapshot() { const runtime = this.dependencies.runtime?.snapshot?.() || null; const metrics = this.dependencies.metrics?.snapshot?.() || null; const health = this.dependencies.health?.snapshot?.() || null; const build = await this.dependencies.buildInfo?.snapshot?.().catch?.(() => null) || null; return { runtime, metrics, health, build, startup: this.dependencies.startupDiagnostics || null }; }
    async snapshot(owner = 'anonymous') {
        const [services, slos, measurements, incidents, timeline, releases, deployments, queues, jobs, backupPolicies, backups, restoreTests, maintenance, risks, syntheticChecks, logs, metricSamples, traces, runtime] = await Promise.all([this.services.list(owner), this.slos.list(owner), this.measurements.list(owner), this.incidents.list(owner), this.timeline.list(owner), this.releases.list(owner), this.deployments.list(owner), this.queues.list(owner), this.jobs.list(owner), this.backupPolicies.list(owner), this.backups.list(owner), this.restoreTests.list(owner), this.maintenance.list(owner), this.risks.list(owner), this.syntheticChecks.list(owner), this.logs.list(owner), this.metricSamples.list(owner), this.traces.list(owner), this.runtimeSnapshot()]);
        const errorBudgets = slos.map(slo => { const rows = measurements.filter(item => item.sloId === slo.id); return errorBudget(slo, rows); });
        const burnRates = slos.map(slo => { const rows = measurements.filter(item => item.sloId === slo.id); return Object.freeze({ sloId: slo.id, ...burnRate(slo, rows.slice(0, 20), rows) }); });
        const queueStates = queues.map(queue => queueHealth(queue));
        const capacity = services.map(service => capacityModel({ currentDemand: Math.max(1, metricSamples.filter(item => item.serviceId === service.id && item.name === 'requests_per_minute').at(0)?.value || 1), currentCapacity: 100, targetUtilization: 70 }));
        const base = { services, slos, measurements, errorBudgets, burnRates, incidents, timeline, releases, deployments, queues, queueHealth: queueStates, jobs, backupPolicies, backups, restoreTests, maintenance, risks, syntheticChecks, logs: logs.slice(0, 200), metrics: metricSamples.slice(0, 500), traceAnalysis: traceAnalysis(traces), latency: latencyAnalysis(metricSamples.filter(item => item.name === 'latency_ms')), capacity, recoveryPlans: this.recoveryPlans.get(String(owner)) || [], runtime, statusPage: statusPage(services, incidents, maintenance), generatedAt: new Date().toISOString() };
        const report = reliabilityReport(base);
        return Object.freeze({ ...base, report, diagnostics: reliabilityDiagnostics(base) });
    }
    async diagnostics(owner) { const snapshot = await this.snapshot(owner); return Object.freeze({ ...snapshot.diagnostics, report: snapshot.report, runtime: snapshot.runtime }); }
    async export(owner, input = {}) {
        const snapshot = await this.snapshot(owner);
        const format = String(input.format || 'JSON').toUpperCase();
        if (format === 'CSV')
            return { contentType: 'text/csv; charset=utf-8', extension: 'csv', body: operationsCsv(input.resource === 'INCIDENTS' ? snapshot.incidents : input.resource === 'SERVICES' ? snapshot.services : snapshot.errorBudgets) };
        if (format === 'SUMMARY')
            return { contentType: 'text/plain; charset=utf-8', extension: 'txt', body: operationsSummary(snapshot) };
        return { contentType: 'application/json; charset=utf-8', extension: 'json', body: operationsJson(snapshot) };
    }
}
export function createReliabilityOperationsService(dependencies = {}) { return new ReliabilityOperationsService(dependencies); }
