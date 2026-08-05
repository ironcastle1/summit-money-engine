import { DEFAULT_LIMITS } from './constants.js';
import { compileWorkflow } from './workflow-compiler.js';
export class WorkflowStore {
    constructor(options = {}) { this.maximum = Number(options.maximum) || DEFAULT_LIMITS.workflowsPerOwner; this.owners = new Map(); }
    bucket(owner = 'anonymous') { const key = String(owner); if (!this.owners.has(key))
        this.owners.set(key, new Map()); return this.owners.get(key); }
    async list(owner, filters = {}) {
        let items = [...this.bucket(owner).values()];
        if (filters.state)
            items = items.filter(item => item.state === String(filters.state).toUpperCase());
        if (filters.triggerType)
            items = items.filter(item => item.triggers.some(trigger => trigger.type === String(filters.triggerType).toUpperCase()));
        if (filters.query) {
            const q = String(filters.query).toLowerCase();
            items = items.filter(item => `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(q));
        }
        return Object.freeze(items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
    }
    async get(owner, id) { return this.bucket(owner).get(String(id)) || null; }
    async put(owner, input) {
        const bucket = this.bucket(owner);
        const existing = input.id ? bucket.get(String(input.id)) : null;
        const record = compileWorkflow({ ...existing, ...input, owner, version: existing ? existing.version + 1 : input.version });
        if (!existing && bucket.size >= this.maximum)
            throw new RangeError(`Maximum ${this.maximum} workflows reached`);
        bucket.set(record.id, record);
        return record;
    }
    async transition(owner, id, state) {
        const current = await this.get(owner, id);
        if (!current)
            return null;
        return this.put(owner, { ...current, id: current.id, version: current.version, state });
    }
    async remove(owner, id) { return this.bucket(owner).delete(String(id)); }
    async summary(owner) { const items = await this.list(owner); return Object.freeze({ total: items.length, active: items.filter(item => item.state === 'ACTIVE').length, paused: items.filter(item => item.state === 'PAUSED').length, drafts: items.filter(item => item.state === 'DRAFT').length }); }
}
