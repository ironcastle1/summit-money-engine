import { recordId } from './id.js';
import { clean } from './text.js';
export function noteRecord(input = {}) {
  const now = new Date().toISOString();
  return Object.freeze({ id: clean(input.id, 180) || recordId('note', `${input.caseId}-${now}`), caseId: clean(input.caseId, 180), title: clean(input.title || 'Note', 120), body: clean(input.body, 5000), author: clean(input.author || 'anonymous', 120), pinned: Boolean(input.pinned), createdAt: input.createdAt || now, updatedAt: now });
}
