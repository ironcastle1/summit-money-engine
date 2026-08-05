import { escapeSecurity, securityAge, stateClass } from './format.js';

export function evidencePanelHtml(snapshot = {}) {
  const evidence = snapshot.evidence || [];
  return `<section class="security-panel"><header><h2>EVIDENCE LEDGER</h2><span>${evidence.length} ITEMS</span></header><div class="security-list">${evidence.slice(0, 40).map(item => `<article><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span><div><b>${escapeSecurity(item.title)}</b><small>${escapeSecurity(item.controlId)} · ${escapeSecurity(item.source)} · ${securityAge(item.capturedAt)}</small></div></article>`).join('') || '<p>No evidence captured.</p>'}</div></section>`;
}
