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
    application = await createApplication({ config, logger: createLogger({ level: 'fatal', service: 'ops-test' }) });
    server = createServer(application.handle);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await application.close();
});
test('operations endpoints expose health quality build and metrics', async () => {
    const [healthResponse, qualityResponse, buildResponse, metricsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/ops/health`), fetch(`${baseUrl}/api/ops/quality`), fetch(`${baseUrl}/api/ops/build`), fetch(`${baseUrl}/api/ops/metrics`)
    ]);
    assert.equal(healthResponse.status, 200);
    assert.equal(qualityResponse.status, 200);
    assert.equal(buildResponse.status, 200);
    assert.equal(metricsResponse.status, 200);
    const health = await healthResponse.json();
    const quality = await qualityResponse.json();
    const build = await buildResponse.json();
    const metrics = await metricsResponse.json();
    assert.equal(typeof health.ready, 'boolean');
    assert.ok(Number.isFinite(quality.catalogs.score));
    assert.equal(build.version, '24.1.0-merlin');
    assert.ok(Array.isArray(metrics.counters));
});
test('prometheus metrics and PWA assets are served', async () => {
    const metrics = await fetch(`${baseUrl}/api/ops/metrics?format=prometheus`);
    assert.equal(metrics.status, 200);
    assert.match(metrics.headers.get('content-type'), /text\/plain/);
    assert.match(await metrics.text(), /merlin_http_requests_total/);
    const manifest = await fetch(`${baseUrl}/manifest.webmanifest`);
    assert.equal(manifest.status, 200);
    assert.match(manifest.headers.get('content-type'), /manifest/);
    const serviceWorker = await fetch(`${baseUrl}/sw.js`);
    assert.equal(serviceWorker.status, 200);
    assert.match(await serviceWorker.text(), /merlin-static-/);
});
test('static assets support etag validation and compression', async () => {
    const first = await fetch(`${baseUrl}/merlin.js`, { headers: { 'accept-encoding': 'gzip' } });
    assert.equal(first.status, 200);
    const etag = first.headers.get('etag');
    assert.ok(etag);
    const second = await fetch(`${baseUrl}/merlin.js`, { headers: { 'if-none-match': etag } });
    assert.equal(second.status, 304);
});
test('client telemetry accepts bounded reports', async () => {
    const response = await fetch(`${baseUrl}/api/ops/client-report`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'WEB_VITAL', name: 'LCP', value: 1900, rating: 'GOOD', route: '/' })
    });
    assert.equal(response.status, 202);
    const reports = await fetch(`${baseUrl}/api/ops/client-reports`).then(value => value.json());
    assert.equal(reports.byType.WEB_VITAL, 1);
    assert.equal(reports.vitals.LCP.count, 1);
});
test('foreign browser origins are rejected for state-changing routes', async () => {
    const response = await fetch(`${baseUrl}/api/alerts/evaluate`, {
        method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: JSON.stringify({ rules: [], targets: [] })
    });
    assert.equal(response.status, 403);
});
test('instant local datasets and vector map assets are production-served', async () => {
    const [mapResponse, newsResponse, shippingResponse, intelligenceResponse, marketsResponse, opportunitiesResponse, bundleResponse, mapEngineResponse] = await Promise.all([
        fetch(`${baseUrl}/assets/world-base.svg?v=18.0.0`),
        fetch(`${baseUrl}/data/preload-news.json`),
        fetch(`${baseUrl}/data/preload-shipping.json`),
        fetch(`${baseUrl}/data/preload-intelligence.json`),
        fetch(`${baseUrl}/data/preload-markets.json`),
        fetch(`${baseUrl}/data/preload-opportunities.json`),
        fetch(`${baseUrl}/merlin-v24.js?v=24.1.0`),
        fetch(`${baseUrl}/map-v20/map-engine.js?v=24.1.0`)
    ]);
    for (const response of [mapResponse, newsResponse, shippingResponse, intelligenceResponse, marketsResponse, opportunitiesResponse, bundleResponse, mapEngineResponse]) {
        assert.equal(response.status, 200);
    }
    assert.match(mapResponse.headers.get('content-type'), /svg/);
    const [news, shipping, intelligence, markets, opportunities, bundle, mapEngine] = await Promise.all([
        newsResponse.json(), shippingResponse.json(), intelligenceResponse.json(), marketsResponse.json(), opportunitiesResponse.json(), bundleResponse.text(), mapEngineResponse.text()
    ]);
    assert.ok(news.storyCount > 0);
    assert.ok(shipping.ports.length >= 70);
    assert.ok(shipping.routes.length >= 15);
    assert.ok(intelligence.countries.length >= 200);
    assert.ok(markets.results.some(item => Number.isFinite(Number(item.quote?.price))));
    assert.ok(opportunities.opportunities.length > 0);
    assert.match(bundle, /new MapEngineV20/);
    assert.match(bundle, /opportunityCard/);
    assert.match(mapEngine, /class MapEngineV20/);
    assert.doesNotMatch(mapEngine, /materialEarthquake/);
});
