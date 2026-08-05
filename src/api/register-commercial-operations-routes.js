import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString } from '../core/validation.js';
function owner(context) { return String(context?.user?.id || context?.session?.userId || 'anonymous'); }
function q(context, key, fallback = '') { return context?.query?.get(key) ?? fallback; }
function notFound(response, name) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: `${name} not found` } }); }
export function registerCommercialOperationsRoutes(router, services) {
    const commercial = services.commercial;
    router.get('/api/commercial/catalog', async ({ response }) => sendJson(response, 200, commercial.catalog()));
    router.get('/api/commercial/diagnostics', async ({ response, context }) => sendJson(response, 200, await commercial.diagnostics(owner(context))));
    router.get('/api/commercial/snapshot', async ({ response, context }) => sendJson(response, 200, await commercial.snapshot(owner(context))));
    router.post('/api/commercial/seed', async ({ request, response, context }) => sendJson(response, 201, await commercial.seed(owner(context), await readJsonBody(request).catch(() => ({})))));
    router.get('/api/commercial/tenants', async ({ response, context }) => sendJson(response, 200, { tenants: await commercial.tenants.list(owner(context), { state: q(context, 'state'), q: q(context, 'q'), limit: q(context, 'limit') }) }));
    router.get('/api/commercial/tenants/:id', async ({ response, context, params }) => { const item = await commercial.tenants.get(owner(context), params.id); if (!item)
        return notFound(response, 'Tenant'); sendJson(response, 200, item); });
    router.post('/api/commercial/tenants', async ({ request, response, context }) => sendJson(response, 201, await commercial.createTenant(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.get('/api/commercial/seats', async ({ response, context }) => sendJson(response, 200, { seats: await commercial.seats.list(owner(context), { tenantId: q(context, 'tenantId'), q: q(context, 'q'), limit: q(context, 'limit') }) }));
    router.post('/api/commercial/seats', async ({ request, response, context }) => sendJson(response, 201, await commercial.seats.put(owner(context), await readJsonBody(request, { maximumBytes: 500000 }))));
    router.post('/api/commercial/invitations', async ({ request, response, context }) => sendJson(response, 201, await commercial.inviteSeat(owner(context), await readJsonBody(request, { maximumBytes: 500000 }))));
    router.post('/api/commercial/invitations/accept', async ({ request, response, context }) => { const body = await readJsonBody(request); sendJson(response, 200, await commercial.acceptInvitation(owner(context), boundedString(body.token, 'token', { min: 8, max: 240 }), body)); });
    router.post('/api/commercial/onboarding/complete', async ({ request, response, context }) => { const body = await readJsonBody(request); sendJson(response, 200, await commercial.completeOnboarding(owner(context), boundedString(body.tenantId, 'tenantId', { min: 1, max: 190 }), boundedString(body.stepId, 'stepId', { min: 1, max: 100 }))); });
    router.get('/api/commercial/onboarding', async ({ response, context }) => sendJson(response, 200, await commercial.onboardingStatus(owner(context), boundedString(q(context, 'tenantId'), 'tenantId', { min: 1, max: 190 }))));
    router.post('/api/commercial/usage', async ({ request, response, context }) => sendJson(response, 201, await commercial.recordUsage(owner(context), await readJsonBody(request, { maximumBytes: 500000 }))));
    router.get('/api/commercial/usage', async ({ response, context }) => sendJson(response, 200, await commercial.usageSummary(owner(context), boundedString(q(context, 'tenantId'), 'tenantId', { min: 1, max: 190 }))));
    router.get('/api/commercial/health/:id', async ({ response, context, params }) => sendJson(response, 200, await commercial.customerHealth(owner(context), params.id)));
    router.get('/api/commercial/brief/:id', async ({ response, context, params }) => sendJson(response, 200, await commercial.accountBrief(owner(context), params.id)));
    router.post('/api/commercial/change-preview', async ({ request, response, context }) => sendJson(response, 200, await commercial.changePreview(owner(context), await readJsonBody(request))));
    router.get('/api/commercial/support', async ({ response, context }) => sendJson(response, 200, { cases: await commercial.supportQueue(owner(context), { tenantId: q(context, 'tenantId'), state: q(context, 'state'), q: q(context, 'q') }) }));
    router.post('/api/commercial/support', async ({ request, response, context }) => sendJson(response, 201, await commercial.openSupportCase(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
    router.post('/api/commercial/support/update', async ({ request, response, context }) => sendJson(response, 200, await commercial.updateSupportCase(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
    router.get('/api/commercial/status', async ({ response, context }) => sendJson(response, 200, await commercial.statusSummary(owner(context), Number(q(context, 'days', 30)))));
    router.post('/api/commercial/status/components', async ({ request, response, context }) => sendJson(response, 201, await commercial.statusComponents.put(owner(context), await readJsonBody(request))));
    router.post('/api/commercial/status/incidents', async ({ request, response, context }) => sendJson(response, 201, await commercial.createStatusIncident(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.post('/api/commercial/status/incidents/update', async ({ request, response, context }) => sendJson(response, 200, await commercial.updateStatusIncident(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.get('/api/commercial/features', async ({ response, context }) => sendJson(response, 200, { flags: await commercial.featureFlags.list(owner(context), { active: q(context, 'active') || undefined, q: q(context, 'q') }) }));
    router.post('/api/commercial/features', async ({ request, response, context }) => sendJson(response, 201, await commercial.featureFlags.put(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.post('/api/commercial/features/evaluate', async ({ request, response, context }) => sendJson(response, 200, await commercial.evaluateFeature(owner(context), await readJsonBody(request))));
    router.get('/api/commercial/releases', async ({ response, context }) => sendJson(response, 200, { releases: await commercial.releaseNotes.list(owner(context), { state: q(context, 'state'), q: q(context, 'q') }) }));
    router.post('/api/commercial/releases', async ({ request, response, context }) => sendJson(response, 201, await commercial.releaseNotes.put(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.get('/api/commercial/feedback', async ({ response, context }) => sendJson(response, 200, { feedback: await commercial.feedback.list(owner(context), { tenantId: q(context, 'tenantId'), type: q(context, 'type'), q: q(context, 'q') }) }));
    router.post('/api/commercial/feedback', async ({ request, response, context }) => sendJson(response, 201, await commercial.feedback.put(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.get('/api/commercial/success-plans', async ({ response, context }) => sendJson(response, 200, { plans: await commercial.successPlans.list(owner(context), { tenantId: q(context, 'tenantId'), state: q(context, 'state') }) }));
    router.post('/api/commercial/success-plans', async ({ request, response, context }) => sendJson(response, 201, await commercial.successPlans.put(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
    router.post('/api/commercial/export', async ({ request, response, context }) => { const body = await readJsonBody(request, { maximumBytes: 1000000 }); const output = await commercial.export(owner(context), body); response.statusCode = 200; response.setHeader('content-type', output.contentType); response.setHeader('content-disposition', `attachment; filename="merlin-commercial.${output.extension}"`); response.end(output.body); });
}
