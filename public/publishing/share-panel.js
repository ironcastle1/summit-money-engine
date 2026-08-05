import { escapePublishing, publishingAge } from './format.js';
export function renderSharePanel(root, shares = []) {
  root.innerHTML = `<section class="publishing-panel"><header><h2>SECURE SHARES</h2></header><div class="publishing-list">${shares.map(item => `<article class="publishing-row"><span>${item.revoked ? 'REVOKED' : 'ACTIVE'}</span><span><b>${escapePublishing(item.editionId)}</b><small>${escapePublishing(item.classification)} · ${item.views || 0} views</small></span><span>${publishingAge(item.issuedAt)}</span></article>`).join('') || '<p class="publishing-empty">No secure links created.</p>'}</div></section>`;
}
