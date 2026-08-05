import { OwnerRecordStore } from './generic-store.js';
import { editionRecord } from './edition-schema.js';
import { EDITION_STATES } from './constants.js';

export class EditionStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 2500 }); }
  async put(owner, input) { return super.put(owner, editionRecord(input)); }
  async transition(owner, id, state, changes = {}) {
    const item = await this.get(owner, id);
    if (!item) return null;
    const next = String(state || '').toUpperCase();
    if (!EDITION_STATES.includes(next)) throw new TypeError(`Unsupported edition state: ${next}`);
    return super.put(owner, Object.freeze({ ...item, ...changes, state: next, updatedAt: new Date().toISOString() }));
  }
}
