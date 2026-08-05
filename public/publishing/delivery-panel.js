import { escapePublishing, publishingAge, stateClass } from './format.js';
export function renderDeliveryPanel(root, deliveries = []) {
  root.innerHTML = `<section class="publishing-panel"><header><h2>DELIVERY OPERATIONS</h2></header><div class="publishing-list">${deliveries.map(item => `<article class="publishing-row"><span class="publishing-state ${stateClass(item.state)}">${escapePublishing(item.state)}</span><span><b>${escapePublishing(item.editionId)}</b><small>${(item.recipients || []).length} recipients · ${(item.channels || []).join(', ')}</small></span><span>${publishingAge(item.updatedAt)}</span></article>`).join('') || '<p class="publishing-empty">No delivery jobs.</p>'}</div></section>`;
}
