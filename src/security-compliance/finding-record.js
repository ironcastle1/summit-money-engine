import { securityId } from './ids.js';
import { iso } from './time.js';
import { clean, unique } from './utilities.js';

export function findingRecord(input = {}) {
  return Object.freeze({
    id: input.id || securityId('finding', input.title),
    tenantId: clean(input.tenantId, 190),
    title: clean(input.title, 300),
    description: clean(input.description, 2000),
    source: clean(input.source || 'ASSESSMENT', 100).toUpperCase(),
    severity: clean(input.severity || 'MEDIUM', 40).toUpperCase(),
    state: clean(input.state || 'OPEN', 40).toUpperCase(),
    controlIds: Object.freeze(unique(input.controlIds || [])),
    ownerId: clean(input.ownerId, 190),
    remediation: clean(input.remediation, 1500),
    dueAt: input.dueAt ? iso(input.dueAt) : null,
    createdAt: iso(input.createdAt),
    closedAt: input.closedAt ? iso(input.closedAt) : null,
    updatedAt: iso()
  });
}
