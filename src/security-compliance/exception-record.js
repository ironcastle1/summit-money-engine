import { securityId } from './ids.js';
import { addDays, iso } from './time.js';
import { clean } from './utilities.js';

export function exceptionRecord(input = {}) {
  if (!input.controlId || !input.justification) throw new TypeError('Control id and justification are required');
  const createdAt = iso(input.createdAt);
  return Object.freeze({
    id: input.id || securityId('exception', input.controlId),
    tenantId: clean(input.tenantId, 190),
    controlId: clean(input.controlId, 100).toUpperCase(),
    justification: clean(input.justification, 1500),
    compensatingControl: clean(input.compensatingControl, 1000),
    ownerId: clean(input.ownerId, 190),
    approverId: clean(input.approverId, 190),
    state: clean(input.state || 'PENDING', 40).toUpperCase(),
    createdAt,
    expiresAt: iso(input.expiresAt || addDays(createdAt, Number(input.durationDays) || 90)),
    updatedAt: iso()
  });
}
