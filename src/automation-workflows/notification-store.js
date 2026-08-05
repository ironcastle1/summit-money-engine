import { DEFAULT_LIMITS } from './constants.js';
import { makeId } from './ids.js';
import { clean, frozen } from './utilities.js';
export class NotificationStore {
    constructor(options = {}) { this.maximum = Number(options.maximum) || DEFAULT_LIMITS.notificationsPerOwner; this.owners = new Map(); }
    bucket(owner = 'anonymous') { const key = String(owner); if (!this.owners.has(key))
        this.owners.set(key, []); return this.owners.get(key); }
    async create(owner, input = {}) { const item = frozen({ id: clean(input.id, 190) || makeId('notification'), title: clean(input.title || 'Merlin notification', 200), body: clean(input.body, 2000), severity: String(input.severity || 'INFO').toUpperCase(), channel: String(input.channel || 'IN_APP').toUpperCase(), state: String(input.state || 'DELIVERED').toUpperCase(), workflowId: clean(input.workflowId, 190), runId: clean(input.runId, 190), read: Boolean(input.read), metadata: frozen({ ...input.metadata }), createdAt: input.createdAt || new Date().toISOString() }); const bucket = this.bucket(owner); bucket.unshift(item); if (bucket.length > this.maximum)
        bucket.length = this.maximum; return item; }
    async list(owner, filters = {}) { let items = [...this.bucket(owner)]; if (filters.unread === 'true' || filters.unread === true)
        items = items.filter(item => !item.read); if (filters.severity)
        items = items.filter(item => item.severity === String(filters.severity).toUpperCase()); return Object.freeze(items.slice(0, Math.max(1, Math.min(1000, Number(filters.limit) || 200)))); }
    async markRead(owner, id, read = true) { const bucket = this.bucket(owner); const index = bucket.findIndex(item => item.id === id); if (index < 0)
        return null; bucket[index] = frozen({ ...bucket[index], read: Boolean(read) }); return bucket[index]; }
    async summary(owner) { const items = await this.list(owner, { limit: 1000 }); return Object.freeze({ total: items.length, unread: items.filter(item => !item.read).length, critical: items.filter(item => item.severity === 'CRITICAL').length, failed: items.filter(item => item.state === 'FAILED').length }); }
}
