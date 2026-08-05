import { OwnerCommercialStore } from './generic-store.js';
import { successPlanRecord } from './success-plan-schema.js';
export class SuccessPlanStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, successPlanRecord({ ...current, ...input })); }
}
