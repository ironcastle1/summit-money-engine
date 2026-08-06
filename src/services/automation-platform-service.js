import { ActionRegistry, AlertRuleEngine, AutomationAuditLog, AutomationExportService, AutomationMetrics, createCaseAction, createInAppChannel, createNotificationAction, createReportAction, createTaskAction, createWatchlistAction, createWebhookAction, createWebhookChannel, NotificationRouter, NotificationStore, RuleStore, RunStore, WorkflowEngine, WorkflowScheduler, WorkflowStore, automationCatalog, automationDiagnostics, compileWorkflow } from '../automation-workflows/index.js';
export class AutomationPlatformService {
    constructor(options = {}) {
        this.decisionSupport = options.decisionSupport;
        this.workflows = options.workflows || new WorkflowStore();
        this.runs = options.runs || new RunStore();
        this.rules = options.rules || new RuleStore();
        this.notifications = options.notifications || new NotificationStore();
        this.audit = options.audit || new AutomationAuditLog();
        this.metrics = options.metrics || new AutomationMetrics();
        this.exporter = options.exporter || new AutomationExportService();
        this.notificationRouter = options.notificationRouter || new NotificationRouter({ store: this.notifications });
        this.notificationRouter.register('IN_APP', createInAppChannel(this.notifications));
        this.notificationRouter.register('WEBHOOK', createWebhookChannel({ fetchImpl: options.fetchImpl }));
        this.actions = options.actions || new ActionRegistry();
        this.actions.register('CREATE_TASK', createTaskAction(this.decisionSupport));
        this.actions.register('CREATE_CASE', createCaseAction(this.decisionSupport));
        this.actions.register('GENERATE_REPORT', createReportAction(this.decisionSupport));
        this.actions.register('ADD_WATCHLIST', createWatchlistAction());
        this.actions.register('SEND_NOTIFICATION', createNotificationAction(this.notificationRouter));
        this.actions.register('CALL_WEBHOOK', createWebhookAction({ fetchImpl: options.fetchImpl }));
        this.actions.register('RECORD_NOTE', async (action, context) => { const item = await this.decisionSupport?.activity?.putNote?.(context.owner, { title: action.configuration.title || 'Automation note', body: action.configuration.body || context.signal?.summary || '', caseId: action.configuration.caseId || '', tags: ['automation'] }); if (!item)
            throw new Error('Decision-support note store unavailable'); return Object.freeze({ type: 'NOTE', id: item.id, note: item }); });
        this.actions.register('REQUEST_APPROVAL', async (action, context) => { const item = await this.decisionSupport?.approvals?.create?.(context.owner, { resourceType: action.configuration.resourceType || 'WORKFLOW', resourceId: action.configuration.resourceId || context.workflowId, assignedTo: action.configuration.assignedTo || 'operator', note: action.configuration.note || 'Automation approval requested' }); if (!item)
            throw new Error('Decision-support approval store unavailable'); return Object.freeze({ type: 'APPROVAL', id: item.id, approval: item }); });
        this.engine = options.engine || new WorkflowEngine({ actions: this.actions, runs: this.runs, audit: this.audit, metrics: this.metrics });
        this.scheduler = options.scheduler || new WorkflowScheduler({ workflows: this.workflows, engine: this.engine, intervalMs: options.schedulerIntervalMs });
        this.alerts = options.alerts || new AlertRuleEngine({ rules: this.rules, workflows: this.workflows, engine: this.engine });
    }
    catalog() { return automationCatalog(); }
    diagnostics(owner) { return automationDiagnostics(this, owner); }
    async saveWorkflow(owner, input) { const item = await this.workflows.put(owner, input); await this.audit.append(owner, { action: 'UPSERT', resourceType: 'WORKFLOW', resourceId: item.id, metadata: { state: item.state, version: item.version } }); return item; }
    async removeWorkflow(owner, id) { const removed = await this.workflows.remove(owner, id); if (removed)
        await this.audit.append(owner, { action: 'REMOVED', resourceType: 'WORKFLOW', resourceId: id }); return removed; }
    async run(owner, id, input = {}) { const workflow = await this.workflows.get(owner, id); if (!workflow)
        return null; return this.engine.execute(workflow, { ...input, owner, manual: input.manual !== false }); }
    async evaluate(owner, input = {}) { return this.alerts.evaluate(owner, input); }
    async seedTemplates(owner) {
        const existing = await this.workflows.list(owner);
        if (existing.length)
            return existing;
        const templates = [
            { name: 'Critical signal escalation', state: 'ACTIVE', triggers: [{ type: 'DECISION_SIGNAL', configuration: { minimumScore: 85 } }], actions: [{ id: 'notify', type: 'SEND_NOTIFICATION', configuration: { title: 'CRITICAL: {{signal.title}}', body: '{{signal.summary}}', severity: 'CRITICAL', channels: ['IN_APP'] } }, { id: 'task', type: 'CREATE_TASK', dependsOn: ['notify'], configuration: { title: 'Review critical signal: {{signal.title}}', priority: 90 } }] },
            { name: 'Major hazard response', state: 'ACTIVE', triggers: [{ type: 'HAZARD_MATERIALITY', configuration: { minimumMateriality: 75 } }], actions: [{ id: 'case', type: 'CREATE_CASE', configuration: { title: 'Hazard response: {{hazard.title}}', priority: 85 } }, { id: 'notify', type: 'SEND_NOTIFICATION', dependsOn: ['case'], configuration: { title: 'Major hazard response opened', body: 'Case created for {{hazard.title}}', severity: 'URGENT' } }] },
            { name: 'Source health watch', state: 'ACTIVE', triggers: [{ type: 'CONNECTOR_HEALTH' }], actions: [{ type: 'CREATE_TASK', configuration: { title: 'Restore connector: {{connector.name}}', priority: 75 } }, { type: 'SEND_NOTIFICATION', configuration: { title: 'Connector degraded: {{connector.name}}', body: 'State: {{connector.state}}', severity: 'URGENT' } }] },
            { name: 'Morning executive report', state: 'ACTIVE', triggers: [{ type: 'SCHEDULE', configuration: { schedule: { type: 'DAILY', time: '07:00', timezone: 'Europe/London' } } }], actions: [{ type: 'GENERATE_REPORT', configuration: { type: 'MORNING', title: 'Merlin Morning Report', hours: 24 } }] }
        ];
        const records = [];
        for (const template of templates)
            records.push(await this.saveWorkflow(owner, template));
        return Object.freeze(records);
    }
    compile(input) { return compileWorkflow(input); }
    async snapshot(owner) { const [workflows, runs, rules, notifications, diagnostics] = await Promise.all([this.workflows.list(owner), this.runs.list(owner, { limit: 100 }), this.rules.list(owner), this.notifications.list(owner, { limit: 100 }), this.diagnostics(owner)]); return Object.freeze({ workflows, runs, rules, notifications, diagnostics, generatedAt: new Date().toISOString() }); }
}
export function createAutomationPlatformService(options) { return new AutomationPlatformService(options); }
