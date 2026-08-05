import { escapeSecurity, securityAge, stateClass } from './format.js';

export function incidentPanelHtml(snapshot = {}) {
  const incidents = snapshot.incidents || [];
  const vulnerabilities = [...(snapshot.vulnerabilities || [])].sort((a, b) => b.priority - a.priority);
  return `<section class="security-panel"><header><h2>SECURITY OPERATIONS</h2><button data-security-action="new-incident">DECLARE INCIDENT</button></header><div class="security-columns"><div><h3>INCIDENTS</h3>${incidents.map(item => `<article><span class="security-badge ${stateClass(item.severity)}">${escapeSecurity(item.severity)}</span><div><b>${escapeSecurity(item.title)}</b><small>${escapeSecurity(item.state)} · ${securityAge(item.declaredAt)}</small></div></article>`).join('') || '<p>No incidents.</p>'}</div><div><h3>VULNERABILITIES</h3>${vulnerabilities.slice(0, 20).map(item => `<article><span class="security-score">${item.priority}</span><div><b>${escapeSecurity(item.cve || item.title)}</b><small>${escapeSecurity(item.severity)} · ${escapeSecurity(item.state)}</small></div></article>`).join('') || '<p>No vulnerabilities.</p>'}</div></div></section>`;
}
