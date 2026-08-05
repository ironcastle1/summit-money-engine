import {
  readJsonBody
}
from '../http/body.js';
import {
  sendJson
}
from '../http/response.js';
import {
  boundedString
}
from '../core/validation.js';
function owner(context) {
  return String(context?.user?.id || context?.session?.userId || 'anonymous');
}
export function registerConflictIntelligenceRoutes(router,
services) {
  const conflict = services.conflictIntelligence;
  router.get('/api/conflict/catalog',
  async ({
    response
  }) => sendJson(response,
  200,
  conflict.catalog(),
  {
    cacheControl: 'public, max-age=900'
  }));
  router.get('/api/conflict/diagnostics',
  async ({
    response
  }) => sendJson(response,
  200,
  conflict.diagnostics()));
  router.get('/api/conflict/snapshot',
  async ({
    response,
    context
  }) => sendJson(response,
  200,
  await conflict.snapshot({
    hours: context.query.get('hours'),
    limit: context.query.get('limit'),
    minimumRisk: context.query.get('minimumRisk'),
    query: context.query.get('query'),
    country: context.query.get('country')
  }),
  {
    cacheControl: 'no-store'
  }));
  router.post('/api/conflict/snapshot',
  async ({
    request,
    response
  }) => sendJson(response,
  200,
  await conflict.snapshot(await readJsonBody(request,
  {
    maximumBytes: 5000000
  }))));
  router.get('/api/conflict/theatre/:id',
  async ({
    response,
    params,
    context
  }) => sendJson(response,
  200,
  await conflict.theatre(params.id,
  {
    hours: context.query.get('hours')
  })));
  router.post('/api/conflict/compare',
  async ({
    request,
    response
  }) => sendJson(response,
  200,
  await conflict.compare(await readJsonBody(request,
  {
    maximumBytes: 3000000
  }))));
  router.post('/api/conflict/scenario',
  async ({
    request,
    response
  }) => sendJson(response,
  200,
  await conflict.scenario(await readJsonBody(request,
  {
    maximumBytes: 3000000
  }))));
  router.get('/api/conflict/watchlist',
  async ({
    response,
    context
  }) => sendJson(response,
  200,
  {
    watches: await conflict.watchlist.list(owner(context)),
    generatedAt: new Date().toISOString()
  }));
  router.post('/api/conflict/watchlist',
  async ({
    request,
    response,
    context
  }) => sendJson(response,
  201,
  await conflict.watchlist.add(owner(context),
  await readJsonBody(request,
  {
    maximumBytes: 100000
  }))));
  router.post('/api/conflict/watchlist/remove',
  async ({
    request,
    response,
    context
  }) => {
    const body = await readJsonBody(request,
    {
      maximumBytes: 50000
    });
    sendJson(response,
    200,
    {
      removed: await conflict.watchlist.remove(owner(context),
      boundedString(body.id,
      'id',
      {
        min: 1,
        max: 160
      }))
    });
  });
  router.post('/api/conflict/alerts',
  async ({
    request,
    response,
    context
  }) => sendJson(response,
  200,
  {
    alerts: await conflict.alerts(owner(context),
    await readJsonBody(request,
    {
      maximumBytes: 3000000
    })),
    generatedAt: new Date().toISOString()
  }));
  router.post('/api/conflict/export',
  async ({
    request,
    response
  }) => {
    const body = await readJsonBody(request,
    {
      maximumBytes: 5000000
    }),
    snapshot = body.snapshot || await conflict.snapshot(body),
    format = String(body.format || 'csv').toLowerCase();
    if (format === 'csv') {
      response.statusCode = 200;
      response.setHeader('content-type',
      'text/csv; charset=utf-8');
      response.end(conflict.exporter.toCsv(snapshot.theatres));
      return;
    }
    if (format === 'json') {
      response.statusCode = 200;
      response.setHeader('content-type',
      'application/json; charset=utf-8');
      response.end(conflict.exporter.toJson(snapshot));
      return;
    }
    sendJson(response,
    200,
    conflict.exporter.summary(snapshot));
  });
}
