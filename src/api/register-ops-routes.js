import { createHash } from 'node:crypto';
import { readJsonBody } from '../http/body.js';
import { sendJson, sendText } from '../http/response.js';

function ipHash(ip, secret) {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex').slice(0, 24);
}

export function registerOpsRoutes(router, services) {
  router.get('/api/ops/live', async ({ response }) => sendJson(response, 200, { live: true, time: new Date().toISOString() }, { cacheControl: 'no-store' }));

  router.get('/api/ops/ready', async ({ response }) => {
    const health = services.health.snapshot();
    sendJson(response, health.ready ? 200 : 503, health, { cacheControl: 'no-store' });
  });

  router.get('/api/ops/health', async ({ response }) => sendJson(response, 200, services.health.snapshot(), { cacheControl: 'no-store' }));
  router.get('/api/ops/quality', async ({ response }) => sendJson(response, 200, services.dataQuality.snapshot(), { cacheControl: 'no-store' }));
  router.get('/api/ops/build', async ({ response }) => sendJson(response, 200, await services.buildInfo.snapshot(), { cacheControl: 'public, max-age=60' }));
  router.get('/api/ops/startup', async ({ response }) => sendJson(response, services.startupDiagnostics?.ready === false ? 503 : 200, services.startupDiagnostics || { ready: true, status: 'NOT_RECORDED' }, { cacheControl: 'no-store' }));
  router.get('/api/ops/metrics', async ({ response, context }) => {
    if (context.query.get('format') === 'prometheus') {
      sendText(response, 200, services.metrics.prometheus(), 'text/plain; version=0.0.4; charset=utf-8');
      return;
    }
    sendJson(response, 200, services.metrics.snapshot(), { cacheControl: 'no-store' });
  });
  router.get('/api/ops/client-reports', async ({ response }) => sendJson(response, 200, services.clientReports.summary(), { cacheControl: 'no-store' }));

  router.post('/api/ops/client-report', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 32_000 });
    const report = services.clientReports.add(body, {
      userAgent: request.headers['user-agent'] || '',
      ipHash: ipHash(context.ip, services.config.accounts.sessionSecret)
    });
    services.metrics.increment('merlin_client_reports_total', { type: report.type, rating: report.rating });
    sendJson(response, 202, { accepted: true, id: report.id });
  });
}
