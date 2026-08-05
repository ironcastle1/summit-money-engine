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
    assert.match(html, /MERLIN/);
    assert.match(html, /merlin\.js\?v=20\.20\.1/);
    const app = await fetch(`${baseUrl}/merlin.js`);
    assert.equal(app.status, 200);
    assert.match(app.headers.get('content-type'), /javascript/);
    const source = await app.text();
    assert.match(source, /import \{ MerlinTileMap \}/);
    assert.match(source, /updateMapData/);
    assert.match(source, /buildShippingMoney/);
    const engine = await fetch(`${baseUrl}/map-v20/map-engine.js`);
    assert.equal(engine.status, 200);
    assert.match(await engine.text(), /class MapEngineV20/);
    const world = await fetch(`${baseUrl}/assets/world-base.svg`);
    assert.equal(world.status, 200);
    assert.match(world.headers.get('content-type'), /svg/);
    assert.ok((await world.text()).includes('<svg'));
});
test('news source endpoint reports configured and credential-gated adapters without fetching them', async () => {
    const response = await fetch(`${baseUrl}/api/news/sources`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.sources.gdelt);
    assert.ok(body.sources.rss);
    assert.equal(body.sources.x, undefined);
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
test('logistics network and route planning endpoints operate on the map shipping graph', async () => {
    const networkResponse = await fetch(`${baseUrl}/api/logistics/network`);
    const network = await networkResponse.json();
    assert.equal(networkResponse.status, 200);
    assert.ok(network.nodeCount >= 90);
    assert.ok(network.edgeCount >= 150);
    assert.equal(network.vesselProfiles.length, 12);
    const planResponse = await fetch(`${baseUrl}/api/logistics/plan`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ originId: 'rotterdam', destinationId: 'shanghai', vesselClass: 'PANAMAX', cargoClass: 'CONTAINERS', policyId: 'BALANCED', cargoTonnes: 20000, maximumAlternatives: 3, hours: 24 })
    });
    const plan = await planResponse.json();
    assert.equal(planResponse.status, 200);
    assert.ok(plan.routes.length >= 1);
    assert.equal(plan.routes[0].recommended, true);
    assert.equal(plan.geojson.type, 'FeatureCollection');
    assert.ok(plan.routes[0].metrics.cost.totalUsd > 0);
});
test('conflict intelligence catalog and diagnostics are exposed', async () => {
    const catalogResponse = await fetch(`${baseUrl}/api/conflict/catalog`);
    const catalog = await catalogResponse.json();
    assert.equal(catalogResponse.status, 200);
    assert.ok(catalog.capabilities.includes('frontline-detection'));
    assert.ok(catalog.scenarios.some(item => item.id === 'CEASEFIRE'));
    const diagnosticsResponse = await fetch(`${baseUrl}/api/conflict/diagnostics`);
    const diagnostics = await diagnosticsResponse.json();
    assert.equal(diagnosticsResponse.status, 200);
    assert.equal(diagnostics.platform, 'MERLIN_CONFLICT_INTELLIGENCE');
});

test('public-first live data is registered without mandatory credentials', async () => {
    const [catalogResponse, statusResponse, configResponse] = await Promise.all([
        fetch(`${baseUrl}/api/live-data/catalog`),
        fetch(`${baseUrl}/api/live-data/status`),
        fetch(`${baseUrl}/api/config`)
    ]);
    assert.equal(catalogResponse.status, 200);
    assert.equal(statusResponse.status, 200);
    const catalog = await catalogResponse.json();
    const status = await statusResponse.json();
    const config = await configResponse.json();
    assert.equal(catalog.mode, 'PUBLIC_FIRST');
    assert.ok(catalog.coreKeyless >= 15);
    assert.ok(config.capabilities.includes('PUBLIC_FIRST_LIVE_DATA'));
    const required = Object.values(status.sources).filter(source => source.required);
    assert.ok(required.length >= 15);
    assert.equal(required.some(source => source.state === 'NOT_CONFIGURED'), false);
    assert.equal(status.sources.reliefweb.required, false);
    assert.equal(status.sources['global-ais'].access, 'COMMERCIAL_LICENSE');
});
