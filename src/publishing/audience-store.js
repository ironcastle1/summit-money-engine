import { OwnerRecordStore } from './generic-store.js';
import { audienceRecord } from './audience-schema.js';

export class AudienceStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 500 }); }
  async put(owner, input) { return super.put(owner, audienceRecord(input)); }
}
