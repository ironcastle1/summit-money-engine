import { escapeSecurity, stateClass } from './format.js';

export function accessPanelHtml(snapshot = {}) {
  const reviews = snapshot.accessReviews || [];
  const identity = snapshot.identity || {};
  return `<section class="security-panel"><header><h2>ACCESS GOVERNANCE</h2><button data-security-action="test-access">TEST ACCESS</button></header>
    <div class="security-mini-grid"><article><span>SSO</span><b>${identity.sso?.enabled ? 'ENABLED' : 'DISABLED'}</b><small>${escapeSecurity(identity.sso?.protocol || 'LOCAL')}</small></article><article><span>ENCRYPTION</span><b>${identity.encryption?.compliant ? 'COMPLIANT' : 'REVIEW'}</b><small>TLS ${escapeSecurity(identity.encryption?.minimumTlsVersion || '--')}</small></article></div>
    <div class="security-list">${reviews.map(item => `<article><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span><div><b>${escapeSecurity(item.name)}</b><small>${item.assignments?.length || 0} assignments · due ${escapeSecurity(item.dueAt?.slice(0, 10) || '--')}</small></div></article>`).join('') || '<p>No access reviews.</p>'}</div></section>`;
}
