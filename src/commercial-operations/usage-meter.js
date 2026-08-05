import { usageEventRecord } from './usage-event-schema.js';
export class UsageMeter {
    constructor(options = {}) { this.maximum = Math.max(100, Number(options.maximum) || 100000); this.events = new Map(); }
    bucket(owner) { const key = String(owner || 'anonymous'); if (!this.events.has(key))
        this.events.set(key, []); return this.events.get(key); }
    async record(owner, input) { const event = usageEventRecord(input); const bucket = this.bucket(owner); bucket.push(event); if (bucket.length > this.maximum)
        bucket.splice(0, bucket.length - this.maximum); return event; }
    async list(owner, filter = {}) { const from = filter.from ? new Date(filter.from).getTime() : -Infinity; const to = filter.to ? new Date(filter.to).getTime() : Infinity; return this.bucket(owner).filter(item => (!filter.tenantId || item.tenantId === filter.tenantId) && (!filter.metric || item.metric === filter.metric) && new Date(item.occurredAt).getTime() >= from && new Date(item.occurredAt).getTime() <= to).slice(-Math.max(1, Number(filter.limit) || this.maximum)); }
}
