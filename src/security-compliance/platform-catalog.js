import { SECURITY_FRAMEWORKS } from './framework-catalog.js';
import { SECURITY_CONTROLS } from './control-catalog.js';
import { DATA_REGIONS } from './residency-catalog.js';
import { RETENTION_SCHEDULES } from './retention-catalog.js';
import { SECURITY_ROLES } from './role-catalog.js';

export function securityCatalog() {
  return Object.freeze({
    platform: 'MERLIN_SECURITY_COMPLIANCE',
    version: '20.16.0',
    frameworks: SECURITY_FRAMEWORKS,
    controls: SECURITY_CONTROLS,
    dataRegions: DATA_REGIONS,
    retentionSchedules: RETENTION_SCHEDULES,
    roles: SECURITY_ROLES,
    capabilities: Object.freeze([
      'ACCESS_GOVERNANCE', 'TENANT_ISOLATION', 'MFA_POLICY', 'SSO_POSTURE', 'SCIM_PROVISIONING',
      'DATA_CLASSIFICATION', 'RETENTION', 'LEGAL_HOLDS', 'DATA_SUBJECT_REQUESTS', 'DATA_RESIDENCY',
      'CONTROL_ASSESSMENT', 'EVIDENCE_MANAGEMENT', 'FRAMEWORK_REPORTING', 'RISK_REGISTER',
      'INCIDENT_RESPONSE', 'BREACH_CLOCK', 'VULNERABILITY_MANAGEMENT', 'VENDOR_RISK',
      'TAMPER_EVIDENT_AUDIT', 'SECURITY_EXPORTS'
    ])
  });
}
