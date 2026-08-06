export function assertTenantBoundary(subject = {}, resource = {}) {
  const subjectTenant = String(subject.tenantId || '');
  const resourceTenant = String(resource.tenantId || '');
  const platformRole = ['OWNER', 'SECURITY_ADMIN'].includes(String(subject.role || '').toUpperCase()) && subject.platformScope === true;
  const allowed = Boolean(subjectTenant && resourceTenant && subjectTenant === resourceTenant) || platformRole;
  return Object.freeze({ allowed, subjectTenant, resourceTenant, reason: allowed ? 'BOUNDARY_OK' : 'TENANT_BOUNDARY_VIOLATION' });
}
