const SOURCES = Object.freeze({
  clean: Object.freeze({
    id: 'clean',
    template: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '© OpenStreetMap contributors © CARTO'
  }),
  dark: Object.freeze({
    id: 'dark',
    template: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '© OpenStreetMap contributors © CARTO'
  }),
  terrain: Object.freeze({
    id: 'terrain',
    template: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: [],
    attribution: '© OpenStreetMap contributors, SRTM | OpenTopoMap'
  })
});

export class TileSource {
  constructor(options = {}) {
    this.id = options.id || 'clean';
    this.template = options.template || null;
    this.subdomains = options.subdomains || [];
    this.fallback = options.fallback || null;
    this.enabled = options.enabled !== false;
    this.attribution = options.attribution || '';
  }

  url(tile) {
    if (!this.enabled || !this.template) return null;
    const subdomain = this.subdomains.length
      ? this.subdomains[Math.abs(Number(tile.x) + Number(tile.y)) % this.subdomains.length]
      : '';
    return this.template
      .replace('{s}', subdomain)
      .replace('{z}', tile.z)
      .replace('{x}', tile.x)
      .replace('{y}', tile.y);
  }

  fallbackUrl(tile) {
    return this.fallback
      ?.replace('{z}', tile.z)
      .replace('{x}', tile.x)
      .replace('{y}', tile.y) || null;
  }
}

export function tileSourceForMode(mode) {
  if (mode === 'local') return new TileSource({ id: 'local', enabled: false });
  const source = SOURCES[mode] || SOURCES.clean;
  return new TileSource(source);
}
