import { CASE_STATUSES } from './constants.js';
import { recordId } from './id.js';
import { clean } from './text.js';
export function caseFileRecord(input = {}) {
  const now = new Date().toISOString();
  const status = CASE_STATUSES.includes(String(input.status).toUpperCase()) ? String(input.status).toUpperCase() : 'OPEN';
  return Object.freeze({
    id: clean(input.id, 180) || recordId('case', input.title),
    title: clean(input.title || 'Case file', 160),
    summary: clean(input.summary, 1200),
    status,
    priority: Math.max(0, Math.min(100, Number(input.priority || 50))),
    signalIds: Object.freeze((input.signalIds || []).map(String).slice(0, 500)),
    noteIds: Object.freeze((input.noteIds || []).map(String).slice(0, 1000)),
    taskIds: Object.freeze((input.taskIds || []).map(String).slice(0, 1000)),
    decisionIds: Object.freeze((input.decisionIds || []).map(String).slice(0, 500)),
    tags: Object.freeze((input.tags || []).map(value => clean(value, 40)).filter(Boolean).slice(0, 40)),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
