import { escapePublishing, stateClass } from './format.js';
export function renderPublicationTable(root, publications = [], query = '') {
  const q = String(query || '').toLowerCase();
  const rows = publications.filter(item => !q || JSON.stringify(item).toLowerCase().includes(q));
  root.innerHTML = `<section class="publishing-panel"><header><h2>PUBLICATION SERIES</h2><button type="button" data-action="new-publication">NEW SERIES</button></header><div class="publishing-list">${rows.map(item => `<button type="button" class="publishing-row" data-publication-id="${escapePublishing(item.id)}"><span class="publishing-state ${stateClass(item.state)}">${escapePublishing(item.state)}</span><span><b>${escapePublishing(item.name)}</b><small>${escapePublishing(`${item.cadence} · ${item.classification} · ${(item.audienceIds || []).length} audiences`)}</small></span><span>${escapePublishing(item.ownerTeam || '')}</span></button>`).join('') || '<p class="publishing-empty">No publication series match this filter.</p>'}</div></section>`;
}
