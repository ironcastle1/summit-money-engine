export class LayerRuntime {
    constructor(options) { Object.assign(this, options); this.renderers = new Map(); }
    registerRenderer(type, renderer) { this.renderers.set(type, renderer); return this; }
    render(viewport) {
        for (const layer of this.layers.list()) {
            const visible = layer.visible && viewport.zoom >= layer.minimumZoom && viewport.zoom <= layer.maximumZoom;
            this.surface.setVisible(layer.id, visible);
            if (!visible)
                continue;
            const renderer = this.renderers.get(layer.renderer);
            if (!renderer)
                continue;
            renderer.render({ layer, features: this.features.get(layer.source || layer.id), viewport, group: this.surface.group(layer.id, layer.order), entities: this.entities });
        }
    }
    clearLayer(id) { this.surface.clear(id); this.entities.removeLayer(id); }
}
