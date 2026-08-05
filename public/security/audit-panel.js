import { escapeSecurity, securityAge } from './format.js';

export function auditPanelHtml(snapshot = {}) {
  const rows = [...(snapshot.audit || [])].reverse().slice(0, 40);
  return `<section class="security-panel"><header><h2>TAMPER-EVIDENT AUDIT</h2><span>${snapshot.auditVerification?.valid ? 'CHAIN VALID' : 'CHAIN FAILURE'}</span></header><div class="security-list">${rows.map(item => `<article><span>${securityAge(item.at)}</span><div><b>${escapeSecurity(item.action)}</b><small>${escapeSecurity(item.actorId)} · ${escapeSecurity(item.resourceType)} ${escapeSecurity(item.resourceId)}</small></div><code>${escapeSecurity(item.hash?.slice(0, 12))}</code></article>`).join('') || '<p>No audit events.</p>'}</div></section>`;
}
