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
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', PORT: '4179' });
  application = await createApplication({ config, logger: createLogger({ level: 'fatal', service: 'part20-test' }) });
  server = createServer(application.handle);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await application.close();
});

test('readiness catalog and onboarding endpoints are public and structured', async () => {
  const [catalogResponse, onboardingResponse] = await Promise.all([
    fetch(`${baseUrl}/api/readiness/catalog`),
    fetch(`${baseUrl}/api/readiness/onboarding?completed=welcome,search`)
  ]);
  assert.equal(catalogResponse.status, 200);
  assert.equal(onboardingResponse.status, 200);
  const catalog = await catalogResponse.json();
  const onboarding = await onboardingResponse.json();
  assert.equal(catalog.version, '20.20.0');
  assert.equal(catalog.devices.length, 6);
  assert.equal(catalog.themes.length, 6);
  assert.equal(onboarding.steps.filter(step => step.completed).length, 2);
});

test('readiness metrics and journey endpoints retain evidence', async () => {
  const journeyResponse = await fetch(`${baseUrl}/api/readiness/journeys`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ journeyId: 'map-investigation', browser: 'chromium', device: 'laptop', status: 'PASS', durationMs: 1800 })
  });
  assert.equal(journeyResponse.status, 201);
  const metricsResponse = await fetch(`${baseUrl}/api/readiness/metrics`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ domNodes: 1400, interactiveMs: 4300, layoutShift: 0.04 })
  });
  assert.equal(metricsResponse.status, 200);
  assert.equal((await metricsResponse.json()).status, 'PASS');
  const snapshot = await (await fetch(`${baseUrl}/api/readiness/snapshot`)).json();
  assert.ok(snapshot.journeys.results.some(item => item.journeyId === 'map-investigation'));
});

test('readiness gate and exports are exposed through HTTP', async () => {
  const gateResponse = await fetch(`${baseUrl}/api/readiness/gate`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ productTestsPassed: true, browserJourneyPassRate: 100, requiredViewportsPassed: true, accessibilityScore: 100, performanceStatus: 'PASS', securityPassed: true, offlineRecoveryPassed: true, criticalErrors: 0 })
  });
  assert.equal(gateResponse.status, 200);
  assert.equal((await gateResponse.json()).status, 'APPROVED');
  const exportResponse = await fetch(`${baseUrl}/api/readiness/export?format=csv`);
  assert.equal(exportResponse.status, 200);
  assert.match(exportResponse.headers.get('content-type'), /text\/csv/);
  assert.match(await exportResponse.text(), /section,status/);
});

test('demo endpoint is clearly marked and blocks operational actions', async () => {
  const response = await fetch(`${baseUrl}/api/readiness/demo`);
  assert.equal(response.status, 200);
  const demo = await response.json();
  assert.equal(demo.sample, true);
  assert.match(demo.notice, /DEMONSTRATION DATA/);
  assert.equal(demo.safeguards.canSendNotifications, false);
});
