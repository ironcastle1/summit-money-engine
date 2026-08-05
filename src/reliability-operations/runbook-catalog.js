import { frozen } from './utilities.js';
export const RUNBOOKS = frozen([
    { id: 'api-unavailable', title: 'API unavailable', triggers: ['HTTP_5XX', 'HEALTH_FAIL'], steps: ['Confirm scope and customer impact', 'Check recent deployments and configuration drift', 'Inspect dependency health and saturation', 'Mitigate with rollback, failover or capacity', 'Validate recovery and communicate status'] },
    { id: 'source-stale', title: 'Intelligence source stale', triggers: ['FRESHNESS_BREACH'], steps: ['Identify affected connectors', 'Check credentials, rate limits and provider status', 'Switch to verified fallback if available', 'Re-run ingestion checkpoint', 'Record coverage gap'] },
    { id: 'queue-backlog', title: 'Queue backlog', triggers: ['QUEUE_DEPTH', 'OLDEST_JOB_AGE'], steps: ['Confirm consumer health', 'Pause non-critical producers', 'Increase safe worker capacity', 'Move poison messages to dead letter', 'Validate drain rate'] },
    { id: 'data-restore', title: 'Data restore', triggers: ['DATA_LOSS', 'CORRUPTION'], steps: ['Declare recovery event', 'Select verified backup', 'Restore into isolated environment', 'Run integrity and application checks', 'Approve controlled cutover'] },
    { id: 'security-incident', title: 'Security incident', triggers: ['SECURITY_SEV1', 'SECURITY_SEV2'], steps: ['Engage security incident commander', 'Preserve evidence', 'Contain affected systems', 'Assess regulated-data impact', 'Recover with validated controls'] }
]);
export function runbookById(id) { return RUNBOOKS.find(item => item.id === String(id)) || null; }
