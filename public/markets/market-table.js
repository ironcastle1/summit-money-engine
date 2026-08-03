import { marketPrice, percent, probability, score } from './market-format.js';

export class MarketTable {
  constructor(options) {
    this.container = options.container;
    this.onSelect = options.onSelect;
    this.selectedAssetId = null;
    this.results = [];
  }

  setSelected(assetId) {
    this.selectedAssetId = assetId;
    this.render();
  }

  setResults(results) {
    this.results = results || [];
    this.render();
  }

  render() {
    this.container.replaceChildren();
    if (!this.results.length) {
      this.container.innerHTML = '<div class="market-empty">NO RESULTS</div>';
      return;
    }
    for (const result of this.results) {
      const asset = result.asset || {};
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `market-row ${asset.id === this.selectedAssetId ? 'selected' : ''} ${result.available ? '' : 'unavailable'}`;
      const rise = result.outcomes?.[0]?.riseProbability;
      const direction = result.opportunity?.direction;
      row.innerHTML = `
        <span class="market-symbol"><strong>${asset.symbol || '?'}</strong><small>${asset.name || result.reason || 'UNAVAILABLE'}</small></span>
        <span class="market-price"><strong>${marketPrice(result.quote?.price, asset.quoteCurrency)}</strong><small class="${(result.quote?.change24h || 0) >= 0 ? 'positive' : 'negative'}">${percent(result.quote?.change24h, 2, true)}</small></span>
        <span class="market-probability"><strong class="${direction === 'RISE' ? 'positive' : direction === 'FALL' ? 'negative' : ''}">${probability(rise)}</strong><small>${direction || 'N/A'}</small></span>
        <span class="market-score"><strong>${score(result.opportunity?.score)}</strong><small>EDGE</small></span>`;
      row.addEventListener('click', () => this.onSelect?.(asset.id));
      this.container.append(row);
    }
  }
}
