import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function logEvent(input = {}) { return Object.freeze({ id: clean(input.id, 140) || operationsId('log', input.serviceId), serviceId: clean(input.serviceId, 120), level: clean(input.level, 20).toUpperCase() || 'INFO', message: clean(input.message, 2000), traceId: clean(input.traceId, 160), requestId: clean(input.requestId, 160), fields: Object.freeze({ ...(input.fields || {}) }), recordedAt: input.recordedAt || iso() }); }
