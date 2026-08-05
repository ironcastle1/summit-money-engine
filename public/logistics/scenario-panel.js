import { element } from './dom.js';
export class ScenarioPanel {
  constructor(options) { this.root = options.root; this.onRun = options.onRun; this.lastRequest = null; }
  setRequest(request) { this.lastRequest = request; this.render(); }
  render() {
    if (!this.lastRequest) { this.root.textContent = 'Calculate a route before running a disruption scenario.'; return; }
    const form = element('form', { className: 'logistics-form' }, [element('label', {}, ['SCENARIO NAME', element('input', { name: 'name', value: 'Chokepoint closure' })]), element('label', {}, ['CLOSED NODE IDS', element('textarea', { name: 'closedNodeIds', placeholder: 'suez-canal, bab-el-mandeb' })]), element('label', {}, ['CLOSED ROUTE IDS', element('textarea', { name: 'closedRouteIds', placeholder: 'med-suez' })]), element('button', { type: 'submit', className: 'logistics-primary', text: 'RUN SCENARIO' })]);
    form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); const split = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean); this.onRun?.({ name: data.get('name'), request: this.lastRequest, closedNodeIds: split(data.get('closedNodeIds')), closedRouteIds: split(data.get('closedRouteIds')) }); });
    this.root.replaceChildren(form);
  }
}
