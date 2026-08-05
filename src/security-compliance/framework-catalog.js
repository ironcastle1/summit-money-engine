import { frozen } from './utilities.js';

const frameworks = [
  { id: 'ISO27001', name: 'ISO/IEC 27001:2022', jurisdiction: 'GLOBAL', families: ['ORGANISATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL'] },
  { id: 'SOC2', name: 'SOC 2 Trust Services Criteria', jurisdiction: 'GLOBAL', families: ['SECURITY', 'AVAILABILITY', 'CONFIDENTIALITY', 'PROCESSING_INTEGRITY', 'PRIVACY'] },
  { id: 'UK_GDPR', name: 'UK GDPR', jurisdiction: 'UNITED_KINGDOM', families: ['LAWFULNESS', 'RIGHTS', 'SECURITY', 'ACCOUNTABILITY', 'TRANSFERS'] },
  { id: 'EU_GDPR', name: 'EU GDPR', jurisdiction: 'EUROPEAN_UNION', families: ['LAWFULNESS', 'RIGHTS', 'SECURITY', 'ACCOUNTABILITY', 'TRANSFERS'] },
  { id: 'NIST_CSF', name: 'NIST Cybersecurity Framework 2.0', jurisdiction: 'GLOBAL', families: ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'] },
  { id: 'CIS_V8', name: 'CIS Critical Security Controls v8', jurisdiction: 'GLOBAL', families: ['BASIC', 'FOUNDATIONAL', 'ORGANISATIONAL'] },
  { id: 'PCI_DSS', name: 'PCI DSS 4.0', jurisdiction: 'GLOBAL', families: ['NETWORK', 'DATA', 'VULNERABILITY', 'ACCESS', 'MONITORING', 'POLICY'] }
];

export const SECURITY_FRAMEWORKS = Object.freeze(frameworks.map(frozen));
export function frameworkById(id) {
  return SECURITY_FRAMEWORKS.find(item => item.id === String(id || '').toUpperCase()) || null;
}
