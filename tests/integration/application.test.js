import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/core/logger.js';

let server;
let application;
let baseUrl;

test.before(async () => {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', PORT: '4173' });
  const logger = createLogger({ level: 'fatal', service: 'test' });
  application = await createApplication({ config, logger });
  server = createServer(application.handle);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await application.close();
});

test('health and config endpoints return structured data', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  const config = await fetch(`${baseUrl}/api/config`);
  const body = await config.json();
  assert.equal(config.status, 200);
  assert.ok(body.radiusOptionsKm.includes(250));
  assert.ok(body.eventCategories.includes('earthquake'));
  assert.ok(body.capabilities.includes('NEWS'));
  assert.ok(body.capabilities.includes('VERIFICATION'));
  assert.ok(body.capabilities.includes('SHIPPING'));
  assert.ok(body.capabilities.includes('TRADE_FLOWS'));
  assert.ok(body.capabilities.includes('COUNTRIES'));
  assert.ok(body.capabilities.includes('CRIME'));
  assert.ok(body.capabilities.includes('ELECTIONS'));
  assert.ok(body.capabilities.includes('ACCOUNTS'));
  assert.ok(body.capabilities.includes('SUBSCRIPTIONS'));
  assert.ok(body.capabilities.includes('BILLING'));
  assert.ok(body.capabilities.includes('USER_DATA'));
  assert.ok(body.capabilities.includes('ADMIN'));
});

test('static index and bundled client are served', async () => {
  const index = await fetch(`${baseUrl}/`);
  assert.equal(index.status, 200);
  const html = await index.text();
  assert.match(html, /SUMMIT/);
  assert.match(html, /app\.bundle\.js/);
  const app = await fetch(`${baseUrl}/app.bundle.js`);
  assert.equal(app.status, 200);
  assert.match(app.headers.get('content-type'), /javascript/);
  const bundle = await app.text();
  assert.match(bundle, /SUMMIT MONEY MAP CLIENT BUNDLE/);
  assert.doesNotMatch(bundle, /^\s*import\s/m);
});

test('news source endpoint reports configured and credential-gated adapters without fetching them', async () => {
  const response = await fetch(`${baseUrl}/api/news/sources`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.sources.gdelt);
  assert.ok(body.sources.rss);
  assert.ok(body.sources.bluesky);
  assert.equal(body.sources.x.state, 'NOT_CONFIGURED');
});


test('shipping catalog exposes separate static catalogue and source states', async () => {
  const response = await fetch(`${baseUrl}/api/shipping/catalog`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.summary.ports >= 70);
  assert.ok(body.summary.chokepoints >= 15);
  assert.ok(body.summary.routes >= 15);
  assert.ok(body.summary.commodities >= 10);
  assert.equal(body.geojson.ports.type, 'FeatureCollection');
  assert.equal(body.geojson.chokepoints.type, 'FeatureCollection');
  assert.equal(body.geojson.routes.type, 'FeatureCollection');
  assert.ok(body.sources['imf-portwatch']);
});

test('shipping source endpoint reports credential and endpoint gated adapters', async () => {
  const response = await fetch(`${baseUrl}/api/shipping/sources`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.sources['noaa-coops']);
  assert.ok(body.sources['un-comtrade']);
  assert.equal(body.sources['imf-portwatch'].state, 'NOT_CONFIGURED');
  assert.equal(body.sources.eia.state, 'NOT_CONFIGURED');
});

test('validation rejects invalid radius scans', async () => {
  const response = await fetch(`${baseUrl}/api/scan?lat=999&lon=0&radiusKm=250`);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.ok(body.error.requestId);
});

test('routes endpoint returns GeoJSON', async () => {
  const response = await fetch(`${baseUrl}/api/routes`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.type, 'FeatureCollection');
  assert.ok(body.features.length >= 10);
});


test('alert evaluation endpoint applies quantified rules', async () => {
  const response = await fetch(`${baseUrl}/api/alerts/evaluate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      rules: [{ id: 'r1', name: 'Score 70', scope: 'OPPORTUNITY', enabled: true, combinator: 'ALL', cooldownMinutes: 60, conditions: [{ field: 'score', operator: 'GTE', expected: 70 }] }],
      targets: [{ id: 't1', title: 'BTC rise', score: 78 }, { id: 't2', title: 'Low score', score: 42 }]
    })
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.matches.length, 1);
  assert.equal(body.matches[0].targetId, 't1');
});

test('alert evaluation rejects non-json request bodies', async () => {
  const response = await fetch(`${baseUrl}/api/alerts/evaluate`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'invalid' });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});


test('intelligence catalog exposes global country and city coverage', async () => {
  const response = await fetch(`${baseUrl}/api/intelligence/catalog?limit=1000`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.summary.countries >= 225);
  assert.ok(body.summary.cities >= 240);
  assert.ok(body.layers.includes('CONFLICT'));
  assert.ok(body.layers.includes('CRIME'));
  assert.ok(body.countries.some(country => country.iso2 === 'GB'));
  assert.ok(body.cities.some(city => city.name === 'London'));
});

test('intelligence source endpoint keeps credential-gated feeds explicit', async () => {
  const response = await fetch(`${baseUrl}/api/intelligence/sources`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.sources['world-bank']);
  assert.ok(body.sources['uk-police']);
  assert.equal(body.sources.reliefweb.state, 'NOT_CONFIGURED');
  assert.equal(body.sources['google-civic'].state, 'NOT_CONFIGURED');
});

test('intelligence endpoints validate coordinates and entity IDs', async () => {
  const invalid = await fetch(`${baseUrl}/api/intelligence/point?lat=999&lon=0`);
  assert.equal(invalid.status, 400);
  const missing = await fetch(`${baseUrl}/api/intelligence/country?id=ZZ`);
  assert.equal(missing.status, 404);
});
