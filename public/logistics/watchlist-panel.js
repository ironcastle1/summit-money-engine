import { escapeHtml } from './format.js';
export class WatchlistPanel {
  constructor(options) { this.root = options.root; this.api = options.api; }
  async render() {
    const payload = await this.api.watchlist(); const watches = payload.watches || [];
    this.root.innerHTML = watches.length ? watches.map(watch => `<article class="logistics-watch"><div><b>${escapeHtml(watch.name)}</b><small>${escapeHtml(watch.routeId)}</small></div><span>RISK ≥ ${watch.thresholds.riskScore}</span><button data-remove="${escapeHtml(watch.id)}">×</button></article>`).join('') : '<div class="logistics-empty">No watched routes.</div>';
    this.root.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => { await this.api.removeWatch(button.dataset.remove); await this.render(); }));
  }
}
