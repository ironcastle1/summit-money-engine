import { clamp } from './numbers.js';
export class MarketWatchlist {
  constructor(options = {}) { this.maximum = Math.max(1, Number(options.maximum) || 250); this.records = new Map(); }
  bucket(owner) { const key = String(owner || 'anonymous'); if (!this.records.has(key)) this.records.set(key, new Map()); return this.records.get(key); }
  async list(owner) { return Object.freeze([...this.bucket(owner).values()].sort((a, b) => a.symbol.localeCompare(b.symbol))); }
  async add(owner, input = {}) {
    const bucket = this.bucket(owner); const symbol = String(input.symbol || input.assetId || '').trim(); if (!symbol) throw new TypeError('Watch symbol is required');
    const id = String(input.id || symbol.toLowerCase());
    if (!bucket.has(id) && bucket.size >= this.maximum) throw new RangeError(`Maximum ${this.maximum} market watches reached`);
    const watch = Object.freeze({ id, assetId: String(input.assetId || symbol), symbol, minimumOpportunity: clamp(Number(input.minimumOpportunity) || 60, 0, 100), maximumRisk: clamp(Number(input.maximumRisk) || 75, 0, 100), minimumMovePercent: Math.max(0, Number(input.minimumMovePercent) || 2), directions: Object.freeze((input.directions || []).map(value => String(value).toUpperCase())), createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    bucket.set(id, watch); return watch;
  }
  async remove(owner, id) { return this.bucket(owner).delete(String(id)); }
}
