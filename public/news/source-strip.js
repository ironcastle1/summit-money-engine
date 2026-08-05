import { escapeHtml } from '../ui/dom.js';

function stateClass(state) {
  return state === 'ONLINE' ? 'online' : state === 'DEGRADED' ? 'degraded' : state === 'NOT_CONFIGURED' ? 'not-configured' : 'offline';
}

export function renderNewsSourceStrip(container, sources = {}) {
  if (!container) return;
  const entries = Object.values(sources);
  container.innerHTML = entries.map(source => `<div class="news-source-pill ${stateClass(source.state)}" title="${escapeHtml(source.errorCode || source.state)}">
    <i></i><span>${escapeHtml(source.name || source.id)}</span><b>${escapeHtml(source.state)}</b><small>${Number(source.recordCount || 0)}</small>
  </div>`).join('') || '<span class="news-empty-inline">0 SOURCES</span>';
}
