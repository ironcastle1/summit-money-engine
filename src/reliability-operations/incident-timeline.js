import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function incidentTimelineEntry(input = {}) {
    if (!input.incidentId)
        throw new TypeError('Timeline incidentId is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('timeline', input.incidentId), incidentId: clean(input.incidentId, 140), type: clean(input.type, 50).toUpperCase() || 'UPDATE', message: clean(input.message, 3000), actor: clean(input.actor, 160) || 'system', at: input.at || iso() });
}
