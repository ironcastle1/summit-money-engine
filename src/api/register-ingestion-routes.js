import { clampInteger } from '../core/validation.js';
import { sendJson } from '../http/response.js';

export function registerIngestionRoutes(router, services) {
  router.get('/api/data-platform/status', async ({ response }) => {
    sendJson(response, 200, services.ingestion.status(), { cacheControl: 'no-store' });
  });

  router.get('/api/data-platform/runs', async ({ response, context }) => {
    const limit = clampInteger(context.query.get('limit'), 25, 1, 100);
    sendJson(response, 200, { runs: services.ingestion.runs.list(limit), generatedAt: new Date().toISOString() });
  });

  router.get('/api/data-platform/provenance', async ({ response, context }) => {
    const limit = clampInteger(context.query.get('limit'), 100, 1, 500);
    const recordId = String(context.query.get('recordId') || '').slice(0, 160);
    const sourceId = String(context.query.get('sourceId') || '').slice(0, 64).toLowerCase();
    const entries = recordId ? services.ingestion.provenance.byRecord(recordId)
      : sourceId ? services.ingestion.provenance.bySource(sourceId, limit)
        : services.ingestion.provenance.list(limit);
    sendJson(response, 200, { entries, generatedAt: new Date().toISOString() });
  });

  router.get('/api/data-platform/dead-letters', async ({ response, context }) => {
    const limit = clampInteger(context.query.get('limit'), 100, 1, 500);
    const sourceId = String(context.query.get('sourceId') || '').slice(0, 64).toLowerCase();
    sendJson(response, 200, {
      entries: services.ingestion.deadLetters.list({ sourceId: sourceId || null, limit, includeResolved: context.query.get('resolved') === 'true' }),
      stats: services.ingestion.deadLetters.stats(),
      generatedAt: new Date().toISOString()
    });
  });

  router.get('/api/data-platform/checkpoints', async ({ response, context }) => {
    const sourceId = String(context.query.get('sourceId') || '').slice(0, 64).toLowerCase();
    sendJson(response, 200, { checkpoints: services.ingestion.checkpoints.list(sourceId || null), generatedAt: new Date().toISOString() });
  });

  router.post('/api/data-platform/refresh', async ({ response, context }) => {
    const sourceIds = String(context.query.get('sources') || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean).slice(0, 30);
    const run = await services.ingestion.ingest({ sourceIds: sourceIds.length ? sourceIds : undefined, force: true });
    sendJson(response, run.state === 'FAILED' ? 503 : 200, { ...run, records: undefined });
  });
}
