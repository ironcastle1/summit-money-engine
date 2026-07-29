import { randomUUID } from 'node:crypto';
import { normalizeRole } from './roles.js';
import { validateEmail } from './email.js';

export function createUser(input, now = new Date().toISOString()) {
  return {
    id: input.id || randomUUID(),
    email: validateEmail(input.email),
    displayName: String(input.displayName || '').trim().slice(0, 80),
    passwordHash: String(input.passwordHash || ''),
    role: normalizeRole(input.role),
    status: input.status || 'ACTIVE',
    emailVerifiedAt: input.emailVerifiedAt || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    lastLoginAt: input.lastLoginAt || null,
    failedLoginCount: Number(input.failedLoginCount || 0),
    lockedUntil: input.lockedUntil || null,
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {}
  };
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt
  };
}
