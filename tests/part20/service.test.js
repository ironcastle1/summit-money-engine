import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCESSIBILITY_REQUIREMENTS } from '../../src/market-readiness/accessibility-policy.js';
import { createMarketReadinessPlatformService } from '../../src/services/market-readiness-platform-service.js';

test('platform catalog exposes Part 20 assets and acceptance inventory', () => {
  const service = createMarketReadinessPlatformService();
  const catalog = service.catalog();
  assert.equal(catalog.version, '20.20.0');
  assert.equal(catalog.devices.length, 6);
  assert.equal(catalog.themes.length, 6);
  assert.equal(catalog.journeys.length, 10);
});

test('platform records browser journeys and performance evidence', () => {
  const service = createMarketReadinessPlatformService();
  service.recordJourney({ journeyId: 'first-run', browser: 'chromium', device: 'desktop', status: 'PASS', durationMs: 900 });
  const performance = service.recordMetrics({ domNodes: 900, interactiveMs: 3000, layoutShift: 0.01 });
  assert.equal(performance.status, 'PASS');
  const snapshot = service.snapshot();
  assert.equal(snapshot.journeys.results.length, 1);
  assert.equal(snapshot.performance.status, 'PASS');
});

test('platform records accessibility and an approved release gate', () => {
  const service = createMarketReadinessPlatformService({ reliabilityStatus: 'PASS', securityStatus: 'PASS' });
  service.recordAccessibility(ACCESSIBILITY_REQUIREMENTS.map(item => ({ id: item.id, status: 'PASS' })));
  const gate = service.evaluateGate({ productTestsPassed: true, browserJourneyPassRate: 100, requiredViewportsPassed: true, accessibilityScore: 100, performanceStatus: 'PASS', securityPassed: true, offlineRecoveryPassed: true, criticalErrors: 0 });
  assert.equal(gate.status, 'APPROVED');
  assert.equal(service.snapshot().accessibility.score, 100);
});

test('platform exports JSON, CSV and Markdown reports', () => {
  const service = createMarketReadinessPlatformService();
  const json = service.export('json');
  const csv = service.export('csv');
  const markdown = service.export('markdown');
  assert.equal(json.extension, 'json');
  assert.match(csv.body, /section,status/);
  assert.equal(markdown.extension, 'md');
  assert.match(markdown.body, /Market-Readiness Report/);
});
