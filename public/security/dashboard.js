import { escapeSecurity, securityNumber, stateClass } from './format.js';

export function securityDashboardHtml(snapshot = {}) {
  const posture = snapshot.posture || {};
  const compliance = snapshot.compliance || {};
  const diagnostics = snapshot.diagnostics || {};
  const cards = [
    ['SECURITY POSTURE', `${securityNumber(posture.score)} / 100`, posture.band || 'UNKNOWN'],
    ['COMPLIANCE', `${securityNumber(compliance.score)} / 100`, compliance.band || 'UNKNOWN'],
    ['CRITICAL VULNS', diagnostics.criticalVulnerabilities || 0, 'Open'],
    ['SEV1 INCIDENTS', diagnostics.openSev1 || 0, 'Active'],
    ['EVIDENCE', snapshot.evidence?.length || 0, `${diagnostics.expiredEvidence || 0} expired`],
    ['AUDIT CHAIN', snapshot.auditVerification?.valid ? 'VALID' : 'FAILED', `${snapshot.auditVerification?.checked || 0} events`]
  ];
  return `<div class="security-scorecards">${cards.map(([label, value, note]) => `<article class="${stateClass(note)}"><span>${escapeSecurity(label)}</span><strong>${escapeSecurity(value)}</strong><small>${escapeSecurity(note)}</small></article>`).join('')}</div>`;
}
