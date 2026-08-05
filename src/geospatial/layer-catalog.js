import { layerDefinition } from './layer-definition.js';
export class LayerCatalog {
    constructor(layers = []) { this.layers = new Map(); layers.forEach(layer => this.register(layer)); }
    register(input) { const layer = layerDefinition(input); if (this.layers.has(layer.id))
        throw new Error(`Layer already registered: ${layer.id}`); this.layers.set(layer.id, layer); return this; }
    replace(input) { const layer = layerDefinition(input); this.layers.set(layer.id, layer); return this; }
    get(id) { return this.layers.get(String(id)) || null; }
    list(options = {}) {
        return [...this.layers.values()].filter(layer => !options.group || layer.group === options.group).sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
    }
    groups() { return [...new Set(this.list().map(layer => layer.group))]; }
    snapshot() { return Object.freeze({ layers: Object.freeze(this.list()), groups: Object.freeze(this.groups()) }); }
}
export const CORE_MAP_LAYERS = Object.freeze([
    { id: 'political-boundaries', title: 'Political boundaries', group: 'reference', renderer: 'polygon', source: 'countries', visible: true, order: 10 },
    { id: 'english-local-labels', title: 'English and local labels', group: 'reference', renderer: 'label', source: 'places', visible: true, order: 20 },
    { id: 'cities', title: 'Cities', group: 'reference', renderer: 'marker', source: 'cities', visible: true, minimumZoom: 3, order: 30 },
    { id: 'ports', title: 'Ports', group: 'logistics', renderer: 'marker', source: 'ports', visible: false, minimumZoom: 2, order: 40 },
    { id: 'shipping-routes', title: 'Shipping routes', group: 'logistics', renderer: 'line', source: 'routes', visible: false, order: 50 },
    { id: 'live-events', title: 'Material events', group: 'intelligence', renderer: 'cluster', source: 'events', visible: true, order: 60 }
]);
