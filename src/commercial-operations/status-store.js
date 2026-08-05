import { OwnerCommercialStore } from './generic-store.js';
import { statusComponentRecord } from './status-component-schema.js';
import { statusIncidentRecord } from './status-incident-schema.js';
export class StatusComponentStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, statusComponentRecord({ ...current, ...input })); }
}
export class StatusIncidentStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, statusIncidentRecord({ ...current, ...input })); }
}
