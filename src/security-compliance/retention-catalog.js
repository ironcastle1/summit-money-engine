export const RETENTION_SCHEDULES = Object.freeze([
  { id: 'AUTH_LOGS', name: 'Authentication logs', minimumDays: 90, maximumDays: 730, legalBasis: 'SECURITY' },
  { id: 'AUDIT_LOGS', name: 'Audit logs', minimumDays: 365, maximumDays: 2555, legalBasis: 'ACCOUNTABILITY' },
  { id: 'CUSTOMER_DATA', name: 'Customer operational data', minimumDays: 30, maximumDays: 2555, legalBasis: 'CONTRACT' },
  { id: 'BILLING', name: 'Billing and tax records', minimumDays: 2190, maximumDays: 3650, legalBasis: 'LEGAL_OBLIGATION' },
  { id: 'SUPPORT', name: 'Support records', minimumDays: 365, maximumDays: 1825, legalBasis: 'LEGITIMATE_INTEREST' },
  { id: 'SECURITY_CASES', name: 'Security incidents and evidence', minimumDays: 1095, maximumDays: 3650, legalBasis: 'SECURITY' },
  { id: 'ANALYTICS', name: 'Product analytics', minimumDays: 30, maximumDays: 730, legalBasis: 'LEGITIMATE_INTEREST' }
]);

export function retentionSchedule(id) {
  return RETENTION_SCHEDULES.find(item => item.id === String(id || '').toUpperCase()) || null;
}
