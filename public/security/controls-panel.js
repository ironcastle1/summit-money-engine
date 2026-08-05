import { escapeSecurity, securityNumber, stateClass } from './format.js';

export function controlsPanelHtml(snapshot = {}) {
  const assessments = [...(snapshot.assessments || [])].sort((a, b) => b.score - a.score);
  return `<section class="security-panel"><header><h2>CONTROL ASSURANCE</h2><button data-security-action="add-evidence">ADD EVIDENCE</button></header><div class="security-list">${assessments.slice(0, 30).map(item => `<article><span class="security-score">${securityNumber(item.score)}</span><div><b>${escapeSecurity(item.controlId)}</b><small>${escapeSecurity(item.state)} · ${item.evidenceIds?.length || 0} evidence items</small></div><span class="security-badge ${stateClass(item.state)}">${escapeSecurity(item.state)}</span></article>`).join('') || '<p>No controls assessed.</p>'}</div></section>`;
}
