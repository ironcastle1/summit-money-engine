export const SECURITY_ROLES = Object.freeze({
  OWNER: ['*'],
  SECURITY_ADMIN: ['security:*', 'audit:read', 'users:read'],
  COMPLIANCE_ADMIN: ['compliance:*', 'evidence:*', 'audit:read', 'risk:*'],
  INCIDENT_COMMANDER: ['incidents:*', 'findings:read', 'audit:write'],
  AUDITOR: ['security:read', 'compliance:read', 'evidence:read', 'audit:read', 'risk:read'],
  ANALYST: ['security:read', 'incidents:read', 'findings:read'],
  VIEWER: ['security:read']
});

export function rolePermissions(role) {
  return SECURITY_ROLES[String(role || '').toUpperCase()] || [];
}
