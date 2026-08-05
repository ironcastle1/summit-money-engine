import { TASK_STATUSES } from './constants.js';
import { recordId } from './id.js';
import { clean } from './text.js';
export function taskRecord(input = {}) {
  const now = new Date().toISOString();
  const status = TASK_STATUSES.includes(String(input.status).toUpperCase()) ? String(input.status).toUpperCase() : 'OPEN';
  return Object.freeze({ id: clean(input.id, 180) || recordId('task', `${input.caseId}-${input.title}`), caseId: clean(input.caseId, 180), title: clean(input.title || 'Task', 200), status, owner: clean(input.owner || 'unassigned', 120), dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null, priority: Math.max(0, Math.min(100, Number(input.priority || 50))), createdAt: input.createdAt || now, updatedAt: now });
}
