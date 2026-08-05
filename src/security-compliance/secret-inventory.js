import { securityId } from './ids.js';
import { addDays, iso } from './time.js';
import { clean } from './utilities.js';

export function secretRecord(input = {}) {
  const createdAt = iso(input.createdAt);
  return Object.freeze({
    id: input.id || securityId('secret', input.name),
    tenantId: clean(input.tenantId, 190),
    name: clean(input.name, 190),
    system: clean(input.system, 190),
    ownerTeam: clean(input.ownerTeam || 'PLATFORM', 120),
    storage: clean(input.storage || 'ENVIRONMENT', 80).toUpperCase(),
    rotationDays: Math.max(1, Number(input.rotationDays) || 90),
    lastRotatedAt: iso(input.lastRotatedAt || createdAt),
    nextRotationAt: iso(input.nextRotationAt || addDays(input.lastRotatedAt || createdAt, Number(input.rotationDays) || 90)),
    active: input.active !== false,
    createdAt,
    updatedAt: iso()
  });
}
