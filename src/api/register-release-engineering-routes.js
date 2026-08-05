import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
const owner = context => String(context?.user?.id || context?.session?.userId || 'anonymous');
const query = (context, key, fallback = '') => context?.query?.get(key) ?? fallback;
export function registerReleaseEngineeringRoutes(router, services) {
    const release = services.releaseEngineering;
    router.get('/api/release/catalog', async ({ response }) => sendJson(response, 200, release.catalog()));
    router.get('/api/release/diagnostics', async ({ response, context }) => sendJson(response, 200, await release.diagnostics(owner(context))));
    router.get('/api/release/snapshot', async ({ response, context }) => sendJson(response, 200, await release.snapshot(owner(context))));
    router.post('/api/release/seed', async ({ response, context }) => sendJson(response, 201, await release.seed(owner(context))));
    const resources = [['components', release.components], ['contracts', release.contracts], ['migrations', release.migrations], ['artifacts', release.artifacts], ['evidence', release.evidence], ['candidates', release.candidates], ['notes', release.notes]];
    for (const [path, store] of resources)
        router.get(`/api/release/${path}`, async ({ response, context }) => sendJson(response, 200, { items: await store.list(owner(context), { state: query(context, 'state'), type: query(context, 'type'), q: query(context, 'q'), limit: query(context, 'limit') }) }));
    router.post('/api/release/components', async ({ request, response, context }) => sendJson(response, 201, await release.addComponent(owner(context), await readJsonBody(request))));
    router.post('/api/release/contracts', async ({ request, response, context }) => sendJson(response, 201, await release.addContract(owner(context), await readJsonBody(request))));
    router.post('/api/release/migrations', async ({ request, response, context }) => sendJson(response, 201, await release.addMigration(owner(context), await readJsonBody(request))));
    router.post('/api/release/artifacts', async ({ request, response, context }) => sendJson(response, 201, await release.addArtifact(owner(context), await readJsonBody(request))));
    router.post('/api/release/evidence', async ({ request, response, context }) => sendJson(response, 201, await release.addEvidence(owner(context), await readJsonBody(request))));
    router.post('/api/release/candidates', async ({ request, response, context }) => sendJson(response, 201, await release.addCandidate(owner(context), await readJsonBody(request))));
    router.post('/api/release/notes', async ({ request, response, context }) => sendJson(response, 201, await release.addNotes(owner(context), await readJsonBody(request))));
    router.post('/api/release/version/evaluate', async ({ request, response }) => sendJson(response, 200, release.version(await readJsonBody(request))));
    router.post('/api/release/environment/evaluate', async ({ request, response }) => sendJson(response, 200, release.environment(await readJsonBody(request))));
    router.post('/api/release/connectors/evaluate', async ({ request, response }) => sendJson(response, 200, release.connectors(await readJsonBody(request))));
    router.post('/api/release/sources/evaluate', async ({ request, response }) => sendJson(response, 200, release.sources(await readJsonBody(request))));
    router.post('/api/release/migrations/plan', async ({ request, response }) => sendJson(response, 200, release.migrationsPlan(await readJsonBody(request))));
    router.post('/api/release/migrations/run', async ({ request, response }) => sendJson(response, 200, release.migrationExecution(await readJsonBody(request))));
    router.post('/api/release/contracts/diff', async ({ request, response }) => sendJson(response, 200, release.contractsDiff(await readJsonBody(request))));
    router.post('/api/release/performance/evaluate', async ({ request, response }) => sendJson(response, 200, release.budgets(await readJsonBody(request))));
    router.post('/api/release/checklist/evaluate', async ({ request, response }) => sendJson(response, 200, release.checklist(await readJsonBody(request))));
    router.post('/api/release/upgrade/plan', async ({ request, response }) => sendJson(response, 200, release.upgrade(await readJsonBody(request))));
    router.post('/api/release/rollback/plan', async ({ request, response }) => sendJson(response, 200, release.rollback(await readJsonBody(request))));
    router.post('/api/release/acceptance/evaluate', async ({ request, response }) => sendJson(response, 200, release.acceptance(await readJsonBody(request))));
    router.post('/api/release/package-report', async ({ request, response, context }) => sendJson(response, 200, await release.packageReport(owner(context), await readJsonBody(request))));
    router.post('/api/release/export', async ({ request, response, context }) => { const output = await release.export(owner(context), await readJsonBody(request)); response.statusCode = 200; response.setHeader('content-type', output.contentType); response.setHeader('content-disposition', `attachment; filename="merlin-release.${output.extension}"`); response.end(output.body); });
}
