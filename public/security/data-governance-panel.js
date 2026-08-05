import { escapeSecurity, stateClass } from './format.js';

export function dataGovernancePanelHtml(snapshot = {}) {
  const records = snapshot.governance?.records || [];
  const requests = snapshot.subjectRequests || [];
  return `<section class="security-panel"><header><h2>DATA GOVERNANCE</h2><span>${records.length} DATA SETS</span></header><div class="security-columns"><div><h3>INVENTORY AND RETENTION</h3>${records.map(item => `<article><span class="security-badge ${stateClass(item.retention.reason)}">${escapeSecurity(item.record.classification)}</span><div><b>${escapeSecurity(item.record.name)}</b><small>${escapeSecurity(item.record.region)} · delete after ${escapeSecurity(item.retention.deleteAfter?.slice(0, 10) || '--')}</small></div></article>`).join('') || '<p>No inventory records.</p>'}</div><div><h3>DATA SUBJECT REQUESTS</h3>${requests.map(item => `<article><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span><div><b>${escapeSecurity(item.type)}</b><small>${escapeSecurity(item.subjectEmail || item.subjectId)} · due ${escapeSecurity(item.dueAt?.slice(0, 10) || '--')}</small></div></article>`).join('') || '<p>No requests.</p>'}</div></div></section>`;
}
