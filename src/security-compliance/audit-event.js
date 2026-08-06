import { fingerprint, securityId } from './ids.js';
import { iso } from './time.js';
import { clean } from './utilities.js';

export function securityAuditEvent(input = {}, previousHash = 'GENESIS') {
  const core = {
    id: input.id || securityId('audit'),
    tenantId: clean(input.tenantId, 190),
    actorId: clean(input.actorId || 'system', 190),
    action: clean(input.action, 190).toUpperCase(),
    resourceType: clean(input.resourceType, 100).toUpperCase(),
    resourceId: clean(input.resourceId, 190),
    outcome: clean(input.outcome || 'SUCCESS', 60).toUpperCase(),
    reason: clean(input.reason, 1000),
    ip: clean(input.ip, 80),
    at: iso(input.at),
    previousHash
  };
  return Object.freeze({ ...core, hash: fingerprint(core) });
}
