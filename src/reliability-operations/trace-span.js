import { operationsId } from './ids.js';
import { clean, finite } from './utilities.js';
import { iso } from './time.js';
export function traceSpan(input = {}) { const startedAt = input.startedAt || iso(); return Object.freeze({ id: clean(input.id, 140) || operationsId('span', input.name), traceId: clean(input.traceId, 160) || operationsId('trace'), parentId: clean(input.parentId, 160), serviceId: clean(input.serviceId, 120), name: clean(input.name, 200) || 'operation', kind: clean(input.kind, 30).toUpperCase() || 'INTERNAL', durationMs: Math.max(0, finite(input.durationMs)), status: clean(input.status, 20).toUpperCase() || 'OK', attributes: Object.freeze({ ...(input.attributes || {}) }), startedAt }); }
