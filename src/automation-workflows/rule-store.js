import { DEFAULT_LIMITS } from './constants.js';
import { makeId } from './ids.js';
import { clean, frozen } from './utilities.js';
export class RuleStore {
    constructor(options = {}) { this.maximum = Number(options.maximum) || DEFAULT_LIMITS.rulesPerOwner; this.owners = new Map(); }
    bucket(owner = 'anonymous') { const key = String(owner); if (!this.owners.has(key))
        this.owners.set(key, new Map()); return this.owners.get(key); }
    async put(owner, input = {}) {
        const bucket = this.bucket(owner);
        const id = clean(input.id, 190) || makeId('rule', input.name);
        if (!bucket.has(id) && bucket.size >= this.maximum)
            throw new RangeError(`Maximum ${this.maximum} rules reached`);
        const record = frozen({ id, name: clean(input.name || 'Alert rule', 160), enabled: input.enabled !== false, workflowId: clean(input.workflowId, 190), trigger: input.trigger || { type: 'DECISION_SIGNAL' }, severity: String(input.severity || 'IMPORTANT').toUpperCase(), channels: Object.freeze([...(input.channels || ['IN_APP'])]), createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
        bucket.set(id, record);
        return record;
    }
    async list(owner, filters = {}) { let items = [...this.bucket(owner).values()]; if (filters.enabled !== undefined)
        items = items.filter(item => item.enabled === Boolean(filters.enabled)); return Object.freeze(items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))); }
    async get(owner, id) { return this.bucket(owner).get(String(id)) || null; }
    async remove(owner, id) { return this.bucket(owner).delete(String(id)); }
}
