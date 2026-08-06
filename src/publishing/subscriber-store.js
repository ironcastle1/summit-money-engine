import { OwnerRecordStore } from './generic-store.js';
import { subscriberRecord } from './subscriber-schema.js';

export class SubscriberStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 10000 }); }
  async put(owner, input) { return super.put(owner, subscriberRecord(input)); }
}
