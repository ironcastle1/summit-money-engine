import test from 'node:test';
import assert from 'node:assert/strict';
import { dataInventoryRecord, legalHoldRecord, evaluateRetention, subjectRequestRecord, residencyDecision, vendorRiskRecord, processingAgreementStatus } from '../../src/security-compliance/index.js';

test('data inventory and legal holds prevent premature deletion', () => {
  const record = dataInventoryRecord({ id: 'd', tenantId: 't', name: 'Dataset', classification: 'CONFIDENTIAL', retentionScheduleId: 'CUSTOMER_DATA', createdAt: '2010-01-01T00:00:00.000Z' });
  const hold = legalHoldRecord({ id: 'h', tenantId: 't', matter: 'Litigation', recordIds: ['d'] });
  assert.equal(evaluateRetention(record, [hold]).reason, 'LEGAL_HOLD');
  assert.equal(evaluateRetention(record, []).eligibleForDeletion, true);
});

test('subject requests and residency decisions enforce governance deadlines', () => {
  const request = subjectRequestRecord({ subjectEmail: 'person@example.test', type: 'ACCESS', receivedAt: '2026-01-01T00:00:00.000Z' });
  assert.equal(request.dueAt.slice(0, 10), '2026-01-31');
  assert.equal(residencyDecision({ sourceRegion: 'UK', targetRegion: 'EEA', classification: 'CONFIDENTIAL' }).allowed, true);
  assert.equal(residencyDecision({ sourceRegion: 'UK', targetRegion: 'US', classification: 'RESTRICTED' }).allowed, false);
});

test('vendor residual risk and processing agreements remain evidence based', () => {
  const vendor = vendorRiskRecord({ name: 'Vendor', inherentRisk: 80, controlStrength: 80, regions: ['US'] });
  assert.ok(vendor.residualRisk < vendor.inherentRisk);
  const agreement = processingAgreementStatus({ vendorId: vendor.id, usesSubprocessors: true, internationalTransfer: true });
  assert.equal(agreement.compliant, false);
});
