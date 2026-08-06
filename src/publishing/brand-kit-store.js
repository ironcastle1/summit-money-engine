import { OwnerRecordStore } from './generic-store.js';
import { brandKitRecord } from './brand-kit-schema.js';

export class BrandKitStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 50 }); }
  async put(owner, input) { return super.put(owner, brandKitRecord(input)); }
}
