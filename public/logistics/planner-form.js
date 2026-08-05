import { element, option } from './dom.js';
export class PlannerForm {
  constructor(options) { this.root = options.root; this.onSubmit = options.onSubmit; this.network = null; }
  setNetwork(network) { this.network = network; this.render(); }
  nodeOptions(kind = 'PORT') { return (this.network?.nodes || []).filter(node => node.kind === kind).sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  value(name) { return this.root.querySelector(`[name="${name}"]`)?.value; }
  payload() { return { originId: this.value('originId'), destinationId: this.value('destinationId'), vesselClass: this.value('vesselClass'), cargoClass: this.value('cargoClass'), policyId: this.value('policyId'), cargoTonnes: Number(this.value('cargoTonnes') || 10000), maximumAlternatives: Number(this.value('maximumAlternatives') || 5), departureAt: new Date().toISOString() }; }
  render() {
    if (!this.network) { this.root.textContent = 'Loading route network…'; return; }
    const ports = this.nodeOptions(); const origin = element('select', { name: 'originId', required: true }, [option('', 'Origin port'), ...ports.map(node => option(node.id, `${node.name}${node.country ? `, ${node.country}` : ''}`))]);
    const destination = element('select', { name: 'destinationId', required: true }, [option('', 'Destination port'), ...ports.map(node => option(node.id, `${node.name}${node.country ? `, ${node.country}` : ''}`))]);
    const vessel = element('select', { name: 'vesselClass' }, (this.network.vesselProfiles || []).map(item => option(item.id, item.id.replaceAll('_', ' '))));
    const cargo = element('select', { name: 'cargoClass' }, (this.network.cargoProfiles || []).map(item => option(item.id, item.id.replaceAll('_', ' '))));
    const policy = element('select', { name: 'policyId' }, (this.network.policies || []).map(item => option(item.id, item.id.replaceAll('_', ' '))));
    const form = element('form', { className: 'logistics-form' }, [element('label', { text: 'ORIGIN' }), origin, element('label', { text: 'DESTINATION' }), destination, element('div', { className: 'logistics-grid' }, [element('label', {}, ['VESSEL', vessel]), element('label', {}, ['CARGO', cargo])]), element('div', { className: 'logistics-grid' }, [element('label', {}, ['POLICY', policy]), element('label', {}, ['TONNES', element('input', { name: 'cargoTonnes', type: 'number', value: '10000', min: '1', max: '500000' })])]), element('label', {}, ['ALTERNATIVES', element('input', { name: 'maximumAlternatives', type: 'number', value: '5', min: '1', max: '12' })]), element('button', { type: 'submit', className: 'logistics-primary', text: 'CALCULATE ROUTES' })]);
    form.addEventListener('submit', event => { event.preventDefault(); this.onSubmit?.(this.payload()); });
    this.root.replaceChildren(form);
  }
}
