import { randomUUID } from 'node:crypto';

export function createAuditEvent(input) {
  return {
    id: input.id || randomUUID(),
    at: input.at || new Date().toISOString(),
    actorUserId: input.actorUserId || null,
    actorRole: input.actorRole || null,
    action: String(input.action || 'UNKNOWN').toUpperCase(),
    targetType: input.targetType || null,
    targetId: input.targetId || null,
    ip: input.ip || null,
    userAgent: String(input.userAgent || '').slice(0, 300),
    outcome: input.outcome || 'SUCCESS',
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {}
  };
}
