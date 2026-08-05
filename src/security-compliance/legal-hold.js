import { securityId } from './ids.js';
import { iso } from './time.js';
import { clean, unique } from './utilities.js';

export function legalHoldRecord(input = {}) {
  if (!input.matter) throw new TypeError('Legal hold matter is required');
  return Object.freeze({
    id: input.id || securityId('hold', input.matter),
    tenantId: clean(input.tenantId, 190),
    matter: clean(input.matter, 300),
    reason: clean(input.reason, 1000),
    recordIds: Object.freeze(unique(input.recordIds || [])),
    systems: Object.freeze(unique(input.systems || [])),
    custodianIds: Object.freeze(unique(input.custodianIds || [])),
    active: input.active !== false,
    issuedAt: iso(input.issuedAt),
    releasedAt: input.releasedAt ? iso(input.releasedAt) : null,
    updatedAt: iso()
  });
}
