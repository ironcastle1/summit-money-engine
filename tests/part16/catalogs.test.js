import test from 'node:test';
import assert from 'node:assert/strict';
import { securityCatalog, SECURITY_CONTROLS, SECURITY_FRAMEWORKS, classificationRule, clearanceAllows, retentionSchedule, regionById } from '../../src/security-compliance/index.js';

test('security catalog exposes frameworks, controls and product capability', () => {
  const catalog = securityCatalog();
  assert.equal(catalog.platform, 'MERLIN_SECURITY_COMPLIANCE');
  assert.ok(SECURITY_CONTROLS.length >= 25);
  assert.ok(SECURITY_FRAMEWORKS.length >= 7);
  assert.ok(catalog.capabilities.includes('TAMPER_EVIDENT_AUDIT'));
});

test('classification, retention and residency catalogs enforce stable rules', () => {
  assert.equal(classificationRule('restricted').rank, 4);
  assert.equal(clearanceAllows('CONFIDENTIAL', 'RESTRICTED'), false);
  assert.equal(retentionSchedule('AUDIT_LOGS').minimumDays, 365);
  assert.equal(regionById('UK').name, 'United Kingdom');
});
