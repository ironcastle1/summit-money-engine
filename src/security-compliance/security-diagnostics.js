export function securityDiagnostics(snapshot = {}) {
  const audit = snapshot.auditVerification || { valid: true, checked: 0 };
  const criticalVulnerabilities = (snapshot.vulnerabilities || []).filter(item => item.state !== 'CLOSED' && item.severity === 'CRITICAL').length;
  const overdueReviews = (snapshot.accessReviews || []).filter(item => item.state !== 'COMPLETE' && item.dueAt && new Date(item.dueAt).getTime() < Date.now()).length;
  const expiredEvidence = (snapshot.evidence || []).filter(item => item.state === 'EXPIRED').length;
  const openSev1 = (snapshot.incidents || []).filter(item => item.severity === 'SEV1' && !['RESOLVED', 'CLOSED'].includes(item.state)).length;
  const status = !audit.valid || openSev1 || criticalVulnerabilities ? 'ACTION_REQUIRED' : overdueReviews || expiredEvidence ? 'ATTENTION' : 'READY';
  return Object.freeze({ status, audit, criticalVulnerabilities, overdueReviews, expiredEvidence, openSev1, generatedAt: new Date().toISOString() });
}
