import test from 'node:test';
import assert from 'node:assert/strict';
import { securityCsv, securityJson, securitySummary, frameworkReport, securityDiagnostics } from '../../src/security-compliance/index.js';

test('security exports produce machine-readable and executive formats', () => {
  assert.match(securityCsv([{ id: 'r1', title: 'Risk' }]), /"id","title"/);
  assert.equal(JSON.parse(securityJson({ ok: true })).ok, true);
  assert.match(securitySummary({ posture: { score: 80, band: 'MANAGED' }, compliance: { score: 75, band: 'MANAGED' } }), /Posture: 80/);
});

test('reports and diagnostics expose honest empty states', () => {
  const report = frameworkReport('ISO27001', { assessments: [] });
  assert.equal(report.assessed, 0);
  const diagnostics = securityDiagnostics({ auditVerification: { valid: true, checked: 0 }, vulnerabilities: [], accessReviews: [], evidence: [], incidents: [] });
  assert.equal(diagnostics.status, 'READY');
});
