import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
import { incidentSeverity } from './incident-severity.js';
export function operationalIncident(input = {}) {
    const title = clean(input.title, 240);
    if (!title)
        throw new TypeError('Incident title is required');
    const calculated = incidentSeverity(input);
    return Object.freeze({ id: clean(input.id, 140) || operationsId('ops-incident', title), tenantId: clean(input.tenantId, 120) || 'tenant-merlin-demo', title, summary: clean(input.summary, 3000), serviceIds: unique(input.serviceIds, 100), severity: clean(input.severity, 20).toUpperCase() || calculated.severity, state: clean(input.state, 40).toUpperCase() || 'DECLARED', commander: clean(input.commander, 160), customerImpact: clean(input.customerImpactText, 1000), statusMessage: clean(input.statusMessage, 1000), runbookId: clean(input.runbookId, 140), declaredAt: input.declaredAt || iso(), acknowledgedAt: input.acknowledgedAt || null, mitigatedAt: input.mitigatedAt || null, resolvedAt: input.resolvedAt || null, updatedAt: iso() });
}
