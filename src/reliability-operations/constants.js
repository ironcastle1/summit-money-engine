export const SERVICE_STATES = Object.freeze(['OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE', 'UNKNOWN']);
export const INCIDENT_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);
export const RELEASE_STATES = Object.freeze(['DRAFT', 'READY', 'DEPLOYING', 'CANARY', 'ROLLOUT', 'COMPLETE', 'ROLLED_BACK', 'FAILED']);
export const JOB_STATES = Object.freeze(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD_LETTER', 'CANCELLED']);
export const BACKUP_STATES = Object.freeze(['SCHEDULED', 'RUNNING', 'VERIFIED', 'FAILED', 'EXPIRED']);
export const CHECK_STATES = Object.freeze(['PASS', 'WARN', 'FAIL', 'UNKNOWN']);
export const OPERATIONS_LIMITS = Object.freeze({ services: 5000, slos: 10000, measurements: 100000, checks: 25000, incidents: 25000, releases: 25000, deployments: 50000, queues: 10000, jobs: 100000, backups: 50000, restoreTests: 25000, maintenance: 10000, risks: 25000, logs: 100000, traces: 100000 });
