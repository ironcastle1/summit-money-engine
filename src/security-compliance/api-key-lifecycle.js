import { securityId, fingerprint } from './ids.js';
import { addDays, iso, expired } from './time.js';
import { clean, unique } from './utilities.js';

export function apiKeyRecord(input = {}) {
  const rawSecret = String(input.secret || securityId('secret'));
  const createdAt = iso(input.createdAt);
  return Object.freeze({
    id: input.id || securityId('key', input.name),
    tenantId: clean(input.tenantId, 190),
    name: clean(input.name || 'API key', 190),
    prefix: rawSecret.slice(0, 8),
    secretHash: fingerprint(rawSecret),
    scopes: Object.freeze(unique(input.scopes || ['security:read'])),
    state: 'ACTIVE',
    createdAt,
    expiresAt: iso(input.expiresAt || addDays(createdAt, Number(input.ttlDays) || 90)),
    lastUsedAt: null
  });
}

export function apiKeyState(record, now = Date.now()) {
  if (!record || record.state === 'REVOKED') return 'REVOKED';
  return expired(record.expiresAt, now) ? 'EXPIRED' : 'ACTIVE';
}
