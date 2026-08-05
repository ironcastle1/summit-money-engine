import test from 'node:test';
import assert from 'node:assert/strict';
import { controlAssessment, evidenceRecord, complianceScore, mappingsForControl, frameworkReport, exceptionRecord } from '../../src/security-compliance/index.js';

test('control assessments combine design, operation and evidence scores', () => {
  const assessment = controlAssessment({ controlId: 'IAM-02', designScore: 90, operationScore: 80, evidenceScore: 100, evidenceIds: ['e'] });
  assert.equal(assessment.state, 'IMPLEMENTED');
  assert.ok(assessment.score >= 85);
});

test('compliance score accounts for evidence and critical findings', () => {
  const evidence = evidenceRecord({ id: 'e', controlId: 'IAM-02', title: 'MFA report', source: 'SYSTEM' });
  const assessment = controlAssessment({ controlId: 'IAM-02', designScore: 100, operationScore: 100, evidenceScore: 100, evidenceIds: ['e'] });
  const score = complianceScore({ assessments: [assessment], evidence: [evidence], findings: [{ severity: 'CRITICAL', state: 'OPEN' }] });
  assert.equal(score.score, 92);
});

test('framework mappings and reports preserve control evidence', () => {
  assert.ok(mappingsForControl('IAM-02').some(item => item.startsWith('ISO27001')));
  const report = frameworkReport('ISO27001', { assessments: [controlAssessment({ controlId: 'IAM-02', designScore: 90, operationScore: 90, evidenceScore: 90, evidenceIds: ['e'] })] });
  assert.ok(report.rows.some(row => row.controlId === 'IAM-02' && row.evidenceIds.includes('e')));
  assert.throws(() => exceptionRecord({ controlId: 'IAM-02' }), /justification/);
});
