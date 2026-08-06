import { operationsId } from './ids.js';
import { clean, finite } from './utilities.js';
import { iso } from './time.js';
export function sliMeasurement(input = {}) {
    if (!input.sloId || !input.serviceId)
        throw new TypeError('Measurement requires serviceId and sloId');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('sli', input.sloId), tenantId: clean(input.tenantId, 120) || 'tenant-merlin-demo', serviceId: clean(input.serviceId, 120), sloId: clean(input.sloId, 140), value: finite(input.value), good: Number.isFinite(Number(input.good)) ? Number(input.good) : null, total: Number.isFinite(Number(input.total)) ? Number(input.total) : null, source: clean(input.source, 120) || 'MERLIN_RUNTIME', recordedAt: input.recordedAt || iso(), dimensions: Object.freeze({ ...(input.dimensions || {}) }) });
}
