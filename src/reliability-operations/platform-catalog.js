import { DEFAULT_SERVICES } from './service-catalog.js';
import { ENVIRONMENTS } from './environment-catalog.js';
import { SLO_TEMPLATES } from './slo-catalog.js';
import { RUNBOOKS } from './runbook-catalog.js';
export function reliabilityCatalog() { return Object.freeze({ platform: 'MERLIN_RELIABILITY_OPERATIONS', version: '20.17.0', capabilities: Object.freeze(['SERVICE_CATALOG', 'SLOS', 'ERROR_BUDGETS', 'BURN_RATES', 'SYNTHETIC_MONITORING', 'LOGS_METRICS_TRACES', 'INCIDENT_COMMAND', 'ON_CALL', 'RELEASE_GATES', 'CANARY_ANALYSIS', 'ROLLBACK_DECISIONS', 'QUEUE_OPERATIONS', 'CAPACITY_PLANNING', 'BACKUPS', 'RESTORE_TESTS', 'DISASTER_RECOVERY', 'STATUS_PAGE', 'RUNBOOKS']), serviceTemplates: DEFAULT_SERVICES, environments: ENVIRONMENTS, sloTemplates: SLO_TEMPLATES, runbooks: RUNBOOKS, generatedAt: new Date().toISOString() }); }
