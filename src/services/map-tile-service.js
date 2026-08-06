import { clampInteger } from '../core/validation.js';

const PROVIDERS = Object.freeze({
  streets: Object.freeze([
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
  ]),
  light: Object.freeze([
    'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  ]),
  terrain: Object.freeze([
    'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  ])
});

function tileKey(style, z, x, y) { return `${style}:${z}:${x}:${y}`; }
function wrap(value, modulo) { return ((value % modulo) + modulo) % modulo; }
function templateUrl(template, { z, x, y }) { return template.replace('{z}', z).replace('{x}', x).replace('{y}', y); }

export class MapTileService {
  constructor(options = {}) {
    this.cache = options.cache;
    this.logger = options.logger;
    this.userAgent = options.userAgent || 'Merlin/18.0 map-proxy';
    this.timeoutMs = options.timeoutMs || 8_000;
    this.maxZoom = options.maxZoom || 19;
  }

  styles() { return Object.keys(PROVIDERS); }

  async tile(input) {
    const style = PROVIDERS[input.style] ? input.style : 'streets';
    const z = clampInteger(input.z, 2, 0, this.maxZoom);
    const n = 2 ** z;
    const x = wrap(clampInteger(input.x, 0, -n * 4, n * 4), n);
    const y = clampInteger(input.y, 0, 0, n - 1);
    const key = tileKey(style, z, x, y);
    const result = await this.cache.getOrLoad(`map-tile:${key}`, { ttlMs: 86_400_000, staleMs: 604_800_000 }, () => this.#download(style, { z, x, y }));
    return { ...result.value, cache: result.cache, ageMs: result.ageMs };
  }

  async #download(style, coordinates) {
    const errors = [];
    for (const template of PROVIDERS[style]) {
      const url = templateUrl(template, coordinates);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('Tile request timeout')), this.timeoutMs);
      try {
        const response = await fetch(url, {
          headers: { accept: 'image/avif,image/webp,image/png,image/*,*/*;q=0.8', 'user-agent': this.userAgent },
          signal: controller.signal
        });
        if (!response.ok) throw Object.assign(new Error(`Tile HTTP ${response.status}`), { code: `HTTP_${response.status}` });
        const contentType = String(response.headers.get('content-type') || 'image/png').split(';')[0];
        if (!contentType.startsWith('image/')) throw Object.assign(new Error('Tile response was not an image'), { code: 'INVALID_TILE_TYPE' });
        const body = Buffer.from(await response.arrayBuffer());
        if (body.length < 64 || body.length > 2_000_000) throw Object.assign(new Error('Tile response size invalid'), { code: 'INVALID_TILE_SIZE' });
        return { body, contentType, sourceUrl: url, provider: new URL(url).hostname };
      } catch (error) {
        errors.push({ url, code: error.code || error.name || 'TILE_ERROR' });
        this.logger?.warn('map_tile.provider_failed', { url, error });
      } finally { clearTimeout(timeout); }
    }
    throw Object.assign(new Error('All map tile providers failed'), { code: 'MAP_TILE_UNAVAILABLE', details: errors });
  }
}
