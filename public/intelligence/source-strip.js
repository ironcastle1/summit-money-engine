import { escapeHtml } from '../ui/dom.js';
export function renderIntelligenceSources(root, sources = {}) {
  if (!root) return;
  const rows = Object.values(sources);
  root.innerHTML = rows.length ? rows.map(source => `<span class="intelligence-source state-${String(source.state).toLowerCase()}"><i></i><b>${escapeHtml(source.name || source.id)}</b><small>${escapeHtml(source.state)} / ${source.recordCount ?? 0}</small></span>`).join('') : '<span class="intelligence-source state-offline"><i></i><b>SOURCES</b><small>0/0</small></span>';
}
