import { clean } from './text.js';

export const SLA_STATES = Object.freeze(['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'BREACHED', 'CANCELLED']);

function iso(value, fallback = Date.now()) {
  const timestamp = value ? Date.parse(value) : fallback;
  return new Date(Number.isFinite(timestamp) ? timestamp : fallback).toISOString();
}

export function slaRecord(input = {}) {
  const createdAt = iso(input.createdAt);
  const acknowledgeMinutes = Math.max(1, Math.min(10_080, Number(input.acknowledgeMinutes) || 30));
  const resolveMinutes = Math.max(acknowledgeMinutes, Math.min(43_200, Number(input.resolveMinutes) || 240));
  const state = SLA_STATES.includes(String(input.state).toUpperCase()) ? String(input.state).toUpperCase() : 'PENDING';
  return Object.freeze({
    id: clean(input.id || `sla-${input.signalId || Date.now()}`, 180),
    signalId: clean(input.signalId, 180),
    caseId: clean(input.caseId, 180),
    policyId: clean(input.policyId, 120),
    owner: clean(input.owner || 'unassigned', 120),
    targetRole: clean(input.targetRole || 'ANALYST', 80).toUpperCase(),
    state,
    createdAt,
    acknowledgeDueAt: iso(input.acknowledgeDueAt, Date.parse(createdAt) + acknowledgeMinutes * 60_000),
    resolveDueAt: iso(input.resolveDueAt, Date.parse(createdAt) + resolveMinutes * 60_000),
    acknowledgedAt: input.acknowledgedAt ? iso(input.acknowledgedAt) : null,
    resolvedAt: input.resolvedAt ? iso(input.resolvedAt) : null,
    updatedAt: iso(input.updatedAt),
    notes: Object.freeze((input.notes || []).map(value => clean(value, 500)).filter(Boolean).slice(0, 100))
  });
}

export function evaluateSla(record, now = Date.now()) {
  const current = Number(now) || Date.now();
  const acknowledgeDue = Date.parse(record.acknowledgeDueAt);
  const resolveDue = Date.parse(record.resolveDueAt);
  const terminal = ['RESOLVED', 'CANCELLED'].includes(record.state);
  const acknowledgementBreached = !record.acknowledgedAt && current > acknowledgeDue;
  const resolutionBreached = !terminal && current > resolveDue;
  const nextDueAt = record.acknowledgedAt ? record.resolveDueAt : record.acknowledgeDueAt;
  const remainingMinutes = Math.round((Date.parse(nextDueAt) - current) / 60_000);
  return Object.freeze({
    ...record,
    health: terminal ? 'CLOSED' : resolutionBreached ? 'BREACHED' : acknowledgementBreached ? 'ACK_BREACHED' : remainingMinutes <= 15 ? 'AT_RISK' : 'ON_TRACK',
    acknowledgementBreached,
    resolutionBreached,
    remainingMinutes,
    nextDueAt
  });
}

export class SlaTracker {
  constructor(options = {}) {
    this.maximumPerOwner = Math.max(100, Number(options.maximumPerOwner) || 5_000);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, new Map());
    return this.owners.get(key);
  }

  async create(owner, input) {
    const bucket = this.bucket(owner);
    const item = slaRecord({ ...input, owner: input.owner || owner });
    if (!bucket.has(item.id) && bucket.size >= this.maximumPerOwner) throw new RangeError('SLA record limit reached');
    bucket.set(item.id, item);
    return evaluateSla(item);
  }

  async transition(owner, id, state, input = {}) {
    const bucket = this.bucket(owner);
    const existing = bucket.get(String(id));
    if (!existing) return null;
    const nextState = String(state).toUpperCase();
    if (!SLA_STATES.includes(nextState)) throw new TypeError(`Invalid SLA state ${state}`);
    const now = new Date().toISOString();
    const updated = slaRecord({
      ...existing,
      ...input,
      state: nextState,
      acknowledgedAt: ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'].includes(nextState) ? existing.acknowledgedAt || now : existing.acknowledgedAt,
      resolvedAt: nextState === 'RESOLVED' ? now : existing.resolvedAt,
      updatedAt: now
    });
    bucket.set(updated.id, updated);
    return evaluateSla(updated);
  }

  async list(owner, filters = {}) {
    const state = filters.state ? String(filters.state).toUpperCase() : null;
    const health = filters.health ? String(filters.health).toUpperCase() : null;
    const items = [...this.bucket(owner).values()].map(item => evaluateSla(item, filters.now));
    return Object.freeze(items
      .filter(item => !state || item.state === state)
      .filter(item => !health || item.health === health)
      .sort((a, b) => Date.parse(a.nextDueAt) - Date.parse(b.nextDueAt))
      .slice(0, Math.max(1, Math.min(1000, Number(filters.limit) || 250))));
  }

  async summary(owner, now = Date.now()) {
    const items = await this.list(owner, { now, limit: 5000 });
    const counts = { total: items.length, onTrack: 0, atRisk: 0, breached: 0, closed: 0 };
    for (const item of items) {
      if (item.health === 'ON_TRACK') counts.onTrack += 1;
      else if (item.health === 'AT_RISK') counts.atRisk += 1;
      else if (item.health === 'CLOSED') counts.closed += 1;
      else counts.breached += 1;
    }
    const active = Math.max(1, counts.total - counts.closed);
    return Object.freeze({ ...counts, compliancePercent: Math.round(((counts.onTrack + counts.atRisk) / active) * 1000) / 10 });
  }
}
