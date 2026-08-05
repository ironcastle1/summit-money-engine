import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString } from '../core/validation.js';

function owner(context) {
  return String(context?.user?.id || context?.session?.userId || 'anonymous');
}

function query(context, key, fallback = '') {
  return context?.query?.get(key) ?? fallback;
}

function sendNotFound(response, resource) {
  sendJson(response, 404, { error: { code: 'NOT_FOUND', message: `${resource} not found` } });
}

export function registerDecisionSupportRoutes(router, services) {
  const decision = services.decisionSupport;

  router.get('/api/decision-support/catalog', async ({ response }) => {
    sendJson(response, 200, decision.catalog(), { cacheControl: 'public, max-age=900' });
  });

  router.get('/api/decision-support/diagnostics', async ({ response }) => {
    sendJson(response, 200, decision.diagnostics());
  });

  router.get('/api/decision-support/snapshot', async ({ response, context }) => {
    sendJson(response, 200, await decision.snapshot({
      owner: owner(context),
      hours: query(context, 'hours'),
      minimumPriority: query(context, 'minimumPriority'),
      domains: String(query(context, 'domains')).split(',').filter(Boolean),
      limit: query(context, 'limit')
    }), { cacheControl: 'no-store' });
  });

  router.post('/api/decision-support/snapshot', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 8_000_000 });
    sendJson(response, 200, await decision.snapshot({ ...body, owner: owner(context) }));
  });

  router.post('/api/decision-support/handover', async ({ request, response, context }) => {
    sendJson(response, 200, await decision.handover({ ...(await readJsonBody(request, { maximumBytes: 8_000_000 })), owner: owner(context) }));
  });

  router.post('/api/decision-support/report', async ({ request, response, context }) => {
    sendJson(response, 200, await decision.report({ ...(await readJsonBody(request, { maximumBytes: 8_000_000 })), owner: owner(context) }));
  });

  router.post('/api/decision-support/digest', async ({ request, response, context }) => {
    sendJson(response, 200, await decision.digest({ ...(await readJsonBody(request, { maximumBytes: 8_000_000 })), owner: owner(context) }));
  });

  router.get('/api/decision-support/workspaces', async ({ response, context }) => {
    sendJson(response, 200, { workspaces: await decision.workspaces.list(owner(context), { query: query(context, 'query'), tag: query(context, 'tag') }) });
  });

  router.post('/api/decision-support/workspaces', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.workspaces.put(ownerId, await readJsonBody(request, { maximumBytes: 1_000_000 }));
    decision.invalidate(ownerId);
    await decision.recordAudit(ownerId, { action: 'UPSERT', resourceType: 'WORKSPACE', resourceId: item.id, changes: item });
    sendJson(response, 201, item);
  });

  router.get('/api/decision-support/workspaces/:id', async ({ response, context, params }) => {
    const item = await decision.workspaces.get(owner(context), params.id);
    if (!item) return sendNotFound(response, 'Workspace');
    sendJson(response, 200, item);
  });

  router.post('/api/decision-support/workspaces/remove', async ({ request, response, context }) => {
    const body = await readJsonBody(request);
    const id = boundedString(body.id, 'id', { min: 1, max: 180 });
    const ownerId = owner(context);
    const removed = await decision.workspaces.remove(ownerId, id);
    decision.invalidate(ownerId);
    if (removed) await decision.recordAudit(ownerId, { action: 'REMOVED', resourceType: 'WORKSPACE', resourceId: id });
    sendJson(response, 200, { removed });
  });

  router.get('/api/decision-support/cases', async ({ response, context }) => {
    sendJson(response, 200, { cases: await decision.cases.list(owner(context), {
      status: query(context, 'status'),
      minimumPriority: query(context, 'minimumPriority'),
      query: query(context, 'query'),
      tag: query(context, 'tag')
    }) });
  });

  router.get('/api/decision-support/cases/:id', async ({ response, context, params }) => {
    const item = await decision.cases.get(owner(context), params.id);
    if (!item) return sendNotFound(response, 'Case');
    sendJson(response, 200, item);
  });

  router.post('/api/decision-support/cases', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.cases.put(ownerId, await readJsonBody(request, { maximumBytes: 1_000_000 }));
    decision.invalidate(ownerId);
    await decision.recordAudit(ownerId, { action: 'UPSERT', resourceType: 'CASE', resourceId: item.id, changes: { status: item.status, priority: item.priority } });
    sendJson(response, 201, item);
  });

  router.post('/api/decision-support/cases/transition', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 1_000_000 });
    const ownerId = owner(context);
    const item = await decision.cases.transition(ownerId, boundedString(body.id, 'id', { min: 1, max: 180 }), body.status, body);
    if (!item) return sendNotFound(response, 'Case');
    decision.invalidate(ownerId);
    await decision.recordAudit(ownerId, { action: 'TRANSITION', resourceType: 'CASE', resourceId: item.id, changes: { status: item.status } });
    sendJson(response, 200, item);
  });

  router.post('/api/decision-support/cases/remove', async ({ request, response, context }) => {
    const body = await readJsonBody(request);
    const id = boundedString(body.id, 'id', { min: 1, max: 180 });
    const ownerId = owner(context);
    const removed = await decision.cases.remove(ownerId, id);
    decision.invalidate(ownerId);
    if (removed) await decision.recordAudit(ownerId, { action: 'REMOVED', resourceType: 'CASE', resourceId: id });
    sendJson(response, 200, { removed });
  });

  router.get('/api/decision-support/notes', async ({ response, context }) => {
    sendJson(response, 200, { notes: await decision.activity.listNotes(owner(context), query(context, 'caseId'), { query: query(context, 'query'), pinned: query(context, 'pinned') === '' ? undefined : query(context, 'pinned') === 'true' }) });
  });

  router.post('/api/decision-support/notes', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.activity.putNote(ownerId, await readJsonBody(request, { maximumBytes: 500_000 }));
    if (item.caseId) await decision.cases.attach(ownerId, item.caseId, 'note', item.id);
    await decision.recordAudit(ownerId, { action: 'UPSERT', resourceType: 'NOTE', resourceId: item.id, metadata: { caseId: item.caseId } });
    sendJson(response, 201, item);
  });

  router.post('/api/decision-support/notes/remove', async ({ request, response, context }) => {
    const body = await readJsonBody(request);
    const id = boundedString(body.id, 'id', { min: 1, max: 180 });
    const ownerId = owner(context);
    const removed = await decision.activity.removeNote(ownerId, id);
    if (removed) await decision.recordAudit(ownerId, { action: 'REMOVED', resourceType: 'NOTE', resourceId: id });
    sendJson(response, 200, { removed });
  });

  router.get('/api/decision-support/tasks', async ({ response, context }) => {
    sendJson(response, 200, { tasks: await decision.activity.listTasks(owner(context), query(context, 'caseId'), {
      status: query(context, 'status'),
      assignedTo: query(context, 'assignedTo'),
      minimumPriority: query(context, 'minimumPriority')
    }) });
  });

  router.post('/api/decision-support/tasks', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.activity.putTask(ownerId, await readJsonBody(request, { maximumBytes: 500_000 }));
    if (item.caseId) await decision.cases.attach(ownerId, item.caseId, 'task', item.id);
    await decision.recordAudit(ownerId, { action: 'UPSERT', resourceType: 'TASK', resourceId: item.id, changes: { status: item.status, priority: item.priority } });
    sendJson(response, 201, item);
  });

  router.post('/api/decision-support/tasks/transition', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 500_000 });
    const ownerId = owner(context);
    const item = await decision.activity.transitionTask(ownerId, boundedString(body.id, 'id', { min: 1, max: 180 }), body.status, body);
    if (!item) return sendNotFound(response, 'Task');
    await decision.recordAudit(ownerId, { action: 'TRANSITION', resourceType: 'TASK', resourceId: item.id, changes: { status: item.status } });
    sendJson(response, 200, item);
  });

  router.get('/api/decision-support/decisions', async ({ response, context }) => {
    sendJson(response, 200, { decisions: await decision.decisions.list(owner(context), query(context, 'caseId'), { status: query(context, 'status'), owner: query(context, 'owner') }) });
  });

  router.post('/api/decision-support/decisions', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.decisions.put(ownerId, await readJsonBody(request, { maximumBytes: 1_000_000 }));
    if (item.caseId) await decision.cases.attach(ownerId, item.caseId, 'decision', item.id);
    await decision.recordAudit(ownerId, { action: 'UPSERT', resourceType: 'DECISION', resourceId: item.id, changes: { status: item.status } });
    sendJson(response, 201, item);
  });

  router.post('/api/decision-support/decisions/transition', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 1_000_000 });
    const ownerId = owner(context);
    const item = await decision.decisions.transition(ownerId, boundedString(body.id, 'id', { min: 1, max: 180 }), body.status, body);
    if (!item) return sendNotFound(response, 'Decision');
    await decision.recordAudit(ownerId, { action: 'TRANSITION', resourceType: 'DECISION', resourceId: item.id, changes: { status: item.status } });
    sendJson(response, 200, item);
  });

  router.get('/api/decision-support/slas', async ({ response, context }) => {
    sendJson(response, 200, { slas: await decision.slas.list(owner(context), { state: query(context, 'state'), health: query(context, 'health'), limit: query(context, 'limit') }), summary: await decision.slas.summary(owner(context)) });
  });

  router.post('/api/decision-support/slas', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.slas.create(ownerId, await readJsonBody(request, { maximumBytes: 500_000 }));
    await decision.recordAudit(ownerId, { action: 'CREATED', resourceType: 'SLA', resourceId: item.id, metadata: { signalId: item.signalId } });
    sendJson(response, 201, item);
  });

  router.post('/api/decision-support/slas/transition', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 500_000 });
    const ownerId = owner(context);
    const item = await decision.slas.transition(ownerId, boundedString(body.id, 'id', { min: 1, max: 180 }), body.state, body);
    if (!item) return sendNotFound(response, 'SLA');
    await decision.recordAudit(ownerId, { action: 'TRANSITION', resourceType: 'SLA', resourceId: item.id, changes: { state: item.state } });
    sendJson(response, 200, item);
  });

  router.get('/api/decision-support/schedules', async ({ response, context }) => {
    sendJson(response, 200, { schedules: await decision.schedules.list(owner(context), { type: query(context, 'type') }) });
  });

  router.post('/api/decision-support/schedules', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.schedules.put(ownerId, await readJsonBody(request, { maximumBytes: 500_000 }));
    await decision.recordAudit(ownerId, { action: 'UPSERT', resourceType: 'SCHEDULE', resourceId: item.id, changes: { enabled: item.enabled, time: item.time } });
    sendJson(response, 201, item);
  });

  router.get('/api/decision-support/schedules/due', async ({ response, context }) => {
    sendJson(response, 200, { schedules: await decision.schedules.due(owner(context), new Date(query(context, 'now') || Date.now())) });
  });

  router.post('/api/decision-support/schedules/remove', async ({ request, response, context }) => {
    const body = await readJsonBody(request);
    const id = boundedString(body.id, 'id', { min: 1, max: 180 });
    const ownerId = owner(context);
    const removed = await decision.schedules.remove(ownerId, id);
    if (removed) await decision.recordAudit(ownerId, { action: 'REMOVED', resourceType: 'SCHEDULE', resourceId: id });
    sendJson(response, 200, { removed });
  });

  router.get('/api/decision-support/approvals', async ({ response, context }) => {
    sendJson(response, 200, { approvals: await decision.approvals.list(owner(context), { state: query(context, 'state'), resourceType: query(context, 'resourceType'), assignedTo: query(context, 'assignedTo') }) });
  });

  router.post('/api/decision-support/approvals', async ({ request, response, context }) => {
    const ownerId = owner(context);
    const item = await decision.approvals.create(ownerId, await readJsonBody(request, { maximumBytes: 500_000 }));
    await decision.recordAudit(ownerId, { action: 'CREATED', resourceType: 'APPROVAL', resourceId: item.id, metadata: { target: item.resourceId } });
    sendJson(response, 201, item);
  });

  router.post('/api/decision-support/approvals/transition', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 500_000 });
    const ownerId = owner(context);
    const item = await decision.approvals.transition(ownerId, boundedString(body.id, 'id', { min: 1, max: 180 }), body.state, body);
    if (!item) return sendNotFound(response, 'Approval');
    await decision.recordAudit(ownerId, { action: 'TRANSITION', resourceType: 'APPROVAL', resourceId: item.id, changes: { state: item.state } });
    sendJson(response, 200, item);
  });

  router.get('/api/decision-support/audit', async ({ response, context }) => {
    sendJson(response, 200, { entries: await decision.audit.list(owner(context), { resourceType: query(context, 'resourceType'), resourceId: query(context, 'resourceId'), actor: query(context, 'actor'), limit: query(context, 'limit') }), verification: await decision.audit.verify(owner(context)) });
  });

  router.get('/api/decision-support/audit/verify', async ({ response, context }) => {
    sendJson(response, 200, await decision.audit.verify(owner(context)));
  });

  router.post('/api/decision-support/distribution/evaluate', async ({ request, response, context }) => {
    sendJson(response, 200, await decision.distribute({ ...(await readJsonBody(request, { maximumBytes: 8_000_000 })), owner: owner(context) }));
  });

  router.post('/api/decision-support/export', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 8_000_000 });
    const snapshot = body.snapshot || await decision.snapshot({ ...body, owner: owner(context) });
    const format = String(body.format || 'json').toLowerCase();
    if (format === 'csv') {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/csv; charset=utf-8');
      response.end(decision.exporter.signalsCsv(snapshot.signals));
      return;
    }
    const report = body.report || await decision.report({ ...body, snapshot, owner: owner(context) });
    if (format === 'markdown') {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/markdown; charset=utf-8');
      response.end(decision.exporter.reportMarkdown(report));
      return;
    }
    if (format === 'html') {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(decision.exporter.reportHtml(report));
      return;
    }
    response.statusCode = 200;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(decision.exporter.toJson(body.report ? report : snapshot));
  });
}
