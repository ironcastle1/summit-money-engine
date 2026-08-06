import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function postmortemRecord(input = {}) {
    if (!input.incidentId)
        throw new TypeError('Postmortem incidentId is required');
    const actions = (input.actions || []).map((item, index) => Object.freeze({ id: item.id || `action-${index + 1}`, owner: clean(item.owner, 160), description: clean(item.description, 1000), dueAt: item.dueAt || null, state: clean(item.state, 30).toUpperCase() || 'OPEN' }));
    return Object.freeze({ id: clean(input.id, 140) || operationsId('postmortem', input.incidentId), incidentId: clean(input.incidentId, 140), summary: clean(input.summary, 3000), rootCause: clean(input.rootCause, 3000), detectionGap: clean(input.detectionGap, 2000), responseReview: clean(input.responseReview, 2000), lessons: clean(input.lessons, 3000), actions, blameless: input.blameless !== false, approvedAt: input.approvedAt || null, createdAt: input.createdAt || iso() });
}
