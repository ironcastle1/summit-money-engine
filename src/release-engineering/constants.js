export const RELEASE_STATES = Object.freeze(['DRAFT', 'ASSESSING', 'BLOCKED', 'READY', 'APPROVED', 'DEPLOYING', 'COMPLETE', 'ROLLED_BACK', 'REJECTED']);
export const GATE_STATES = Object.freeze(['PASS', 'WARN', 'FAIL', 'NOT_RUN', 'NOT_APPLICABLE']);
export const MIGRATION_STATES = Object.freeze(['PENDING', 'READY', 'RUNNING', 'COMPLETE', 'FAILED', 'ROLLED_BACK', 'SKIPPED']);
export const COMPATIBILITY = Object.freeze(['COMPATIBLE', 'CONDITIONAL', 'BREAKING', 'UNKNOWN']);
export const ARTIFACT_TYPES = Object.freeze(['SOURCE', 'CLIENT', 'SERVER', 'DATA', 'MIGRATION', 'DOCUMENTATION', 'CONTAINER', 'MANIFEST']);
export const RELEASE_LIMITS = Object.freeze({ components: 10000, contracts: 25000, migrations: 10000, artifacts: 25000, evidence: 50000, candidates: 10000, notes: 50000 });
export const REQUIRED_FINAL_PARTS = 18;
