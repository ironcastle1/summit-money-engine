import fs from 'node:fs/promises';
import { NotFoundError } from '../core/errors.js';
import { normalizeAsset, publicAsset } from '../domain/markets/asset-schema.js';

export class MarketCatalogService {
  static async create(options) {
    const raw = JSON.parse(await fs.readFile(options.catalogPath, 'utf8'));
    return new MarketCatalogService({ assets: raw.assets || raw });
  }

  constructor(options) {
    this.assets = new Map();
    for (const value of options.assets || []) {
      const asset = normalizeAsset(value);
      if (this.assets.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
      this.assets.set(asset.id, asset);
    }
  }

  get(idOrSymbol) {
    const query = String(idOrSymbol || '').trim().toLowerCase();
    const asset = this.assets.get(query) || [...this.assets.values()].find(item => item.symbol.toLowerCase() === query);
    if (!asset) throw new NotFoundError('Unknown market asset', { asset: idOrSymbol });
    return asset;
  }

  list(filters = {}) {
    const search = String(filters.search || '').trim().toLowerCase();
    const assetClass = String(filters.assetClass || '').trim().toLowerCase();
    return [...this.assets.values()]
      .filter(asset => asset.enabled)
      .filter(asset => !assetClass || asset.assetClass === assetClass)
      .filter(asset => !search || `${asset.symbol} ${asset.name} ${asset.tags.join(' ')}`.toLowerCase().includes(search))
      .sort((a, b) => a.priority - b.priority || a.symbol.localeCompare(b.symbol))
      .map(publicAsset);
  }

  internalList(filters = {}) {
    const ids = new Set((filters.ids || []).map(value => String(value).toLowerCase()));
    return [...this.assets.values()].filter(asset => asset.enabled && (!ids.size || ids.has(asset.id) || ids.has(asset.symbol.toLowerCase()))).sort((a, b) => a.priority - b.priority);
  }
}
