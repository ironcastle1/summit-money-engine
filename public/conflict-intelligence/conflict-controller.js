import {
  createConflictApi
}
from './api-client.js';
import {
  ConflictStateStore
}
from './state-store.js';
import {
  conflictSummary
}
from './summary-strip.js';
import {
  theatreTable
}
from './theatre-table.js';
import {
  conflictDetail
}
from './detail-panel.js';
import {
  conflictScenarioPanel
}
from './scenario-panel.js';
import {
  conflictTimeline
}
from './timeline.js';
import {
  installConflictLayer
}
from './map-layer.js';
export class ConflictController {
  constructor(options = {
  }) {
    this.api = options.api || createConflictApi();
    this.store = options.store || new ConflictStateStore();
    this.state = this.store.load();
    this.layer = installConflictLayer(options.map, {
      onSelect: id => this.select(id)
    });
    this.catalog = null;
    this.snapshot = null;
  }
  async initialize() {
    [this.catalog,
    this.snapshot] = await Promise.all([this.api.catalog(),
    this.api.snapshot({
      hours: 336,
      limit: 150
    })]);
    this.layer.set(this.snapshot.features);
    return this;
  }
  async activate() {
    if (!this.snapshot)
    await this.initialize();
    this.render(this.state.query || '');
  }
  selected() {
    return this.snapshot?.theatres?.find(item => item.id === this.state.selected) || null;
  }
  render(query = '') {
    this.state.query = query;
    this.store.save(this.state);
    const content = document.querySelector('#sheet-content');
    if (!content)
    return;
    document.querySelector('#sheet-kicker').textContent = 'WAR / SECURITY / ESCALATION';
    document.querySelector('#sheet-title').textContent = 'CONFLICT';
    document.querySelector('#sheet-summary').innerHTML = conflictSummary(this.snapshot.summary);
    content.innerHTML = `<div class="conflict-layout"><section><div class="conflict-tools"><input id="conflict-filter" placeholder="Filter theatres" value="${query}"></div>${theatreTable(this.snapshot.theatres,
    query)}</section><aside id="conflict-inspector">${conflictDetail(this.selected())}${conflictScenarioPanel(this.catalog)}${conflictTimeline(this.selected()?.timeline || [])}</aside></div>`;
    content.querySelector('#conflict-filter')?.addEventListener('input',
    event => this.render(event.target.value));
    content.querySelectorAll('[data-conflict-id]').forEach(button => button.addEventListener('click',
    () => this.select(button.dataset.conflictId)));
    content.querySelector('#conflict-scenario')?.addEventListener('submit',
    event => this.runScenario(event));
  }
  select(id) {
    this.state.selected = id;
    this.store.save(this.state);
    this.layer.show();
    this.render(this.state.query || '');
  }
  async runScenario(event) {
    event.preventDefault();
    const theatre = this.selected();
    if (!theatre)
    return;
    const data = new FormData(event.currentTarget),
    result = await this.api.scenario({
      theatreId: theatre.id,
      type: data.get('type'),
      severity: Number(data.get('severity')),
      horizonDays: Number(data.get('horizonDays')),
      theatre
    });
    const output = document.querySelector('#conflict-scenario-result');
    if (output)
    output.textContent = `${result.before} → ${result.after} (${result.delta >= 0 ? '+' : ''}${result.delta})`;
  }
}
