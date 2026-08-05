import { operationsId } from './ids.js';
import { clean, finite, clamp } from './utilities.js';
import { iso } from './time.js';
export function serviceLevelObjective(input = {}) {
    if (!input.serviceId)
        throw new TypeError('SLO serviceId is required');
    const indicator = clean(input.indicator, 80).toUpperCase() || 'AVAILABILITY';
    const comparator = clean(input.comparator, 8).toUpperCase() || (['LATENCY_P95_MS', 'FRESHNESS_MINUTES'].includes(indicator) ? 'LTE' : 'GTE');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('slo', `${input.serviceId}-${indicator}`), tenantId: clean(input.tenantId, 120) || 'tenant-merlin-demo', serviceId: clean(input.serviceId, 120), name: clean(input.name, 180) || `${indicator} objective`, indicator, target: finite(input.target, indicator === 'AVAILABILITY' ? 99.9 : 100), comparator, windowDays: Math.max(1, Math.min(365, Number(input.windowDays) || 30)), minimumSamples: Math.max(1, Number(input.minimumSamples) || 1), warningBurnRate: clamp(input.warningBurnRate || 100, 1, 1000), enabled: input.enabled !== false, createdAt: input.createdAt || iso(), updatedAt: iso() });
}
