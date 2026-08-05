import { createHash } from 'node:crypto';
import { recordId } from './id.js';
import { clean } from './text.js';

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function digest(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

export function auditEntry(input = {}, previousHash = 'GENESIS') {
  const time = input.time ? new Date(input.time).toISOString() : new Date().toISOString();
  const payload = Object.freeze({
    action: clean(input.action || 'UPDATE', 80).toUpperCase(),
    resourceType: clean(input.resourceType || 'RESOURCE', 80).toUpperCase(),
    resourceId: clean(input.resourceId, 180),
    actor: clean(input.actor || 'system', 120),
    reason: clean(input.reason, 1000),
    changes: Object.freeze(input.changes && typeof input.changes === 'object' ? { ...input.changes } : {}),
    metadata: Object.freeze(input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {}),
    time,
    previousHash
  });
  const hash = digest(payload);
  return Object.freeze({
    id: clean(input.id, 180) || recordId('audit', `${payload.resourceType}-${payload.resourceId}-${time}-${hash.slice(0, 12)}`),
    ...payload,
    hash
  });
}

export class DecisionAuditTrail {
  constructor(options = {}) {
    this.maximumPerOwner = Math.max(100, Number(options.maximumPerOwner) || 10_000);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, []);
    return this.owners.get(key);
  }

  async append(owner, input) {
    const bucket = this.bucket(owner);
    const previousHash = bucket.at(-1)?.hash || 'GENESIS';
    const entry = auditEntry(input, previousHash);
    bucket.push(entry);
    if (bucket.length > this.maximumPerOwner) bucket.splice(0, bucket.length - this.maximumPerOwner);
    return entry;
  }

  async list(owner, filters = {}) {
    const resourceType = filters.resourceType ? String(filters.resourceType).toUpperCase() : null;
    const resourceId = filters.resourceId ? String(filters.resourceId) : null;
    const actor = filters.actor ? String(filters.actor) : null;
    const since = filters.since ? Date.parse(filters.since) : Number.NEGATIVE_INFINITY;
    const until = filters.until ? Date.parse(filters.until) : Number.POSITIVE_INFINITY;
    const limit = Math.max(1, Math.min(1000, Number(filters.limit) || 250));
    return Object.freeze(this.bucket(owner)
      .filter(entry => !resourceType || entry.resourceType === resourceType)
      .filter(entry => !resourceId || entry.resourceId === resourceId)
      .filter(entry => !actor || entry.actor === actor)
      .filter(entry => Date.parse(entry.time) >= since && Date.parse(entry.time) <= until)
      .slice(-limit)
      .reverse());
  }

  async verify(owner) {
    const entries = this.bucket(owner);
    const failures = [];
    let previousHash = 'GENESIS';
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const payload = {
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        actor: entry.actor,
        reason: entry.reason,
        changes: entry.changes,
        metadata: entry.metadata,
        time: entry.time,
        previousHash
      };
      if (entry.previousHash !== previousHash || entry.hash !== digest(payload)) failures.push(entry.id);
      previousHash = entry.hash;
    }
    return Object.freeze({ valid: failures.length === 0, entries: entries.length, failures: Object.freeze(failures) });
  }

  async export(owner) {
    const entries = Object.freeze([...this.bucket(owner)]);
    const verification = await this.verify(owner);
    return Object.freeze({ owner: String(owner), generatedAt: new Date().toISOString(), verification, entries });
  }
}
