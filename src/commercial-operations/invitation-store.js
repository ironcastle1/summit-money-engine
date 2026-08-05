import { OwnerCommercialStore } from './generic-store.js';
import { invitationRecord } from './invitation-schema.js';
export class InvitationStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, invitationRecord({ ...current, ...input })); }
}
