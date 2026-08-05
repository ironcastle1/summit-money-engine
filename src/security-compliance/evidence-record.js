import { securityId, fingerprint } from './ids.js';
import { dueState, iso } from './time.js';
import { clean, unique } from './utilities.js';

export function evidenceRecord(input = {}) {
  const capturedAt = iso(input.capturedAt);
  const expiresAt = input.expiresAt ? iso(input.expiresAt) : null;
  const body = {
    controlId: clean(input.controlId, 100).toUpperCase(),
    title: clean(input.title, 240),
    source: clean(input.source, 240),
    ownerTeam: clean(input.ownerTeam || 'PLATFORM', 120),
    references: unique(input.references || []),
    capturedAt,
    expiresAt
  };
  return Object.freeze({
    id: input.id || securityId('evidence', input.title),
    tenantId: clean(input.tenantId, 190),
    ...body,
    checksum: fingerprint(body),
    state: expiresAt ? dueState(expiresAt, Number(input.warningDays) || 30) : 'CURRENT',
    createdAt: capturedAt,
    updatedAt: iso()
  });
}
