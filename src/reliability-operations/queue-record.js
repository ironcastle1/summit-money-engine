import { operationsId } from './ids.js';
import { clean, finite } from './utilities.js';
import { iso } from './time.js';
export function queueRecord(input = {}) {
    const name = clean(input.name, 160);
    if (!name)
        throw new TypeError('Queue name is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('queue', name), name, serviceId: clean(input.serviceId, 120), depth: Math.max(0, finite(input.depth)), inFlight: Math.max(0, finite(input.inFlight)), consumers: Math.max(0, finite(input.consumers)), ingressPerMinute: Math.max(0, finite(input.ingressPerMinute)), egressPerMinute: Math.max(0, finite(input.egressPerMinute)), oldestJobAgeSeconds: Math.max(0, finite(input.oldestJobAgeSeconds)), deadLetters: Math.max(0, finite(input.deadLetters)), updatedAt: input.updatedAt || iso() });
}
