import { noteRecord } from './note-schema.js';
import { taskRecord } from './task-schema.js';
import { clean } from './text.js';

function sorted(items, compare) {
  return Object.freeze([...items].sort(compare));
}

export class ActivityStore {
  constructor(options = {}) {
    this.maximumNotes = Math.max(100, Number(options.maximumNotes) || 2_000);
    this.maximumTasks = Math.max(100, Number(options.maximumTasks) || 2_000);
    this.maximumActivity = Math.max(250, Number(options.maximumActivity) || 10_000);
    this.notes = new Map();
    this.tasks = new Map();
    this.activity = new Map();
  }

  bucket(store, owner = 'anonymous') {
    const key = String(owner);
    if (!store.has(key)) store.set(key, new Map());
    return store.get(key);
  }

  enforceLimit(bucket, maximum) {
    if (bucket.size <= maximum) return;
    const entries = [...bucket.values()].sort((a, b) => Date.parse(a.updatedAt || a.time) - Date.parse(b.updatedAt || b.time));
    for (const item of entries.slice(0, bucket.size - maximum)) bucket.delete(item.id);
  }

  record(owner, input) {
    const bucket = this.bucket(this.activity, owner);
    const now = new Date().toISOString();
    const item = Object.freeze({
      id: clean(input.id || `activity-${input.type}-${input.resourceId || Date.now()}`, 200),
      type: clean(input.type || 'UPDATE', 60).toUpperCase(),
      action: clean(input.action || 'UPSERT', 60).toUpperCase(),
      title: clean(input.title || 'Activity', 240),
      actor: clean(input.actor || owner, 120),
      caseId: clean(input.caseId, 180),
      resourceId: clean(input.resourceId, 180),
      score: Number(input.score || 0),
      metadata: Object.freeze(input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {}),
      time: input.time ? new Date(input.time).toISOString() : now
    });
    bucket.set(item.id, item);
    this.enforceLimit(bucket, this.maximumActivity);
    return item;
  }

  async putNote(owner, input) {
    const bucket = this.bucket(this.notes, owner);
    const existing = input.id ? bucket.get(String(input.id)) : null;
    const item = noteRecord({
      ...existing,
      ...input,
      author: input.author || existing?.author || owner,
      createdAt: existing?.createdAt || input.createdAt
    });
    bucket.set(item.id, item);
    this.enforceLimit(bucket, this.maximumNotes);
    this.record(owner, {
      id: `activity-note-${item.id}-${Date.now()}`,
      type: 'NOTE',
      action: existing ? 'UPDATED' : 'CREATED',
      title: item.title,
      actor: input.actor || owner,
      resourceId: item.id,
      caseId: item.caseId,
      metadata: { pinned: item.pinned }
    });
    return item;
  }

  async getNote(owner, id) {
    return this.bucket(this.notes, owner).get(String(id)) || null;
  }

  async listNotes(owner, caseId, filters = {}) {
    const query = String(filters.query || '').trim().toLowerCase();
    const pinned = filters.pinned === undefined ? null : Boolean(filters.pinned);
    const limit = Math.max(1, Math.min(2000, Number(filters.limit) || 500));
    const items = [...this.bucket(this.notes, owner).values()]
      .filter(item => !caseId || item.caseId === String(caseId))
      .filter(item => pinned === null || item.pinned === pinned)
      .filter(item => !query || `${item.title} ${item.body} ${item.author}`.toLowerCase().includes(query));
    return sorted(items, (a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, limit);
  }

  async removeNote(owner, id, actor = owner) {
    const bucket = this.bucket(this.notes, owner);
    const existing = bucket.get(String(id));
    if (!existing) return false;
    bucket.delete(existing.id);
    this.record(owner, { type: 'NOTE', action: 'REMOVED', title: existing.title, actor, resourceId: existing.id, caseId: existing.caseId });
    return true;
  }

  async putTask(owner, input) {
    const bucket = this.bucket(this.tasks, owner);
    const existing = input.id ? bucket.get(String(input.id)) : null;
    const item = taskRecord({
      ...existing,
      ...input,
      createdAt: existing?.createdAt || input.createdAt
    });
    bucket.set(item.id, item);
    this.enforceLimit(bucket, this.maximumTasks);
    this.record(owner, {
      id: `activity-task-${item.id}-${Date.now()}`,
      type: 'TASK',
      action: existing ? 'UPDATED' : 'CREATED',
      title: item.title,
      actor: input.actor || owner,
      resourceId: item.id,
      caseId: item.caseId,
      score: item.priority,
      metadata: { status: item.status, assignedTo: item.owner, dueAt: item.dueAt }
    });
    return item;
  }

  async getTask(owner, id) {
    return this.bucket(this.tasks, owner).get(String(id)) || null;
  }

  async transitionTask(owner, id, status, input = {}) {
    const existing = await this.getTask(owner, id);
    if (!existing) return null;
    return this.putTask(owner, { ...existing, ...input, id: existing.id, status, actor: input.actor || owner });
  }

  async listTasks(owner, caseId, filters = {}) {
    const status = filters.status ? String(filters.status).toUpperCase() : null;
    const assignedTo = filters.assignedTo ? String(filters.assignedTo) : null;
    const minimumPriority = Math.max(0, Number(filters.minimumPriority) || 0);
    const dueBefore = filters.dueBefore ? Date.parse(filters.dueBefore) : Number.POSITIVE_INFINITY;
    const limit = Math.max(1, Math.min(2000, Number(filters.limit) || 500));
    const items = [...this.bucket(this.tasks, owner).values()]
      .filter(item => !caseId || item.caseId === String(caseId))
      .filter(item => !status || item.status === status)
      .filter(item => !assignedTo || item.owner === assignedTo)
      .filter(item => item.priority >= minimumPriority)
      .filter(item => !item.dueAt || Date.parse(item.dueAt) <= dueBefore);
    return sorted(items, (a, b) => {
      const aClosed = ['DONE', 'CANCELLED'].includes(a.status);
      const bClosed = ['DONE', 'CANCELLED'].includes(b.status);
      return Number(aClosed) - Number(bClosed) || b.priority - a.priority || Date.parse(a.dueAt || '9999-12-31') - Date.parse(b.dueAt || '9999-12-31');
    }).slice(0, limit);
  }

  async removeTask(owner, id, actor = owner) {
    const bucket = this.bucket(this.tasks, owner);
    const existing = bucket.get(String(id));
    if (!existing) return false;
    bucket.delete(existing.id);
    this.record(owner, { type: 'TASK', action: 'REMOVED', title: existing.title, actor, resourceId: existing.id, caseId: existing.caseId });
    return true;
  }

  async listActivity(owner, limit = 250, filters = {}) {
    const type = filters.type ? String(filters.type).toUpperCase() : null;
    const caseId = filters.caseId ? String(filters.caseId) : null;
    const since = filters.since ? Date.parse(filters.since) : Number.NEGATIVE_INFINITY;
    const items = [...this.bucket(this.activity, owner).values()]
      .filter(item => !type || item.type === type)
      .filter(item => !caseId || item.caseId === caseId)
      .filter(item => Date.parse(item.time) >= since);
    return sorted(items, (a, b) => Date.parse(b.time) - Date.parse(a.time)).slice(0, Math.max(1, Math.min(5000, Number(limit) || 250)));
  }

  async summary(owner) {
    const [notes, tasks, activity] = await Promise.all([
      this.listNotes(owner, null, { limit: 2000 }),
      this.listTasks(owner, null, { limit: 2000 }),
      this.listActivity(owner, 10_000)
    ]);
    const openTasks = tasks.filter(item => !['DONE', 'CANCELLED'].includes(item.status));
    const overdue = openTasks.filter(item => item.dueAt && Date.parse(item.dueAt) < Date.now());
    return Object.freeze({ notes: notes.length, pinnedNotes: notes.filter(item => item.pinned).length, tasks: tasks.length, openTasks: openTasks.length, overdueTasks: overdue.length, activity: activity.length });
  }
}
