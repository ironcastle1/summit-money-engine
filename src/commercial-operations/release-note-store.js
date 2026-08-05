import { OwnerCommercialStore } from './generic-store.js';
import { releaseNoteRecord } from './release-note-schema.js';
export class ReleaseNoteStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, releaseNoteRecord({ ...current, ...input })); }
}
