import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString } from '../core/validation.js';

function owner(context) { return String(context?.user?.id || context?.session?.userId || 'anonymous'); }
function query(context, key, fallback = '') { return context?.query?.get(key) ?? fallback; }
function missing(response, name) { sendJson(response, 404, { error: { code: 'NOT_FOUND', message: `${name} not found` } }); }

export function registerPublishingRoutes(router, services) {
  const publishing = services.publishing;
  router.get('/api/publishing/catalog', async ({ response }) => sendJson(response, 200, publishing.catalog()));
  router.get('/api/publishing/diagnostics', async ({ response, context }) => sendJson(response, 200, await publishing.diagnostics(owner(context))));
  router.get('/api/publishing/snapshot', async ({ response, context }) => sendJson(response, 200, await publishing.snapshot(owner(context))));
  router.post('/api/publishing/seed', async ({ response, context }) => sendJson(response, 201, await publishing.seed(owner(context))));

  router.get('/api/publishing/publications', async ({ response, context }) => sendJson(response, 200, { publications: await publishing.publications.list(owner(context), { state: query(context, 'state'), q: query(context, 'q'), limit: query(context, 'limit') }) }));
  router.get('/api/publishing/publications/:id', async ({ response, context, params }) => { const item = await publishing.publications.get(owner(context), params.id); if (!item) return missing(response, 'Publication'); sendJson(response, 200, item); });
  router.post('/api/publishing/publications', async ({ request, response, context }) => sendJson(response, 201, await publishing.publications.put(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.post('/api/publishing/publications/transition', async ({ request, response, context }) => { const body = await readJsonBody(request); const item = await publishing.publications.transition(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body.state); if (!item) return missing(response, 'Publication'); sendJson(response, 200, item); });

  router.get('/api/publishing/editions', async ({ response, context }) => sendJson(response, 200, { editions: await publishing.editions.list(owner(context), { publicationId: query(context, 'publicationId'), state: query(context, 'state'), q: query(context, 'q'), limit: query(context, 'limit') }) }));
  router.get('/api/publishing/editions/:id', async ({ response, context, params }) => { const item = await publishing.editions.get(owner(context), params.id); if (!item) return missing(response, 'Edition'); sendJson(response, 200, item); });
  router.post('/api/publishing/editions', async ({ request, response, context }) => sendJson(response, 201, await publishing.generateEdition(owner(context), await readJsonBody(request, { maximumBytes: 12000000 }))));
  router.post('/api/publishing/editions/approve', async ({ request, response, context }) => { const body = await readJsonBody(request); const item = await publishing.approveEdition(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body); if (!item) return missing(response, 'Edition'); sendJson(response, 200, item); });
  router.post('/api/publishing/editions/publish', async ({ request, response, context }) => { const body = await readJsonBody(request); const item = await publishing.publishEdition(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body); if (!item) return missing(response, 'Edition'); sendJson(response, 200, item); });
  router.post('/api/publishing/editions/preview', async ({ request, response, context }) => { const body = await readJsonBody(request); const item = await publishing.preview(owner(context), boundedString(body.id, 'id', { min: 1, max: 190 }), body); if (!item) return missing(response, 'Edition'); sendJson(response, 200, item); });
  router.post('/api/publishing/editions/deliver', async ({ request, response, context }) => { const body = await readJsonBody(request, { maximumBytes: 5000000 }); const item = await publishing.deliverEdition(owner(context), body); if (!item) return missing(response, 'Edition'); sendJson(response, 200, item); });

  for (const [path, store] of [['templates', 'templates'], ['brand-kits', 'brandKits'], ['audiences', 'audiences'], ['subscribers', 'subscribers']]) {
    router.get(`/api/publishing/${path}`, async ({ response, context }) => sendJson(response, 200, { [path.replace('-', '')]: await publishing[store].list(owner(context), { q: query(context, 'q'), active: query(context, 'active') || undefined, limit: query(context, 'limit') }) }));
    router.post(`/api/publishing/${path}`, async ({ request, response, context }) => sendJson(response, 201, await publishing[store].put(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
  }

  router.get('/api/publishing/deliveries', async ({ response, context }) => sendJson(response, 200, { deliveries: await publishing.deliveries.list(owner(context), { state: query(context, 'state'), limit: query(context, 'limit') }) }));
  router.get('/api/publishing/analytics', async ({ response, context }) => sendJson(response, 200, { events: await publishing.analytics.list(owner(context), { editionId: query(context, 'editionId'), publicationId: query(context, 'publicationId'), type: query(context, 'type'), limit: query(context, 'limit') }), summary: await publishing.analytics.summary(owner(context), { editionId: query(context, 'editionId'), publicationId: query(context, 'publicationId') }) }));
  router.post('/api/publishing/analytics', async ({ request, response, context }) => sendJson(response, 201, await publishing.analytics.record(owner(context), await readJsonBody(request, { maximumBytes: 500000 }))));

  router.post('/api/publishing/share', async ({ request, response, context }) => { const item = await publishing.createShare(owner(context), await readJsonBody(request, { maximumBytes: 500000 })); if (!item) return missing(response, 'Edition'); sendJson(response, 201, item); });
  router.get('/api/publishing/shares', async ({ response, context }) => sendJson(response, 200, { shares: await publishing.listShares(owner(context)) }));
  router.post('/api/publishing/share/access', async ({ request, response }) => { const body = await readJsonBody(request, { maximumBytes: 500000 }); sendJson(response, 200, await publishing.accessShare(boundedString(body.token, 'token', { min: 10, max: 10000 }), body)); });
  router.post('/api/publishing/scheduler/tick', async ({ request, response, context }) => { const body = await readJsonBody(request).catch(() => ({})); sendJson(response, 200, await publishing.scheduler.tick(owner(context), body.now || new Date())); });

  router.post('/api/publishing/export', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 8000000 });
    const edition = await publishing.editions.get(owner(context), boundedString(body.editionId, 'editionId', { min: 1, max: 190 }));
    if (!edition) return missing(response, 'Edition');
    const publication = await publishing.publications.get(owner(context), edition.publicationId);
    const brand = await publishing.brandKits.get(owner(context), body.brandKitId || publication?.brandKitId);
    const output = publishing.exporter.render(edition, body.format || 'HTML', { brand });
    response.statusCode = 200;
    response.setHeader('content-type', output.contentType);
    response.setHeader('content-disposition', `attachment; filename="${edition.id}.${output.extension}"`);
    response.end(output.body);
  });
}
