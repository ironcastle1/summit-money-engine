export class LayerRegistry {
    constructor(definitions = []) { this.layers = new Map(); definitions.forEach(definition => this.register(definition)); }
    register(definition) { if (!definition?.id)
        throw new TypeError('Layer requires an ID'); const layer = { visible: true, minimumZoom: 0, maximumZoom: 18, order: 0, interactive: true, ...definition }; this.layers.set(layer.id, layer); return layer; }
    get(id) { return this.layers.get(id) || null; }
    setVisible(id, visible) { const layer = this.get(id); if (layer)
        layer.visible = Boolean(visible); }
    visible(zoom) { return [...this.layers.values()].filter(layer => layer.visible && zoom >= layer.minimumZoom && zoom <= layer.maximumZoom).sort((a, b) => a.order - b.order); }
    list() { return [...this.layers.values()].sort((a, b) => a.order - b.order); }
}
