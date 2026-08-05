const VALID_RENDERERS = new Set(['marker', 'cluster', 'line', 'polygon', 'label', 'heat', 'raster']);
export function layerDefinition(input) {
    if (!input?.id || !/^[a-z][a-z0-9-]{1,63}$/.test(String(input.id)))
        throw new TypeError('Layer ID is invalid');
    if (!VALID_RENDERERS.has(String(input.renderer)))
        throw new TypeError(`Layer renderer is invalid: ${input.renderer}`);
    return Object.freeze({
        id: String(input.id), title: String(input.title || input.id), group: String(input.group || 'general'), renderer: String(input.renderer),
        source: String(input.source || input.id), visible: input.visible !== false, minimumZoom: Number(input.minimumZoom ?? 0), maximumZoom: Number(input.maximumZoom ?? 20),
        interactive: input.interactive !== false, searchable: input.searchable !== false, order: Number(input.order ?? 0),
        style: Object.freeze({ ...(input.style || {}) }), filters: Object.freeze({ ...(input.filters || {}) }), metadata: Object.freeze({ ...(input.metadata || {}) })
    });
}
export function layerVisibleAtZoom(layer, zoom) { return layer.visible && Number(zoom) >= layer.minimumZoom && Number(zoom) <= layer.maximumZoom; }
