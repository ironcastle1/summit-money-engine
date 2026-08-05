import { securityId } from './ids.js';
import { addDays, iso } from './time.js';
import { clean, unique } from './utilities.js';

export function policyRecord(input = {}) {
  const approvedAt = input.approvedAt ? iso(input.approvedAt) : null;
  return Object.freeze({
    id: input.id || securityId('policy', input.name),
    tenantId: clean(input.tenantId, 190),
    name: clean(input.name, 300),
    category: clean(input.category || 'SECURITY', 100).toUpperCase(),
    version: clean(input.version || '1.0', 40),
    state: clean(input.state || 'DRAFT', 40).toUpperCase(),
    ownerId: clean(input.ownerId, 190),
    approverIds: Object.freeze(unique(input.approverIds || [])),
    controlIds: Object.freeze(unique(input.controlIds || [])),
    summary: clean(input.summary, 2000),
    approvedAt,
    nextReviewAt: input.nextReviewAt ? iso(input.nextReviewAt) : approvedAt ? iso(addDays(approvedAt, Number(input.reviewDays) || 365)) : null,
    createdAt: iso(input.createdAt),
    updatedAt: iso()
  });
}
