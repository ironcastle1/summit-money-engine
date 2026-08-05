import { OwnerRecordStore } from './generic-store.js';
import { publicationRecord } from './publication-schema.js';
import { PUBLICATION_STATES } from './constants.js';

export class PublicationStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 250 }); }
  async put(owner, input) { return super.put(owner, publicationRecord(input)); }
  async transition(owner, id, state) {
    const item = await this.get(owner, id);
    if (!item) return null;
    const next = String(state || '').toUpperCase();
    if (!PUBLICATION_STATES.includes(next)) throw new TypeError(`Unsupported publication state: ${next}`);
    return super.put(owner, Object.freeze({ ...item, state: next, updatedAt: new Date().toISOString() }));
  }
}
