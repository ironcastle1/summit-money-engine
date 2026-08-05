import { OwnerCommercialStore } from './generic-store.js';
import { seatRecord } from './seat-schema.js';
export class SeatStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, seatRecord({ ...current, ...input })); }
}
