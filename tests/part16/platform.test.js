import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecurityComplianceService } from '../../src/services/security-compliance-service.js';

function platform() { return createSecurityComplianceService(); }

test('platform seeds evidence-backed security operations', async () => {
  const service = platform();
  const snapshot = await service.seed('owner');
  assert.ok(snapshot.policies.length >= 1);
  assert.ok(snapshot.assessments.length >= 10);
  assert.equal(snapshot.auditVerification.valid, true);
  assert.ok(snapshot.posture.score > 0);
});

test('access decisions and audit events are integrated', async () => {
  const service = platform();
  await service.seed('owner');
  const result = await service.evaluateAccess('owner', { subject: { id: 'analyst', tenantId: 't', role: 'ANALYST', clearance: 'CONFIDENTIAL' }, resource: { id: 'r', tenantId: 't', classification: 'CONFIDENTIAL' }, permission: 'security:read', context: { mfaSatisfied: true } });
  assert.equal(result.decision, 'ALLOW');
  assert.equal((await service.snapshot('owner')).auditVerification.valid, true);
});

test('platform creates incidents, vulnerabilities and exports', async () => {
  const service = platform();
  await service.seed('owner');
  const incident = await service.createIncident('owner', { tenantId: 't', title: 'Security event', regulatedData: true, confidentialityImpact: 80 });
  assert.ok(incident.playbook.steps.length);
  const vulnerability = await service.createVulnerability('owner', { tenantId: 't', title: 'Critical issue', cvss: 9.8, exploitability: 100, assetCriticality: 90, exposure: 90, knownExploited: true });
  assert.equal(vulnerability.sla.targetDays, 3);
  assert.match((await service.export('owner', { format: 'SUMMARY' })).body, /MERLIN SECURITY/);
});
