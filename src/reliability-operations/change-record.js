import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function changeRecord(input = {}) {
    const summary = clean(input.summary, 1000);
    if (!summary)
        throw new TypeError('Change summary is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('change', summary), releaseId: clean(input.releaseId, 140), serviceIds: unique(input.serviceIds, 100), summary, type: clean(input.type, 40).toUpperCase() || 'STANDARD', risk: clean(input.risk, 20).toUpperCase() || 'MEDIUM', rollbackPlan: clean(input.rollbackPlan, 3000), validationPlan: clean(input.validationPlan, 3000), maintenanceRequired: Boolean(input.maintenanceRequired), requestedBy: clean(input.requestedBy, 160), approvedBy: unique(input.approvedBy, 50), state: clean(input.state, 30).toUpperCase() || 'REQUESTED', createdAt: input.createdAt || iso() });
}
