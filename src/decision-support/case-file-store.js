import { WORKSPACE_LIMITS } from './constants.js';
import { caseFileRecord } from './case-file-schema.js';

export class CaseFileStore {
  constructor(options = {}) {
    this.maximum = Math.max(10, Number(options.maximum) || WORKSPACE_LIMITS.cases);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, new Map());
    return this.owners.get(key);
  }

  async list(owner, filters = {}) {
    const query = String(filters.query || '').trim().toLowerCase();
    const status = filters.status ? String(filters.status).toUpperCase() : null;
    const tag = String(filters.tag || '').trim().toLowerCase();
    const minimumPriority = Math.max(0, Number(filters.minimumPriority) || 0);
    const items = [...this.bucket(owner).values()]
      .filter(item => !status || item.status === status)
      .filter(item => item.priority >= minimumPriority)
      .filter(item => !tag || item.tags.some(value => value.toLowerCase() === tag))
      .filter(item => !query || `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase().includes(query))
      .sort((a, b) => b.priority - a.priority || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return Object.freeze(items.slice(0, Math.max(1, Math.min(1000, Number(filters.limit) || 500))));
  }

  async get(owner, id) {
    return this.bucket(owner).get(String(id)) || null;
  }

  async put(owner, input) {
    const bucket = this.bucket(owner);
    const existing = input.id ? bucket.get(String(input.id)) : null;
    const record = caseFileRecord({
      ...existing,
      ...input,
      createdAt: existing?.createdAt || input.createdAt
    });
    if (!bucket.has(record.id) && bucket.size >= this.maximum) throw new RangeError(`Maximum ${this.maximum} cases reached`);
    bucket.set(record.id, record);
    return record;
  }

  async transition(owner, id, status, input = {}) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    return this.put(owner, { ...existing, ...input, status });
  }

  async linkSignal(owner, id, signalId) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    return this.put(owner, { ...existing, signalIds: [...new Set([...existing.signalIds, String(signalId)])] });
  }

  async unlinkSignal(owner, id, signalId) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    return this.put(owner, { ...existing, signalIds: existing.signalIds.filter(value => value !== String(signalId)) });
  }

  async attach(owner, id, type, resourceId) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    const field = { note: 'noteIds', task: 'taskIds', decision: 'decisionIds' }[String(type).toLowerCase()];
    if (!field) throw new TypeError(`Unsupported case attachment type ${type}`);
    return this.put(owner, { ...existing, [field]: [...new Set([...existing[field], String(resourceId)])] });
  }

  async detach(owner, id, type, resourceId) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    const field = { note: 'noteIds', task: 'taskIds', decision: 'decisionIds' }[String(type).toLowerCase()];
    if (!field) throw new TypeError(`Unsupported case attachment type ${type}`);
    return this.put(owner, { ...existing, [field]: existing[field].filter(value => value !== String(resourceId)) });
  }

  async remove(owner, id) {
    return this.bucket(owner).delete(String(id));
  }

  async summary(owner) {
    const items = await this.list(owner, { limit: 1000 });
    const byStatus = {};
    for (const item of items) byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    return Object.freeze({
      total: items.length,
      open: items.filter(item => !['RESOLVED', 'ARCHIVED'].includes(item.status)).length,
      critical: items.filter(item => item.priority >= 85).length,
      linkedSignals: new Set(items.flatMap(item => item.signalIds)).size,
      byStatus: Object.freeze(byStatus)
    });
  }
}
