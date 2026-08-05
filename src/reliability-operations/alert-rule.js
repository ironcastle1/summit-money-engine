import { operationsId } from './ids.js';
import { clean, finite, unique } from './utilities.js';
import { iso } from './time.js';
export function alertRule(input = {}) {
    if (!input.metric && !input.condition)
        throw new TypeError('Alert metric or condition is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('alert', input.name), name: clean(input.name, 180) || 'Operational alert', serviceId: clean(input.serviceId, 120), metric: clean(input.metric, 160), comparator: clean(input.comparator, 8).toUpperCase() || 'GT', threshold: finite(input.threshold), severity: clean(input.severity, 20).toUpperCase() || 'SEV3', evaluationMinutes: Math.max(1, Number(input.evaluationMinutes) || 5), channels: unique(input.channels || ['IN_APP'], 20), enabled: input.enabled !== false, createdAt: input.createdAt || iso() });
}
