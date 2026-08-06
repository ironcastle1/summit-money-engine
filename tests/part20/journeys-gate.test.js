import test from 'node:test';
import assert from 'node:assert/strict';
import { CustomerJourneyService } from '../../src/market-readiness/journey-service.js';
import { evaluateMarketReadinessGate } from '../../src/market-readiness/release-gate.js';

test('journey service records evidence by journey, browser and device', () => {
  const service = new CustomerJourneyService({ clock: () => '2026-08-05T12:00:00.000Z' });
  const record = service.record({ journeyId: 'first-run', browser: 'chromium', device: 'desktop', status: 'PASS', durationMs: 1200, evidence: 'screenshot.png' });
  assert.equal(record.status, 'PASS');
  assert.equal(record.recordedAt, '2026-08-05T12:00:00.000Z');
  assert.equal(service.snapshot().passRate, 100);
});

test('journey service rejects unknown journeys', () => {
  const service = new CustomerJourneyService();
  assert.throws(() => service.record({ journeyId: 'invented' }), /Unknown customer journey/);
});

test('market-readiness gate approves complete evidence', () => {
  const gate = evaluateMarketReadinessGate({
    productTestsPassed: true,
    browserJourneyPassRate: 100,
    requiredViewportsPassed: true,
    accessibilityScore: 100,
    performanceStatus: 'PASS',
    securityPassed: true,
    offlineRecoveryPassed: true,
    criticalErrors: 0
  });
  assert.equal(gate.status, 'APPROVED');
  assert.deepEqual(gate.failed, []);
});

test('market-readiness gate identifies every blocking area', () => {
  const gate = evaluateMarketReadinessGate({ browserJourneyPassRate: 50, accessibilityScore: 40, criticalErrors: 2 });
  assert.equal(gate.status, 'BLOCKED');
  assert.ok(gate.failed.includes('product-tests'));
  assert.ok(gate.failed.includes('browser-journeys'));
  assert.ok(gate.failed.includes('no-critical-errors'));
});
