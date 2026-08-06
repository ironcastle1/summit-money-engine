import { normalizeScreenDefinition } from './screen-definition.js';
export class MarketScreenRepository {
  constructor(options = {}) { this.maximum = Math.max(1, Number(options.maximum) || 100); this.records = new Map(); }
  bucket(owner) { const key = String(owner || 'anonymous'); if (!this.records.has(key)) this.records.set(key, new Map()); return this.records.get(key); }
  async list(owner) { return Object.freeze([...this.bucket(owner).values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))); }
  async save(owner, value) {
    const bucket = this.bucket(owner); const screen = normalizeScreenDefinition(value);
    if (!bucket.has(screen.id) && bucket.size >= this.maximum) throw new RangeError(`Maximum ${this.maximum} saved screens reached`);
    bucket.set(screen.id, screen); return screen;
  }
  async remove(owner, id) { return this.bucket(owner).delete(String(id)); }
  async get(owner, id) { return this.bucket(owner).get(String(id)) || null; }
}
