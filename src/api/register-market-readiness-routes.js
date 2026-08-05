import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';

export function registerMarketReadinessRoutes(router, services) {
  const readiness = services.marketReadiness;
  router.get('/api/readiness/catalog', async ({ response }) => sendJson(response, 200, readiness.catalog(), { cacheControl: 'public, max-age=3600' }));
  router.get('/api/readiness/snapshot', async ({ response }) => sendJson(response, 200, readiness.snapshot()));
  router.get('/api/readiness/onboarding', async ({ response, context }) => {
    const completed = String(context.query.get('completed') || '').split(',').filter(Boolean);
    sendJson(response, 200, readiness.onboarding(completed));
  });
  router.get('/api/readiness/demo', async ({ response }) => sendJson(response, 200, readiness.demo(), { cacheControl: 'public, max-age=600' }));
  router.get('/api/readiness/diagnostics', async ({ response }) => sendJson(response, 200, readiness.diagnostics()));
  router.post('/api/readiness/journeys', async ({ request, response }) => sendJson(response, 201, readiness.recordJourney(await readJsonBody(request))));
  router.post('/api/readiness/metrics', async ({ request, response }) => sendJson(response, 200, readiness.recordMetrics(await readJsonBody(request))));
  router.post('/api/readiness/accessibility', async ({ request, response }) => {
    const body = await readJsonBody(request);
    sendJson(response, 200, readiness.recordAccessibility(Array.isArray(body) ? body : body.results));
  });
  router.post('/api/readiness/gate', async ({ request, response }) => sendJson(response, 200, readiness.evaluateGate(await readJsonBody(request))));
  router.get('/api/readiness/export', async ({ response, context }) => {
    const output = readiness.export(String(context.query.get('format') || 'json').toLowerCase());
    response.statusCode = 200;
    response.setHeader('content-type', output.contentType);
    response.setHeader('content-disposition', `attachment; filename="merlin-readiness.${output.extension}"`);
    response.end(output.body);
  });
}
