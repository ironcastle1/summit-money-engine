import { escapeSecurity, stateClass } from './format.js';

export function riskPanelHtml(snapshot = {}) {
  const risks = [...(snapshot.risks || [])].sort((a, b) => b.residual - a.residual);
  const vendors = [...(snapshot.vendors || [])].sort((a, b) => b.residualRisk - a.residualRisk);
  return `<section class="security-panel"><header><h2>RISK AND THIRD PARTIES</h2><button data-security-action="new-risk">NEW RISK</button></header><div class="security-columns"><div><h3>RISK REGISTER</h3>${risks.map(item => `<article class="security-risk"><span>${item.residual}</span><div><b>${escapeSecurity(item.title)}</b><small>${escapeSecurity(item.band)} · ${escapeSecurity(item.state)}</small></div></article>`).join('') || '<p>No risks.</p>'}</div><div><h3>VENDORS</h3>${vendors.map(item => `<article class="security-risk"><span>${item.residualRisk}</span><div><b>${escapeSecurity(item.name)}</b><small>${escapeSecurity(item.criticality)} · ${escapeSecurity(item.state)}</small></div></article>`).join('') || '<p>No vendors.</p>'}</div></div></section>`;
}
