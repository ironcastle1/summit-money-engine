import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('market intelligence API exposes complete operating routes', async () => {
  const source = await readFile(new URL('../../src/api/register-market-intelligence-routes.js', import.meta.url), 'utf8');
  for (const route of ['/api/market-intelligence/catalog', '/api/market-intelligence/snapshot', '/api/market-intelligence/screen', '/api/market-intelligence/screens', '/api/market-intelligence/watchlist', '/api/market-intelligence/alerts', '/api/market-intelligence/portfolio', '/api/market-intelligence/scenario', '/api/market-intelligence/sensitivity', '/api/market-intelligence/export']) assert.match(source, new RegExp(route.replaceAll('/', '\\/')));
});
test('application registers market intelligence service and routes', async () => {
  const source = await readFile(new URL('../../src/app/create-application.js', import.meta.url), 'utf8');
  assert.match(source, /createMarketIntelligencePlatformService/);
  assert.match(source, /registerMarketIntelligenceRoutes/);
});
