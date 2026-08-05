import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString, clampInteger } from '../core/validation.js';

function owner(context) {
  return String(context?.user?.id || context?.session?.userId || 'anonymous');
}

function commaList(value, maximum = 120) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, maximum);
}

export function registerMarketIntelligenceRoutes(router, services) {
  const markets = services.marketIntelligence;

  router.get('/api/market-intelligence/catalog', async ({ response }) => {
    sendJson(response, 200, markets.catalog(), { cacheControl: 'public, max-age=900' });
  });

  router.get('/api/market-intelligence/diagnostics', async ({ response }) => {
    sendJson(response, 200, markets.diagnostics());
  });

  router.get('/api/market-intelligence/snapshot', async ({ response, context }) => {
    sendJson(response, 200, await markets.snapshot({
      assetIds: commaList(context.query.get('assetIds')),
      timeframe: context.query.get('timeframe') || '1d',
      historyLimit: clampInteger(context.query.get('historyLimit'), 180, 20, 1000),
      maximumAssets: clampInteger(context.query.get('maximumAssets'), 30, 1, 120),
      includeEvents: String(context.query.get('includeEvents') || 'true').toLowerCase() !== 'false',
      includePredictions: String(context.query.get('includePredictions') || 'true').toLowerCase() !== 'false',
      force: String(context.query.get('force') || 'false').toLowerCase() === 'true'
    }), { cacheControl: 'no-store' });
  });

  router.post('/api/market-intelligence/snapshot', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 4_000_000 });
    sendJson(response, 200, await markets.snapshot(body));
  });

  router.post('/api/market-intelligence/screen', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 4_000_000 });
    sendJson(response, 200, await markets.screen(body));
  });

  router.get('/api/market-intelligence/screens', async ({ response, context }) => {
    sendJson(response, 200, { screens: await markets.screens.list(owner(context)), generatedAt: new Date().toISOString() });
  });

  router.post('/api/market-intelligence/screens', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 250_000 });
    sendJson(response, 201, await markets.screens.save(owner(context), body));
  });

  router.post('/api/market-intelligence/screens/remove', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 50_000 });
    sendJson(response, 200, { removed: await markets.screens.remove(owner(context), boundedString(body.id, 'id', { min: 2, max: 160 })) });
  });

  router.get('/api/market-intelligence/watchlist', async ({ response, context }) => {
    sendJson(response, 200, { watches: await markets.watchlist.list(owner(context)), generatedAt: new Date().toISOString() });
  });

  router.post('/api/market-intelligence/watchlist', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 150_000 });
    sendJson(response, 201, await markets.watchlist.add(owner(context), body));
  });

  router.post('/api/market-intelligence/watchlist/remove', async ({ request, response, context }) => {
    const body = await readJsonBody(request, { maximumBytes: 50_000 });
    sendJson(response, 200, { removed: await markets.watchlist.remove(owner(context), boundedString(body.id, 'id', { min: 1, max: 160 })) });
  });

  router.post('/api/market-intelligence/alerts', async ({ response, context }) => {
    sendJson(response, 200, { alerts: await markets.alerts(owner(context)), generatedAt: new Date().toISOString() });
  });

  router.post('/api/market-intelligence/portfolio', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 3_000_000 });
    sendJson(response, 200, await markets.portfolio(body));
  });

  router.post('/api/market-intelligence/scenario', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 3_000_000 });
    sendJson(response, 200, await markets.scenario(body));
  });

  router.post('/api/market-intelligence/sensitivity', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 3_000_000 });
    sendJson(response, 200, await markets.sensitivity(body));
  });

  router.post('/api/market-intelligence/export', async ({ request, response }) => {
    const body = await readJsonBody(request, { maximumBytes: 4_000_000 });
    const snapshot = body.snapshot || await markets.snapshot(body);
    const format = String(body.format || 'csv').toLowerCase();
    if (format === 'csv') {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/csv; charset=utf-8');
      response.end(markets.exporter.toCsv(snapshot.assets || []));
      return;
    }
    if (format === 'json') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(markets.exporter.toJson(snapshot));
      return;
    }
    sendJson(response, 200, markets.exporter.summary(snapshot));
  });
}
