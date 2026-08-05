import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
const owner = context => String(context?.user?.id || context?.session?.userId || 'anonymous');
const query = (context, key, fallback = '') => context?.query?.get(key) ?? fallback;
export function registerReliabilityOperationsRoutes(router, services) {
    const ops = services.reliabilityOperations;
    router.get('/api/operations/catalog', async ({ response }) => sendJson(response, 200, ops.catalog()));
    router.get('/api/operations/diagnostics', async ({ response, context }) => sendJson(response, 200, await ops.diagnostics(owner(context))));
    router.get('/api/operations/snapshot', async ({ response, context }) => sendJson(response, 200, await ops.snapshot(owner(context))));
    router.post('/api/operations/seed', async ({ request, response, context }) => sendJson(response, 201, await ops.seed(owner(context), await readJsonBody(request).catch(() => ({})))));
    const resources = [['services', ops.services], ['slos', ops.slos], ['measurements', ops.measurements], ['incidents', ops.incidents], ['releases', ops.releases], ['deployments', ops.deployments], ['queues', ops.queues], ['jobs', ops.jobs], ['backup-policies', ops.backupPolicies], ['backups', ops.backups], ['restore-tests', ops.restoreTests], ['maintenance', ops.maintenance], ['risks', ops.risks], ['synthetics', ops.syntheticChecks], ['logs', ops.logs], ['metrics', ops.metricSamples], ['traces', ops.traces]];
    for (const [path, store] of resources)
        router.get(`/api/operations/${path}`, async ({ response, context }) => sendJson(response, 200, { items: await store.list(owner(context), { serviceId: query(context, 'serviceId'), state: query(context, 'state'), severity: query(context, 'severity'), q: query(context, 'q'), limit: query(context, 'limit') }) }));
    router.post('/api/operations/services', async ({ request, response, context }) => sendJson(response, 201, await ops.createService(owner(context), await readJsonBody(request))));
    router.post('/api/operations/slos', async ({ request, response, context }) => sendJson(response, 201, await ops.createSlo(owner(context), await readJsonBody(request))));
    router.post('/api/operations/measurements', async ({ request, response, context }) => sendJson(response, 201, await ops.recordMeasurement(owner(context), await readJsonBody(request))));
    router.post('/api/operations/synthetics', async ({ request, response, context }) => sendJson(response, 201, await ops.recordSynthetic(owner(context), await readJsonBody(request))));
    router.post('/api/operations/incidents', async ({ request, response, context }) => sendJson(response, 201, await ops.createIncident(owner(context), await readJsonBody(request))));
    router.post('/api/operations/incidents/timeline', async ({ request, response, context }) => sendJson(response, 201, await ops.addTimeline(owner(context), await readJsonBody(request))));
    router.post('/api/operations/releases', async ({ request, response, context }) => sendJson(response, 201, await ops.createRelease(owner(context), await readJsonBody(request))));
    router.post('/api/operations/deployments', async ({ request, response, context }) => sendJson(response, 201, await ops.createDeployment(owner(context), await readJsonBody(request))));
    router.post('/api/operations/queues', async ({ request, response, context }) => sendJson(response, 201, await ops.createQueue(owner(context), await readJsonBody(request))));
    router.post('/api/operations/jobs', async ({ request, response, context }) => sendJson(response, 201, await ops.createJob(owner(context), await readJsonBody(request))));
    router.post('/api/operations/backup-policies', async ({ request, response, context }) => sendJson(response, 201, await ops.createBackupPolicy(owner(context), await readJsonBody(request))));
    router.post('/api/operations/backups', async ({ request, response, context }) => sendJson(response, 201, await ops.createBackup(owner(context), await readJsonBody(request))));
    router.post('/api/operations/restore-tests', async ({ request, response, context }) => sendJson(response, 201, await ops.createRestoreTest(owner(context), await readJsonBody(request))));
    router.post('/api/operations/maintenance', async ({ request, response, context }) => sendJson(response, 201, await ops.createMaintenance(owner(context), await readJsonBody(request))));
    router.post('/api/operations/risks', async ({ request, response, context }) => sendJson(response, 201, await ops.createRisk(owner(context), await readJsonBody(request))));
    router.post('/api/operations/logs', async ({ request, response, context }) => sendJson(response, 201, await ops.addLog(owner(context), await readJsonBody(request))));
    router.post('/api/operations/metrics', async ({ request, response, context }) => sendJson(response, 201, await ops.addMetric(owner(context), await readJsonBody(request))));
    router.post('/api/operations/traces', async ({ request, response, context }) => sendJson(response, 201, await ops.addTrace(owner(context), await readJsonBody(request))));
    router.post('/api/operations/canary/evaluate', async ({ request, response }) => sendJson(response, 200, ops.canary(await readJsonBody(request))));
    router.post('/api/operations/rollback/evaluate', async ({ request, response }) => sendJson(response, 200, ops.rollback(await readJsonBody(request))));
    router.post('/api/operations/capacity/recommend', async ({ request, response }) => sendJson(response, 200, ops.capacity(await readJsonBody(request))));
    router.post('/api/operations/configuration/drift', async ({ request, response }) => sendJson(response, 200, ops.drift(await readJsonBody(request))));
    router.post('/api/operations/recovery/assess', async ({ request, response }) => sendJson(response, 200, ops.recovery(await readJsonBody(request))));
    router.post('/api/operations/export', async ({ request, response, context }) => { const output = await ops.export(owner(context), await readJsonBody(request)); response.statusCode = 200; response.setHeader('content-type', output.contentType); response.setHeader('content-disposition', `attachment; filename="merlin-operations.${output.extension}"`); response.end(output.body); });
}
