import { stateClass } from './market-format.js';

export class MarketSourceStrip {
  constructor(container) { this.container = container; }
  render(sources = {}) {
    this.container.replaceChildren();
    for (const source of Object.values(sources)) {
      const item = document.createElement('span');
      item.className = `market-source-pill ${stateClass(source.state)}`;
      item.innerHTML = `<i></i><b>${source.name || source.id}</b><small>${source.state || 'OFF'}</small>`;
      this.container.append(item);
    }
  }
}
