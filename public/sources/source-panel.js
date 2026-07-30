import { $, text } from '../ui/dom.js';
import { number } from '../ui/format.js';

function stateClass(value) {
  return String(value || 'OFFLINE').toLowerCase().replaceAll('_', '-');
}

export class SourcePanel {
  constructor(options) {
    this.store = options.store;
    this.container = $('#map-source-strip');
  }

  render() {
    const sources = this.store.getState().sourceStatus || {};
    const entries = Object.values(sources);
    const configured = entries.filter(source => source.configured);
    const online = configured.filter(source => source.state === 'ONLINE').length;
    text('#global-source-count', `${online}/${configured.length} SOURCES`);
    this.container.innerHTML = entries.map(source => `
      <span class="source-chip ${stateClass(source.state)}" title="${source.name} / ${source.recordCount || 0} records">
        <i></i><span>${source.id.toUpperCase()}</span><b>${source.state === 'NOT_CONFIGURED' ? 'N/C' : source.recordCount || 0}</b>
      </span>
    `).join('');
  }
}
