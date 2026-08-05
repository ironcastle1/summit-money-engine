import { securityId } from './ids.js';
import { addDays, iso } from './time.js';
import { clean, unique } from './utilities.js';

export function subjectRequestRecord(input = {}) {
  const receivedAt = iso(input.receivedAt);
  return Object.freeze({
    id: input.id || securityId('dsr', input.subjectEmail || input.subjectId),
    tenantId: clean(input.tenantId, 190),
    type: clean(input.type || 'ACCESS', 60).toUpperCase(),
    subjectId: clean(input.subjectId, 190),
    subjectEmail: clean(input.subjectEmail, 320).toLowerCase(),
    state: clean(input.state || 'RECEIVED', 60).toUpperCase(),
    systems: Object.freeze(unique(input.systems || [])),
    exemptions: Object.freeze(unique(input.exemptions || [])),
    receivedAt,
    dueAt: iso(input.dueAt || addDays(receivedAt, Number(input.responseDays) || 30)),
    completedAt: input.completedAt ? iso(input.completedAt) : null,
    createdAt: receivedAt,
    updatedAt: iso()
  });
}
