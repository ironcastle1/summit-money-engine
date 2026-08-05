import { OwnerCommercialStore } from './generic-store.js';
import { tenantRecord } from './tenant-schema.js';
export class TenantStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, tenantRecord({ ...current, ...input })); }
}
