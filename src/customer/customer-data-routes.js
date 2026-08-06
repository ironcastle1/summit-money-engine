import { sendJson } from '../http/response.js';

function integer(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, parsed));
}

export function registerCustomerDataRoutes(router, services) {
  router.get('/api/customer/snapshot', async ({ response, context }) => {
    const hours = integer(context.query.get('hours'), 12, 1, 24);
    const force = ['1', 'true', 'yes'].includes(String(context.query.get('force') || '').toLowerCase());
    const snapshot = await services.customerData.snapshot({ hours, force });
    sendJson(response, 200, snapshot, { cacheControl: 'no-store' });
  });

  router.get('/api/customer/status', async ({ response }) => {
    const snapshot = await services.customerData.snapshot({ hours: 12 });
    sendJson(response, 200, {
      status: snapshot.status,
      generatedAt: snapshot.generatedAt,
      newestAt: snapshot.newestAt,
      counts: snapshot.counts,
      sources: snapshot.sources
    }, { cacheControl: 'no-store' });
  });
}
