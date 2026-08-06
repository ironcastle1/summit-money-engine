import { frozen } from './utilities.js';
export const SLO_TEMPLATES = frozen([
    { id: 'availability-critical', name: 'Critical availability', indicator: 'AVAILABILITY', target: 99.9, windowDays: 30 },
    { id: 'availability-standard', name: 'Standard availability', indicator: 'AVAILABILITY', target: 99.5, windowDays: 30 },
    { id: 'latency-api', name: 'API p95 latency', indicator: 'LATENCY_P95_MS', target: 750, comparator: 'LTE', windowDays: 7 },
    { id: 'freshness-intelligence', name: 'Intelligence freshness', indicator: 'FRESHNESS_MINUTES', target: 15, comparator: 'LTE', windowDays: 7 },
    { id: 'job-success', name: 'Worker success rate', indicator: 'SUCCESS_RATE', target: 99, windowDays: 7 }
]);
export function sloTemplate(id) { return SLO_TEMPLATES.find(item => item.id === String(id)) || null; }
