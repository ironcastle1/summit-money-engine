import { compareText } from './utilities.js';
export class OwnerCommercialStore {
    constructor(options = {}) { this.maximum = Math.max(1, Number(options.maximum) || 5000); this.records = new Map(); }
    bucket(owner) { const key = String(owner || 'anonymous'); if (!this.records.has(key))
        this.records.set(key, new Map()); return this.records.get(key); }
    async put(owner, record) { const bucket = this.bucket(owner); bucket.set(record.id, record); while (bucket.size > this.maximum)
        bucket.delete(bucket.keys().next().value); return record; }
    async get(owner, id) { return this.bucket(owner).get(String(id)) || null; }
    async remove(owner, id) { return this.bucket(owner).delete(String(id)); }
    async list(owner, filter = {}) {
        const query = String(filter.q || filter.query || '').toLowerCase();
        const items = [...this.bucket(owner).values()].filter(item => {
            if (filter.tenantId && item.tenantId !== filter.tenantId)
                return false;
            if (filter.state && String(item.state) !== String(filter.state).toUpperCase())
                return false;
            if (filter.type && String(item.type) !== String(filter.type).toUpperCase())
                return false;
            if (filter.active !== undefined && Boolean(item.active) !== Boolean(filter.active))
                return false;
            if (query && !JSON.stringify(item).toLowerCase().includes(query))
                return false;
            return true;
        });
        return items.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')) || compareText(a.name || a.title, b.name || b.title)).slice(0, Math.max(1, Number(filter.limit) || this.maximum));
    }
    async count(owner, filter = {}) { return (await this.list(owner, { ...filter, limit: this.maximum })).length; }
}
