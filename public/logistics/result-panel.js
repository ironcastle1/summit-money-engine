import { escapeHtml, money, number, duration, dateTime } from './format.js';
export class ResultPanel {
  constructor(options) { this.root = options.root; this.onSelect = options.onSelect; this.onSave = options.onSave; this.onWatch = options.onWatch; }
  render(result) {
    if (!result?.routes?.length) { this.root.innerHTML = '<div class="logistics-empty">No viable route found for these constraints.</div>'; return; }
    this.root.innerHTML = `<div class="logistics-result-head"><div><b>${escapeHtml(result.request.originId)}</b><span>→</span><b>${escapeHtml(result.request.destinationId)}</b></div><small>${result.routes.length} alternatives · ${dateTime(result.generatedAt)}</small></div><div class="logistics-route-list">${result.routes.map(route => this.card(route)).join('')}</div>${this.actions()}`;
    this.root.querySelectorAll('[data-route-id]').forEach(button => button.addEventListener('click', () => this.onSelect?.(button.dataset.routeId)));
    this.root.querySelector('[data-action="save"]')?.addEventListener('click', () => this.onSave?.(result));
    this.root.querySelector('[data-action="watch"]')?.addEventListener('click', () => this.onWatch?.(result));
  }
  card(route) {
    const risk = route.metrics.exposure.risk; const reliability = route.metrics.reliability;
    return `<button type="button" class="logistics-route-card ${route.recommended ? 'recommended' : ''}" data-route-id="${escapeHtml(route.id)}"><div class="logistics-route-title"><span>#${route.rank} ${route.recommended ? 'RECOMMENDED' : 'ALTERNATIVE'}</span><b>${number(route.policyScore, 1)}</b></div><div class="logistics-metrics"><span><small>TIME</small>${duration(route.metrics.eta.durationHours)}</span><span><small>COST</small>${money(route.metrics.cost.totalUsd)}</span><span><small>RISK</small>${number(risk.score, 1)} ${escapeHtml(risk.band)}</span><span><small>RELIABILITY</small>${number(reliability.score, 1)}%</span><span><small>DISTANCE</small>${number(route.metrics.distanceKm)} km</span><span><small>CO₂</small>${number(route.metrics.cost.emissions.co2Tonnes, 1)} t</span></div></button>`;
  }
  actions() { return `<div class="logistics-actions"><button data-action="save">SAVE ROUTE</button><button data-action="watch">WATCH ROUTE</button></div>`; }
}
