import { DECISION_STATUSES } from './constants.js';
import { recordId } from './id.js';
import { clean } from './text.js';

const TRANSITIONS = Object.freeze({
  PROPOSED: Object.freeze(['APPROVED', 'REJECTED', 'SUPERSEDED']),
  APPROVED: Object.freeze(['COMPLETED', 'SUPERSEDED']),
  REJECTED: Object.freeze(['PROPOSED', 'SUPERSEDED']),
  SUPERSEDED: Object.freeze([]),
  COMPLETED: Object.freeze(['SUPERSEDED'])
});

export function decisionRecord(input = {}) {
  const now = new Date().toISOString();
  const status = DECISION_STATUSES.includes(String(input.status).toUpperCase()) ? String(input.status).toUpperCase() : 'PROPOSED';
  return Object.freeze({
    id: clean(input.id, 180) || recordId('decision', `${input.caseId}-${input.title}`),
    caseId: clean(input.caseId, 180),
    title: clean(input.title || 'Decision', 200),
    rationale: clean(input.rationale, 5000),
    status,
    owner: clean(input.owner || 'unassigned', 120),
    approver: clean(input.approver, 120),
    alternatives: Object.freeze((input.alternatives || []).map(value => clean(value, 1000)).filter(Boolean).slice(0, 30)),
    evidenceSignalIds: Object.freeze((input.evidenceSignalIds || []).map(String).slice(0, 500)),
    assumptions: Object.freeze((input.assumptions || []).map(value => clean(value, 1000)).filter(Boolean).slice(0, 50)),
    expectedOutcomes: Object.freeze((input.expectedOutcomes || []).map(value => clean(value, 1000)).filter(Boolean).slice(0, 50)),
    reviewAt: input.reviewAt ? new Date(input.reviewAt).toISOString() : null,
    decidedAt: input.decidedAt ? new Date(input.decidedAt).toISOString() : null,
    completedAt: input.completedAt ? new Date(input.completedAt).toISOString() : null,
    history: Object.freeze((input.history || []).slice(0, 250)),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}

function transitionHistory(from, to, actor, reason) {
  return Object.freeze({ from, to, actor: clean(actor || 'system', 120), reason: clean(reason, 2000), time: new Date().toISOString() });
}

export class DecisionRegister {
  constructor(options = {}) {
    this.maximum = Math.max(100, Number(options.maximum) || 1_000);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, new Map());
    return this.owners.get(key);
  }

  async list(owner, caseId, filters = {}) {
    const status = filters.status ? String(filters.status).toUpperCase() : null;
    const assignedTo = filters.owner ? String(filters.owner) : null;
    const dueForReview = filters.dueForReview === true;
    const now = Number(filters.now) || Date.now();
    const limit = Math.max(1, Math.min(1000, Number(filters.limit) || 500));
    return Object.freeze([...this.bucket(owner).values()]
      .filter(item => !caseId || item.caseId === String(caseId))
      .filter(item => !status || item.status === status)
      .filter(item => !assignedTo || item.owner === assignedTo)
      .filter(item => !dueForReview || (item.reviewAt && Date.parse(item.reviewAt) <= now))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, limit));
  }

  async get(owner, id) {
    return this.bucket(owner).get(String(id)) || null;
  }

  async put(owner, input) {
    const bucket = this.bucket(owner);
    const existing = input.id ? bucket.get(String(input.id)) : null;
    const item = decisionRecord({ ...existing, ...input, createdAt: existing?.createdAt || input.createdAt });
    if (!bucket.has(item.id) && bucket.size >= this.maximum) throw new RangeError(`Maximum ${this.maximum} decisions reached`);
    bucket.set(item.id, item);
    return item;
  }

  async transition(owner, id, status, input = {}) {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    const target = String(status).toUpperCase();
    if (!DECISION_STATUSES.includes(target)) throw new TypeError(`Invalid decision state ${status}`);
    if (!TRANSITIONS[existing.status]?.includes(target)) throw new Error(`Decision transition ${existing.status} → ${target} is not allowed`);
    const now = new Date().toISOString();
    return this.put(owner, {
      ...existing,
      status: target,
      approver: input.approver || existing.approver,
      rationale: input.rationale || existing.rationale,
      decidedAt: ['APPROVED', 'REJECTED'].includes(target) ? now : existing.decidedAt,
      completedAt: target === 'COMPLETED' ? now : existing.completedAt,
      history: [...existing.history, transitionHistory(existing.status, target, input.actor || owner, input.reason)]
    });
  }

  async remove(owner, id) {
    return this.bucket(owner).delete(String(id));
  }

  async summary(owner) {
    const items = await this.list(owner, null, { limit: 1000 });
    const byStatus = Object.fromEntries(DECISION_STATUSES.map(status => [status, 0]));
    for (const item of items) byStatus[item.status] += 1;
    return Object.freeze({ total: items.length, byStatus: Object.freeze(byStatus), dueForReview: items.filter(item => item.reviewAt && Date.parse(item.reviewAt) <= Date.now() && !['SUPERSEDED', 'COMPLETED'].includes(item.status)).length });
  }
}
