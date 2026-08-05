import { percent, probability, score } from './market-format.js';

export class TimeframeMatrix {
  constructor(container) { this.container = container; }
  render(payload) {
    this.container.replaceChildren();
    const order = ['15m', '1h', '4h', '1d'];
    const analyses = payload?.analyses || {};
    for (const timeframe of order) {
      const analysis = analyses[timeframe];
      const outcome = analysis?.outcomes?.[0];
      const row = document.createElement('div');
      row.className = `timeframe-row ${analysis?.available ? '' : 'unavailable'}`;
      row.innerHTML = `<span>${timeframe.toUpperCase()}</span><strong class="${(outcome?.riseProbability || 0) >= .5 ? 'positive' : 'negative'}">${probability(outcome?.riseProbability)}</strong><strong>${percent(outcome?.medianReturn, 2, true)}</strong><strong>${score(outcome?.confidence)}</strong><strong>${score(analysis?.signal?.score)}</strong>`;
      this.container.append(row);
    }
    const consensus = document.querySelector('#market-consensus');
    if (payload?.consensus?.available) {
      consensus.textContent = `${payload.consensus.direction} ${probability(payload.consensus.riseProbability)}`;
      consensus.className = payload.consensus.direction === 'RISE' ? 'positive' : payload.consensus.direction === 'FALL' ? 'negative' : 'warning';
    } else {
      consensus.textContent = 'N/A';
      consensus.className = '';
    }
  }
}
