import { operationsId } from './ids.js';
import { clean, finite } from './utilities.js';
import { iso } from './time.js';
export function metricSample(input = {}) {
    if (!input.name)
        throw new TypeError('Metric name is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('metric', input.name), serviceId: clean(input.serviceId, 120), name: clean(input.name, 160), value: finite(input.value), unit: clean(input.unit, 40), labels: Object.freeze({ ...(input.labels || {}) }), recordedAt: input.recordedAt || iso() });
}
