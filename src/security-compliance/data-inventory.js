import { securityId } from './ids.js';
import { classificationRule } from './classification-catalog.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';

export function dataInventoryRecord(input = {}) {
  const classification = classificationRule(input.classification);
  return Object.freeze({
    id: input.id || securityId('data', input.name),
    tenantId: clean(input.tenantId, 190),
    name: clean(input.name, 240),
    system: clean(input.system, 190),
    ownerTeam: clean(input.ownerTeam || 'PLATFORM', 120),
    classification: classification.id,
    categories: Object.freeze(unique(input.categories || [])),
    dataSubjects: Object.freeze(unique(input.dataSubjects || [])),
    purposes: Object.freeze(unique(input.purposes || [])),
    legalBasis: clean(input.legalBasis || 'CONTRACT', 80).toUpperCase(),
    region: clean(input.region || 'UK', 40).toUpperCase(),
    retentionScheduleId: clean(input.retentionScheduleId || 'CUSTOMER_DATA', 80).toUpperCase(),
    processors: Object.freeze(unique(input.processors || [])),
    encryptionRequired: classification.encryptionRequired,
    createdAt: iso(input.createdAt),
    updatedAt: iso()
  });
}
