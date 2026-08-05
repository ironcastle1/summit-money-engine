import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAuditEvent, verifyAuditChain, apiKeyRecord, apiKeyState, secretRecord, keyRotationStatus } from '../../src/security-compliance/index.js';

test('audit chain detects tampering', () => {
  let chain = appendAuditEvent([], { actorId: 'u', action: 'LOGIN', resourceType: 'ACCOUNT', resourceId: 'u' });
  chain = appendAuditEvent(chain, { actorId: 'u', action: 'READ', resourceType: 'REPORT', resourceId: 'r' });
  assert.equal(verifyAuditChain(chain).valid, true);
  const tampered = [...chain];
  tampered[0] = { ...tampered[0], action: 'DELETE' };
  assert.equal(verifyAuditChain(tampered).valid, false);
});

test('API keys store hashes rather than plaintext secrets', () => {
  const record = apiKeyRecord({ name: 'Integration', secret: 'very-secret-value', ttlDays: 10 });
  assert.equal('secret' in record, false);
  assert.equal(record.secretHash.length, 64);
  assert.equal(apiKeyState(record), 'ACTIVE');
});

test('secret inventory exposes rotation deadlines', () => {
  const record = secretRecord({ name: 'Signing key', rotationDays: 30, lastRotatedAt: new Date(Date.now() - 31 * 86400000).toISOString() });
  assert.equal(keyRotationStatus(record).state, 'OVERDUE');
});
