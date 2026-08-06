import { rolePermissions } from './role-catalog.js';

function matches(grant, permission) {
  if (grant === '*') return true;
  if (grant === permission) return true;
  if (grant.endsWith(':*')) return permission.startsWith(grant.slice(0, -1));
  return false;
}

export function evaluatePermission(input = {}) {
  const permission = String(input.permission || '').toLowerCase();
  const grants = new Set([
    ...rolePermissions(input.role),
    ...(input.permissions || [])
  ].map(value => String(value).toLowerCase()));
  const denied = new Set((input.deniedPermissions || []).map(value => String(value).toLowerCase()));
  if ([...denied].some(grant => matches(grant, permission))) {
    return Object.freeze({ allowed: false, reason: 'EXPLICIT_DENY', permission });
  }
  const allowed = [...grants].some(grant => matches(grant, permission));
  return Object.freeze({ allowed, reason: allowed ? 'ROLE_OR_GRANT' : 'NO_MATCHING_GRANT', permission });
}
