import { WORKSPACE_LIMITS } from './constants.js';
import { workspaceRecord } from './workspace-schema.js';

export class WorkspaceStore {
  constructor(options = {}) {
    this.maximum = Math.max(10, Number(options.maximum) || WORKSPACE_LIMITS.workspaces);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, new Map());
    return this.owners.get(key);
  }

  async list(owner, filters = {}) {
    const query = String(filters.query || '').trim().toLowerCase();
    const tag = String(filters.tag || '').trim().toLowerCase();
    const items = [...this.bucket(owner).values()]
      .filter(item => !query || `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(query))
      .filter(item => !tag || item.tags.some(value => value.toLowerCase() === tag))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return Object.freeze(items.slice(0, Math.max(1, Math.min(1000, Number(filters.limit) || 250))));
  }

  async get(owner, id) {
    return this.bucket(owner).get(String(id)) || null;
  }

  async put(owner, input) {
    const bucket = this.bucket(owner);
    const existing = input.id ? bucket.get(String(input.id)) : null;
    const record = workspaceRecord({
      ...existing,
      ...input,
      owner,
      createdAt: existing?.createdAt || input.createdAt
    });
    if (!bucket.has(record.id) && bucket.size >= this.maximum) throw new RangeError(`Maximum ${this.maximum} workspaces reached`);
    bucket.set(record.id, record);
    return record;
  }

  async clone(owner, id, input = {}) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    return this.put(owner, {
      ...existing,
      id: undefined,
      name: input.name || `${existing.name} copy`,
      description: input.description ?? existing.description,
      createdAt: undefined
    });
  }

  async attachCase(owner, id, caseId) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    return this.put(owner, { ...existing, caseIds: [...new Set([...existing.caseIds, String(caseId)])] });
  }

  async detachCase(owner, id, caseId) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    return this.put(owner, { ...existing, caseIds: existing.caseIds.filter(value => value !== String(caseId)) });
  }

  async remove(owner, id) {
    return this.bucket(owner).delete(String(id));
  }

  async summary(owner) {
    const items = await this.list(owner, { limit: 1000 });
    return Object.freeze({
      total: items.length,
      linkedCases: new Set(items.flatMap(item => item.caseIds)).size,
      savedViews: items.reduce((sum, item) => sum + item.views.length, 0),
      tags: [...new Set(items.flatMap(item => item.tags))].sort()
    });
  }
}
