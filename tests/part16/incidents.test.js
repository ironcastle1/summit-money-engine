import test from 'node:test';
import assert from 'node:assert/strict';
import { incidentRecord, breachClock, responsePlaybook, vulnerabilityRecord, remediationSla, securityPosture } from '../../src/security-compliance/index.js';

test('incident severity and breach clock prioritize regulated events', () => {
  const incident = incidentRecord({ id: 'i', title: 'Exposure', regulatedData: true, affectedUsers: 10000, confidentialityImpact: 90, activeThreat: true, declaredAt: new Date().toISOString() });
  assert.equal(incident.severity, 'SEV1');
  assert.equal(breachClock(incident).state, 'OPEN');
  assert.ok(responsePlaybook('DATA_EXPOSURE').steps.length >= 5);
});

test('vulnerability priority drives remediation SLA', () => {
  const vulnerability = vulnerabilityRecord({ id: 'v', title: 'Remote exploit', cvss: 9.8, exploitability: 100, assetCriticality: 100, exposure: 100, knownExploited: true, discoveredAt: new Date().toISOString() });
  assert.equal(vulnerability.severity, 'CRITICAL');
  assert.equal(remediationSla(vulnerability).targetDays, 3);
});

test('security posture penalizes critical unresolved issues', () => {
  const posture = securityPosture({ complianceScore: 90, accessScore: 90, vulnerabilityScore: 90, incidentReadiness: 90, dataGovernanceScore: 90, vendorScore: 90, criticalVulnerabilities: 2 });
  assert.equal(posture.score, 80);
});
