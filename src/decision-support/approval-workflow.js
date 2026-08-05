import { recordId } from './id.js';
import { clean } from './text.js';

export const APPROVAL_STATES = Object.freeze(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']);

function transitionAllowed(from, to) {
  const transitions = {
    DRAFT: ['SUBMITTED', 'WITHDRAWN'],
    SUBMITTED: ['IN_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
    IN_REVIEW: ['APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
    APPROVED: [],
    REJECTED: ['DRAFT'],
    WITHDRAWN: ['DRAFT'],
    EXPIRED: ['DRAFT']
  };
  return transitions[from]?.includes(to) || false;
}

export function approvalRecord(input = {}) {
  const now = new Date().toISOString();
  const state = APPROVAL_STATES.includes(String(input.state).toUpperCase()) ? String(input.state).toUpperCase() : 'DRAFT';
  return Object.freeze({
    id: clean(input.id, 180) || recordId('approval', `${input.resourceType}-${input.resourceId}`),
    resourceType: clean(input.resourceType || 'REPORT', 80).toUpperCase(),
    resourceId: clean(input.resourceId, 180),
    title: clean(input.title || 'Approval request', 200),
    state,
    requestedBy: clean(input.requestedBy || 'anonymous', 120),
    assignedTo: clean(input.assignedTo || 'unassigned', 120),
    requiredRole: clean(input.requiredRole || 'APPROVER', 80).toUpperCase(),
    reason: clean(input.reason, 2000),
    decisionNote: clean(input.decisionNote, 2000),
    expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
    submittedAt: input.submittedAt ? new Date(input.submittedAt).toISOString() : null,
    decidedAt: input.decidedAt ? new Date(input.decidedAt).toISOString() : null,
    history: Object.freeze((input.history || []).slice(0, 250)),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}

function historyEntry(from, to, actor, note) {
  return Object.freeze({ from, to, actor: clean(actor || 'system', 120), note: clean(note, 1000), time: new Date().toISOString() });
}

export class ApprovalWorkflowStore {
  constructor(options = {}) {
    this.maximum = Math.max(100, Number(options.maximum) || 2_000);
    this.owners = new Map();
  }

  bucket(owner = 'anonymous') {
    const key = String(owner);
    if (!this.owners.has(key)) this.owners.set(key, new Map());
    return this.owners.get(key);
  }

  async create(owner, input) {
    const bucket = this.bucket(owner);
    const item = approvalRecord(input);
    if (!bucket.has(item.id) && bucket.size >= this.maximum) throw new RangeError('Approval workflow limit reached');
    bucket.set(item.id, item);
    return item;
  }

  async get(owner, id) {
    const item = this.bucket(owner).get(String(id));
    if (!item) return null;
    if (item.expiresAt && Date.parse(item.expiresAt) < Date.now() && !['APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(item.state)) {
      return this.transition(owner, item.id, 'EXPIRED', { actor: 'system', note: 'Approval window expired' });
    }
    return item;
  }

  async transition(owner, id, targetState, input = {}) {
    const bucket = this.bucket(owner);
    const existing = bucket.get(String(id));
    if (!existing) return null;
    const target = String(targetState).toUpperCase();
    if (!APPROVAL_STATES.includes(target)) throw new TypeError(`Invalid approval state ${targetState}`);
    if (!transitionAllowed(existing.state, target)) throw new Error(`Approval transition ${existing.state} → ${target} is not allowed`);
    const now = new Date().toISOString();
    const history = [...existing.history, historyEntry(existing.state, target, input.actor, input.note)];
    const updated = approvalRecord({
      ...existing,
      state: target,
      assignedTo: input.assignedTo ?? existing.assignedTo,
      decisionNote: ['APPROVED', 'REJECTED'].includes(target) ? input.note : existing.decisionNote,
      submittedAt: target === 'SUBMITTED' ? now : existing.submittedAt,
      decidedAt: ['APPROVED', 'REJECTED'].includes(target) ? now : existing.decidedAt,
      history
    });
    bucket.set(updated.id, updated);
    return updated;
  }

  async list(owner, filters = {}) {
    const state = filters.state ? String(filters.state).toUpperCase() : null;
    const resourceType = filters.resourceType ? String(filters.resourceType).toUpperCase() : null;
    const assignedTo = filters.assignedTo ? String(filters.assignedTo) : null;
    const results = [];
    for (const id of this.bucket(owner).keys()) {
      const item = await this.get(owner, id);
      if (!state || item.state === state) {
        if (!resourceType || item.resourceType === resourceType) {
          if (!assignedTo || item.assignedTo === assignedTo) results.push(item);
        }
      }
    }
    results.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return Object.freeze(results.slice(0, Math.max(1, Math.min(1000, Number(filters.limit) || 250))));
  }
}
