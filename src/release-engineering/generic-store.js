import { clean } from './utilities.js';
export class ReleaseStore {
    constructor(options = {}) { this.maximum = Math.max(1, Number(options.maximum) || 10000); this.records = new Map(); }
    bucket(owner) { const key = String(owner || 'anonymous'); if (!this.records.has(key))
        this.records.set(key, new Map()); return this.records.get(key); }
    async put(owner, record) { if (!record?.id)
        throw new TypeError('Release record id is required'); const bucket = this.bucket(owner); bucket.set(record.id, Object.freeze({ ...record })); while (bucket.size > this.maximum)
        bucket.delete(bucket.keys().next().value); return bucket.get(record.id); }
    async get(owner, id) { return this.bucket(owner).get(String(id)) || null; }
    async remove(owner, id) { return this.bucket(owner).delete(String(id)); }
    async list(owner, filter = {}) { const query = clean(filter.q || filter.query, 300).toLowerCase(); let rows = [...this.bucket(owner).values()]; for (const field of ['state', 'status', 'type', 'componentId', 'candidateId', 'environment', 'severity'])
        if (filter[field])
            rows = rows.filter(item => String(item[field] || '').toUpperCase() === String(filter[field]).toUpperCase()); if (query)
        rows = rows.filter(item => JSON.stringify(item).toLowerCase().includes(query)); rows.sort((a, b) => String(b.updatedAt || b.createdAt || b.recordedAt || '').localeCompare(String(a.updatedAt || a.createdAt || a.recordedAt || ''))); return rows.slice(0, Math.max(1, Number(filter.limit) || this.maximum)); }
}
