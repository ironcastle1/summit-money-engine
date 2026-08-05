import { clean } from './utilities.js';

export class OwnerSecurityStore {
  constructor(options = {}) {
    this.maximum = Math.max(1, Number(options.maximum) || 5000);
    this.records = new Map();
  }

  bucket(owner) {
    const key = String(owner || 'anonymous');
    if (!this.records.has(key)) this.records.set(key, new Map());
    return this.records.get(key);
  }

  async put(owner, record) {
    if (!record?.id) throw new TypeError('Security record id is required');
    const bucket = this.bucket(owner);
    bucket.set(record.id, Object.freeze({ ...record }));
    while (bucket.size > this.maximum) bucket.delete(bucket.keys().next().value);
    return bucket.get(record.id);
  }

  async get(owner, id) {
    return this.bucket(owner).get(String(id)) || null;
  }

  async remove(owner, id) {
    return this.bucket(owner).delete(String(id));
  }

  async list(owner, filter = {}) {
    const query = clean(filter.q || filter.query, 300).toLowerCase();
    let rows = [...this.bucket(owner).values()];
    for (const field of ['tenantId', 'state', 'status', 'type', 'severity', 'frameworkId', 'controlId', 'vendorId']) {
      if (filter[field]) rows = rows.filter(item => String(item[field] || '').toUpperCase() === String(filter[field]).toUpperCase());
    }
    if (filter.active !== undefined) rows = rows.filter(item => Boolean(item.active) === Boolean(filter.active));
    if (query) rows = rows.filter(item => JSON.stringify(item).toLowerCase().includes(query));
    rows.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    return rows.slice(0, Math.max(1, Number(filter.limit) || this.maximum));
  }

  async count(owner, filter = {}) {
    return (await this.list(owner, { ...filter, limit: this.maximum })).length;
  }
}
