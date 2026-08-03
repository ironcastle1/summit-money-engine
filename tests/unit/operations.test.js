import test from 'node:test';
import assert from 'node:assert/strict';
import { MetricsRegistry } from '../../src/observability/metrics-registry.js';
import { RequestMetrics } from '../../src/observability/request-metrics.js';
import { HealthEvaluator } from '../../src/observability/health-evaluator.js';
import { ClientReportStore } from '../../src/observability/client-report-store.js';
import { DataQualityService } from '../../src/quality/data-quality-service.js';
import { verifyRequestOrigin } from '../../src/security/origin-guard.js';

const healthRegistry = state => ({ health: () => ({ source: { state } }) });

test('metrics registry records counters gauges histograms and prometheus text', () => {
  const registry = new MetricsRegistry();
  registry.increment('merlin_requests_total', { method: 'GET' });
  registry.increment('merlin_requests_total', { method: 'GET' }, 2);
  registry.setGauge('merlin_active', 4);
  registry.observe('merlin_latency_ms', 25, { route: '/api/test' }, [10, 50, 100]);
  registry.observe('merlin_latency_ms', 75, { route: '/api/test' }, [10, 50, 100]);
  const snapshot = registry.snapshot();
  assert.equal(snapshot.counters[0].value, 3);
  assert.equal(snapshot.gauges[0].value, 4);
  assert.equal(snapshot.histograms[0].count, 2);
  assert.equal(snapshot.histograms[0].mean, 50);
  assert.match(registry.prometheus(), /merlin_latency_ms_bucket/);
});

test('request metrics records latency and status class once', async () => {
  const registry = new MetricsRegistry();
  const requests = new RequestMetrics({ metrics: registry, slowRequestMs: 0 });
  const complete = requests.begin({ method: 'GET', path: '/api/items/123456' });
  await new Promise(resolve => setTimeout(resolve, 2));
  complete(503);
  complete(200);
  const snapshot = registry.snapshot();
  assert.equal(snapshot.counters.find(item => item.name === 'merlin_http_requests_total').value, 1);
  assert.equal(snapshot.counters.find(item => item.name === 'merlin_http_errors_total').value, 1);
  assert.equal(snapshot.histograms.find(item => item.name === 'merlin_http_request_duration_ms').count, 1);
});

test('health evaluator reports degraded and unhealthy states numerically', () => {
  const runtime = { snapshot: () => ({ uptimeSeconds: 10, memoryMb: { heapUsed: 50, heapTotal: 100 }, eventLoopMs: { p95: 40 } }) };
  const degraded = new HealthEvaluator({ runtime, sourceGroups: () => ({ a: healthRegistry('NOT_CONFIGURED').health(), b: healthRegistry('LIVE').health() }) }).snapshot();
  assert.equal(degraded.ready, true);
  assert.equal(degraded.status, 'DEGRADED');
  const unhealthy = new HealthEvaluator({ runtime: { snapshot: () => ({ uptimeSeconds: 10, memoryMb: { heapUsed: 95, heapTotal: 100 }, eventLoopMs: { p95: 500 } }) }, sourceGroups: () => ({}) }).snapshot();
  assert.equal(unhealthy.ready, false);
  assert.equal(unhealthy.status, 'UNHEALTHY');
});

test('client reports are bounded and aggregate web vitals', () => {
  const store = new ClientReportStore({ maximum: 2 });
  store.add({ type: 'WEB_VITAL', name: 'LCP', value: 1200, rating: 'GOOD' });
  store.add({ type: 'WEB_VITAL', name: 'LCP', value: 3200, rating: 'NEEDS_IMPROVEMENT' });
  store.add({ type: 'ERROR', name: 'WINDOW_ERROR', message: 'x' });
  const summary = store.summary();
  assert.equal(summary.count, 2);
  assert.equal(summary.vitals.LCP.count, 1);
  assert.equal(summary.byType.ERROR, 1);
});

test('data quality distinguishes source state from catalog integrity', () => {
  const catalog = {
    intelligence: { listCountries: () => Array.from({ length: 225 }, (_, index) => ({ iso2: `X${index}`, lat: 0, lon: 0 })), listCities: () => Array.from({ length: 240 }, (_, index) => ({ id: index, lat: 0, lon: 0 })) },
    shipping: { listPorts: () => Array.from({ length: 70 }, (_, index) => ({ id: index, lat: 0, lon: 0 })), listChokepoints: () => Array.from({ length: 15 }, (_, index) => ({ id: index })), listRoutes: () => ({ features: Array.from({ length: 15 }, (_, index) => ({ id: index })) }) },
    market: { list: () => Array.from({ length: 10 }, (_, index) => ({ id: index })) }
  };
  const service = new DataQualityService({ registries: { events: healthRegistry('LIVE') }, catalogs: catalog, cache: { stats: () => ({ entries: 1 }) } });
  const snapshot = service.snapshot();
  assert.equal(snapshot.catalogs.score, 100);
  assert.equal(snapshot.sources.score, 100);
  assert.equal(snapshot.status, 'GOOD');
});

test('origin guard allows absent and same origin but rejects foreign origins', () => {
  assert.doesNotThrow(() => verifyRequestOrigin({ headers: { host: 'localhost:4173' } }, { method: 'POST', path: '/api/test' }, { protocol: 'http' }));
  assert.doesNotThrow(() => verifyRequestOrigin({ headers: { host: 'localhost:4173', origin: 'http://localhost:4173' } }, { method: 'POST', path: '/api/test' }, { protocol: 'http' }));
  assert.throws(() => verifyRequestOrigin({ headers: { host: 'localhost:4173', origin: 'https://evil.example' } }, { method: 'POST', path: '/api/test' }, { protocol: 'http' }), error => error.statusCode === 403);
});
