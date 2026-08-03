import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/core/logger.js';

let server;
let application;
let baseUrl;
const nativeFetch = globalThis.fetch;

test.before(async () => {
  globalThis.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return nativeFetch(input, init);
    return Promise.reject(Object.assign(new Error('External network disabled by test'), { code: 'TEST_NETWORK_DISABLED' }));
  };
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', PORT: '4179', HTTP_TIMEOUT_MS: '200' });
  application = await createApplication({ config, logger: createLogger({ level: 'fatal', service: 'fallback-test' }) });
  server = createServer(application.handle);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await application.close();
  globalThis.fetch = nativeFetch;
});

test('bundled event snapshot keeps map and radius metrics operational', async () => {
  const events = await fetch(`${baseUrl}/api/events?days=30&limit=25`).then(response => response.json());
  assert.ok(events.events.length > 0);
  assert.equal(events.sources.snapshot.state, 'ONLINE');
  const scan = await fetch(`${baseUrl}/api/scan?lat=51.5074&lon=-0.1278&radiusKm=250`).then(response => response.json());
  assert.equal(scan.metrics.estimateSupported, true);
  assert.ok(Number.isFinite(scan.metrics.eventProbability24h));
  assert.ok(Number.isFinite(scan.metrics.confidencePct));
});

test('news, shipping, places, and markets return usable fallback payloads', async () => {
  const [news, shipping, places, markets] = await Promise.all([
    fetch(`${baseUrl}/api/news?hours=168&limit=20`).then(response => response.json()),
    fetch(`${baseUrl}/api/shipping/snapshot?hours=48`).then(response => response.json()),
    fetch(`${baseUrl}/api/intelligence/overview?hours=168&limit=20`).then(response => response.json()),
    fetch(`${baseUrl}/api/markets/screener?timeframe=1h&assets=btc,eth,sol&limit=3`).then(response => response.json())
  ]);
  assert.ok(news.articles.length > 0);
  assert.ok(news.stories.length > 0);
  assert.equal(shipping.ports.length, 75);
  assert.equal(shipping.routes.length, 15);
  assert.ok(places.countries.length > 0);
  assert.equal(markets.results.length, 3);
  assert.ok(markets.results.every(item => Number.isFinite(item.quote?.price)));
});

test('browser fallback data is served and API traffic is excluded from the service worker', async () => {
  for (const name of ['fallback-events.json', 'fallback-news.json', 'fallback-market.json']) {
    const response = await fetch(`${baseUrl}/data/${name}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /json/);
  }
  const serviceWorker = await fetch(`${baseUrl}/sw.js`).then(response => response.text());
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)\) return/);
});
