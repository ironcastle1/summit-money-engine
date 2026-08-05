import test from 'node:test';
import assert from 'node:assert/strict';
import { createPerformanceBudget, evaluatePerformance } from '../../src/market-readiness/performance-budget.js';
import { calculateReadinessScore } from '../../src/market-readiness/readiness-score.js';

test('performance budget exposes practical browser limits', () => {
  const budget = createPerformanceBudget();
  assert.ok(budget.initialJavaScriptBytes >= 1_000_000);
  assert.ok(budget.domNodes >= 1_000);
  assert.ok(budget.visibleMarkers >= 1_000);
});

test('performance evaluator passes observations under budget', () => {
  const budget = createPerformanceBudget({ domNodes: 1000, interactiveMs: 5000 });
  const result = evaluatePerformance({ domNodes: 900, interactiveMs: 4200 }, budget);
  assert.equal(result.status, 'PASS');
  assert.equal(result.failed, 0);
  assert.equal(result.measured, 2);
});

test('performance evaluator blocks observations over budget', () => {
  const result = evaluatePerformance({ layoutShift: 0.4 });
  assert.equal(result.status, 'FAIL');
  assert.equal(result.failed, 1);
  assert.equal(result.checks.find(check => check.metric === 'layoutShift').status, 'FAIL');
});

test('unobserved performance metrics remain explicit', () => {
  const result = evaluatePerformance({});
  assert.equal(result.status, 'NOT_MEASURED');
  assert.ok(result.checks.every(check => check.status === 'NOT_MEASURED'));
});

test('readiness score becomes ready only at a high weighted score', () => {
  const ready = calculateReadinessScore({ browser: 100, responsive: 100, accessibility: 95, performance: 90, journeys: 100, reliability: 95, security: 100 });
  assert.equal(ready.status, 'READY');
  assert.ok(ready.score >= 90);
  const blocked = calculateReadinessScore({ browser: 50, responsive: 50, accessibility: 50, performance: 50, journeys: 50, reliability: 50, security: 50 });
  assert.equal(blocked.status, 'NOT_READY');
});
