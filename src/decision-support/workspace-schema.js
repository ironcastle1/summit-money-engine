import { WORKSPACE_LIMITS } from './constants.js';
import { recordId } from './id.js';
import { clean } from './text.js';
export function workspaceRecord(input = {}) {
  const now = new Date().toISOString();
  return Object.freeze({
    id: clean(input.id, 180) || recordId('workspace', input.name),
    name: clean(input.name || 'Workspace', 100),
    description: clean(input.description, 500),
    filters: Object.freeze(input.filters || {}),
    views: Object.freeze((input.views || []).slice(0, 50)),
    caseIds: Object.freeze((input.caseIds || []).map(String).slice(0, WORKSPACE_LIMITS.cases)),
    tags: Object.freeze((input.tags || []).map(value => clean(value, 40)).filter(Boolean).slice(0, 30)),
    owner: clean(input.owner || 'anonymous', 120),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
