import { OwnerCommercialStore } from './generic-store.js';
import { supportCaseRecord } from './support-case-schema.js';
export class SupportCaseStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, supportCaseRecord({ ...current, ...input })); }
}
