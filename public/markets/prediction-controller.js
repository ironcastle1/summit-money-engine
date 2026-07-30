import { compactNumber, probability, percent } from './market-format.js';
import { escapeHtml } from '../ui/dom.js';

export class PredictionController {
  constructor(options) {
    this.api = options.api;
    this.initialized = false;
    this.searchTimer = null;
  }

  bind() {
    document.querySelector('#prediction-refresh').addEventListener('click', () => this.load());
    document.querySelector('#prediction-search').addEventListener('input', event => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.load(event.target.value), 350);
    });
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    await this.load();
  }

  async load(search = '') {
    const button = document.querySelector('#prediction-refresh');
    button.disabled = true;
    button.textContent = 'LOADING';
    try {
      const payload = await this.api.predictionMarkets({ q: search, limit: 60 });
      this.render(payload.markets || []);
      document.querySelector('#prediction-source-state').textContent = payload.source?.stale ? 'STALE' : 'ONLINE';
      document.querySelector('#prediction-source-age').textContent = payload.generatedAt ? new Date(payload.generatedAt).toLocaleTimeString('en-GB') : '--';
    } catch (error) {
      document.querySelector('#prediction-rows').innerHTML = `<div class="prediction-empty">${error.code || 'SOURCE_OFF'} / N/A</div>`;
      document.querySelector('#prediction-source-state').textContent = 'OFF';
    } finally {
      button.disabled = false;
      button.textContent = 'REFRESH';
    }
  }

  render(markets) {
    const container = document.querySelector('#prediction-rows');
    container.replaceChildren();
    document.querySelector('#prediction-count').textContent = String(markets.length);
    for (const market of markets) {
      const row = document.createElement('a');
      row.className = 'prediction-row';
      row.href = market.url || '#';
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.innerHTML = `
        <span class="prediction-question"><strong>${escapeHtml(market.question)}</strong><small>${escapeHtml(market.category.toUpperCase())} · ${market.endDate ? new Date(market.endDate).toLocaleDateString('en-GB') : 'OPEN'}</small></span>
        <span><strong>${probability(market.probability)}</strong><small>YES</small></span>
        <span class="${(market.change24h || 0) >= 0 ? 'positive' : 'negative'}"><strong>${percent(market.change24h, 1, true)}</strong><small>24H</small></span>
        <span><strong>${compactNumber(market.volume)}</strong><small>VOLUME</small></span>
        <span><strong>${compactNumber(market.liquidity)}</strong><small>LIQUIDITY</small></span>`;
      container.append(row);
    }
    if (!markets.length) container.innerHTML = '<div class="prediction-empty">NO MATCHES</div>';
  }
}
