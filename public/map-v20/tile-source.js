export class TileSource {
    constructor(options = {}) { this.id = options.id || 'streets'; this.template = options.template || '/api/map/tiles/streets/{z}/{x}/{y}.png'; this.fallback = options.fallback || null; this.enabled = options.enabled !== false; }
    url(tile) { if (!this.enabled || !this.template)
        return null; return this.template.replace('{z}', tile.z).replace('{x}', tile.x).replace('{y}', tile.y); }
    fallbackUrl(tile) { return this.fallback?.replace('{z}', tile.z).replace('{x}', tile.x).replace('{y}', tile.y) || null; }
}
export function tileSourceForMode(mode) {
    if (mode === 'local')
        return new TileSource({ id: 'local', enabled: false, template: null });
    return new TileSource({ id: mode, template: `/api/map/tiles/${['streets', 'light', 'terrain'].includes(mode) ? mode : 'streets'}/{z}/{x}/{y}.png` });
}
