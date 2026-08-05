import test from 'node:test';
import assert from 'node:assert/strict';
import { accessDecision, evaluatePermission, sessionRisk, mfaRequirement, segregationConflicts, orphanAccess } from '../../src/security-compliance/index.js';

test('permissions support wildcard grants and explicit denies', () => {
  assert.equal(evaluatePermission({ role: 'SECURITY_ADMIN', permission: 'security:write' }).allowed, true);
  assert.equal(evaluatePermission({ role: 'SECURITY_ADMIN', permission: 'security:write', deniedPermissions: ['security:write'] }).allowed, false);
});

test('access decision enforces tenant boundary, classification and step up', () => {
  const allowed = accessDecision({ subject: { tenantId: 'a', role: 'ANALYST', clearance: 'CONFIDENTIAL' }, resource: { tenantId: 'a', classification: 'CONFIDENTIAL' }, permission: 'security:read', context: { mfaSatisfied: true } });
  assert.equal(allowed.decision, 'ALLOW');
  const denied = accessDecision({ subject: { tenantId: 'a', role: 'ANALYST', clearance: 'INTERNAL' }, resource: { tenantId: 'b', classification: 'RESTRICTED' }, permission: 'security:read', context: {} });
  assert.equal(denied.decision, 'DENY');
});

test('session and governance checks identify elevated access risk', () => {
  assert.equal(sessionRisk({ impossibleTravel: true, newDevice: true }).band, 'HIGH');
  assert.equal(mfaRequirement({ role: 'OWNER', classification: 'RESTRICTED' }).phishingResistant, true);
  assert.equal(segregationConflicts([{ userId: 'u', role: 'DEVELOPER' }, { userId: 'u', role: 'PRODUCTION_APPROVER' }]).length, 1);
  assert.equal(orphanAccess([{ userId: 'gone', role: 'VIEWER' }], []).length, 1);
});
