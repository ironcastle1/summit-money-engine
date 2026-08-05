import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCESSIBILITY_REQUIREMENTS, summarizeAccessibility } from '../../src/market-readiness/accessibility-policy.js';

test('accessibility policy covers core WCAG-oriented controls', () => {
  assert.ok(ACCESSIBILITY_REQUIREMENTS.length >= 12);
  for (const id of ['keyboard-access', 'visible-focus', 'dialog-focus', 'control-names', 'reduced-motion', 'skip-link', 'zoom-reflow']) {
    assert.ok(ACCESSIBILITY_REQUIREMENTS.some(item => item.id === id));
  }
});

test('accessibility summary passes complete evidence', () => {
  const results = ACCESSIBILITY_REQUIREMENTS.map(item => ({ id: item.id, status: 'PASS', evidence: `checked:${item.id}` }));
  const summary = summarizeAccessibility(results);
  assert.equal(summary.status, 'PASS');
  assert.equal(summary.passed, ACCESSIBILITY_REQUIREMENTS.length);
  assert.equal(summary.failed, 0);
});

test('accessibility summary fails any explicit failure', () => {
  const summary = summarizeAccessibility([{ id: 'keyboard-access', status: 'FAIL', evidence: 'blocked control' }]);
  assert.equal(summary.status, 'FAIL');
  assert.equal(summary.failed, 1);
  assert.ok(summary.checks.some(check => check.status === 'NOT_TESTED'));
});
