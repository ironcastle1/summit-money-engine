import { escapeHtml, number } from './format.js';
export function renderWatchlist(root, watches, alerts, handlers = {}) {
  if (!root) return;
  root.innerHTML = `<section class="mi-watchlist"><header><h3>WATCHLIST</h3><button type="button" data-refresh-alerts>CHECK ALERTS</button></header>${(watches || []).map(watch => `<div class="mi-watch-row"><div><strong>${escapeHtml(watch.symbol)}</strong><span>Opportunity ≥ ${number(watch.minimumOpportunity, 0)} · risk ≤ ${number(watch.maximumRisk, 0)}</span></div><button type="button" data-remove-watch="${escapeHtml(watch.id)}">REMOVE</button></div>`).join('') || '<p class="mi-empty">No assets watched.</p>'}<div class="mi-alert-list">${(alerts || []).map(alert => `<article class="${alert.severity.toLowerCase()}"><strong>${escapeHtml(alert.symbol)} · ${escapeHtml(alert.severity)}</strong><span>${escapeHtml(alert.reasons.join(' · '))}</span></article>`).join('')}</div></section>`;
  root.querySelector('[data-refresh-alerts]')?.addEventListener('click', handlers.refreshAlerts);
  root.querySelectorAll('[data-remove-watch]').forEach(button => button.addEventListener('click', () => handlers.remove?.(button.dataset.removeWatch)));
}
