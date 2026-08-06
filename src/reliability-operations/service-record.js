import { operationsId } from './ids.js';
import { clean, clamp, unique } from './utilities.js';
import { iso } from './time.js';
export function serviceRecord(input = {}) {
    const name = clean(input.name, 160);
    if (!name)
        throw new TypeError('Service name is required');
    return Object.freeze({ id: clean(input.id, 120) || operationsId('svc', name), tenantId: clean(input.tenantId, 120) || 'tenant-merlin-demo', name, description: clean(input.description, 1000), tier: Math.max(1, Math.min(4, Number(input.tier) || 2)), type: clean(input.type, 60).toUpperCase() || 'SERVICE', ownerTeam: clean(input.ownerTeam, 120) || 'PLATFORM', ownerContact: clean(input.ownerContact, 200), repository: clean(input.repository, 300), runbookIds: unique(input.runbookIds, 50), dependencies: unique(input.dependencies, 100), state: clean(input.state, 40).toUpperCase() || 'OPERATIONAL', criticality: clamp(input.criticality ?? (input.tier === 1 ? 100 : 70)), createdAt: input.createdAt || iso(), updatedAt: iso() });
}
