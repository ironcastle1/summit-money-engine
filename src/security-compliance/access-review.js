import { securityId } from './ids.js';
import { addDays, iso } from './time.js';
import { clean, unique } from './utilities.js';

export function accessReviewRecord(input = {}) {
  const createdAt = iso(input.createdAt);
  const assignments = (input.assignments || []).map(item => Object.freeze({
    userId: clean(item.userId, 190),
    role: clean(item.role, 80).toUpperCase(),
    resourceId: clean(item.resourceId, 190),
    decision: clean(item.decision || 'PENDING', 40).toUpperCase(),
    justification: clean(item.justification, 500)
  }));
  return Object.freeze({
    id: input.id || securityId('review', input.name),
    tenantId: clean(input.tenantId, 190),
    name: clean(input.name || 'Access review', 240),
    reviewerIds: Object.freeze(unique(input.reviewerIds || [])),
    assignments: Object.freeze(assignments),
    state: assignments.every(item => item.decision !== 'PENDING') ? 'COMPLETE' : 'OPEN',
    dueAt: iso(input.dueAt || addDays(createdAt, 30)),
    createdAt,
    updatedAt: iso()
  });
}

export function accessReviewSummary(review) {
  const counts = { PENDING: 0, APPROVE: 0, REVOKE: 0, MODIFY: 0 };
  for (const item of review?.assignments || []) counts[item.decision] = (counts[item.decision] || 0) + 1;
  return Object.freeze({ reviewId: review?.id, total: review?.assignments?.length || 0, counts: Object.freeze(counts), complete: counts.PENDING === 0 });
}
