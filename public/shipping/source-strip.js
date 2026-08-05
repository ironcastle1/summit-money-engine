import { escapeHtml } from '../ui/dom.js';

const PRIORITY = { ONLINE: 0, DEGRADED: 1, STARTING: 2, NOT_CONFIGURED: 3, OFFLINE: 4 };
export function renderShippingSources(root, sources = {}) {
  if (!root) return;
  const items = Object.values(sources).sort((a, b) => (PRIORITY[a.state] ?? 9) - (PRIORITY[b.state] ?? 9));
  root.innerHTML = items.map(source => `<span class="shipping-source state-${escapeHtml(String(source.state || 'OFFLINE').toLowerCase())}"><i></i><b>${escapeHtml(source.name || source.id)}</b><em>${escapeHtml(source.state || 'OFFLINE')}</em><small>${Number(source.recordCount || 0)}</small></span>`).join('');
}
