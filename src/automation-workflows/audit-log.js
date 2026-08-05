import { createHash } from 'node:crypto';
import { makeId } from './ids.js';
import { stableStringify } from './utilities.js';
export class AutomationAuditLog {
    constructor(options = {}) { this.maximum = Number(options.maximum) || 10000; this.owners = new Map(); }
    bucket(owner = 'anonymous') { const key = String(owner); if (!this.owners.has(key))
        this.owners.set(key, []); return this.owners.get(key); }
    async append(owner, input = {}) { const bucket = this.bucket(owner); const previous = bucket[0]?.hash || 'GENESIS'; const payload = { id: input.id || makeId('automation-audit'), action: String(input.action || 'UNKNOWN').toUpperCase(), resourceType: String(input.resourceType || 'WORKFLOW').toUpperCase(), resourceId: String(input.resourceId || ''), actor: String(input.actor || owner), metadata: input.metadata || {}, createdAt: input.createdAt || new Date().toISOString(), previousHash: previous }; const hash = createHash('sha256').update(previous + stableStringify(payload)).digest('hex'); const record = Object.freeze({ ...payload, hash }); bucket.unshift(record); if (bucket.length > this.maximum)
        bucket.length = this.maximum; return record; }
    async list(owner, filters = {}) { let items = [...this.bucket(owner)]; if (filters.resourceType)
        items = items.filter(item => item.resourceType === String(filters.resourceType).toUpperCase()); if (filters.resourceId)
        items = items.filter(item => item.resourceId === String(filters.resourceId)); return Object.freeze(items.slice(0, Math.max(1, Math.min(1000, Number(filters.limit) || 200)))); }
    async verify(owner) { const chronological = [...this.bucket(owner)].reverse(); let previous = 'GENESIS'; for (const item of chronological) {
        const { hash, ...payload } = item;
        const expected = createHash('sha256').update(previous + stableStringify(payload)).digest('hex');
        if (hash !== expected)
            return Object.freeze({ valid: false, brokenAt: item.id, checked: chronological.length });
        previous = hash;
    } return Object.freeze({ valid: true, checked: chronological.length, head: this.bucket(owner)[0]?.hash || 'GENESIS' }); }
}
