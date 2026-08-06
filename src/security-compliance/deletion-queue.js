import { securityId } from './ids.js';
import { iso } from './time.js';
import { unique } from './utilities.js';

export function deletionJob(input = {}) {
  const recordIds = unique(input.recordIds || []);
  if (!recordIds.length) throw new TypeError('Deletion job requires record ids');
  return Object.freeze({
    id: input.id || securityId('delete', input.reason),
    tenantId: String(input.tenantId || ''),
    recordIds: Object.freeze(recordIds),
    reason: String(input.reason || 'RETENTION').toUpperCase(),
    state: String(input.state || 'QUEUED').toUpperCase(),
    verificationRequired: input.verificationRequired !== false,
    requestedBy: String(input.requestedBy || ''),
    requestedAt: iso(input.requestedAt),
    completedAt: input.completedAt ? iso(input.completedAt) : null,
    proof: input.proof || null
  });
}
