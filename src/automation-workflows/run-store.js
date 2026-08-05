import { DEFAULT_LIMITS } from './constants.js';
export class RunStore {
    constructor(options = {}) { this.maximum = Number(options.maximum) || DEFAULT_LIMITS.runsPerOwner; this.owners = new Map(); }
    bucket(owner = 'anonymous') { const key = String(owner); if (!this.owners.has(key))
        this.owners.set(key, []); return this.owners.get(key); }
    async append(owner, run) {
        const bucket = this.bucket(owner);
        bucket.unshift(Object.freeze({ ...run }));
        if (bucket.length > this.maximum)
            bucket.length = this.maximum;
        return bucket[0];
    }
    async update(owner, id, patch) {
        const bucket = this.bucket(owner);
        const index = bucket.findIndex(item => item.id === id);
        if (index < 0)
            return null;
        bucket[index] = Object.freeze({ ...bucket[index], ...patch, updatedAt: new Date().toISOString() });
        return bucket[index];
    }
    async get(owner, id) { return this.bucket(owner).find(item => item.id === id) || null; }
    async list(owner, filters = {}) {
        let items = [...this.bucket(owner)];
        if (filters.workflowId)
            items = items.filter(item => item.workflowId === filters.workflowId);
        if (filters.state)
            items = items.filter(item => item.state === String(filters.state).toUpperCase());
        if (filters.limit)
            items = items.slice(0, Math.max(1, Math.min(1000, Number(filters.limit))));
        return Object.freeze(items);
    }
    async summary(owner) {
        const items = await this.list(owner, { limit: 1000 });
        const succeeded = items.filter(item => item.state === 'SUCCEEDED').length;
        const failed = items.filter(item => item.state === 'FAILED').length;
        const durations = items.map(item => Number(item.durationMs)).filter(Number.isFinite);
        return Object.freeze({ total: items.length, succeeded, failed, suppressed: items.filter(item => item.state === 'SUPPRESSED').length, successRate: items.length ? Math.round(succeeded / items.length * 1000) / 10 : 100, averageDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0 });
    }
}
