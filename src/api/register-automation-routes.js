import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString } from '../core/validation.js';
function owner(context) { return String(context?.user?.id || context?.session?.userId || 'anonymous'); }
function query(context, key, fallback = '') { return context?.query?.get(key) ?? fallback; }
function notFound(response, name) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: `${name} not found` } }); }
export function registerAutomationRoutes(router, services) {
    const automation = services.automation;
    router.get('/api/automation/catalog', async ({ response }) => sendJson(response, 200, automation.catalog()));
    router.get('/api/automation/diagnostics', async ({ response, context }) => sendJson(response, 200, await automation.diagnostics(owner(context))));
    router.get('/api/automation/snapshot', async ({ response, context }) => sendJson(response, 200, await automation.snapshot(owner(context))));
    router.get('/api/automation/workflows', async ({ response, context }) => sendJson(response, 200, { workflows: await automation.workflows.list(owner(context), { state: query(context, 'state'), triggerType: query(context, 'triggerType'), query: query(context, 'q') }) }));
    router.get('/api/automation/workflows/:id', async ({ response, context, params }) => { const item = await automation.workflows.get(owner(context), params.id); if (!item)
        return notFound(response, 'Workflow'); sendJson(response, 200, item); });
    router.post('/api/automation/workflows', async ({ request, response, context }) => sendJson(response, 201, await automation.saveWorkflow(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
    router.post('/api/automation/workflows/compile', async ({ request, response }) => sendJson(response, 200, automation.compile(await readJsonBody(request, { maximumBytes: 2000000 }))));
    router.post('/api/automation/workflows/transition', async ({ request, response, context }) => { const body = await readJsonBody(request); const item = await automation.workflows.transition(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body.state); if (!item)
        return notFound(response, 'Workflow'); await automation.audit.append(owner(context), { action: 'TRANSITION', resourceType: 'WORKFLOW', resourceId: item.id, metadata: { state: item.state } }); sendJson(response, 200, item); });
    router.post('/api/automation/workflows/remove', async ({ request, response, context }) => { const body = await readJsonBody(request); sendJson(response, 200, { removed: await automation.removeWorkflow(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 })) }); });
    router.post('/api/automation/workflows/run', async ({ request, response, context }) => { const body = await readJsonBody(request, { maximumBytes: 5000000 }); const item = await automation.run(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body); if (!item)
        return notFound(response, 'Workflow'); sendJson(response, 200, item); });
    router.post('/api/automation/evaluate', async ({ request, response, context }) => sendJson(response, 200, await automation.evaluate(owner(context), await readJsonBody(request, { maximumBytes: 5000000 }))));
    router.post('/api/automation/templates/seed', async ({ response, context }) => sendJson(response, 201, { workflows: await automation.seedTemplates(owner(context)) }));
    router.get('/api/automation/runs', async ({ response, context }) => sendJson(response, 200, { runs: await automation.runs.list(owner(context), { workflowId: query(context, 'workflowId'), state: query(context, 'state'), limit: query(context, 'limit') }) }));
    router.get('/api/automation/runs/:id', async ({ response, context, params }) => { const item = await automation.runs.get(owner(context), params.id); if (!item)
        return notFound(response, 'Run'); sendJson(response, 200, item); });
    router.get('/api/automation/rules', async ({ response, context }) => sendJson(response, 200, { rules: await automation.rules.list(owner(context), {}) }));
    router.post('/api/automation/rules', async ({ request, response, context }) => sendJson(response, 201, await automation.rules.put(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.post('/api/automation/rules/remove', async ({ request, response, context }) => { const body = await readJsonBody(request); sendJson(response, 200, { removed: await automation.rules.remove(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 })) }); });
    router.get('/api/automation/notifications', async ({ response, context }) => sendJson(response, 200, { notifications: await automation.notifications.list(owner(context), { unread: query(context, 'unread'), severity: query(context, 'severity'), limit: query(context, 'limit') }) }));
    router.post('/api/automation/notifications/read', async ({ request, response, context }) => { const body = await readJsonBody(request); const item = await automation.notifications.markRead(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body.read !== false); if (!item)
        return notFound(response, 'Notification'); sendJson(response, 200, item); });
    router.post('/api/automation/scheduler/tick', async ({ request, response, context }) => { const body = await readJsonBody(request).catch(() => ({})); sendJson(response, 200, await automation.scheduler.tick(owner(context), body.now || new Date())); });
    router.get('/api/automation/audit', async ({ response, context }) => sendJson(response, 200, { entries: await automation.audit.list(owner(context), { resourceType: query(context, 'resourceType'), resourceId: query(context, 'resourceId'), limit: query(context, 'limit') }), verification: await automation.audit.verify(owner(context)) }));
    router.post('/api/automation/export', async ({ request, response, context }) => { const body = await readJsonBody(request); const type = String(body.type || 'workflows').toLowerCase(); const format = String(body.format || 'json').toLowerCase(); const items = type === 'runs' ? await automation.runs.list(owner(context), { limit: 1000 }) : await automation.workflows.list(owner(context)); if (format === 'csv') {
        response.statusCode = 200;
        response.setHeader('content-type', 'text/csv; charset=utf-8');
        response.end(type === 'runs' ? automation.exporter.runsCsv(items) : automation.exporter.workflowsCsv(items));
        return;
    } sendJson(response, 200, { type, items }); });
}
