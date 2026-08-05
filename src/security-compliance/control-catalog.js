import { frozen } from './utilities.js';

const controls = [
  ['IAM-01', 'Identity lifecycle', 'IDENTITY', 'HIGH'],
  ['IAM-02', 'Multi-factor authentication', 'IDENTITY', 'CRITICAL'],
  ['IAM-03', 'Privileged access management', 'IDENTITY', 'CRITICAL'],
  ['IAM-04', 'Periodic access review', 'IDENTITY', 'HIGH'],
  ['DAT-01', 'Data classification', 'DATA', 'HIGH'],
  ['DAT-02', 'Encryption at rest', 'DATA', 'CRITICAL'],
  ['DAT-03', 'Encryption in transit', 'DATA', 'CRITICAL'],
  ['DAT-04', 'Retention and disposal', 'DATA', 'HIGH'],
  ['OPS-01', 'Security logging', 'OPERATIONS', 'HIGH'],
  ['OPS-02', 'Incident response', 'OPERATIONS', 'CRITICAL'],
  ['OPS-03', 'Vulnerability management', 'OPERATIONS', 'CRITICAL'],
  ['OPS-04', 'Backup and recovery', 'OPERATIONS', 'HIGH'],
  ['GOV-01', 'Risk management', 'GOVERNANCE', 'HIGH'],
  ['GOV-02', 'Vendor assurance', 'GOVERNANCE', 'HIGH'],
  ['GOV-03', 'Policy governance', 'GOVERNANCE', 'MEDIUM'],
  ['GOV-04', 'Compliance evidence', 'GOVERNANCE', 'MEDIUM'],
  ['APP-01', 'Secure development lifecycle', 'APPLICATION', 'HIGH'],
  ['APP-02', 'Dependency and secret scanning', 'APPLICATION', 'CRITICAL'],
  ['APP-03', 'Change approval', 'APPLICATION', 'HIGH'],
  ['NET-01', 'Network segmentation', 'NETWORK', 'HIGH'],
  ['NET-02', 'Boundary protection', 'NETWORK', 'CRITICAL'],
  ['BCP-01', 'Business continuity', 'RESILIENCE', 'HIGH'],
  ['BCP-02', 'Disaster recovery testing', 'RESILIENCE', 'HIGH'],
  ['PRI-01', 'Data subject rights', 'PRIVACY', 'HIGH'],
  ['PRI-02', 'Processing inventory', 'PRIVACY', 'HIGH'],
  ['PRI-03', 'International transfers', 'PRIVACY', 'HIGH']
].map(([id, name, family, criticality]) => frozen({ id, name, family, criticality, active: true }));

export const SECURITY_CONTROLS = Object.freeze(controls);
export function controlsByFamily(family) {
  return SECURITY_CONTROLS.filter(item => item.family === String(family || '').toUpperCase());
}
