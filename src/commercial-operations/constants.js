export const TENANT_STATES = Object.freeze(['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED']);
export const TENANT_SEGMENTS = Object.freeze(['SELF_SERVE', 'SMB', 'MID_MARKET', 'ENTERPRISE', 'STRATEGIC']);
export const SEAT_ROLES = Object.freeze(['OWNER', 'ADMIN', 'ANALYST', 'VIEWER', 'BILLING']);
export const INVITATION_STATES = Object.freeze(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']);
export const SUPPORT_STATES = Object.freeze(['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']);
export const SUPPORT_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);
export const INCIDENT_STATES = Object.freeze(['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']);
export const FEATURE_ROLLOUTS = Object.freeze(['OFF', 'INTERNAL', 'PERCENTAGE', 'TENANTS', 'ON']);
export const FEEDBACK_TYPES = Object.freeze(['NPS', 'CSAT', 'CES', 'IDEA', 'BUG', 'INTERVIEW']);
export const LIFECYCLE_STAGES = Object.freeze(['LEAD', 'TRIAL', 'ONBOARDING', 'ADOPTING', 'ESTABLISHED', 'EXPANDING', 'AT_RISK', 'CHURNED']);
export const COMMERCIAL_LIMITS = Object.freeze({
    tenantsPerOwner: 5000,
    seatsPerTenant: 5000,
    invitationsPerTenant: 2000,
    usageEventsPerOwner: 100000,
    supportCasesPerOwner: 25000,
    incidentsPerOwner: 5000,
    flagsPerOwner: 1000,
    feedbackPerOwner: 50000,
    releaseNotesPerOwner: 5000,
    successPlansPerOwner: 5000
});
