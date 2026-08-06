export const CLASSIFICATIONS = Object.freeze(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']);
export const ACCESS_DECISIONS = Object.freeze(['ALLOW', 'DENY', 'STEP_UP', 'REVIEW']);
export const CONTROL_STATES = Object.freeze(['NOT_ASSESSED', 'PARTIAL', 'IMPLEMENTED', 'INEFFECTIVE', 'NOT_APPLICABLE']);
export const EVIDENCE_STATES = Object.freeze(['CURRENT', 'EXPIRING', 'EXPIRED', 'MISSING']);
export const RISK_STATES = Object.freeze(['OPEN', 'MITIGATING', 'ACCEPTED', 'TRANSFERRED', 'CLOSED']);
export const INCIDENT_STATES = Object.freeze(['DECLARED', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'RESOLVED', 'CLOSED']);
export const INCIDENT_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);
export const VULNERABILITY_STATES = Object.freeze(['OPEN', 'TRIAGED', 'REMEDIATING', 'RISK_ACCEPTED', 'VERIFIED', 'CLOSED']);
export const SUBJECT_REQUEST_STATES = Object.freeze(['RECEIVED', 'IDENTITY_CHECK', 'SEARCHING', 'REVIEW', 'FULFILLED', 'REJECTED']);
export const SECURITY_LIMITS = Object.freeze({
  policies: 5000,
  controls: 10000,
  evidence: 50000,
  accessReviews: 10000,
  risks: 20000,
  vendors: 10000,
  processingRecords: 25000,
  subjectRequests: 25000,
  incidents: 10000,
  vulnerabilities: 50000,
  auditEntries: 100000,
  exceptions: 10000,
  apiKeys: 10000,
  secrets: 20000
});
