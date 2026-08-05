export const WORKFLOW_STATES = Object.freeze(['DRAFT', 'ACTIVE', 'PAUSED', 'DISABLED', 'ARCHIVED']);
export const RUN_STATES = Object.freeze(['QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED', 'SUPPRESSED']);
export const TRIGGER_TYPES = Object.freeze([
    'MANUAL', 'SCHEDULE', 'EVENT', 'MARKET_THRESHOLD', 'HAZARD_MATERIALITY', 'COUNTRY_RISK', 'ROUTE_DISRUPTION',
    'CONNECTOR_HEALTH', 'DATA_FRESHNESS', 'GEOFENCE', 'DECISION_SIGNAL'
]);
export const CONDITION_OPERATORS = Object.freeze([
    'EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'EXISTS', 'NOT_EXISTS', 'MATCHES'
]);
export const ACTION_TYPES = Object.freeze([
    'CREATE_TASK', 'CREATE_CASE', 'GENERATE_REPORT', 'ADD_WATCHLIST', 'SEND_NOTIFICATION', 'CALL_WEBHOOK', 'RECORD_NOTE', 'REQUEST_APPROVAL'
]);
export const CHANNEL_TYPES = Object.freeze(['IN_APP', 'WEBHOOK', 'EMAIL', 'SLACK']);
export const SEVERITY_LEVELS = Object.freeze(['INFO', 'WATCH', 'IMPORTANT', 'URGENT', 'CRITICAL']);
export const DEFAULT_LIMITS = Object.freeze({
    workflowsPerOwner: 500,
    rulesPerOwner: 1000,
    runsPerOwner: 5000,
    notificationsPerOwner: 5000,
    stepsPerWorkflow: 50,
    conditionsPerTrigger: 30,
    maximumAttempts: 5,
    maximumRunMilliseconds: 120000,
    maximumParallelSteps: 8
});
